// Server-only sprite color extraction. Loads node-vibrant + sharp,
// which both reach for `child_process` / `fs` / native `jimp` deps —
// importing this file from a client component breaks the browser
// bundle. For type / constants / pure-JS classification, import from
// `@/lib/color-families` instead.

import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";

import {
  COLOR_FAMILIES,
  type ColorFamily,
  classifyColorFamily,
} from "@/lib/color-families";

// Re-export so the existing import surface keeps working for the few
// server-only callers (admin approve hook, backfill script). New
// browser-side imports should target color-families directly.
export { COLOR_FAMILIES, type ColorFamily, classifyColorFamily };

const PALETTE_ORDER = [
  "Vibrant",
  "LightVibrant",
  "Muted",
  "LightMuted",
  "DarkVibrant",
  "DarkMuted",
] as const;

export async function extractDominantColor(
  spriteUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(spriteUrl);
    if (!res.ok) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const normalized = await sharp(buffer).png().toBuffer();
    const palette = await Vibrant.from(normalized).getPalette();

    for (const key of PALETTE_ORDER) {
      const swatch = palette[key];
      if (swatch?.hex) {
        return swatch.hex.toLowerCase();
      }
    }

    return null;
  } catch {
    return null;
  }
}
