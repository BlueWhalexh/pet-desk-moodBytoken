// Adds owner-controlled ordering to submitted_pets so owners can
// drag-reorder their gallery on /u/<handle>. Default 0 lets every
// existing row stay in its current implicit order until the owner
// touches it. Idempotent.
//
// Run:
//   bun --env-file .env.local scripts/apply-gallery-position.ts

import { neon } from "@neondatabase/serverless";

import { requiredEnv } from "./env";

const sql = neon(requiredEnv("DATABASE_URL"));

async function tryRun(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`ok   ${label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      /already exists/i.test(msg) ||
      /duplicate column/i.test(msg) ||
      /duplicate object/i.test(msg)
    ) {
      console.log(`skip ${label} (already exists)`);
    } else {
      throw err;
    }
  }
}

await tryRun(
  "submitted_pets.gallery_position column",
  () => sql`
    ALTER TABLE submitted_pets
    ADD COLUMN gallery_position integer NOT NULL DEFAULT 0
  `,
);

await tryRun(
  "submitted_pets_owner_gallery_idx",
  () => sql`
    CREATE INDEX submitted_pets_owner_gallery_idx
    ON submitted_pets (owner_id, gallery_position, created_at DESC)
    WHERE status = 'approved'
  `,
);

console.log("done");
