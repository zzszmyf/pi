# pi 仓库 Essence 报告

数据源：`out/git.md`（git 考古）、`out/deps.md`（模块依赖图）、`out/symbols.md`（导出符号中心性），原始数据在 `out/*.json`。分析日期 2026-06-24。

## 一句话本质

pi 是一个以终端 TUI 为载体的 coding agent monorepo：`tui` 提供终端 UI 内核，`ai` 是 LLM provider 抽象层，`agent` 是会话/压缩等 harness 能力，`coding-agent` 是组合前三者的应用层。代码流向严格单向（coding-agent → agent/ai/tui → 底层），是一个由单人主导（Mario Zechner 72% commits）、以 fix 迭代为主的成熟项目。

## 1. 演化叙事（git 考古）

**规模与节奏**

- 4718 个提交，2025-08-09 → 2026-06-24（约 10.5 个月）。
- 类型分布：无前缀 43%、`fix` 27%、`feat` 10%、`docs` 9%。fix:feat ≈ 2.7:1，说明产品已过功能爆发期，处于密集打磨期。
- 月度尖峰：2025-12（872 提交）与 2026-01（1224 提交）——这是 monorepo 重构/定型期：`interactive-mode.ts`、`agent-session.ts` 均 born 于 2025-12-09，`docs/refactor.md` 于 2025-12-08 出现，coding-agent 主体架构由此定形。
- 高频关键词 `release/changelog/unreleased/section/cycle/merge/closes` 与 `github-actions[bot]` 112 提交：发布流程高度自动化（每版本统一更新 changelog 的 lockstep 发布）。

**人员**

- Mario Zechner 3404（72%）、Armin Ronacher 328（7%）、github-actions[bot] 112（2.4%）。其余贡献者（Abakumov、Ylisiurunen、Bailon、Stikbakke、Poyarkov 等）合计不足 3%。本质上是单人项目 + 自动化。

**包的生灭（历史 → 现状）**

| 包 | 生 | 灭 | 说明 |
|---|---|---|---|
| `agent` / `tui` | 2025-08-09 | — | 仓库起点，最老文件即这两包 |
| `ai` | 2025-08（provider 文件 8-17~8-29） | — | 早期与 agent 并行发展 |
| `browser-extension` | 2025-10-03 | 2025-10-06 移除 | 迁出到独立 sitegeist 仓库（`aa005d06`） |
| `web-ui` | 2025-10-05 | 2026-05-20 移除 | 早期 0.5.x 时代的 Web 界面（`b141e1fa` "remove web-ui workspace"） |
| `mom` | 2025-11-26 | 2026-04-30 移除 | 与 pods 一同移除（`0ed0d434` "remove mom and pods packages"） |
| `pods` | 2025-11~12 | 2026-04-30 移除 | 同上 |
| `coding-agent` | 2025-10-17（main.ts）；12-09 交互模式定型 | — | 现主应用 |

当前稳定四包：`tui`(28 src) / `agent`(25) / `ai`(146) / `coding-agent`(158)。演化方向是收敛：实验性外围（web-ui、browser-extension、mom、pods）全部剥离，保留 TUI 主线。

## 2. 结构本质（依赖图）

- 357 个 src 文件、1445 条去重依赖边；src 内 0 个动态 import（懒加载边界干净）。
- 跨包依赖只有三条主链，且全部单向、无环：
  - `coding-agent → tui`（57 边）、`→ ai`（38）、`→ agent`（30）
  - `agent → ai`（11）
  - `ai`、`tui` 不依赖任何上层包。`ai` 的外部依赖只有模型厂商 SDK（openai、@anthropic-ai/sdk、@google/genai、@aws-sdk/client-bedrock）；`tui` 只有 marked。
- 承重模块（fanIn TOP）：
  - `ai/src/types.ts`（fanIn 86）——全仓库类型契约中枢，Model/Message/TextContent/ImageContent/Context/Tool/ThinkingLevel 等都在这里。
  - `coding-agent/src/modes/interactive/theme/theme.ts`（fanIn 54）——交互模式的视觉骨架。
  - `ai/src/models.ts`（fanIn 49）——Provider 注册与懒加载入口。
  - `coding-agent/src/config.ts`（fanIn 35）、`ai/src/auth/helpers.ts`（fanIn 33）。
- 外部契约面：`ai/index.ts`（17 入边）、`ai/compat.ts`（13）、`agent/index.ts`（12）。改动 `ai/src/types.ts` 是全仓库风险最高的操作。

## 3. 符号本质

1404 个导出名。被引用最多的符号精确映射了三个内核：

1. **LLM 契约**（ai 包）：`Model`(85 refs，跨 3 包)、`Provider`(41)、`createProvider`(37)、`stream`(35)/`streamSimple`(23)、`AssistantMessage`(29)、`ImageContent`(31)。
2. **交互 UI**（coding-agent + tui）：`theme`(67，几乎全在 coding-agent 内部——视觉是 coding-agent 的内聚核心)、`Text`(33)、`Container`(30)、`Component`(27)、`Spacer`(26)、`DynamicBorder`(24)、`keyHint`(21)。
3. **工程基建**（coding-agent）：`resolvePath`(19)、`SettingsManager`(18)、`getAgentDir`/`CONFIG_DIR_NAME`(16)、`compact`(14)、`time`(15)。

跨包符号（`Model` 跨 ai/coding-agent/agent；`Agent`/`Session`/`AgentMessage` 跨 coding-agent/agent）与依赖图完全一致，没有隐式的符号级环。

## 4. 交叉验证：热点 vs 承重

| 维度 | 第一名 | 解读 |
|---|---|---|
| 累计 churn | `ai/src/models.generated.ts`（churn 14.2万，424 commits，近 180 天仍 4.8 万） | 生成文件，随每次模型元数据刷新重写——churn 之王但非核心代码 |
| 提交次数 | `coding-agent/CHANGELOG.md`（1567 commits） | 每次提交都更新 changelog，是发布纪律的体现 |
| fanIn | `ai/src/types.ts`（86） | churn 不高但被依赖最广——契约层稳定而沉重 |
| 符号 refs | `Model`（85）/ `theme`（67） | 与 fanIn 榜首一致：数据模型与主题是两大引力中心 |
| 长期活跃 | `interactive-mode.ts`、`agent-session.ts`（均 2025-12-09 出生，422/247 commits，last=2026-06-24 当天） | 应用层主循环持续演化，是项目"还活着"的脉搏 |

生成管线也是结构的一部分：`models.json` → `scripts/generate-models.ts` → `models.generated.ts`（AGENTS.md 明令禁止手改生成物），2026-06 新增 openrouter/vercel-ai-gateway/amazon-bedrock 等 provider 模型文件，说明 provider 覆盖仍在扩张。

## 5. 结论（TL;DR）

- **架构**：四层单向栈 `tui`（UI 内核）+ `ai`（provider 抽象）+ `agent`（harness）+ `coding-agent`（应用），无环、无动态 import 越界。
- **本质**：Mario Zechner 的个人项目；fix 主导的成熟期；发布高度自动化（lockstep 版本 + 自动 changelog/CI）。
- **契约**：改 `ai/src/types.ts` 影响全仓库；`theme` 与 `config` 是 coding-agent 内部两大承重墙。
- **演化**：从 8 月的 agent+tui 起点，经历 12 月大重构定型 coding-agent，2026 年剥离 web-ui/browser-extension/mom/pods，收敛为聚焦 TUI 的四包 monorepo；近 180 天热点在 provider 扩张（openrouter、vercel、bedrock）与 agent harness 重构（agent-harness.ts、compaction）。

## 附录：复现

```bash
python3 tools/essence/git_arch.py  > tools/essence/out/git.md      # 写 out/git.json
node tools/essence/deps.mjs        > tools/essence/out/deps.md     # 写 out/deps.json
node tools/essence/symbols.mjs     > tools/essence/out/symbols.md  # 写 out/symbols.json
```

已知局限：`born` 基于 `--diff-filter=A`，merge 引入或重命名的文件记为 `None`；符号分析为词法级（标识符出现），不做完整类型解析。
