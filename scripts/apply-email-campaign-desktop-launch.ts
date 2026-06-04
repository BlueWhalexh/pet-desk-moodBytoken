import { neon } from "@neondatabase/serverless";

import { requiredEnv } from "./env";

// Apply 0013_email_campaign_desktop_launch by hand. Drizzle journals
// the migration file but Vercel doesn't run drizzle-kit migrate at
// deploy time, so each enum-extending migration ships as its own
// idempotent apply-* script that we can run from a local shell or a
// one-off dashboard task.
const sql = neon(requiredEnv("DATABASE_URL"));

async function tryRun(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`ok   ${label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already exists/i.test(msg) || /duplicate object/i.test(msg)) {
      console.log(`skip ${label} (already exists)`);
    } else {
      throw err;
    }
  }
}

// ALTER TYPE ... ADD VALUE is not transactional in Postgres — it cannot
// run inside an explicit BEGIN/COMMIT, and Drizzle doesn't understand
// that for our needs. Running it bare via @neondatabase/serverless
// opens an implicit transaction per call, which IS supported.
await tryRun("add desktop_launch to email_campaign", async () => {
  await sql`ALTER TYPE "public"."email_campaign" ADD VALUE 'desktop_launch'`;
});

console.log("done");
