# 模块依赖图（357 个 src 文件，1445 条去重边）

## 包规模
- **agent**: 25 文件
- **ai**: 146 文件
- **coding-agent**: 158 文件
- **tui**: 28 文件

## 跨包依赖（src 级别，去重边数）
- coding-agent->tui: 57 条
    - packages/tui/src/index.ts （被引 57 次）
- coding-agent->ai: 38 条
    - packages/ai/src/index.ts （被引 24 次）
    - packages/ai/src/compat.ts （被引 9 次）
    - packages/ai/src/oauth.ts （被引 4 次）
    - packages/ai/src/bedrock-provider.ts （被引 1 次）
- coding-agent->agent: 30 条
    - packages/agent/src/index.ts （被引 30 次）
- agent->ai: 11 条
    - packages/ai/src/index.ts （被引 9 次）
    - packages/ai/src/compat.ts （被引 2 次）

## 承重模块 TOP 30（被最多文件直接 import，排除 index.ts）
| fanIn | fanOut | 文件 |
|---:|---:|---|
| 86 | 11 | packages/ai/src/types.ts |
| 54 | 5 | packages/coding-agent/src/modes/interactive/theme/theme.ts |
| 49 | 6 | packages/ai/src/models.ts |
| 35 | 2 | packages/coding-agent/src/config.ts |
| 33 | 1 | packages/ai/src/auth/helpers.ts |
| 25 | 2 | packages/ai/src/api/openai-completions.lazy.ts |
| 25 | 2 | packages/coding-agent/src/modes/interactive/components/keybinding-hints.ts |
| 23 | 19 | packages/coding-agent/src/core/extensions/types.ts |
| 23 | 1 | packages/coding-agent/src/utils/paths.ts |
| 22 | 2 | packages/coding-agent/src/modes/interactive/components/dynamic-border.ts |
| 19 | 4 | packages/coding-agent/src/core/settings-manager.ts |
| 16 | 5 | packages/coding-agent/src/core/session-manager.ts |
| 15 | 4 | packages/agent/src/harness/types.ts |
| 14 | 2 | packages/ai/src/auth/types.ts |
| 14 | 1 | packages/ai/src/utils/event-stream.ts |
| 13 | 5 | packages/tui/src/tui.ts |
| 13 | 1 | packages/coding-agent/src/core/source-info.ts |
| 12 | 2 | packages/ai/src/api/anthropic-messages.lazy.ts |
| 11 | 19 | packages/ai/src/compat.ts |
| 11 | 2 | packages/ai/src/api/lazy.ts |
| 11 | 2 | packages/coding-agent/src/core/messages.ts |
| 11 | 0 | packages/tui/src/utils.ts |
| 10 | 8 | packages/coding-agent/src/core/model-registry.ts |
| 10 | 1 | packages/ai/src/utils/provider-env.ts |
| 10 | 0 | packages/coding-agent/src/core/tools/truncate.ts |
| 9 | 26 | packages/coding-agent/src/core/agent-session.ts |
| 9 | 2 | packages/coding-agent/src/core/keybindings.ts |
| 9 | 2 | packages/coding-agent/src/core/tools/tool-definition-wrapper.ts |
| 9 | 1 | packages/ai/src/api/simple-options.ts |
| 9 | 1 | packages/ai/src/utils/headers.ts |

## 被多个包直接引用的模块（跨包契约候选）
- packages/ai/src/index.ts ← [ai, agent, coding-agent]
- packages/ai/src/compat.ts ← [agent, coding-agent]
- packages/agent/src/index.ts ← [agent, coding-agent]

## 外部依赖 TOP（按包）
- **agent**: yaml×2, ignore×1, typebox×1
- **ai**: openai×5, openai/resources/responses/responses.js×4, typebox×4, @google/genai×3, openai/resources/chat/completions.js×2, @anthropic-ai/sdk×1, @anthropic-ai/sdk/resources/messages.js×1, @aws-sdk/client-bedrock-runtime×1, @smithy/node-http-handler×1, @smithy/types×1, http-proxy-agent×1, https-proxy-agent×1
- **coding-agent**: chalk×13, typebox×11, proper-lockfile×3, typebox/compile×3, minimatch×2, ignore×2, semver×2, diff×2, jiti/static×1, typebox/value×1, undici×1, typebox/error×1
- **tui**: marked×1, get-east-asian-width×1

## 其他
- 动态 import() 总数: 37（src 内应为 0）
