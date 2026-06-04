// Per-visitor stable shuffle seed used by the curated gallery sort.
//
// Why: the default `curated` sort was deterministic for every visitor
// ("featured DESC, displayName ASC"), so pets near the front of the
// alphabet always won the homepage real-estate lottery. We seed a
// stable, per-visitor random hash so each person sees a unique
// ordering of the catalog, while keeping the order rock-stable
// across refresh + infinite scroll within a 30-day window.
//
// The cookie is minted by /api/pets/search when a curated request arrives.
// Keeping Set-Cookie off the home HTML response lets ISR/CDN caches share
// that page, while the API response can stay private and visitor-specific.
//
// Issue: https://github.com/crafter-station/petdex/issues/82

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "petdex_shuffle_seed";
const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

// 16-char hex (8 random bytes). Tight regex on read so a tampered
// cookie can't smuggle SQL fragments into ORDER BY md5(slug || $seed).
const SEED_PATTERN = /^[a-f0-9]{16}$/;

export function createShuffleSeed(): string {
  return randomBytes(8).toString("hex");
}

export function normalizeShuffleSeed(
  value: string | null | undefined,
): string | null {
  return value && SEED_PATTERN.test(value) ? value : null;
}

export function setShuffleSeedCookie(
  response: NextResponse,
  seed: string,
): void {
  response.cookies.set(COOKIE_NAME, seed, {
    maxAge: ONE_MONTH_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Read the shuffle seed cookie. Returns null when the cookie is
 * missing or malformed; API routes that need a seed can mint one and set it
 * on their own response so the same request can use stable shuffle ordering.
 */
export async function readShuffleSeed(): Promise<string | null> {
  const jar = await cookies();
  return normalizeShuffleSeed(jar.get(COOKIE_NAME)?.value);
}
