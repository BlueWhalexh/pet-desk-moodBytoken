# pet-desk-moodBytoken

一个会根据本地 Coding Agent token 用量改变心情的桌面小宠物。

当你的 agent 用得不多时，小狗保持正常 idle；当 Claude/Codex 等本地 agent 的 token 用量变重时，它会逐渐变成 tired、exhausted，最后进入 dying 的趴倒/濒临崩溃姿态。这里的 mood 不是透明度、滤镜、变灰这种视觉假象，而是切换真实的宠物表情和姿态精灵图。

![Petdex icon](public/brand/petdex-desktop-icon.png)

## 项目目标

Coding Agent 大多数时候是不可见的。它会消耗 context、cache read、output tokens，也会在工具调用循环里跑很久，但你通常只能看到一个 spinner，或者之后才从账单里意识到用量已经很高。

这个项目把这些不可见的用量变成一个桌面上的环境反馈：

- token 用量会被计算成 `0..1` 的 fatigue 分数
- fatigue 会映射成五档 mood
- mood 会切换真实的宠物 idle sprite row
- 计算逻辑完全本地、可配置、容易改

## 效果逻辑

Mood 分档：

| Fatigue | Mood | 宠物表现 |
| --- | --- | --- |
| `< 0.20` | `energetic` | 精神、活跃 |
| `< 0.45` | `normal` | 默认 idle |
| `< 0.70` | `tired` | 低能量、眼神疲惫 |
| `< 0.90` | `exhausted` | 坐下、塌下去 |
| `>= 0.90` | `dying` | 趴倒、濒临崩溃 |

桌面应用会查找当前宠物目录下的 mood sprites：

```text
~/.petdex/pets/<slug>/moods/energetic.webp
~/.petdex/pets/<slug>/moods/normal.webp
~/.petdex/pets/<slug>/moods/tired.webp
~/.petdex/pets/<slug>/moods/exhausted.webp
~/.petdex/pets/<slug>/moods/dying.webp
```

每个文件都是透明背景 WebP，尺寸固定为 `1152x208`，也就是 6 个横向排列的 `192x208` idle frames。

如果某只宠物没有这些 mood sprites，桌面应用会自动回退到原 Petdex 的 CSS filter 方案，保证旧宠物仍然能显示。

## Token 心情算法

核心代码：

- `packages/petdex-desktop/sidecar/token-mood.ts`
- `packages/petdex-desktop/sidecar/agent-usage.ts`

采样器使用三层策略：

1. 优先读取 agent 日志里的原生 usage 字段，例如 `input_tokens`、`output_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens`。
2. 如果没有原生 usage，就用 `js-tiktoken` 按 `gpt-4o` / `o200k_base` tokenizer 估算 transcript 文本 token。
3. 如果 tokenizer 加载失败，则回退到 `ceil(text.length / 4)` 的字符估算。

计算公式：

```text
weightedTokens =
  inputTokens * inputWeight +
  outputTokens * outputWeight +
  cacheReadTokens * cacheReadWeight +
  cacheCreationTokens * cacheCreationWeight +
  estimatedTextTokens * textEstimateWeight

fatigue = clamp(weightedTokens / tokenBudget, 0, 1)
```

默认参数：

| 配置项 | 默认值 |
| --- | --- |
| 统计窗口 | 24 小时 |
| Token 预算 | `600000` weighted tokens |
| Input 权重 | `1` |
| Output 权重 | `1.5` |
| Cache read 权重 | `0.15` |
| Cache creation 权重 | `0.5` |
| 文本估算权重 | `1` |

默认权重会让 output 和 cache creation 比 cache read 更“累”。这样 mood 更接近 agent 的真实工作强度，而不是简单看 raw token 总数。

## 当前支持的数据源

当前会读取这些本地数据源：

- Claude Code JSONL transcripts：`~/.claude/projects/**.jsonl`
- Claude stats cache：`~/.claude/stats-cache.json`
- Codex archived JSONL transcripts：`~/.codex/archived_sessions/**.jsonl`

扫描器只读取本地文件，只提取数字 usage 和时间戳。不会上传 prompt、response、token 明细或 telemetry。

## 配置方式

启动 desktop 或 sidecar 前设置环境变量即可：

```bash
PETDEX_USAGE_MOOD_INTERVAL_MS=30000
PETDEX_USAGE_MOOD_WINDOW_MS=86400000
PETDEX_USAGE_MOOD_TOKEN_BUDGET=600000

PETDEX_TOKEN_WEIGHT_INPUT=1
PETDEX_TOKEN_WEIGHT_OUTPUT=1.5
PETDEX_TOKEN_WEIGHT_CACHE_READ=0.15
PETDEX_TOKEN_WEIGHT_CACHE_CREATION=0.5
PETDEX_TOKEN_WEIGHT_TEXT_ESTIMATE=1
```

关闭自动 token mood 采样：

```bash
PETDEX_USAGE_MOOD=0
```

你也可以通过本地 sidecar endpoint 手动设置 mood：

```bash
TOKEN="$(cat ~/.petdex/runtime/update-token)"
curl -sS http://127.0.0.1:7777/mood \
  -H "content-type: application/json" \
  -H "x-petdex-update-token: $TOKEN" \
  --data '{"level":"tired","reason":"manual demo","agent_source":"demo"}'
```

手动 mood 默认会保持 5 分钟，然后才允许自动 token mood 覆盖：

```bash
PETDEX_MANUAL_MOOD_HOLD_MS=300000
```

## 生成 Mood Sprites

仓库里包含一个本地 Codex skill：

```text
.agents/skills/petdex-mood-sprite/
```

生成 mock 数据用于 renderer 链路测试：

```bash
node .agents/skills/petdex-mood-sprite/scripts/generate-mood-sprites.mjs \
  aka-shiba \
  --mock-postures \
  --out-dir /tmp/aka-shiba-moods
```

处理 AI 生成的 5x6 绿幕 sprite sheet：

```bash
node .agents/skills/petdex-mood-sprite/scripts/postprocess-ai-mood-sheet.mjs \
  --input /path/to/generated-5x6-green-screen-sheet.png \
  --slug aka-shiba
```

注意：正式 mood sprites 应该是真实的表情和姿态变化。mock 输出只用于测试渲染链路，不适合作为官方资产。

## 本地构建

安装依赖：

```bash
bun install
```

构建 sidecar：

```bash
bun build packages/petdex-desktop/sidecar/server.ts \
  --target=node \
  --format=cjs \
  --outfile=packages/petdex-desktop/sidecar/server.js \
  --minify
```

构建 desktop：

```bash
cd packages/petdex-desktop
ZERO_NATIVE_PATH=/absolute/path/to/zero-native zig build
```

运行：

```bash
PETDEX_SIDECAR_DIR="$PWD/packages/petdex-desktop/sidecar" \
  ./packages/petdex-desktop/zig-out/bin/petdex-desktop
```

## 验证

核心测试：

```bash
bun test \
  packages/petdex-desktop/sidecar/token-mood.test.ts \
  packages/petdex-desktop/sidecar/agent-usage.test.ts \
  packages/petdex-desktop/sidecar/mood-level.test.ts \
  packages/petdex-desktop/sidecar/state-queue.test.ts \
  packages/petdex-desktop/sidecar/update-utils.test.ts \
  packages/petdex-desktop/sidecar/running-variant.test.ts
```

格式和 lint：

```bash
bunx biome check \
  packages/petdex-desktop/sidecar/token-mood.ts \
  packages/petdex-desktop/sidecar/token-mood.test.ts \
  packages/petdex-desktop/sidecar/agent-usage.ts \
  packages/petdex-desktop/sidecar/agent-usage.test.ts \
  packages/petdex-desktop/sidecar/server.ts
```

直接 smoke test 本地用量采样：

```bash
bun -e "import { scanLocalAgentUsage } from './packages/petdex-desktop/sidecar/agent-usage.ts'; console.log(scanLocalAgentUsage())"
```

## 技术调研结论

- `js-tiktoken` 是 OpenAI tiktoken 的 JavaScript port，适合作为本地 token 估算器。
- OpenAI tiktoken 相关实践建议按模型使用对应 encoding，当前 GPT-4o 系列可使用 `o200k_base`。
- Claude transcript 通常会暴露 `input_tokens`、`output_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens` 等 usage 字段，本项目会优先使用这些原生数据。

## Roadmap

- 增加一个小设置面板，用 UI 调整 token budget 和 weights。
- 给默认 mood sprites 补完整截图/GIF。
- 支持更多 agent 的本地 transcript 格式。
- 支持 per-agent pets，让 Codex、Claude Code、Gemini 等分别驱动不同宠物。
- 打包 macOS `.app`，降低安装门槛。

## 致谢

本项目基于 Petdex 做 token mood fork/extension。Petdex 提供了宠物包格式、桌面 sprite renderer、CLI hooks 和 gallery 基础。

上游项目：https://github.com/crafter-station/petdex

## License

MIT，沿用上游 Petdex 源码许可。
