# pet-desk-moodBytoken

A tiny desktop pet whose mood changes with your local coding-agent token usage.

When your agent has been quiet, the pet stays normal. When your local Claude/Codex usage gets heavy, the pet becomes tired, exhausted, and eventually falls into a dying idle pose. The important part: mood is rendered with real sprite rows, not opacity or CSS tint tricks.

![Petdex icon](public/brand/petdex-desktop-icon.png)

## Why this exists

Coding agents are invisible most of the time. They burn context, cache reads, output tokens, and tool loops in the background, but the only feedback you usually see is a spinner or a bill later.

This project turns that invisible usage into an ambient desktop signal:

- token usage becomes a 0..1 fatigue score
- fatigue becomes one of five mood levels
- mood levels swap real pet idle sprite rows
- the calculation is local, configurable, and easy to change

## Demo behavior

Mood levels:

| Fatigue | Mood | Pet behavior |
| --- | --- | --- |
| `< 0.20` | `energetic` | upbeat idle |
| `< 0.45` | `normal` | default idle |
| `< 0.70` | `tired` | droopy/low-energy idle |
| `< 0.90` | `exhausted` | slumped idle |
| `>= 0.90` | `dying` | fainting/near-crash idle |

The desktop app looks for:

```text
~/.petdex/pets/<slug>/moods/energetic.webp
~/.petdex/pets/<slug>/moods/normal.webp
~/.petdex/pets/<slug>/moods/tired.webp
~/.petdex/pets/<slug>/moods/exhausted.webp
~/.petdex/pets/<slug>/moods/dying.webp
```

Each mood file is a transparent WebP row sized `1152x208`: six `192x208` idle frames.

If those files are missing, the app falls back to the original Petdex CSS filter behavior for backward compatibility.

## Token mood algorithm

The code lives in:

- `packages/petdex-desktop/sidecar/token-mood.ts`
- `packages/petdex-desktop/sidecar/agent-usage.ts`

The sampler uses a three-layer strategy:

1. Prefer native agent usage fields when logs expose them, such as `input_tokens`, `output_tokens`, `cache_read_input_tokens`, and `cache_creation_input_tokens`.
2. If native usage is missing, estimate transcript text with `js-tiktoken` using the `gpt-4o`/`o200k_base` tokenizer.
3. If the tokenizer cannot load, fall back to `ceil(text.length / 4)`.

Then it computes:

```text
weightedTokens =
  inputTokens * inputWeight +
  outputTokens * outputWeight +
  cacheReadTokens * cacheReadWeight +
  cacheCreationTokens * cacheCreationWeight +
  estimatedTextTokens * textEstimateWeight

fatigue = clamp(weightedTokens / tokenBudget, 0, 1)
```

Defaults:

| Setting | Default |
| --- | --- |
| Window | 24 hours |
| Token budget | `600000` weighted tokens |
| Input weight | `1` |
| Output weight | `1.5` |
| Cache read weight | `0.15` |
| Cache creation weight | `0.5` |
| Text estimate weight | `1` |

The defaults intentionally make output and cache creation more expensive than cache reads. This creates a mood signal that tracks "agent effort" better than raw token count alone.

## Supported local sources

Current local sources:

- Claude Code JSONL transcripts under `~/.claude/projects/**.jsonl`
- Claude stats cache at `~/.claude/stats-cache.json`
- Codex archived JSONL transcripts under `~/.codex/archived_sessions/**.jsonl` when they expose usage fields or transcript text

The scanner only reads local files and only extracts numeric usage plus timestamps. It does not upload prompts, responses, tokens, or telemetry.

## Configuration

Set environment variables before launching the desktop app or sidecar:

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

Disable automatic token mood sampling:

```bash
PETDEX_USAGE_MOOD=0
```

Manual mood updates still work through the local sidecar endpoint:

```bash
TOKEN="$(cat ~/.petdex/runtime/update-token)"
curl -sS http://127.0.0.1:7777/mood \
  -H "content-type: application/json" \
  -H "x-petdex-update-token: $TOKEN" \
  --data '{"level":"tired","reason":"manual demo","agent_source":"demo"}'
```

Manual mood updates hold for 5 minutes by default before automatic token mood sampling can overwrite them:

```bash
PETDEX_MANUAL_MOOD_HOLD_MS=300000
```

## Generate mood sprites

The repository includes a Codex skill for local mood sprite generation:

```text
.agents/skills/petdex-mood-sprite/
```

Mock renderer test:

```bash
node .agents/skills/petdex-mood-sprite/scripts/generate-mood-sprites.mjs \
  aka-shiba \
  --mock-postures \
  --out-dir /tmp/aka-shiba-moods
```

AI sheet post-processing:

```bash
node .agents/skills/petdex-mood-sprite/scripts/postprocess-ai-mood-sheet.mjs \
  --input /path/to/generated-5x6-green-screen-sheet.png \
  --slug aka-shiba
```

Official mood sprites should be real expression/posture art. Mock output is only for renderer testing.

## Build locally

Install dependencies:

```bash
bun install
```

Build the sidecar:

```bash
bun build packages/petdex-desktop/sidecar/server.ts \
  --target=node \
  --format=cjs \
  --outfile=packages/petdex-desktop/sidecar/server.js \
  --minify
```

Build the desktop app:

```bash
cd packages/petdex-desktop
ZERO_NATIVE_PATH=/absolute/path/to/zero-native zig build
```

Run:

```bash
PETDEX_SIDECAR_DIR="$PWD/packages/petdex-desktop/sidecar" \
  ./packages/petdex-desktop/zig-out/bin/petdex-desktop
```

## Verify

Focused tests:

```bash
bun test \
  packages/petdex-desktop/sidecar/token-mood.test.ts \
  packages/petdex-desktop/sidecar/agent-usage.test.ts \
  packages/petdex-desktop/sidecar/mood-level.test.ts \
  packages/petdex-desktop/sidecar/state-queue.test.ts \
  packages/petdex-desktop/sidecar/update-utils.test.ts \
  packages/petdex-desktop/sidecar/running-variant.test.ts
```

Format/lint:

```bash
bunx biome check \
  packages/petdex-desktop/sidecar/token-mood.ts \
  packages/petdex-desktop/sidecar/token-mood.test.ts \
  packages/petdex-desktop/sidecar/agent-usage.ts \
  packages/petdex-desktop/sidecar/agent-usage.test.ts \
  packages/petdex-desktop/sidecar/server.ts
```

Smoke test the live sampler:

```bash
bun -e "import { scanLocalAgentUsage } from './packages/petdex-desktop/sidecar/agent-usage.ts'; console.log(scanLocalAgentUsage())"
```

## Research notes

- `js-tiktoken` is a JavaScript port of OpenAI's tiktoken and is used here for local text estimation.
- OpenAI's tiktoken guidance recommends model-specific encodings such as `o200k_base` for current GPT-4o-family tokenization.
- Claude transcripts commonly expose usage fields such as `input_tokens`, `output_tokens`, `cache_read_input_tokens`, and `cache_creation_input_tokens`; this project treats those as first-class native usage data.

## Roadmap

- Add a tiny settings UI for token budget and weights.
- Add screenshots/GIFs for all default mood sprites.
- Support more local agent transcript formats.
- Add per-agent pets so Codex, Claude Code, Gemini, and others can each drive their own mascot.
- Package a macOS `.app` release for one-command install.

## Credits

This project is built as a token-mood fork/extension of Petdex. Petdex provides the pet package format, desktop sprite renderer, CLI hooks, and gallery foundation.

Upstream: https://github.com/crafter-station/petdex

## License

MIT, following the upstream Petdex source license.
