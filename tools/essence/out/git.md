# Git 考古（4718 commits, 2025-08-09 → 2026-06-24）

## 提交类型分布
- (no-prefix): 2075 (43%)
- fix: 1301 (27%)
- feat: 487 (10%)
- docs: 430 (9%)
- chore: 293 (6%)
- refactor: 68 (1%)
- test: 39 (0%)
- perf: 7 (0%)
- release: 5 (0%)
- revert: 4 (0%)
- style: 4 (0%)
- ci: 4 (0%)
- build: 1 (0%)

## 高频 scope TOP 20
`coding-agent`×1025, `ai`×446, `tui`×226, `agent`×62, `plan-mode`×30, `changelog`×25, `hooks`×17, `ai,coding-agent`×15, `mom`×15, `ci`×10, `web-ui`×10, `extensions`×8, `tui,coding-agent`×6, `release`×6, `deps`×5, `coding-agent,ai`×5, `coding-agent,tui`×5, `amazon-bedrock`×4, `oauth`×4, `prompts`×4

## 提交主题关键词 TOP 30（已去类型前缀/停用词）
**release**(301), **changelog**(279), **update**(275), **unreleased**(267), **merge**(247), **section**(237), **closes**(232), **tool**(225), **support**(181), **cycle**(169), **next**(167), **remove**(159), **session**(155), **request**(150), **pull**(145), **model**(139), **extension**(136), **models**(134), **provider**(130), **contributor**(118), **thinking**(114), **approve**(112), **prompt**(107), **entries**(104), **branch**(98), **readme**(92), **context**(91), **test**(88), **improve**(87), **compaction**(86)

## 月度提交量（最近 24 个月）
- 2025-08  ███ 85
- 2025-09  ██ 53
- 2025-10  ████ 129
- 2025-11  █████████ 280
- 2025-12  ████████████████████████████ 872
- 2026-01  ████████████████████████████████████████ 1224
- 2026-02  ████████████ 377
- 2026-03  ██████████████ 418
- 2026-04  ███████████████ 461
- 2026-05  ████████████████ 481
- 2026-06  ███████████ 338

## 贡献者 TOP 10
- Mario Zechner: 3404
- Armin Ronacher: 328
- github-actions[bot]: 112
- Helmut Januschka: 66
- Aliou Diallo: 56
- Sviatoslav Abakumov: 44
- Markus Ylisiurunen: 44
- Nico Bailon: 33
- Vegard Stikbakke: 25
- Danila Poyarkov: 21

## 累计 churn TOP 30
- `packages/ai/src/models.generated.ts`  churn=142375, commits=424, last=2026-06-22, born=2025-08-29
- `packages/ai/src/models.json`  churn=16628, commits=2, last=2025-08-30, born=2025-08-25
- `packages/coding-agent/src/modes/interactive/interactive-mode.ts`  churn=14712, commits=422, last=2026-06-24, born=2025-12-09
- `packages/coding-agent/src/core/agent-session.ts`  churn=9309, commits=247, last=2026-06-24, born=2025-12-09
- `packages/coding-agent/src/main.ts`  churn=8994, commits=209, last=2026-06-24, born=2025-10-17
- `packages/coding-agent/README.md`  churn=7923, commits=318, last=2026-06-22, born=2025-11-12
- `packages/coding-agent/docs/extensions.md`  churn=7208, commits=152, last=2026-06-22, born=2026-01-05
- `packages/coding-agent/docs/refactor.md`  churn=7170, commits=20, last=2025-12-09, born=2025-12-08
- `packages/ai/scripts/generate-models.ts`  churn=7168, commits=179, last=2026-06-23, born=2025-08-25
- `packages/coding-agent/CHANGELOG.md`  churn=6372, commits=1567, last=2026-06-24, born=2025-11-13
- `packages/coding-agent/src/tui/tui-renderer.ts`  churn=6033, commits=76, last=2025-12-09, born=None
- `packages/tui/src/tui.ts`  churn=5232, commits=77, last=2026-06-23, born=2025-08-09
- `packages/ai/README.md`  churn=5163, commits=108, last=2026-06-23, born=2025-08-17
- `packages/coding-agent/src/core/package-manager.ts`  churn=5152, commits=80, last=2026-06-14, born=2026-01-20
- `packages/coding-agent/docs/hooks.md`  churn=5015, commits=75, last=2026-01-05, born=2025-12-10
- `packages/ai/src/providers/openrouter.models.ts`  churn=4786, commits=6, last=2026-06-23, born=2026-06-10
- `packages/web-ui/src/utils/test-sessions.ts`  churn=4714, commits=3, last=2026-05-20, born=2025-10-05
- `packages/tui/test/editor.test.ts`  churn=4707, commits=47, last=2026-06-16, born=2025-11-16
- `packages/web-ui/example/package-lock.json`  churn=4670, commits=4, last=2025-11-12, born=2025-10-05
- `packages/tui/src/components/editor.ts`  churn=4669, commits=91, last=2026-06-16, born=None
- `packages/browser-extension/src/utils/test-sessions.ts`  churn=4494, commits=3, last=2025-10-05, born=2025-10-03
- `packages/coding-agent/src/export-html.ts`  churn=4392, commits=16, last=2025-12-08, born=2025-11-12
- `packages/ai/src/providers/openai-completions.ts`  churn=4202, commits=139, last=2026-06-22, born=2025-08-24
- `packages/mom/src/agent.ts`  churn=4202, commits=57, last=2026-04-30, born=2025-11-26
- `packages/coding-agent/src/core/export-html/template.html`  churn=4163, commits=11, last=2026-03-19, born=2026-01-01
- `packages/ai/src/providers/openai-codex-responses.ts`  churn=4088, commits=60, last=2026-06-22, born=2026-01-04
- `packages/coding-agent/src/core/session-manager.ts`  churn=4074, commits=75, last=2026-06-23, born=None
- `packages/agent/src/agent.ts`  churn=4047, commits=56, last=2026-06-22, born=2025-08-09
- `packages/ai/src/providers/anthropic.ts`  churn=3792, commits=114, last=2026-06-22, born=2025-08-17
- `packages/coding-agent/src/core/sdk.ts`  churn=3371, commits=118, last=2026-06-16, born=2025-12-22

## 近 180 天 churn TOP 25
- `packages/ai/src/models.generated.ts`  churn=48343, commits=424, last=2026-06-22, born=2025-08-29
- `packages/ai/src/providers/openrouter.models.ts`  churn=4786, commits=6, last=2026-06-23, born=2026-06-10
- `packages/coding-agent/src/modes/interactive/interactive-mode.ts`  churn=3982, commits=422, last=2026-06-24, born=2025-12-09
- `packages/agent/src/harness/agent-harness.ts`  churn=2951, commits=22, last=2026-06-22, born=2026-05-03
- `packages/ai/src/providers/vercel-ai-gateway.models.ts`  churn=2884, commits=1, last=2026-06-10, born=2026-06-10
- `packages/coding-agent/src/core/agent-session.ts`  churn=2826, commits=247, last=2026-06-24, born=2025-12-09
- `packages/ai/scripts/generate-models.ts`  churn=2735, commits=179, last=2026-06-23, born=2025-08-25
- `packages/coding-agent/npm-shrinkwrap.json`  churn=2499, commits=28, last=2026-06-23, born=2026-05-20
- `packages/agent/docs/models.md`  churn=2444, commits=17, last=2026-06-24, born=2026-06-08
- `packages/coding-agent/CHANGELOG.md`  churn=2418, commits=1567, last=2026-06-24, born=2025-11-13
- `packages/web-ui/src/utils/test-sessions.ts`  churn=2357, commits=3, last=2026-05-20, born=2025-10-05
- `packages/coding-agent/src/main.ts`  churn=2162, commits=209, last=2026-06-24, born=2025-10-17
- `packages/ai/README.md`  churn=2038, commits=108, last=2026-06-23, born=2025-08-17
- `packages/ai/src/providers/register-builtins.ts`  churn=2005, commits=14, last=2026-06-22, born=2026-01-24
- `packages/coding-agent/test/package-manager.test.ts`  churn=1891, commits=51, last=2026-06-14, born=2026-01-20
- `packages/tui/test/editor.test.ts`  churn=1767, commits=47, last=2026-06-16, born=2025-11-16
- `packages/agent/src/harness/types.ts`  churn=1690, commits=28, last=2026-06-23, born=2026-05-03
- `packages/ai/test/openai-completions-tool-choice.test.ts`  churn=1689, commits=35, last=2026-06-22, born=2026-01-27
- `packages/ai/src/providers/amazon-bedrock.models.ts`  churn=1677, commits=1, last=2026-06-10, born=2026-06-10
- `packages/coding-agent/src/core/package-manager.ts`  churn=1639, commits=80, last=2026-06-14, born=2026-01-20
- `packages/ai/src/providers/openai-completions.ts`  churn=1612, commits=139, last=2026-06-22, born=2025-08-24
- `packages/ai/test/openai-codex-stream.test.ts`  churn=1601, commits=26, last=2026-06-23, born=2026-01-04
- `packages/coding-agent/src/core/tools/edit.ts`  churn=1488, commits=31, last=2026-05-29, born=None
- `packages/agent/src/harness/compaction.ts`  churn=1466, commits=2, last=2026-05-03, born=2026-05-03
- `packages/tui/src/components/editor.ts`  churn=1378, commits=91, last=2026-06-16, born=None

## 最老文件（存在 >1 年，按出生时间）
- `packages/agent/README.md`  born=2025-08-09, churn=1824, last=2026-06-22
- `packages/agent/src/main.ts`  born=2025-08-09, churn=285, last=2025-08-09
- `packages/agent/package-lock.json`  born=2025-08-09, churn=1499, last=2025-10-05
- `packages/agent/package.json`  born=2025-08-09, churn=1912, last=2026-06-23
- `packages/agent/src/agent.ts`  born=2025-08-09, churn=4047, last=2026-06-22
- `packages/agent/src/args.ts`  born=2025-08-09, churn=204, last=2025-08-09
- `packages/agent/src/cli.ts`  born=2025-08-09, churn=615, last=2025-08-09
- `packages/agent/src/index.ts`  born=2025-08-09, churn=274, last=2026-06-22
- `packages/agent/src/renderers/console-renderer.ts`  born=2025-08-09, churn=182, last=2025-08-10
- `packages/agent/src/renderers/json-renderer.ts`  born=2025-08-09, churn=7, last=2025-08-09
- `packages/agent/src/renderers/tui-renderer.ts`  born=2025-08-09, churn=472, last=2025-08-16
- `packages/agent/src/session-manager.ts`  born=2025-08-09, churn=189, last=2025-08-11
- `packages/agent/src/tools/tools.ts`  born=2025-08-09, churn=264, last=2025-08-09
- `packages/agent/tsconfig.build.json`  born=2025-08-09, churn=19, last=2026-05-27
- `packages/pods/README.md`  born=2025-08-09, churn=1022, last=2026-04-30
- `packages/pods/docs/gml-4.5.md`  born=2025-08-09, churn=378, last=2026-04-30
- `packages/pods/docs/gpt-oss.md`  born=2025-08-09, churn=466, last=2026-04-30
- `packages/pods/docs/implementation-plan.md`  born=2025-08-09, churn=366, last=2026-04-30
- `packages/pods/docs/kimi-k2.md`  born=2025-08-09, churn=394, last=2026-04-30
- `packages/pods/docs/models.md`  born=2025-08-09, churn=232, last=2026-04-30
- `packages/pods/docs/plan.md`  born=2025-08-09, churn=332, last=2026-04-30
- `packages/pods/docs/qwen3-coder.md`  born=2025-08-09, churn=264, last=2026-04-30
- `packages/pods/package-lock.json`  born=2025-08-09, churn=3066, last=2025-11-12
- `packages/pods/package.json`  born=2025-08-09, churn=1328, last=2026-04-30
- `packages/pods/scripts/model_run.sh`  born=2025-08-09, churn=166, last=2026-04-30

## 近 60 天新建文件 TOP 25（前沿方向）
- `packages/ai/src/utils/retry.ts`  born=2026-06-24, churn=96
- `packages/ai/test/retry.test.ts`  born=2026-06-24, churn=38
- `packages/coding-agent/test/suite/regressions/6019-explicit-provider-retry-message.test.ts`  born=2026-06-24, churn=31
- `packages/ai/src/legacy-api-aliases.ts`  born=2026-06-23, churn=108
- `packages/ai/test/openai-responses-terminal-event.test.ts`  born=2026-06-23, churn=233
- `packages/ai/src/providers/cloudflare-auth.ts`  born=2026-06-23, churn=163
- `packages/ai/test/compat-env.test.ts`  born=2026-06-23, churn=84
- `packages/coding-agent/test/suite/regressions/5996-session-name-newlines.test.ts`  born=2026-06-23, churn=40
- `packages/ai/src/providers/images/register-builtins.ts`  born=2026-06-22, churn=225
- `packages/coding-agent/test/suite/regressions/5217-compaction-reason.test.ts`  born=2026-06-22, churn=95
- `packages/ai/test/openai-completions-reasoning-details.test.ts`  born=2026-06-22, churn=118
- `packages/coding-agent/test/suite/regressions/5943-session-start-notify.test.ts`  born=2026-06-21, churn=513
- `packages/coding-agent/test/plan-mode-extension.test.ts`  born=2026-06-21, churn=167
- `packages/coding-agent/test/suite/regressions/extension-factory-cache.test.ts`  born=2026-06-20, churn=131
