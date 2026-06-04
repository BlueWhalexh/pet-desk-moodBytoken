#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FRAME_W = 192;
const FRAME_H = 208;
const IDLE_FRAMES = 6;
const OUT_W = FRAME_W * IDLE_FRAMES;
const LEVELS = ["energetic", "normal", "tired", "exhausted", "dying"];

const MOODS = {
  energetic: {
    brightness: 1.08,
    saturation: 1.18,
    scaleX: 0.94,
    scaleY: 0.94,
    rotate: 0,
    x: 0,
    y: -1,
    bounce: [0, -2, -1, -2, 0, 1],
  },
  normal: {
    brightness: 1,
    saturation: 1,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    x: 0,
    y: 0,
    bounce: [0, 0, 0, 0, 0, 0],
  },
  tired: {
    brightness: 0.96,
    saturation: 0.82,
    scaleX: 0.92,
    scaleY: 0.9,
    rotate: 0,
    x: 0,
    y: 10,
    bounce: [0, 1, 2, 2, 1, 0],
  },
  exhausted: {
    brightness: 0.86,
    saturation: 0.62,
    scaleX: 0.94,
    scaleY: 0.78,
    rotate: 0,
    x: 0,
    y: 18,
    bounce: [0, 2, 3, 3, 2, 1],
  },
  dying: {
    brightness: 0.72,
    saturation: 0.35,
    scaleX: 0.92,
    scaleY: 0.68,
    rotate: 0,
    x: 0,
    y: 26,
    bounce: [0, 3, 4, 4, 3, 2],
    tint: { r: 210, g: 220, b: 255 },
  },
};

function usage() {
  console.error(`Usage:
  generate-mood-sprites.mjs <slug> [--pets-root <dir>] [--source <spritesheet>] [--out-dir <dir>]
  generate-mood-sprites.mjs <slug> --mock-postures

Output:
  ~/.petdex/pets/<slug>/moods/<level>.webp

Note:
  --mock-postures creates simulated posture rows for renderer testing.
  Do not treat those outputs as final official mood artwork.
`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return path.join(homedir(), value.slice(2));
  return value;
}

function parseArgs(argv) {
  let slug = null;
  const opts = {
    petsRoot: path.join(homedir(), ".petdex", "pets"),
    source: null,
    outDir: null,
    mockPostures: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--pets-root") {
      opts.petsRoot = expandHome(argv[++i]);
    } else if (arg === "--source") {
      opts.source = expandHome(argv[++i]);
    } else if (arg === "--out-dir") {
      opts.outDir = expandHome(argv[++i]);
    } else if (arg === "--mock-postures") {
      opts.mockPostures = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else if (!slug) {
      slug = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (!slug && !opts.source) throw new Error("missing <slug>");
  if (!opts.mockPostures) {
    throw new Error(
      "refusing to generate final artwork automatically; pass --mock-postures for simulated renderer-test data",
    );
  }
  return { slug, ...opts };
}

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default ?? mod;
  } catch (err) {
    throw new Error(
      `Could not import sharp. Run this from the Petdex repo after bun install, or install sharp where Node can resolve it. (${err.message})`,
    );
  }
}

function readPetSource(petDir, sourceArg) {
  if (sourceArg) return path.resolve(sourceArg);
  const petJsonPath = path.join(petDir, "pet.json");
  let declared = null;
  if (existsSync(petJsonPath)) {
    const pet = JSON.parse(readFileSync(petJsonPath, "utf8"));
    if (typeof pet.spritesheetPath === "string" && pet.spritesheetPath) {
      declared = path.join(petDir, pet.spritesheetPath);
    }
  }
  const candidates = [
    declared,
    path.join(petDir, "spritesheet.webp"),
    path.join(petDir, "spritesheet.png"),
  ].filter(Boolean);
  const hit = candidates.find((candidate) => existsSync(candidate));
  if (!hit) throw new Error(`no spritesheet found in ${petDir}`);
  return hit;
}

async function frameBuffer(sharp, source, frameIndex, mood) {
  let image = sharp(source)
    .extract({
      left: frameIndex * FRAME_W,
      top: 0,
      width: FRAME_W,
      height: FRAME_H,
    })
    .ensureAlpha()
    .modulate({
      brightness: mood.brightness,
      saturation: mood.saturation,
    });

  if (mood.tint) image = image.tint(mood.tint);

  const resizedW = Math.round(FRAME_W * mood.scaleX);
  const resizedH = Math.round(FRAME_H * mood.scaleY);
  const frameLean = frameIndex % 2 === 0 ? mood.rotate : -mood.rotate / 2;
  return image
    .resize(resizedW, resizedH, { fit: "fill", kernel: "nearest" })
    .rotate(frameLean, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize({
      width: FRAME_W,
      height: FRAME_H,
      fit: "inside",
      kernel: "nearest",
    })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function generateLevel(sharp, source, outPath, mood) {
  const composites = [];
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    const { data, info } = await frameBuffer(sharp, source, i, mood);
    const frameLeft = Math.max(
      0,
      Math.round((FRAME_W - info.width) / 2 + mood.x),
    );
    const frameTop = Math.max(
      0,
      Math.round((FRAME_H - info.height) / 2 + mood.y + mood.bounce[i]),
    );
    const framed = await sharp({
      create: {
        width: FRAME_W,
        height: FRAME_H,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: data, left: frameLeft, top: frameTop }])
      .png()
      .toBuffer();
    composites.push({
      input: framed,
      left: i * FRAME_W,
      top: 0,
    });
  }

  await sharp({
    create: {
      width: OUT_W,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .webp({ quality: 92, effort: 5 })
    .toFile(outPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug ?? path.basename(path.dirname(args.source));
  const petDir = path.join(args.petsRoot, slug);
  const source = readPetSource(petDir, args.source);
  const outDir = args.outDir
    ? path.resolve(args.outDir)
    : path.join(petDir, "moods");
  mkdirSync(outDir, { recursive: true });

  const sharp = await loadSharp();
  const metadata = await sharp(source).metadata();
  if (metadata.width < OUT_W || metadata.height < FRAME_H) {
    throw new Error(
      `spritesheet too small: expected at least ${OUT_W}x${FRAME_H}, got ${metadata.width}x${metadata.height}`,
    );
  }

  for (const level of LEVELS) {
    const outPath = path.join(outDir, `${level}.webp`);
    await generateLevel(sharp, source, outPath, MOODS[level]);
    const outMeta = await sharp(outPath).metadata();
    if (outMeta.width !== OUT_W || outMeta.height !== FRAME_H) {
      throw new Error(
        `${outPath} has wrong size ${outMeta.width}x${outMeta.height}`,
      );
    }
    console.log(`${level}: ${outPath} ${outMeta.width}x${outMeta.height}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`petdex mood sprite: ${err.message}`);
    process.exit(1);
  });
}
