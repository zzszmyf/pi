#!/usr/bin/env node
// Module dependency graph analysis for the pi monorepo. Zero dependencies.
// Usage: node tools/essence/deps.mjs
// Emits a markdown summary to stdout and full data to out/deps.json.
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = join(__dirname, "out");

const PKGS = {
  "@earendil-works/pi-tui": "tui",
  "@earendil-works/pi-ai": "ai",
  "@earendil-works/pi-agent-core": "agent",
  "@earendil-works/pi-coding-agent": "coding-agent",
};
const BUILTINS = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

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

// Extract module specifiers from import / export...from statements.
// Statement is scanned until ';' or a depth-0 newline; the first string literal
// inside is the specifier (import clause never contains a string before it).
function extractSpecs(text) {
  const specs = [];
  const re = /(^|\n)\s*(?:import|export)\b/g;
  let m;
  while ((m = re.exec(text))) {
    let i = re.lastIndex;
    let depth = 0;
    let end = i;
    for (; end < text.length; end++) {
      const c = text[end];
      if (c === "{") depth++;
      else if (c === "}") {
        if (depth === 0) break;
        depth--;
      } else if ((c === ";" || c === "\n") && depth === 0) break;
    }
    const window = text.slice(i, end);
    const isImport = /^\s*import\b/.test(window);
    // import: first string literal is the specifier (covers import "x" / import {..} from "x" / import("x"))
    // export: only re-exports (export .. from "x") create a dependency
    const spec = isImport ? window.match(/["']([^"'\n]+)["']/) : window.match(/\bfrom\s+["']([^"'\n]+)["']/);
    if (spec) specs.push(spec[1]);
    re.lastIndex = end > i ? end : i + 1;
  }
  return specs;
}

function firstExisting(cands) {
  for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

function resolveSpec(fileDir, spec) {
  if (spec.startsWith(".")) {
    const base = join(fileDir, spec);
    return firstExisting([base, base + ".ts", join(base, "index.ts")]) ?? "workspace-unresolved";
  }
  if (spec.startsWith("node:") || BUILTINS.has(spec.split("/")[0])) return "builtin";
  for (const [name, short] of Object.entries(PKGS)) {
    if (spec !== name && !spec.startsWith(name + "/")) continue;
    const sub = spec.slice(name.length).replace(/^\//, "");
    if (!sub) return join(ROOT, "packages", short, "src", "index.ts");
    const base = join(ROOT, "packages", short, "src", sub);
    return (
      firstExisting([
        base.endsWith(".ts") ? base : base + ".ts",
        base.endsWith(".ts") ? null : join(base, "index.ts"),
      ]) ?? "workspace-unresolved"
    );
  }
  return "external";
}

function pkgOf(p) {
  const m = p.match(/packages\/([^/]+)\//);
  return m ? m[1] : "root";
}

const pkgSrcs = [];
for (const short of Object.values(PKGS)) pkgSrcs.push(...walk(join(ROOT, "packages", short, "src")));

const files = new Map(); // relPath -> { pkg, fanIn:Set, fanOut:Set, imports:[], text }
for (const abs of pkgSrcs) {
  const rel = relative(ROOT, abs);
  files.set(rel, { pkg: pkgOf(rel), fanIn: new Set(), fanOut: new Set(), imports: [], dynamic: 0 });
}

const edges = new Set(); // "from\x00to"
const external = new Map(); // pkg -> (spec -> count)
const unresolved = [];

for (const [rel, f] of files) {
  const text = stripComments(readFileSync(join(ROOT, rel), "utf8"));
  f.dynamic = (text.match(/\bimport\s*\(/g) || []).length;
  for (const spec of extractSpecs(text)) {
    const target = resolveSpec(dirname(join(ROOT, rel)), spec);
    if (target === "builtin") continue;
    if (target === "external") {
      let m = external.get(f.pkg);
      if (!m) external.set(f.pkg, (m = new Map()));
      m.set(spec, (m.get(spec) ?? 0) + 1);
      continue;
    }
    if (target === "workspace-unresolved") {
      unresolved.push(`${rel} -> ${spec}`);
      continue;
    }
    const relTarget = relative(ROOT, target);
    f.imports.push(relTarget);
    f.fanOut.add(relTarget);
    edges.add(`${rel}\u0000${relTarget}`);
    files.get(relTarget).fanIn.add(rel);
  }
}

// Cross-package summary
const cross = new Map(); // "A->B" -> count
const crossTargets = new Map(); // "A->B" -> (target -> count)
for (const e of edges) {
  const [a, b] = e.split("\u0000");
  const pa = pkgOf(a), pb = pkgOf(b);
  if (pa === pb) continue;
  const key = `${pa}->${pb}`;
  cross.set(key, (cross.get(key) ?? 0) + 1);
  let m = crossTargets.get(key);
  if (!m) crossTargets.set(key, (m = new Map()));
  m.set(b, (m.get(b) ?? 0) + 1);
}

const topFanIn = [...files.entries()]
  .filter(([rel]) => !rel.endsWith("index.ts"))
  .sort((a, b) => b[1].fanIn.size - a[1].fanIn.size || b[1].fanOut.size - a[1].fanOut.size)
  .slice(0, 30);

// Modules imported (transitively not needed; direct) by files in all 4 packages
const pkgImporters = new Map(); // target -> Set(packages)
for (const e of edges) {
  const [a, b] = e.split("\u0000");
  let s = pkgImporters.get(b);
  if (!s) pkgImporters.set(b, (s = new Set()));
  s.add(pkgOf(a));
}
const universal = [...pkgImporters.entries()]
  .filter(([, s]) => s.size >= 2)
  .sort((a, b) => b[1].size - a[1].size)
  .slice(0, 20);

const byPkg = {};
for (const [rel, f] of files) (byPkg[f.pkg] ??= []).push({ rel, fanIn: f.fanIn.size, fanOut: f.fanOut.size });

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, "deps.json"),
  JSON.stringify({
    root: ROOT,
    nodes: [...files.entries()].map(([rel, f]) => ({ path: rel, pkg: f.pkg, fanIn: f.fanIn.size, fanOut: f.fanOut.size })),
    edges: [...edges].map((e) => ({ from: e.slice(0, e.indexOf("\u0000")), to: e.slice(e.indexOf("\u0000") + 1) })),
    external: Object.fromEntries([...external.entries()].map(([p, m]) => [p, Object.fromEntries(m)])),
    unresolved,
  }),
);

// ---- report ----
const r = [];
r.push(`# 模块依赖图（${files.size} 个 src 文件，${edges.size} 条去重边）\n`);
r.push("## 包规模");
for (const [p, arr] of Object.entries(byPkg).sort()) r.push(`- **${p}**: ${arr.length} 文件`);
r.push("\n## 跨包依赖（src 级别，去重边数）");
for (const [k, v] of [...cross.entries()].sort((a, b) => b[1] - a[1])) {
  r.push(`- ${k}: ${v} 条`);
  const top = [...crossTargets.get(k).entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [t, c] of top) r.push(`    - ${t} （被引 ${c} 次）`);
}
r.push("\n## 承重模块 TOP 30（被最多文件直接 import，排除 index.ts）");
r.push("| fanIn | fanOut | 文件 |");
r.push("|---:|---:|---|");
for (const [rel, f] of topFanIn) r.push(`| ${f.fanIn.size} | ${f.fanOut.size} | ${rel} |`);
r.push("\n## 被多个包直接引用的模块（跨包契约候选）");
for (const [b, s] of universal) r.push(`- ${b} ← [${[...s].join(", ")}]`);
r.push("\n## 外部依赖 TOP（按包）");
for (const [p, m] of [...external.entries()].sort()) {
  const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  r.push(`- **${p}**: ` + top.map(([s, c]) => `${s}×${c}`).join(", "));
}
const dynTotal = [...files.values()].reduce((a, f) => a + f.dynamic, 0);
r.push(`\n## 其他\n- 动态 import() 总数: ${dynTotal}（src 内应为 0）`);
if (unresolved.length) r.push(`- 未解析的 workspace import: ${unresolved.length}\n` + unresolved.slice(0, 20).map((u) => `  - ${u}`).join("\n"));

console.log(r.join("\n"));
