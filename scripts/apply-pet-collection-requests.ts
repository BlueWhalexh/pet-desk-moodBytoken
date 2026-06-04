// Apply the 0003 migration directly. We don't run drizzle-kit at
// deploy time — historical migrations land here as one-shot scripts
// the maintainer runs once against prod (.env.local) and once against
// any other env that needs them.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const sql = neon(process.env.DATABASE_URL);

const sqlText = readFileSync(
  join(process.cwd(), "drizzle/0003_pet_collection_requests.sql"),
  "utf8",
);

const statements = sqlText
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  console.log(`> ${stmt.slice(0, 80).replace(/\s+/g, " ")}`);
  await sql.query(stmt);
}
console.log("done.");
