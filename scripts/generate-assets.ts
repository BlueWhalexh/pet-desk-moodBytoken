import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const brandDir = path.join(publicDir, "brand");
const markPath = path.join(brandDir, "petdex-mark.svg");

async function main() {
  await mkdir(brandDir, { recursive: true });

  const markSvg = await readFile(markPath, "utf8");
  const iconPng = await sharp(Buffer.from(markSvg))
    .resize(512, 512)
    .png()
    .toBuffer();
  const faviconEntries = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      data: await sharp(Buffer.from(markSvg))
        .resize(size, size)
        .png()
        .toBuffer(),
      size,
    })),
  );

  await writeFile(path.join(publicDir, "apple-icon.png"), iconPng);
  await writeFile(path.join(publicDir, "icon.png"), iconPng);
  const ico = createIco(faviconEntries);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);
  // Next 16 prefers app/favicon.ico over public/favicon.ico
  await writeFile(path.join(root, "src", "app", "favicon.ico"), ico);
  await writeFile(
    path.join(publicDir, "og.png"),
    await createOg(markSvg, 1200, 630),
  );
  await writeFile(
    path.join(publicDir, "og-twitter.png"),
    await createOg(markSvg, 1200, 600),
  );
}

async function createOg(markSvg: string, width: number, height: number) {
  const logo = await sharp(Buffer.from(markSvg))
    .resize(116, 116)
    .png()
    .toBuffer();
  const base = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="72%" cy="38%" r="58%">
          <stop offset="0" stop-color="#6975ff" stop-opacity="0.84"/>
          <stop offset="0.5" stop-color="#c7dfff" stop-opacity="0.72"/>
          <stop offset="1" stop-color="#f7f8ff"/>
        </radialGradient>
        <radialGradient id="soft" cx="24%" cy="70%" r="52%">
          <stop offset="0" stop-color="#d9ecff"/>
          <stop offset="1" stop-color="#f7f8ff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#f7f8ff"/>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <rect width="${width}" height="${height}" fill="url(#soft)"/>
      <text x="${width / 2}" y="${height / 2 + 72}" fill="#050505" font-family="Inter, Arial, sans-serif" font-size="94" font-weight="600" text-anchor="middle">Petdex</text>
      <text x="${width / 2}" y="${height / 2 + 128}" fill="#252631" font-family="Inter, Arial, sans-serif" font-size="29" font-weight="400" text-anchor="middle">Animated Codex pets, ready to preview and download</text>
    </svg>
  `);

  return sharp(base)
    .composite([
      {
        input: logo,
        top: Math.round(height / 2 - 142),
        left: Math.round(width / 2 - 58),
      },
    ])
    .png()
    .toBuffer();
}

function createIco(entries: Array<{ data: Buffer; size: number }>) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directories = entries.map(({ data, size }) => {
    const directory = Buffer.alloc(16);
    directory.writeUInt8(size, 0);
    directory.writeUInt8(size, 1);
    directory.writeUInt8(0, 2);
    directory.writeUInt8(0, 3);
    directory.writeUInt16LE(1, 4);
    directory.writeUInt16LE(32, 6);
    directory.writeUInt32LE(data.length, 8);
    directory.writeUInt32LE(offset, 12);
    offset += data.length;
    return directory;
  });

  return Buffer.concat([
    header,
    ...directories,
    ...entries.map(({ data }) => data),
  ]);
}

main();
