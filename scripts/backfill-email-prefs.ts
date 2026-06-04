// Sync every Clerk user into email_preferences with default opt-in
// status. Idempotent — re-running skips users that already have a row
// (ON CONFLICT DO NOTHING). Designed to run before the first broadcast
// and again periodically as new users sign up.
//
// Run:  bun --env-file .env.local --env-file .env.production.local \
//       scripts/backfill-email-prefs.ts [--dry] [--limit=N]
//
// Needs CLERK_SECRET_KEY matching the env where Petdex users live
// (sk_live_* for prod). Pass both env files to combine DATABASE_URL +
// Clerk creds.

import { clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

import { requiredEnv } from "./env";

const dryRun = process.argv.includes("--dry");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const sql = neon(requiredEnv("DATABASE_URL"));

function newToken(): string {
  return `mlu_${crypto.randomUUID().replace(/-/g, "")}${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)}`;
}

function inferLocale(value: string | null | undefined): "en" | "es" | "zh" {
  if (!value) return "en";
  const v = value.toLowerCase();
  if (v.startsWith("zh")) return "zh";
  if (v.startsWith("es")) return "es";
  return "en";
}

async function main() {
  const cc = await clerkClient();
  let total = 0;
  let inserted = 0;
  let skipped = 0;
  let missingEmail = 0;
  let pageOffset = 0;
  const PAGE = 100;

  while (total < limit) {
    const remaining = limit - total;
    const take = Math.min(PAGE, remaining);
    const { data: users, totalCount } = await cc.users.getUserList({
      limit: take,
      offset: pageOffset,
      orderBy: "+created_at",
    });
    if (users.length === 0) break;

    for (const u of users) {
      total++;
      const primaryEmail = u.emailAddresses.find(
        (e) => e.id === u.primaryEmailAddressId,
      );
      const email = primaryEmail?.emailAddress?.toLowerCase() ?? null;
      if (!email) {
        missingEmail++;
        continue;
      }

      const locale = inferLocale(
        (u.publicMetadata as Record<string, unknown>)?.preferredLocale as
          | string
          | undefined,
      );

      if (dryRun) {
        inserted++;
        continue;
      }

      const result = await sql`
        INSERT INTO email_preferences (
          user_id, email, locale, unsubscribe_token
        ) VALUES (
          ${u.id}, ${email}, ${locale}, ${newToken()}
        )
        ON CONFLICT (user_id) DO NOTHING
        RETURNING user_id
      `;
      if (result.length > 0) inserted++;
      else skipped++;
    }

    pageOffset += users.length;
    console.log(
      `progress: scanned=${total}/${totalCount} inserted=${inserted} skipped=${skipped} no_email=${missingEmail}`,
    );
    if (users.length < take) break;
  }

  console.log(
    `\ndone. mode=${dryRun ? "DRY" : "APPLY"} scanned=${total} inserted=${inserted} skipped=${skipped} no_email=${missingEmail}`,
  );
}

await main();
