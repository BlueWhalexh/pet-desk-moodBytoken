"use server";

import { revalidatePath } from "next/cache";

import { markResubscribed, markUnsubscribed } from "@/lib/email-preferences";

export async function unsubscribeAction(
  token: string,
): Promise<{ ok: boolean }> {
  if (!token) return { ok: false };
  const ok = await markUnsubscribed(token);
  if (ok) revalidatePath("/unsubscribe");
  return { ok };
}

export async function resubscribeAction(
  token: string,
): Promise<{ ok: boolean }> {
  if (!token) return { ok: false };
  const ok = await markResubscribed(token);
  if (ok) revalidatePath("/unsubscribe");
  return { ok };
}
