#!/usr/bin/env node
// Exported-symbol centrality for the pi monorepo. Zero dependencies.
// Usage: node tools/essence/symbols.mjs
// Emits a markdown summary to stdout and full data to out/symbols.json.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = join(__dirname, "out");

const PKGS = ["tui", "ai", "agent", "coding-agent"];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (e.endsWith(".ts")) out.push(p);
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, " ");
}

function pkgOf(p) {
  const m = p.match(/packages\/([^/]+)\//);
  return m ? m[1] : "root";
}

const DECL_PATTERNS = [
  { re: /\bexport\s+(?:declare\s+)?(interface|class|enum)\s+([A-Za-z_$][\w$]*)/g, kind: "type" },
  { re: /\bexport\s+type\s+([A-Za-z_$][\w$]*)\s*[=<{]/g, kind: "type" },
  { re: /\bexport\s+(?:abstract\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, kind: "function" },
  { re: /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g, kind: "value" },
];
const REEXPORT_RE = /\bexport\s+(?:type\s+)?\{([\s\S]*?)\}/g;

const files = new Map(); // rel -> { pkg, text, tokens:Set, exports:Map(name->kind) }
const globalCount = new Map(); // name -> total token occurrences
const refFiles = new Map(); // name -> Set(rel)

for (const short of PKGS) {
  for (const abs of walk(join(ROOT, "packages", short, "src"))) {
    const rel = relative(ROOT, abs);
    const text = stripComments(readFileSync(abs, "utf8"));
    const exports = new Map();
    for (const { re, kind } of DECL_PATTERNS) {
      for (const m of text.matchAll(re)) exports.set(m[2] ?? m[1], kind);
    }
    for (const m of text.matchAll(REEXPORT_RE)) {
      for (const item of m[1].split(",")) {
        const t = item.trim();
        if (!t) continue;
        const name = t.includes(" as ") ? t.split(" as ").pop().trim() : t.trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name) && !exports.has(name)) exports.set(name, "re-export");
      }
    }
    const tokens = new Set();
    for (const m of text.matchAll(/[A-Za-z_$][\w$]*/g)) {
      tokens.add(m[0]);
    }
    for (const t of tokens) {
      globalCount.set(t, (globalCount.get(t) ?? 0) + 1);
      let s = refFiles.get(t);
      if (!s) refFiles.set(t, (s = new Set()));
      s.add(rel);
    }
    files.set(rel, { pkg: pkgOf(rel), text, tokens, exports });
  }
}

// Rank exported symbols by distinct referencing files, then total occurrences.
const names = new Set();
for (const f of files.values()) for (const n of f.exports.keys()) names.add(n);

const ranked = [...names]
  .filter((n) => n.length >= 4)
  .map((n) => {
    const defs = [...files.entries()].filter(([, f]) => f.exports.has(n) && f.exports.get(n) !== "re-export");
    const reexports = [...files.entries()].filter(([, f]) => f.exports.get(n) === "re-export").map(([rel]) => rel);
    const refs = refFiles.get(n)?.size ?? 0;
    const count = globalCount.get(n) ?? 0;
    return { name: n, kind: defs[0]?.[1].exports.get(n) ?? "re-export", definedAt: defs.map(([rel]) => rel), reexports, refs, count };
  })
  .sort((a, b) => b.refs - a.refs || b.count - a.count);

// Per-package reference breakdown for top names
const TOP = 50;
const top = ranked.slice(0, TOP);
for (const sym of top) {
  const byPkg = {};
  for (const rel of refFiles.get(sym.name) ?? []) byPkg[files.get(rel).pkg] = (byPkg[files.get(rel).pkg] ?? 0) + 1;
  sym.byPkg = byPkg;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "symbols.json"), JSON.stringify({ exported: ranked }, null, 0));

const r = [];
r.push(`# 导出符号中心性（共 ${names.size} 个导出名，TOP ${top.length}）\n`);
r.push("refs = 直接出现该标识符的文件数；count = 全仓库词元总次数；定义位置取本地声明（re-export 只列第一个来源）");
r.push("| refs | count | kind | 名称 | 定义 | 被引用的包分布 |");
r.push("|---:|---:|---|---|---|---|");
for (const s of top) {
  const def = s.definedAt.length ? s.definedAt[0] : s.reexports[0] ?? "?";
  const dist = Object.entries(s.byPkg).sort((a, b) => b[1] - a[1]).map(([p, c]) => `${p}×${c}`).join(" ");
  r.push(`| ${s.refs} | ${s.count} | ${s.kind} | **${s.name}** | ${def} | ${dist} |`);
}
console.log(r.join("\n"));
