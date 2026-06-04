// Backfill pet_metrics from Vercel Analytics page-view data captured 2026-05-02.
// Idempotent: re-running upserts the same numbers, doesn't accumulate.
// Source data:
//   install_command_copied: 37 total
//   pack_downloaded: 20 total
//   Per-pet page views distribute proportionally.

import { sql } from "drizzle-orm";

import { db, schema } from "../src/lib/db/client";

type Backfill = {
  slug: string;
  installs: number;
  zipDownloads: number;
};

// Prorated 1:1 from page views captured 2026-05-02.
// Sum of installs = 37, sum of zipDownloads = 20.
const ROWS: Backfill[] = [
  { slug: "noir-webling", installs: 8, zipDownloads: 5 },
  { slug: "cache-capy", installs: 6, zipDownloads: 3 },
  { slug: "kebo", installs: 4, zipDownloads: 2 },
  { slug: "socksy", installs: 4, zipDownloads: 2 },
  { slug: "boba", installs: 4, zipDownloads: 2 },
  { slug: "boxcat", installs: 4, zipDownloads: 2 },
  { slug: "prompt-penguin", installs: 2, zipDownloads: 1 },
  { slug: "cash-cuy", installs: 1, zipDownloads: 1 },
  { slug: "cosmo", installs: 1, zipDownloads: 1 },
  { slug: "scoop", installs: 1, zipDownloads: 1 },
  { slug: "paperclip", installs: 1, zipDownloads: 0 },
  { slug: "pixel-panda", installs: 1, zipDownloads: 0 },
];

async function main() {
  const installSum = ROWS.reduce((a, r) => a + r.installs, 0);
  const zipSum = ROWS.reduce((a, r) => a + r.zipDownloads, 0);

  console.log(
    `Backfilling ${ROWS.length} pets (installs=${installSum}, zip_downloads=${zipSum})`,
  );

  for (const row of ROWS) {
    await db
      .insert(schema.petMetrics)
      .values({
        petSlug: row.slug,
        installCount: row.installs,
        zipDownloadCount: row.zipDownloads,
        likeCount: 0,
      })
      .onConflictDoUpdate({
        target: schema.petMetrics.petSlug,
        set: {
          // Use GREATEST so re-running with smaller numbers doesn't regress
          // real installs that may have happened after the backfill.
          installCount: sql`GREATEST(${schema.petMetrics.installCount}, ${row.installs})`,
          zipDownloadCount: sql`GREATEST(${schema.petMetrics.zipDownloadCount}, ${row.zipDownloads})`,
          updatedAt: new Date(),
        },
      });
    console.log(
      `  ${row.slug.padEnd(20)} installs=${row.installs} zip=${row.zipDownloads}`,
    );
  }

  console.log("done.");
}

await main();
