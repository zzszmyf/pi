/**
 * Retrieval-based context transform: replaces "send the whole history" with
 * "retrieve what matters".
 *
 * Mounted on the agent's transformContext hook. On every request:
 *  1. Mirror any not-yet-stored messages into the SQLite memory.
 *  2. Use the latest user message as the retrieval query.
 *  3. Return: [retrieval notice, relevant historical messages (top-K),
 *     most recent N messages] — everything else stays in SQLite.
 *
 * The transform is idempotent (storing is deduplicated by message id) and
 * configurable via the memory settings object.
 */
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { RetrievalMemorySettings } from "./retrieval-memory.ts";
import { RetrievalMemory } from "./retrieval-memory.ts";

export interface RetrievalTransformOptions {
	sessionId: string;
	dbPath: string;
	settings?: Partial<RetrievalMemorySettings>;
	/** Include the retrieval notice message so the model knows context was injected. */
	includeNotice?: boolean;
}

const USER_ROLES = new Set(["user"]);
const SKIP_ROLES = new Set(["system", "developer"]);

export function createRetrievalTransform(options: RetrievalTransformOptions) {
	const memory = new RetrievalMemory(options.dbPath, options.settings);
	const includeNotice = options.includeNotice ?? true;

	return async (messages: AgentMessage[]): Promise<AgentMessage[]> => {
		// 1. Mirror new messages into SQLite (dedup by id when available).
		for (const message of messages) {
			if (SKIP_ROLES.has(message.role)) {
				continue;
			}
			const id = (message as { id?: string }).id ?? null;
			if (id && memory.has(id)) {
				continue;
			}
			memory.store(options.sessionId, message.role, extractText(message));
		}

		if (messages.length === 0) {
			return messages;
		}

		// 2. Query = latest user message.
		const lastUser = [...messages].reverse().find((m) => USER_ROLES.has(m.role));
		if (!lastUser) {
			return messages;
		}

		const keepRecent = memory.settings.keepRecent;
		const recent = messages.slice(-keepRecent);
		const recentIds = new Set(recent.map((m) => (m as { id?: string }).id).filter(Boolean));

		// 3. Retrieve relevant older messages.
		const hits = memory
			.retrieve(options.sessionId, extractText(lastUser))
			.filter((entry) => !recentIds.has(entry.id));
		// Retrieved history is injected as user-role context messages (the
		// agent harness convention for RAG-style context injection).
		const retrieved: AgentMessage[] = hits.map(
			(entry): AgentMessage => ({
				role: "user",
				content: `[earlier ${entry.role}] ${entry.content}`,
				timestamp: entry.createdAt,
			}),
		);

		if (retrieved.length === 0) {
			return messages;
		}

		// 4. Compose: notice + retrieved context + recent window.
		const notice: AgentMessage[] = includeNotice
			? [
					{
						role: "user",
						content:
							`[Retrieved context from earlier in this session (${hits.length} messages). ` +
							`Treat as historical record; the live conversation continues below.]`,
						timestamp: Date.now(),
					},
				]
			: [];

		return [...notice, ...retrieved, ...recent];
	};
}

function extractText(message: AgentMessage): string {
	const content = (message as { content?: unknown }).content;
	if (typeof content === "string") {
		return content;
	}
	if (Array.isArray(content)) {
		return content
			.map((part) => {
				if (typeof part === "string") {
					return part;
				}
				if (part && typeof part === "object" && "text" in part) {
					return String((part as { text: unknown }).text);
				}
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	return String(content ?? "");
}
