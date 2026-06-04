# pet-desk-moodBytoken

一个会根据本地 Coding Agent token 用量改变心情的桌面小宠物。

它不是把宠物变透明、变灰或套滤镜，而是按 token 压力切换真实的表情和姿态精灵图：精神、正常、疲惫、力竭、趴倒。

![Petdex icon](public/brand/petdex-desktop-icon.png)

## 快速开始

目标使用方式是：安装一次，然后在 agent 里直接输入 `/petdesk`。

当前 `pet-desk-moodbytoken` 还没有发布到 npm registry，所以直接运行 `npx -y pet-desk-moodbytoken@latest init` 会得到 `404 Not Found`。在正式发布前，先用源码本地安装：

```bash
git clone https://github.com/BlueWhalexh/pet-desk-moodBytoken.git
cd pet-desk-moodBytoken/packages/petdex-cli
bun install
bun run build
npm install -g .
petdesk init
```

发布到 npm 后，用户可以改用：

```bash
npx -y pet-desk-moodbytoken@latest init
```

`init` 会尽量完成三件事：

- 安装或启动 Petdex Desktop。
- 安装一只 starter pet。
- 给本机已检测到的 agent 写入 hooks 和原生 slash command。

安装完成后，打开 Codex / Claude Code / Gemini CLI / OpenCode，在对话里输入：

```text
/petdesk
```

常用命令：

| Agent 内命令 | 作用 |
| --- | --- |
| `/petdesk` | 智能切换：已启动就收起，未启动就唤醒 |
| `/petdesk up` | 强制唤醒并启用 hooks |
| `/petdesk down` | 收起并暂停 hooks |
| `/petdesk status` | 查看 hooks 状态 |
| `/petdesk doctor` | 检查安装问题 |

说明：`npx` 是一次性下载并运行 npm 包，不会把命令永久安装到你的 PATH。为了避免和上游 Petdex 的 `petdex` 包名、全局命令冲突，本项目使用独立 npm 包名 `pet-desk-moodbytoken`，并只暴露 `petdesk` 这个 shell 命令。全局安装后可以直接用：

```bash
npm install -g pet-desk-moodbytoken
petdesk init
petdesk doctor
```

如果你只跑过 `npx -y pet-desk-moodbytoken@latest init`，然后在普通终端里输入 `petdesk` 找不到，这是正常的：`npx` 没有做全局安装。此时继续用 `npx -y pet-desk-moodbytoken@latest doctor`，或者执行上面的全局安装。

维护者发布 npm 包时：

```bash
cd packages/petdex-cli
bun install
bun run build
npm login
npm publish --access public
```

当前 dry-run 已验证 tarball 可生成；正式发布需要 npm 账号登录。

Windows 用户也可以用 `npx` 运行 Node CLI；需要 Node.js 20+。桌面宠物是否能完整启动取决于当前 release 是否提供 `win32` desktop 资产和目标 agent 的 hooks 支持。当前最稳定路径仍是 macOS；Windows 可以先按 CLI / hooks-only 路径验证，遇到桌面二进制缺失时 `doctor` 会提示。

## 默认宠物

本 fork 的默认 starter pet 首选是 `aka-shiba`。如果在线 manifest 里暂时没有 `aka-shiba`，CLI 会回退安装 manifest 中第一只可用宠物，保证用户至少能看到桌面宠物。

桌面端会按这个优先级找宠物：

```text
~/.petdex/pets/<slug>
~/.codex/pets/<slug>
```

当前激活宠物记录在：

```text
~/.petdex/active.json
```

如果当前宠物目录里存在 mood sprites，桌面会按 token 心情切换真实姿态；如果不存在，会回退到上游 Petdex 的兼容显示方式。

## 新增自己的宠物

你可以从 Petdex 宠物商店下载宠物，也可以自己做一只。本地桌面只认宠物目录结构，不强依赖它来自商店。

从商店安装：

```bash
npx -y pet-desk-moodbytoken@latest install <slug>
```

例如：

```bash
npx -y pet-desk-moodbytoken@latest install aka-shiba
```

安装后宠物会落到：

```text
~/.petdex/pets/<slug>
~/.codex/pets/<slug>
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

基础 `spritesheet.webp` 或 `spritesheet.png` 用于普通 idle 动画。要让 token mood 变成真实神态变化，再加上五张 mood idle sprite row：

```text
~/.petdex/pets/my-pet/moods/energetic.webp
~/.petdex/pets/my-pet/moods/normal.webp
~/.petdex/pets/my-pet/moods/tired.webp
~/.petdex/pets/my-pet/moods/exhausted.webp
~/.petdex/pets/my-pet/moods/dying.webp
```

每张 mood 图固定为透明背景 WebP，尺寸 `1152x208`，横向 6 帧，每帧 `192x208`。

### 用 Agent 生成 Mood Sprites

仓库里已经封装了一个 Codex skill：

```text
.agents/skills/petdex-mood-sprite/
```

你可以直接和自己的 agent 这样说：

```text
使用 petdex-mood-sprite skill，基于 ~/.petdex/pets/my-pet 生成五档 mood idle sprites。
要求输出 energetic、normal、tired、exhausted、dying 五张 1152x208 WebP。
不要只改透明度、颜色或滤镜，要画出真实表情和姿态变化。
```

如果只是测试渲染链路，可以先让 agent 生成 mock 姿态：

```bash
node .agents/skills/petdex-mood-sprite/scripts/generate-mood-sprites.mjs \
  my-pet \
  --mock-postures
```

如果你让 agent 调用图片模型生成真实素材，推荐沟通方式是：

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

注意：mock 只用于测试。正式宠物应该为五档 mood 画出明确不同的表情和姿态。

## Token 心情算法

Mood 分档：

| Fatigue | Mood | 宠物表现 |
| --- | --- | --- |
| `< 0.20` | `energetic` | 精神、活跃 |
| `< 0.45` | `normal` | 默认 idle |
| `< 0.70` | `tired` | 低能量、眼神疲惫 |
| `< 0.90` | `exhausted` | 坐下、塌下去 |
| `>= 0.90` | `dying` | 趴倒、濒临崩溃 |

采样器读取本地 agent 用量：

- Claude Code JSONL transcripts：`~/.claude/projects/**.jsonl`
- Claude stats cache：`~/.claude/stats-cache.json`
- Codex archived JSONL transcripts：`~/.codex/archived_sessions/**.jsonl`

计算优先级：

1. 优先读取原生 usage 字段，例如 `input_tokens`、`output_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens`。
2. 没有原生 usage 时，用 `js-tiktoken` 按 `gpt-4o` / `o200k_base` 估算 transcript 文本 token。
3. tokenizer 不可用时，回退到 `ceil(text.length / 4)`。

公式：

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

所有扫描都在本地完成，不上传 prompt、response、token 明细或 telemetry。

## 高级配置

启动 desktop 或 sidecar 前设置环境变量：

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

## 本地开发

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

直接 smoke test 本地用量采样：

```bash
bun -e "import { scanLocalAgentUsage } from './packages/petdex-desktop/sidecar/agent-usage.ts'; console.log(scanLocalAgentUsage())"
```

## Roadmap

- 发布独立包名，减少 `petdex` / `petdesk` 命名混用。
- 给 `aka-shiba` 和 `kabi` 补完整官方 mood sprite 资产。
- 增加设置面板，用 UI 调整 token budget 和 weights。
- 支持更多 agent 的本地 transcript 格式。
- 支持 per-agent pets，让 Codex、Claude Code、Gemini 分别驱动不同宠物。

## 致谢

本项目基于 Petdex 做 token mood fork/extension。Petdex 提供了宠物包格式、桌面 sprite renderer、CLI hooks 和 gallery 基础。

上游项目：https://github.com/crafter-station/petdex

## License

MIT，沿用上游 Petdex 源码许可。
