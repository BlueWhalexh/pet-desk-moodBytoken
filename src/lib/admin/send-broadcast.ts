import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";

import { db, schema } from "@/lib/db/client";
import { renderCollectionsDropEmail } from "@/lib/email-templates/collections-drop";
import { renderDesktopLaunchEmail } from "@/lib/email-templates/desktop-launch";

import type { Locale } from "@/i18n/config";

export type Campaign = "collections_drop" | "desktop_launch";

type SendOptions = {
  campaign: Campaign;
  batchKey: string;
  // null = all opted-in users; otherwise restrict to these userIds (testing).
  toUserIds: string[] | null;
  // Optional locale filter — null sends to every opted-in locale.
  localeFilter: Locale | null;
  // Per-campaign payload. collections_drop needs a list of collections;
  // desktop_launch is parameterless (the template is self-contained,
  // no per-send variables aside from the unsubscribe token).
  collections?: { slug: string; title: string; description: string }[];
};

export type SendResult = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: { email: string; error: string }[];
};

const SLEEP_MS = 110; // ~9 sends/sec, safe under Resend default cap

export async function sendBroadcast(opts: SendOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Petdex <hello@petdex.crafter.run>";
  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }
  const resend = new Resend(apiKey);

  const baseFilter = and(
    eq(schema.emailPreferences.unsubscribedMarketing, false),
    opts.localeFilter
      ? eq(schema.emailPreferences.locale, opts.localeFilter)
      : undefined,
    opts.toUserIds && opts.toUserIds.length > 0
      ? inArray(schema.emailPreferences.userId, opts.toUserIds)
      : undefined,
  );

  const recipients = await db
    .select({
      userId: schema.emailPreferences.userId,
      email: schema.emailPreferences.email,
      locale: schema.emailPreferences.locale,
      unsubscribeToken: schema.emailPreferences.unsubscribeToken,
    })
    .from(schema.emailPreferences)
    .where(baseFilter);

  const result: SendResult = {
    attempted: recipients.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const r of recipients) {
    const rendered =
      opts.campaign === "desktop_launch"
        ? renderDesktopLaunchEmail(r.locale as Locale, {
            unsubscribeToken: r.unsubscribeToken,
          })
        : renderCollectionsDropEmail(r.locale as Locale, {
            collections: opts.collections ?? [],
            unsubscribeToken: r.unsubscribeToken,
          });
    const { subject, html, text } = rendered;

    const sendId = `snd_${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;

    try {
      await db.insert(schema.emailSends).values({
        id: sendId,
        userId: r.userId,
        email: r.email,
        campaign: opts.campaign,
        batchKey: opts.batchKey,
        status: "queued",
      });
    } catch {
      result.skipped++;
      continue;
    }

    try {
      const res = await resend.emails.send({
        from,
        to: r.email,
        subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<https://petdex.crafter.run/unsubscribe?token=${encodeURIComponent(r.unsubscribeToken)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (res.error) {
        result.failed++;
        result.errors.push({
          email: r.email,
          error: res.error.message ?? "unknown",
        });
        await db
          .update(schema.emailSends)
          .set({ status: "failed", error: res.error.message ?? "unknown" })
          .where(eq(schema.emailSends.id, sendId));
        continue;
      }

      const resendId = res.data?.id ?? null;
      result.sent++;
      await db
        .update(schema.emailSends)
        .set({
          status: "sent",
          resendId,
          sentAt: new Date(),
        })
        .where(eq(schema.emailSends.id, sendId));
    } catch (err) {
      result.failed++;
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ email: r.email, error: msg });
      await db
        .update(schema.emailSends)
        .set({ status: "failed", error: msg })
        .where(eq(schema.emailSends.id, sendId));
    }

    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  return result;
}
