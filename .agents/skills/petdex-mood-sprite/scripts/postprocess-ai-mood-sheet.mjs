#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FRAME_W = 192;
const FRAME_H = 208;
const COLS = 6;
const ROWS = 5;
const OUT_W = FRAME_W * COLS;
const OUT_H = FRAME_H * ROWS;
const LEVELS = ["energetic", "normal", "tired", "exhausted", "dying"];

function usage() {
  console.error(`Usage:
  postprocess-ai-mood-sheet.mjs --input <png> --slug <slug> [--pets-root <dir>] [--out-dir <dir>]

Input:
  One AI-generated 5x6 mood sheet on a green chroma-key background.

Output:
  ~/.petdex/pets/<slug>/moods/<level>.webp
`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return path.join(homedir(), value.slice(2));
  return value;
}

function parseArgs(argv) {
  const opts = {
    input: null,
    slug: null,
    petsRoot: path.join(homedir(), ".petdex", "pets"),
    outDir: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") {
      opts.input = expandHome(argv[++i]);
    } else if (arg === "--slug") {
      opts.slug = argv[++i];
    } else if (arg === "--pets-root") {
      opts.petsRoot = expandHome(argv[++i]);
    } else if (arg === "--out-dir") {
      opts.outDir = expandHome(argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (!opts.input) throw new Error("missing --input");
  if (!opts.slug && !opts.outDir)
    throw new Error("missing --slug or --out-dir");
  return opts;
}

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default ?? mod;
  } catch (err) {
    throw new Error(
      `Could not import sharp. Run bun install first. (${err.message})`,
    );
  }
}

function chromaKeyGreen({ data, info }) {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += info.channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];

    const maxRb = Math.max(r, b);
    const minRb = Math.min(r, b);
    const greenExcess = g - maxRb;
    const saturatedGreen =
      g > 135 && greenExcess > 42 && g > r * 1.3 && g > b * 1.3;
    const brightGreen = g > 165 && r < 125 && b < 125;
    const flatBackdrop = g > 110 && greenExcess > 32 && maxRb - minRb < 42;
    if (brightGreen || (saturatedGreen && flatBackdrop)) {
      out[i + 3] = 0;
      continue;
    }

    const edgeSpill = g > 65 && greenExcess > 18 && g > r * 1.1 && g > b * 1.1;
    if (edgeSpill) {
      out[i + 1] = Math.min(g, maxRb + 4);
    }
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const input = path.resolve(opts.input);
  if (!existsSync(input)) throw new Error(`input not found: ${input}`);

  const outDir = opts.outDir
    ? path.resolve(opts.outDir)
    : path.join(opts.petsRoot, opts.slug, "moods");
  mkdirSync(outDir, { recursive: true });

  const sharp = await loadSharp();
  const normalized = await sharp(input)
    .resize(OUT_W, OUT_H, { fit: "fill", kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const keyed = chromaKeyGreen(normalized);
  const sheet = sharp(keyed, {
    raw: {
      width: OUT_W,
      height: OUT_H,
      channels: 4,
    },
  });

  for (const [row, level] of LEVELS.entries()) {
    const outPath = path.join(outDir, `${level}.webp`);
    await sheet
      .clone()
      .extract({ left: 0, top: row * FRAME_H, width: OUT_W, height: FRAME_H })
      .webp({ quality: 92, effort: 5 })
      .toFile(outPath);
    const meta = await sharp(outPath).metadata();
    if (meta.width !== OUT_W || meta.height !== FRAME_H) {
      throw new Error(`${outPath} has wrong size ${meta.width}x${meta.height}`);
    }
    console.log(`${level}: ${outPath} ${meta.width}x${meta.height}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`petdex mood sprite postprocess: ${err.message}`);
    process.exit(1);
  });
}
