// Browser-safe color family helpers. Split out of color-extract.ts so
// client components (e.g. pet-gallery.tsx FilterChips) can import the
// constants and the pure-JS classifier without dragging node-vibrant +
// sharp + Jimp into the browser bundle. The actual extraction lives in
// color-extract.ts (server-only).

export const COLOR_FAMILIES = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
  "brown",
  "neutral",
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export function classifyColorFamily(hex: string): ColorFamily {
  const normalized = normalizeHex(hex);
  const [r, g, b] = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(r, g, b);

  if (s < 0.1 || l < 0.1 || l > 0.92) {
    return "neutral";
  }

  if ((h >= 0 && h < 14) || (h >= 345 && h <= 360)) {
    return "red";
  }

  if (h >= 14 && h < 35 && s < 0.55) {
    return "brown";
  }

  if (h >= 14 && h < 45) {
    return "orange";
  }

  if (h >= 45 && h < 65) {
    return "yellow";
  }

  if (h >= 65 && h < 95) {
    return "lime";
  }

  if (h >= 95 && h < 155) {
    return "green";
  }

  if (h >= 155 && h < 185) {
    return "teal";
  }

  if (h >= 185 && h < 230) {
    return "blue";
  }

  if (h >= 230 && h < 265) {
    return "indigo";
  }

  if (h >= 265 && h < 305) {
    return "purple";
  }

  if (h >= 305 && h < 345) {
    return "pink";
  }

  return "red";
}

function normalizeHex(hex: string): string {
  const value = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) {
    return value;
  }

  throw new Error(`invalid hex color: ${hex}`);
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let h =
    max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4;

  h *= 60;

  return { h, s, l };
}
