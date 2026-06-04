// Embed a search query into the same vector space the catalog lives in.
// Cached in Upstash Redis by SHA1(query) so the second user typing
// "cozy night programmer" doesn't burn another embedding call.

import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

import {
  embedTextValue,
  hasCurrentEmbeddingDimensions,
  PETDEX_EMBEDDING_MODEL,
} from "@/lib/embeddings";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function cacheKey(text: string): string {
  return `petdex:queryvec:${PETDEX_EMBEDDING_MODEL}:${createHash("sha1").update(text).digest("hex")}`;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  if (redis) {
    try {
      const cached = await redis.get<number[]>(cacheKey(trimmed));
      if (hasCurrentEmbeddingDimensions(cached)) {
        return cached;
      }
    } catch {
      /* fall through to provider */
    }
  }

  const v = await embedTextValue(trimmed);
  if (v && redis) {
    await redis.set(cacheKey(trimmed), v, { ex: TTL_SECONDS }).catch(() => {});
  }
  return v;
}

/** Decide whether a search query is "vibey" enough to embed instead of
 *  doing keyword search. Heuristic: 3+ words OR ends with '?' OR
 *  contains common natural-language tokens. */
export function looksLikeVibeQuery(q: string): boolean {
  const t = q.trim();
  if (!t) return false;
  if (t.endsWith("?")) return true;
  if (t.split(/\s+/).length >= 3) return true;
  // catch "cozy night" type two-word phrases
  if (/\s/.test(t) && t.length >= 8) return true;
  return false;
}
