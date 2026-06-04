// Compute perceptual hash + current-model semantic embedding for every
// approved / pending pet. Re-runs are idempotent: rows already populated
// for PETDEX_EMBEDDING_MODEL are skipped unless --force is passed.
//
// Usage:
//   bun scripts/compute-similarity.ts          # only un-hashed rows
//   bun scripts/compute-similarity.ts --force  # rehash everything
//
// Migration note: 0005 intentionally nulls old 1536-dim text embeddings when
// moving to the required 3072-dim Gemini image-aware embedding model. Re-run
// this script with --force after applying 0005 anywhere 0004 had populated
// embeddings.

import { neon } from "@neondatabase/serverless";
import sharp from "sharp";

import {
  buildPetEmbeddingText,
  embeddingVectorLiteral,
  embedTextValue,
  PETDEX_EMBEDDING_MODEL,
} from "../src/lib/embeddings";

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

const sql = neon(env("DATABASE_URL")); // raw for vector inserts

// dHash: 9x8 grayscale, compare adjacent columns. 64 bits = 16 hex.
async function dhash(spriteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(spriteUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Crop the first idle frame (192×208) like the OG image does.
    const frame = await sharp(buf)
      .extract({ left: 0, top: 0, width: 192, height: 208 })
      .resize(9, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
    let bits = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = frame[row * 9 + col];
        const right = frame[row * 9 + col + 1];
        bits += left < right ? "1" : "0";
      }
    }
    return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
  } catch (err) {
    console.warn("  dhash fail:", (err as Error).message);
    return null;
  }
}

async function main() {
  // Process approved + pending. Curated featured already approved.
  const rows = await sql`
    SELECT id, slug, display_name, description, spritesheet_url,
           tags, vibes, kind, dhash
    FROM submitted_pets
    WHERE status IN ('approved','pending')
    ORDER BY created_at ASC
  `;

  console.log(`processing ${rows.length} pets (force=${FORCE})`);

  let processed = 0;
  let skipped = 0;
  for (const row of rows) {
    const r = row as {
      id: string;
      slug: string;
      display_name: string;
      description: string;
      spritesheet_url: string;
      tags: unknown;
      vibes: unknown;
      kind: string;
      dhash: string | null;
    };
    const needsDhash = FORCE || !r.dhash;

    // Check if a current-model embedding exists. We can't use drizzle's
    // findFirst because the vector columns aren't declared in schema.ts.
    const [exist] = await sql`
      SELECT (embedding IS NOT NULL AND embedding_model = ${PETDEX_EMBEDDING_MODEL}) as has_embedding
      FROM submitted_pets WHERE id = ${r.id}
    `;
    const needsEmbed =
      FORCE || !(exist as { has_embedding: boolean }).has_embedding;

    if (!needsDhash && !needsEmbed) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${processed + 1}/${rows.length}] ${r.slug} ... `);

    if (needsDhash) {
      const h = await dhash(r.spritesheet_url);
      if (h) {
        await sql`UPDATE submitted_pets SET dhash = ${h} WHERE id = ${r.id}`;
      }
    }

    if (needsEmbed) {
      const tagsArr = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      const vibesArr = Array.isArray(r.vibes) ? (r.vibes as string[]) : [];
      const text = buildPetEmbeddingText({
        displayName: r.display_name,
        description: r.description,
        kind: r.kind,
        tags: tagsArr,
        vibes: vibesArr,
      });
      const v = await embedTextValue(text);
      if (v) {
        const lit = embeddingVectorLiteral(v);
        await sql`
          UPDATE submitted_pets
          SET embedding = ${lit}::vector,
              embedding_model = ${PETDEX_EMBEDDING_MODEL}
          WHERE id = ${r.id}
        `;
      }
    }

    processed++;
    process.stdout.write("OK\n");
  }

  console.log(`\nprocessed: ${processed}, skipped: ${skipped}`);
}

await main();
