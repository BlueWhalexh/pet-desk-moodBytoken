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
  "create table telemetry_events",
  () => sql`
    CREATE TABLE telemetry_events (
      id serial PRIMARY KEY NOT NULL,
      install_id text NOT NULL,
      event text NOT NULL,
      cli_version text,
      binary_version text,
      os text,
      arch text,
      agents jsonb,
      state text,
      agent_source text,
      country text,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
);

await tryRun(
  "telemetry_install_id_idx",
  () =>
    sql`CREATE INDEX telemetry_install_id_idx ON telemetry_events (install_id)`,
);

await tryRun(
  "telemetry_event_idx",
  () => sql`CREATE INDEX telemetry_event_idx ON telemetry_events (event)`,
);

await tryRun(
  "telemetry_created_at_idx",
  () =>
    sql`CREATE INDEX telemetry_created_at_idx ON telemetry_events (created_at)`,
);

console.log("done");
