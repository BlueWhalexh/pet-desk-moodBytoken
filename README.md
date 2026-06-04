# pet-desk-moodBytoken

![license](https://img.shields.io/badge/license-MIT-green)
![platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![node](https://img.shields.io/badge/node-%3E%3D20-339933)
![agents](https://img.shields.io/badge/agent-Codex%20%2F%20Claude%20Code%20%2F%20Gemini%20%2F%20OpenCode-blue)

让 Coding Agent 的 token 压力变成一只会累、会趴下、会被你叫醒的桌面宠物。

它不是把宠物变透明、变灰或套滤镜，而是根据本地 agent 用量切换真实的表情和姿态精灵图：精神、正常、疲惫、力竭、趴倒。

![Petdex icon](public/brand/petdex-desktop-icon.png)

## 适合谁

- 想把 Codex / Claude Code 的用量压力看得更直观的开发者。
- 想从 agent 里输入 `/petdesk` 就唤醒桌宠的人。
- 想做自己的像素宠物、宠物商店或 agent 桌面伴侣的人。
- 想要一个本地优先、低开销、可扩展的开源项目基底的人。

## 功能亮点

- **真实心情姿态**：支持五档 mood sprites，不靠透明度、灰度、模糊来假装疲惫。
- **Agent 内启动**：安装后在 Codex / Claude Code / Gemini CLI / OpenCode 里输入 `/petdesk`。
- **本地用量驱动**：优先读取 Codex 原生 `rate_limits.primary.used_percent`，否则按本地 transcripts 估算 weighted tokens。
- **默认不混算**：`PETDEX_USAGE_MOOD_SOURCE=auto` 会选择单一 agent 来源，避免历史 Claude Code 用量把 Codex 显示冲到 100%。
- **可关闭百分比**：桌宠下方的 token 百分比默认显示，可在 Settings 或配置文件关闭。
- **本地优先隐私**：不上传 prompt、response、token 明细或 telemetry。
- **可扩展宠物**：任何符合 Petdex 目录结构的宠物都可以补 mood sprites。

## 快速开始

目标体验是：安装一次，然后在 agent 里直接输入 `/petdesk`。

> 当前 `pet-desk-moodbytoken` 尚未发布到 npm registry。直接运行 `npx -y pet-desk-moodbytoken@latest init` 会得到 `404 Not Found`。发布前请先用源码安装。

### 从源码安装

```bash
git clone https://github.com/BlueWhalexh/pet-desk-moodBytoken.git
cd pet-desk-moodBytoken/packages/petdex-cli
bun install
bun run build
npm install -g .
petdesk init
```

`init` 会尽量完成三件事：

- 安装或启动 Petdex Desktop。
- 安装一只 starter pet，默认优先使用 `aka-shiba`。
- 给本机已检测到的 agent 写入 hooks 和 `/petdesk` 原生命令。

### npm 发布后的安装方式

```bash
npx -y pet-desk-moodbytoken@latest init
```

`npx` 是一次性下载并运行 npm 包，不会把 `petdesk` 永久安装到你的 `PATH`。如果希望终端里长期可用：

```bash
npm install -g pet-desk-moodbytoken
petdesk init
petdesk doctor
```

包名使用 `pet-desk-moodbytoken`，命令名使用 `petdesk`，是为了避免和上游 Petdex 的 `petdex` 包名、全局命令混淆。

## Agent 内用法

安装完成后，打开 Codex / Claude Code / Gemini CLI / OpenCode，在对话里输入：

```text
/petdesk
```

常用命令：

| Agent 内命令 | 作用 |
| --- | --- |
| `/petdesk` | 启动或唤醒默认宠物；不会因为宠物已经运行就把它关掉 |
| `/petdesk up` / `/petdesk on` / `/petdesk start` | 强制唤醒并启用 hooks |
| `/petdesk toggle` | 显式切换开关 |
| `/petdesk down` | 收起并暂停 hooks |
| `/petdesk status` | 查看 hooks 状态 |
| `/petdesk doctor` | 检查安装问题 |

Shell 里也可以直接运行：

```bash
petdesk up
petdesk down
petdesk hooks status
petdesk doctor
```

## 默认宠物

默认 starter pet 首选 `aka-shiba`。如果远端 manifest 暂时没有 `aka-shiba`，CLI 会回退安装 manifest 中第一只可用宠物，保证用户至少能看到桌宠。

桌面端按这个优先级找宠物：

```text
~/.petdex/pets/<slug>
~/.codex/pets/<slug>
```

当前激活宠物记录在：

```text
~/.petdex/active.json
```

如果当前宠物存在 mood sprites，桌面会按 token 心情切换真实姿态；如果不存在，会回退到基础 idle sprite。

## 新增自己的宠物

你可以从 Petdex 宠物商店下载宠物，也可以自己做一只。本地桌面只认宠物目录结构，不强依赖它来自商店。

从商店安装：

```bash
petdesk install <slug>
```

例如：

```bash
petdesk install aka-shiba
```

自己准备宠物时，每只宠物是一个目录，最小结构如下：

```text
~/.petdex/pets/my-pet/
  pet.json
  spritesheet.webp
```

`pet.json` 最小示例：

```json
{
  "slug": "my-pet",
  "displayName": "My Pet"
}
```

基础 `spritesheet.webp` 或 `spritesheet.png` 用于普通 idle 动画。要让 token mood 变成真实神态变化，再加五张 mood idle sprite row：

```text
~/.petdex/pets/my-pet/moods/energetic.webp
~/.petdex/pets/my-pet/moods/normal.webp
~/.petdex/pets/my-pet/moods/tired.webp
~/.petdex/pets/my-pet/moods/exhausted.webp
~/.petdex/pets/my-pet/moods/dying.webp
```

每张 mood 图固定为透明背景 WebP，尺寸 `1152x208`，横向 6 帧，每帧 `192x208`。

## 用 Agent 生成 Mood Sprites

仓库内封装了 `petdex-mood-sprite` skill，用来把一只宠物扩展成五档心情姿态。

你可以直接和自己的 agent 这样说：

```text
使用 petdex-mood-sprite skill，基于 ~/.petdex/pets/my-pet 生成五档 mood idle sprites。
要求输出 energetic、normal、tired、exhausted、dying 五张 1152x208 WebP。
不要只改透明度、颜色或滤镜，要画出真实表情和姿态变化。
```

如果只是测试渲染链路，可以先生成 mock 姿态：

```bash
node .agents/skills/petdex-mood-sprite/scripts/generate-mood-sprites.mjs \
  my-pet \
  --mock-postures
```

如果你让 agent 调用图片模型生成真实素材，推荐这样描述：

```text
请参考 ~/.petdex/pets/my-pet/spritesheet.webp 的 idle 行，生成一张 5 行 x 6 列的 sprite sheet。
每行对应 energetic、normal、tired、exhausted、dying。
每格保持同一只宠物、同一画风、透明或纯绿色背景，姿态逐步从精神到疲惫趴倒。
```

拿到 5x6 mood sheet 后，用脚本切成五张标准 WebP：

```bash
node .agents/skills/petdex-mood-sprite/scripts/postprocess-ai-mood-sheet.mjs \
  --input /path/to/generated-5x6-green-screen-sheet.png \
  --slug my-pet
```

## Token 心情算法

桌面端会在宠物下方显示一个 token 用量百分比，例如 `57%`。它默认开启，可以在 Settings 里关闭 `Usage percent`，也可以编辑：

```text
~/.petdex/preferences.json
```

```json
{
  "showUsagePercent": false
}
```

Mood 分档：

| Fatigue | Mood | 宠物表现 |
| --- | --- | --- |
| `< 0.20` | `energetic` | 精神、活跃 |
| `< 0.45` | `normal` | 默认 idle |
| `< 0.70` | `tired` | 低能量、眼神疲惫 |
| `< 0.90` | `exhausted` | 坐下、塌下去 |
| `>= 0.90` | `dying` | 趴倒、濒临崩溃 |

用量来源优先级：

1. `auto` 默认模式下，优先使用 Codex session 中最近的 `rate_limits.primary.used_percent`。
2. 如果没有 Codex 原生百分比，则读取本地 transcript 里的原生 token 字段，例如 `input_tokens`、`output_tokens`、`cache_read_input_tokens`。
3. 如果 transcript 没有 token 字段，则用 `js-tiktoken` 按 `gpt-4o` / `o200k_base` 估算文本 token。
4. tokenizer 不可用时，回退到 `ceil(text.length / 4)`。

weighted token 公式：

```text
weightedTokens =
  inputTokens * inputWeight +
  outputTokens * outputWeight +
  cacheReadTokens * cacheReadWeight +
  cacheCreationTokens * cacheCreationWeight +
  estimatedTextTokens * textEstimateWeight

fatigue = clamp(weightedTokens / tokenBudget, 0, 1)
usagePercent = Codex native percent, or round(weightedTokens / tokenBudget * 100)
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

所有扫描都在本地完成，不上传 prompt、response、token 明细或 telemetry。

## 配置

启动 desktop 或 sidecar 前设置环境变量：

```bash
PETDEX_USAGE_MOOD_INTERVAL_MS=30000
PETDEX_USAGE_MOOD_WINDOW_MS=86400000
PETDEX_USAGE_MOOD_TOKEN_BUDGET=600000
PETDEX_USAGE_MOOD_SOURCE=auto

PETDEX_TOKEN_WEIGHT_INPUT=1
PETDEX_TOKEN_WEIGHT_OUTPUT=1.5
PETDEX_TOKEN_WEIGHT_CACHE_READ=0.15
PETDEX_TOKEN_WEIGHT_CACHE_CREATION=0.5
PETDEX_TOKEN_WEIGHT_TEXT_ESTIMATE=1
```

`PETDEX_USAGE_MOOD_SOURCE` 可选：

| 值 | 含义 |
| --- | --- |
| `auto` | 默认，不混算；优先使用 Codex 原生百分比，否则选择最近有数据的单一 agent |
| `codex` | 只统计 Codex active / archived sessions |
| `claude-code` | 只统计 Claude Code transcripts / stats cache |
| `all` | 高级调试用，合并所有支持的本地 agent 用量 |

如果你主要用 Codex，但本机也有 Claude Code 的历史统计，可以这样启动：

```bash
PETDEX_USAGE_MOOD_SOURCE=codex petdesk up
```

关闭自动 token mood：

```bash
PETDEX_USAGE_MOOD=0
```

手动设置 mood：

```bash
TOKEN="$(cat ~/.petdex/runtime/update-token)"
curl -sS http://127.0.0.1:7777/mood \
  -H "content-type: application/json" \
  -H "x-petdex-update-token: $TOKEN" \
  --data '{"level":"tired","reason":"manual demo","agent_source":"demo"}'
```

手动 mood 默认保持 5 分钟：

```bash
PETDEX_MANUAL_MOOD_HOLD_MS=300000
```

## 支持平台

| 平台 | 状态 |
| --- | --- |
| macOS | 当前主验证路径 |
| Windows | Node CLI / `npx` 可运行；桌面二进制取决于 release 资产 |
| Linux | Node CLI 可运行；桌面端需要后续补齐 release 资产和验证 |

Windows 用户可以用 `npx` 运行 Node CLI，但完整桌宠启动取决于当前 release 是否提供 `win32` desktop 资产和目标 agent 的 hooks 支持。遇到桌面二进制缺失时，先运行：

```bash
petdesk doctor
```

## 本地开发

安装依赖：

```bash
bun install
```

构建 CLI：

```bash
cd packages/petdex-cli
bun install
bun run build
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

运行本地 desktop：

```bash
PETDEX_SIDECAR_DIR="$PWD/packages/petdex-desktop/sidecar" \
  ./packages/petdex-desktop/zig-out/bin/petdex-desktop
```

## 验证

核心测试：

```bash
bun test \
  packages/petdex-cli/src/hooks/agents.test.ts \
  packages/petdex-cli/src/hooks/killswitch.test.ts \
  packages/petdex-cli/src/desktop/install.test.ts \
  packages/petdex-desktop/sidecar/token-mood.test.ts \
  packages/petdex-desktop/sidecar/agent-usage.test.ts \
  packages/petdex-desktop/sidecar/mood-level.test.ts
```

格式和 lint：

```bash
bunx biome check \
  packages/petdex-cli/src/hooks/agents.ts \
  packages/petdex-cli/src/hooks/slash-command.ts \
  packages/petdex-cli/src/hooks/killswitch.ts \
  packages/petdex-cli/src/desktop/doctor.ts \
  packages/petdex-cli/src/desktop/install.ts \
  packages/petdex-cli/bin/petdex.ts \
  packages/petdex-desktop/sidecar/token-mood.ts \
  packages/petdex-desktop/sidecar/agent-usage.ts \
  packages/petdex-desktop/sidecar/server.ts
```

本地用量采样 smoke test：

```bash
PETDEX_USAGE_MOOD_SOURCE=codex bun -e "import { scanLocalAgentUsage } from './packages/petdex-desktop/sidecar/agent-usage.ts'; console.log(scanLocalAgentUsage())"
```

## 常见问题

### `npx -y pet-desk-moodbytoken@latest init` 报 404

说明 npm 包还没有发布到 registry。发布前请使用源码安装；发布后这条命令才会可用。

### `npx` 之后终端找不到 `petdesk`

这是正常的。`npx` 只运行一次，不会全局安装命令。需要长期使用请运行：

```bash
npm install -g pet-desk-moodbytoken
```

### `/petdesk` 识别不到

先检查 hooks 和 slash command 是否安装：

```bash
petdesk doctor
petdesk hooks install
```

Codex 通常读取 `~/.codex/prompts/petdesk.md`，Claude Code 通常读取 `~/.claude/commands/petdesk.md`。安装后如果 agent 没刷新命令列表，重启对应 agent。

### 出现两个宠物窗口

通常是旧版本 desktop 进程还在。先收起，再重新启动：

```bash
petdesk down
petdesk up
```

如果仍然存在，运行 `petdesk doctor` 看当前 desktop pid 和 runtime 路径。

### 用量显示 100%，但 Codex 实际不是 100%

确认没有使用旧配置 `PETDEX_USAGE_MOOD_SOURCE=all`。默认应该是：

```bash
PETDEX_USAGE_MOOD_SOURCE=auto
```

如果只想看 Codex：

```bash
PETDEX_USAGE_MOOD_SOURCE=codex petdesk up
```

### 宠物没有真实姿态变化

检查当前宠物目录下是否存在五张 mood sprites：

```text
~/.petdex/pets/<slug>/moods/energetic.webp
~/.petdex/pets/<slug>/moods/normal.webp
~/.petdex/pets/<slug>/moods/tired.webp
~/.petdex/pets/<slug>/moods/exhausted.webp
~/.petdex/pets/<slug>/moods/dying.webp
```

没有这些文件时，桌面端只能显示基础 idle sprite。

## Roadmap

- 发布 `pet-desk-moodbytoken` 到 npm，补齐 `npx` 一键安装链路。
- 给 `aka-shiba` 和 `kabi` 补完整官方 mood sprite 资产。
- 增加设置面板，用 UI 调整 token budget、weights 和 agent source。
- 支持更多 agent 的本地 transcript 格式。
- 支持 per-agent pets，让 Codex、Claude Code、Gemini 分别驱动不同宠物。
- 补齐 Windows / Linux 桌面 release 资产和验证。

## 贡献

欢迎提交：

- 新宠物和 mood sprite 资产。
- 新 agent transcript 适配器。
- Windows / Linux desktop release 验证。
- README、安装体验、排障文档改进。

提交前建议运行：

```bash
bun test packages/petdex-desktop/sidecar/agent-usage.test.ts
bunx biome check packages/petdex-desktop/sidecar/agent-usage.ts
```

## 致谢

本项目基于 Petdex 做 token mood fork/extension。Petdex 提供了宠物包格式、桌面 sprite renderer、CLI hooks 和 gallery 基础。

上游项目：https://github.com/crafter-station/petdex

## License

MIT，沿用上游 Petdex 源码许可。
