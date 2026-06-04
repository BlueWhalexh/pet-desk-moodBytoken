import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

async function hasColumn(columnName: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submitted_pets'
      AND column_name = ${columnName}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function ensureColumn(
  columnName: string,
  definition: string,
): Promise<void> {
  if (await hasColumn(columnName)) {
    console.log(`skip submitted_pets.${columnName} (already exists)`);
    return;
  }

  await sql.query(
    `ALTER TABLE submitted_pets ADD COLUMN ${columnName} ${definition}`,
  );
  console.log(`ok   submitted_pets.${columnName}`);
}

await ensureColumn("dominant_color", "text");
await ensureColumn("color_family", "text");

console.log("done");
