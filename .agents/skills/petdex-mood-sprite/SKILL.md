---
name: petdex-mood-sprite
description: Generate, validate, or mock-test Petdex desktop mood idle sprite rows for a local pet slug. Use when Codex needs to create or refresh real mood WebP assets under a local Petdex pet directory, verify the 1152x208 mood sprite contract, prepare official default mood sprites for Petdex Desktop, or generate simulated posture data to test mood sprite rendering.
---

# Petdex Mood Sprite

## Overview

Generate or validate five mood-specific idle sprite rows for a Petdex pet. The output contract is:

```text
~/.petdex/pets/<slug>/moods/energetic.webp
~/.petdex/pets/<slug>/moods/normal.webp
~/.petdex/pets/<slug>/moods/tired.webp
~/.petdex/pets/<slug>/moods/exhausted.webp
~/.petdex/pets/<slug>/moods/dying.webp
```

Each file must be a transparent WebP row sized `1152x208`: six `192x208` idle frames laid out horizontally.

Important product rule: official mood sprites must be actual pet expression/posture art. Do not ship "mood" assets that only change opacity, tint, brightness, blur, or CSS filters. Those effects are acceptable only as legacy fallback when no mood sprite exists.

## Workflow

1. Locate the pet directory, normally `~/.petdex/pets/<slug>`.
2. Read `pet.json` and prefer its `spritesheetPath`; otherwise use `spritesheet.webp` then `spritesheet.png`.
3. For simulated data only, run the bundled script with `--mock-postures`:

```bash
node /path/to/petdex-mood-sprite/scripts/generate-mood-sprites.mjs <slug> --mock-postures
```

Useful options:

```bash
node scripts/generate-mood-sprites.mjs aka-shiba --mock-postures --pets-root ~/.petdex/pets
node scripts/generate-mood-sprites.mjs kabi --mock-postures --out-dir /tmp/kabi-moods
node scripts/generate-mood-sprites.mjs aka-shiba --mock-postures --source /path/to/spritesheet.webp
```

4. Verify all five files exist and report their dimensions. Use `sips -g pixelWidth -g pixelHeight <file>` on macOS.
5. For official defaults, use AI-generated or hand-authored posture art that follows the same file contract. The mock script can test rendering, but it is not sufficient as final official artwork.

## AI Sheet Workflow

When generating real posture art with an image model:

1. Extract the current pet's idle row as reference.
2. Ask for a 5 row x 6 column sprite sheet on a flat green chroma-key background.
3. Require actual posture/expression changes per row, not tint/opacity/filter changes.
4. Post-process the generated sheet:

```bash
node scripts/postprocess-ai-mood-sheet.mjs \
  --input /path/to/generated-sheet.png \
  --slug aka-shiba
```

This removes the green background, resizes the sheet to `1152x1040`, and writes the five standard `moods/*.webp` rows.

## Generation Rules

- Do not modify the original `spritesheet.webp` or `pet.json`.
- Preserve alpha transparency.
- Use the first spritesheet row as idle and the first six columns as frames.
- Keep output dimensions exactly `1152x208`.
- Keep filenames lowercase and matching the five mood levels exactly.
- Require visible expression/posture differences for official assets:
  - `energetic`: alert/upright/lively.
  - `normal`: baseline idle.
  - `tired`: droopy/slower/low-energy.
  - `exhausted`: slumped or collapsed posture.
  - `dying`: clearly distressed/fainting/near-crash posture.
- Treat the bundled script as deterministic mock data for renderer validation only. Replace mock output with real generated or drawn sprite rows before calling assets official.

## Resources

- `scripts/generate-mood-sprites.mjs`: deterministic Sharp-based mock posture generator for local Petdex spritesheets.
- `scripts/postprocess-ai-mood-sheet.mjs`: standardizes a generated 5x6 green-screen mood sheet into Petdex `moods/*.webp` assets.
