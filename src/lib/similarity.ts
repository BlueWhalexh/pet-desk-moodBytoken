// Compute a perceptual hash + a semantic embedding for a single pet row
// and persist them. Designed to run server-side (Node), idempotent
// against re-runs, and fail-soft so the caller never blocks on it.
//
// Used by:
//   - /api/admin/[id] approve path (fire-and-forget after approval)
//   - scripts/compute-similarity.ts for bulk backfill

import { eq } from "drizzle-orm";
import sharp from "sharp";

import {
  AGGREGATE_KEYS,
  invalidateAggregates,
  invalidatePetCaches,
} from "@/lib/db/cached-aggregates";
import { db, schema } from "@/lib/db/client";
import {
  buildPetEmbeddingText,
  embeddingVectorLiteral,
  embedTextValue,
  PETDEX_EMBEDDING_MODEL,
} from "@/lib/embeddings";
import { isAllowedAssetUrl } from "@/lib/url-allowlist";

const FRAME_W = 192;
const FRAME_H = 208;

export async function dhashFromSpriteUrl(
  spriteUrl: string,
): Promise<string | null> {
  if (!isAllowedAssetUrl(spriteUrl)) return null;
  try {
    const res = await fetch(spriteUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return dhashFromSpriteBuffer(buf);
  } catch {
    return null;
  }
}

export async function dhashFromSpriteBuffer(
  buf: Buffer,
): Promise<string | null> {
  try {
    const frame = await sharp(buf)
      .extract({ left: 0, top: 0, width: FRAME_W, height: FRAME_H })
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
  } catch {
    return null;
  }
}

export function hammingDistanceHex(a: string, b: string): number {
  const ZERO = BigInt(0);
  const ONE = BigInt(1);
  let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let distance = 0;
  while (xor !== ZERO) {
    distance += Number(xor & ONE);
    xor >>= ONE;
  }
  return distance;
}

export async function embedPetText(args: {
  displayName: string;
  description: string;
  kind: string;
  tags: string[];
  vibes: string[];
}): Promise<number[] | null> {
  return embedTextValue(buildPetEmbeddingText(args));
}

/** Persist dhash + embedding for the given pet id. */
export async function refreshSimilarityFor(petId: string): Promise<void> {
  const row = await db.query.submittedPets.findFirst({
    where: eq(schema.submittedPets.id, petId),
  });
  if (!row) return;

  const [hash, vec] = await Promise.all([
    dhashFromSpriteUrl(row.spritesheetUrl),
    embedPetText({
      displayName: row.displayName,
      description: row.description,
      kind: row.kind,
      tags: (row.tags as string[]) ?? [],
      vibes: (row.vibes as string[]) ?? [],
    }),
  ]);

  if (hash) {
    await db
      .update(schema.submittedPets)
      .set({ dhash: hash })
      .where(eq(schema.submittedPets.id, petId));
    await invalidateAggregates(AGGREGATE_KEYS.variantIndex);
    await invalidatePetCaches(row.slug);
  }
  if (vec) {
    await persistPetEmbedding(petId, vec);
  }
}

export async function persistPetEmbedding(
  petId: string,
  vec: number[],
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  // Drizzle doesn't model pgvector yet; raw SQL via the neon-http driver.
  const literal = embeddingVectorLiteral(vec);
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    UPDATE submitted_pets
    SET embedding = ${literal}::vector,
        embedding_model = ${PETDEX_EMBEDDING_MODEL}
    WHERE id = ${petId}
  `;
}
