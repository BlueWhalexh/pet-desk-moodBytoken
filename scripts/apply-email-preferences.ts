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
  "create enum email_campaign",
  () => sql`CREATE TYPE email_campaign AS ENUM ('collections_drop')`,
);

await tryRun(
  "create enum email_send_status",
  () =>
    sql`CREATE TYPE email_send_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'bounced', 'complained', 'failed')`,
);

await tryRun(
  "create table email_preferences",
  () => sql`
    CREATE TABLE email_preferences (
      user_id text PRIMARY KEY NOT NULL,
      email text NOT NULL,
      locale text NOT NULL DEFAULT 'en',
      unsubscribed_marketing boolean NOT NULL DEFAULT false,
      unsubscribed_at timestamp with time zone,
      unsubscribe_token text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
);

await tryRun(
  "create table email_sends",
  () => sql`
    CREATE TABLE email_sends (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      email text NOT NULL,
      campaign email_campaign NOT NULL,
      batch_key text NOT NULL,
      resend_id text,
      status email_send_status NOT NULL DEFAULT 'queued',
      error text,
      sent_at timestamp with time zone,
      delivered_at timestamp with time zone,
      opened_at timestamp with time zone,
      bounced_at timestamp with time zone,
      complained_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
);

await tryRun(
  "email_preferences_email_idx",
  () =>
    sql`CREATE INDEX email_preferences_email_idx ON email_preferences (email)`,
);

await tryRun(
  "email_preferences_token_unique",
  () =>
    sql`CREATE UNIQUE INDEX email_preferences_token_unique ON email_preferences (unsubscribe_token)`,
);

await tryRun(
  "email_preferences_opted_in_idx",
  () =>
    sql`CREATE INDEX email_preferences_opted_in_idx ON email_preferences (unsubscribed_marketing)`,
);

await tryRun(
  "email_sends_user_idx",
  () => sql`CREATE INDEX email_sends_user_idx ON email_sends (user_id)`,
);

await tryRun(
  "email_sends_batch_idx",
  () => sql`CREATE INDEX email_sends_batch_idx ON email_sends (batch_key)`,
);

await tryRun(
  "email_sends_campaign_idx",
  () =>
    sql`CREATE INDEX email_sends_campaign_idx ON email_sends (campaign, created_at DESC NULLS LAST)`,
);

await tryRun(
  "email_sends_status_idx",
  () => sql`CREATE INDEX email_sends_status_idx ON email_sends (status)`,
);

await tryRun(
  "email_sends_resend_unique",
  () =>
    sql`CREATE UNIQUE INDEX email_sends_resend_unique ON email_sends (resend_id)`,
);

await tryRun(
  "email_sends_user_batch_unique",
  () =>
    sql`CREATE UNIQUE INDEX email_sends_user_batch_unique ON email_sends (user_id, batch_key)`,
);

console.log("done");
