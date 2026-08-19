/**
 * Retrieval-augmented session memory backed by SQLite (node:sqlite).
 *
 * Every session message (user / assistant / tool results) is mirrored into a
 * per-project SQLite database with an FTS5 index. When a new request is built,
 * the latest user message is used as the query to pull the most relevant
 * historical messages back into context — replacing the "send the entire
 * history every turn" behavior with retrieval, so context usage stays flat
 * no matter how long the session runs.
 *
 * Design notes:
 * - node:sqlite is built into Node 22.5+, no native deps.
 * - FTS5 BM25 scoring provides keyword relevance; recency is applied as a
 *   multiplicative decay so old-but-relevant results can still surface.
 * - The database is per-project-directory (same granularity as Pi sessions),
 *   stored under the project dir as .pi/memory.sqlite.
 */

import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface MemoryEntry {
	id: string;
	role: string;
	content: string;
	createdAt: number;
}

export interface RetrievalMemorySettings {
	/** Top-K results injected per request. */
	topK: number;
	/** Number of most recent messages always kept verbatim. */
	keepRecent: number;
	/** Half-life (ms) of the recency decay applied to BM25 scores. */
	halfLifeMs: number;
}

export const DEFAULT_RETRIEVAL_MEMORY_SETTINGS: RetrievalMemorySettings = {
	topK: 8,
	keepRecent: 12,
	halfLifeMs: 10 * 60 * 1000,
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS entries (
	id TEXT PRIMARY KEY,
	session_id TEXT NOT NULL,
	role TEXT NOT NULL,
	content TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_session ON entries(session_id, created_at);
CREATE VIRTUAL TABLE IF NOT EXISTS entry_fts USING fts5(
	content,
	content='entries',
	content_rowid='rowid',
	tokenize='unicode61'
);
CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
	INSERT INTO entry_fts(rowid, content) VALUES (new.rowid, new.content);
END;
CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
	INSERT INTO entry_fts(entry_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
END;
`;

export class RetrievalMemory {
	private readonly db: DatabaseSync;
	private readonly _settings: RetrievalMemorySettings;

	constructor(dbPath: string, settings?: Partial<RetrievalMemorySettings>) {
		mkdirSync(dirname(dbPath), { recursive: true });
		this.db = new DatabaseSync(dbPath);
		this._settings = { ...DEFAULT_RETRIEVAL_MEMORY_SETTINGS, ...settings };
		this.db.exec("PRAGMA journal_mode = WAL;");
		this.db.exec(SCHEMA);
	}

	close(): void {
		this.db.close();
	}

	get settings(): RetrievalMemorySettings {
		return this._settings;
	}

	has(id: string): boolean {
		const row = this.db.prepare("SELECT 1 FROM entries WHERE id = ?").get(id);
		return row !== undefined;
	}

	store(sessionId: string, role: string, content: string, createdAt = Date.now()): void {
		if (!content.trim()) {
			return;
		}
		// Deterministic content-hash id: re-sent history (the harness resends
		// the full context every turn) becomes an INSERT OR REPLACE no-op
		// instead of duplicating rows.
		const id = createHash("sha1").update(`${role}\0${content}`).digest("hex").slice(0, 32);
		this.db
			.prepare("INSERT OR REPLACE INTO entries (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)")
			.run(id, sessionId, role, content, createdAt);
	}

	/**
	 * FTS5 BM25 retrieval with recency decay. Returns entries sorted by score.
	 */
	retrieve(sessionId: string, query: string, topK = this._settings.topK): MemoryEntry[] {
		const now = Date.now();
		const halfLife = this._settings.halfLifeMs;
		// FTS5 BM25: bm25(entry_fts) ranks by keyword relevance.
		const rows = this.db
			.prepare(
				`SELECT e.id, e.role, e.content, e.created_at,
						bm25(entry_fts) AS score
				 FROM entry_fts
				 JOIN entries e ON e.rowid = entry_fts.rowid
				 WHERE entry_fts MATCH ? AND e.session_id = ?
				 ORDER BY score
				 LIMIT 200`,
			)
			.all(this.#ftsQuery(query), sessionId) as Array<{
			id: string;
			role: string;
			content: string;
			created_at: number;
			score: number;
		}>;

		// Decay: relevance = bm25 * 0.5^(age/halfLife). BM25 is negative
		// (lower is better), so convert to a positive relevance first.
		const entries = rows.map((r) => ({
			id: r.id,
			role: r.role,
			content: r.content,
			createdAt: r.created_at,
			relevance: -r.score * 0.5 ** ((now - r.created_at) / halfLife),
		}));

		entries.sort((a, b) => b.relevance - a.relevance);
		return entries.slice(0, topK).map(({ id, role, content, createdAt }) => ({
			id,
			role,
			content,
			createdAt,
		}));
	}

	#ftsQuery(query: string): string {
		// Tokenize the raw query into double-quoted phrases for FTS5.
		const tokens = query
			.split(/[^\p{L}\p{N}]+/u)
			.filter((t) => t.length > 1)
			.slice(0, 32);
		if (tokens.length === 0) {
			return '""';
		}
		return tokens.map((t) => `"${t.replaceAll('"', '""')}"`).join(" OR ");
	}
}
