#!/usr/bin/env python3
"""Git archaeology for the pi monorepo. Stdlib only.
Usage: python3 tools/essence/git_arch.py
Emits a markdown summary to stdout and full data to out/git.json.
"""
import collections
import datetime
import json
import os
import re
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
SEP = "\x1f"
MARK = "\x1e"


def git(*args):
    return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True, check=True).stdout


commits = []
for line in git("log", "--date=short", f"--format=%H{SEP}%ad{SEP}%s").split("\n"):
    if not line:
        continue
    h, d, s = line.split(SEP)
    commits.append((h, d, s))

# Churn + per-file commit count + last touched (log is newest-first).
churn = collections.Counter()
file_commits = collections.Counter()
last_touched = {}
out = git("log", "--numstat", "--date=short", f"--format={MARK}%H{SEP}%ad")
cur_date = None
for line in out.split("\n"):
    if line.startswith(MARK):
        cur_date = line[1:].split(SEP)[1]
        continue
    parts = line.split("\t")
    if len(parts) != 3:
        continue
    added, deleted, path = parts
    if added == "-" or cur_date is None:
        continue
    path = path.split(SEP)[-1]
    if " => " in path:
        path = path.split(" => ")[-1]
    if path.startswith(("packages/", "scripts/", "tools/", "docs/")):
        churn[path] += int(added) + int(deleted)
        file_commits[path] += 1
        last_touched.setdefault(path, cur_date)

# File birth: oldest addition commit (iterate newest-first, last write wins).
birth = {}
out = git("log", "--diff-filter=A", "--name-only", "--date=short", f"--format={MARK}%ad")
cur_date = None
for line in out.split("\n"):
    if line.startswith(MARK):
        cur_date = line[1:]
        continue
    if line and cur_date:
        birth[line] = cur_date  # keep overwriting -> ends at oldest

# Recent activity (last 180 days).
recent_churn = collections.Counter()
out = git("log", "--since=180.days.ago", "--numstat", "--date=short", f"--format={MARK}%ad")
for line in out.split("\n"):
    if line.startswith(MARK):
        continue
    parts = line.split("\t")
    if len(parts) != 3 or parts[0] == "-":
        continue
    added, deleted, path = parts
    path = path.split(SEP)[-1]
    if " => " in path:
        path = path.split(" => ")[-1]
    if path.startswith(("packages/", "scripts/", "tools/", "docs/")):
        recent_churn[path] += int(added) + int(deleted)

today = datetime.date.today()


def days_ago(d):
    return (today - datetime.date.fromisoformat(d)).days


# Conventional-commit type + scope.
cc = re.compile(r"^(feat|fix|docs|chore|refactor|perf|test|build|ci|style|release|revert)(\(([^)]*)\))?\s*:?\s")
type_counts = collections.Counter()
scope_counts = collections.Counter()
subjects = []
for _, _, s in commits:
    m = cc.match(s)
    if m:
        type_counts[m.group(1)] += 1
        if m.group(3):
            scope_counts[m.group(3)] += 1
        subjects.append(s[m.end():])
    else:
        type_counts["(no-prefix)"] += 1
        subjects.append(s)

STOP = set(
    """a an and are as at be but by can could did do does doing done down during each few for from
had has have having he her him his if in into is it its just like made make making many may me more
most much must my no nor not now of off on once only or our out over own same she should so some such
than that the their them then there these they this those through to too under until up upon very was
were when where while who will with within without you your between because after before again further
about against all any both every here how what which why""".split()
)
word_counts = collections.Counter()
for s in subjects:
    for w in re.findall(r"[a-z][a-z0-9_-]{3,}", s.lower()):
        if w not in STOP:
            word_counts[w] += 1

month_counts = collections.Counter(d[:7] for _, d, _ in commits)
authors = collections.Counter()
for line in git("log", "--format=%an").split("\n"):
    if line:
        authors[line] += 1

os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, "git.json"), "w") as f:
    json.dump(
        {
            "total_commits": len(commits),
            "range": [commits[-1][1], commits[0][1]],
            "months": dict(month_counts),
            "types": dict(type_counts),
            "scopes": dict(scope_counts.most_common()),
            "words": word_counts.most_common(),
            "authors": authors.most_common(),
            "churn": dict(churn.most_common()),
            "file_commits": dict(file_commits.most_common()),
            "recent_churn": dict(recent_churn.most_common()),
            "last_touched": last_touched,
            "birth": birth,
        },
        f,
    )

r = []
r.append(f"# Git 考古（{len(commits)} commits, {commits[-1][1]} → {commits[0][1]}）\n")
r.append("## 提交类型分布")
for t, c in type_counts.most_common():
    r.append(f"- {t}: {c} ({100 * c // len(commits)}%)")
r.append("\n## 高频 scope TOP 20")
r.append(", ".join(f"`{s}`×{c}" for s, c in scope_counts.most_common(20)))
r.append("\n## 提交主题关键词 TOP 30（已去类型前缀/停用词）")
r.append(", ".join(f"**{w}**({c})" for w, c in word_counts.most_common(30)))
r.append("\n## 月度提交量（最近 24 个月）")
months = [m for m in sorted(month_counts) if m >= (today - datetime.timedelta(days=730)).strftime("%Y-%m")]
max_c = max(month_counts[m] for m in months) if months else 1
for m in months:
    r.append(f"- {m}  {'█' * round(40 * month_counts[m] / max_c)} {month_counts[m]}")
r.append("\n## 贡献者 TOP 10")
for a, c in authors.most_common(10):
    r.append(f"- {a}: {c}")

def section(title, pairs):
    r.append(f"\n## {title}")
    for p, v in pairs:
        lt = last_touched.get(p)
        b = birth.get(p)
        r.append(f"- `{p}`  churn={v}, commits={file_commits.get(p, 0)}, last={lt}, born={b}")

pk = lambda d: d.most_common(30)
section("累计 churn TOP 30", pk(churn))
section("近 180 天 churn TOP 25", pk(recent_churn)[:25])

oldest = sorted(((p, d) for p, d in birth.items() if p.startswith("packages/") and birth[p] <= (today - datetime.timedelta(days=365)).isoformat()), key=lambda x: x[1])[:25]
r.append("\n## 最老文件（存在 >1 年，按出生时间）")
for p, d in oldest:
    r.append(f"- `{p}`  born={d}, churn={churn.get(p, 0)}, last={last_touched.get(p)}")

newborn = sorted(((p, d) for p, d in birth.items() if p.startswith("packages/") and days_ago(d) <= 60), key=lambda x: x[1], reverse=True)[:25]
r.append("\n## 近 60 天新建文件 TOP 25（前沿方向）")
for p, d in newborn:
    r.append(f"- `{p}`  born={d}, churn={churn.get(p, 0)}")

print("\n".join(r))
