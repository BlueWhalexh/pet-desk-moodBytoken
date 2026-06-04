import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { Webhook } from "svix";

import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained"
  | "email.delivery_delayed"
  | "email.failed";

type ResendWebhookPayload = {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id?: string;
    [key: string]: unknown;
  };
};

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "resend_webhook_secret_missing" },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "signature_missing" }, { status: 400 });
  }

  const body = await req.text();
  let payload: ResendWebhookPayload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "signature_invalid" }, { status: 400 });
  }

  const resendId = payload.data?.email_id;
  if (!resendId) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const updates: Partial<typeof schema.emailSends.$inferInsert> = {};

  switch (payload.type) {
    case "email.sent":
      updates.status = "sent";
      updates.sentAt = now;
      break;
    case "email.delivered":
      updates.status = "delivered";
      updates.deliveredAt = now;
      break;
    case "email.opened":
      updates.status = "opened";
      updates.openedAt = now;
      break;
    case "email.bounced":
      updates.status = "bounced";
      updates.bouncedAt = now;
      break;
    case "email.complained":
      updates.status = "complained";
      updates.complainedAt = now;
      break;
    case "email.failed":
      updates.status = "failed";
      updates.error =
        typeof payload.data.reason === "string" ? payload.data.reason : null;
      break;
    default:
      return NextResponse.json({ ok: true });
  }

  await db
    .update(schema.emailSends)
    .set(updates)
    .where(eq(schema.emailSends.resendId, resendId));

  return NextResponse.json({ ok: true });
}
