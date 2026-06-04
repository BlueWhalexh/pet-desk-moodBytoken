import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db/client";

export type EmailPreference = typeof schema.emailPreferences.$inferSelect;

export function newUnsubscribeToken(): string {
  return `mlu_${crypto.randomUUID().replace(/-/g, "")}${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)}`;
}

export async function findByToken(
  token: string,
): Promise<EmailPreference | null> {
  const rows = await db
    .select()
    .from(schema.emailPreferences)
    .where(eq(schema.emailPreferences.unsubscribeToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function markUnsubscribed(token: string): Promise<boolean> {
  const result = await db
    .update(schema.emailPreferences)
    .set({
      unsubscribedMarketing: true,
      unsubscribedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.emailPreferences.unsubscribeToken, token))
    .returning({ userId: schema.emailPreferences.userId });
  return result.length > 0;
}

export async function markResubscribed(token: string): Promise<boolean> {
  const result = await db
    .update(schema.emailPreferences)
    .set({
      unsubscribedMarketing: false,
      unsubscribedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailPreferences.unsubscribeToken, token))
    .returning({ userId: schema.emailPreferences.userId });
  return result.length > 0;
}
