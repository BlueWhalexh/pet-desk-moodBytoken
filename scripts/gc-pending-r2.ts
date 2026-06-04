// gc-pending-r2.ts — Garbage collector for stale pending R2 uploads.
//
// Run manually or wire into a Vercel cron / Trigger.dev job:
//   bun scripts/gc-pending-r2.ts
//
// TODO: Wire this as a Trigger.dev scheduled task (daily, e.g. 03:00 UTC).
// The job should NOT be wired to a Vercel cron because it needs to list R2
// objects (S3 ListObjectsV2), which is too slow for a serverless function
// with tight timeout budgets.

// Algorithm:
//
// 1. List R2 objects under the `pets/` prefix where the key contains
//    "-pending/" (e.g. `pets/boba-pending/spritesheet.webp`).
//    Use S3 ListObjectsV2 with a ContinuationToken loop to page through.
//    Only consider objects older than 24h (LastModified < now - 24h).
//
// 2. For each candidate key, check whether any submitted_pets row currently
//    references this URL in one of the pending asset columns:
//      - pendingSpritesheetUrl
//      - pendingPetJsonUrl
//      - pendingZipUrl
//    If yes, this upload is still "live" for an in-flight admin review —
//    skip it. Otherwise it is orphaned (the edit was withdrawn, rejected,
//    or auto-approved and the live columns already point elsewhere).
//
// 3. Batch-delete orphaned keys via deleteR2Objects(). Log each deletion.
//
// 4. Write a summary to stdout: total objects scanned, orphaned, deleted,
//    skipped (still referenced), and errors.
//
// Safety invariants:
// - Only delete objects whose keys match the "-pending/" infix. Never touch
//   live pet assets (which live under `pets/<slug>/` without "-pending/").
// - The 24h age gate ensures a freshly presigned upload that hasn't been
//   submitted yet is not collected mid-flight.
// - If the DB query fails, skip the batch and log the error — never delete
//   without a DB confirmation.

// TODO: implement after Trigger.dev is wired and DATABASE_URL / R2 creds
// are available in the job environment.

console.log("gc-pending-r2: stub — not yet implemented");
