"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { canEditWeChatQr } from "@/lib/admin";
import { uploadWeChatQr } from "@/lib/aliyun-oss";
import { db, schema } from "@/lib/db/client";
import { wechatQrUploadRatelimit } from "@/lib/ratelimit";
import { validateQrImage } from "@/lib/wechat-qr-validator";

export type UploadResult =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: string; reasoning?: string };

export async function uploadWechatQrAction(
  formData: FormData,
): Promise<UploadResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthenticated" };
  if (!canEditWeChatQr(userId)) return { ok: false, error: "forbidden" };

  const { success } = await wechatQrUploadRatelimit.limit(userId);
  if (!success) return { ok: false, error: "rate_limited" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "missing_file" };
  if (file.size > 200 * 1024) return { ok: false, error: "file_too_large" };
  if (!["image/jpeg", "image/png"].includes(file.type))
    return { ok: false, error: "wrong_format" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateQrImage(buffer);
  if (!validation.ok) {
    return {
      ok: false,
      error: "validation_failed",
      reasoning: validation.reasoning,
    };
  }

  let upload: Awaited<ReturnType<typeof uploadWeChatQr>>;
  try {
    upload = await uploadWeChatQr(buffer);
  } catch (e) {
    return {
      ok: false,
      error: "upload_failed",
      reasoning: e instanceof Error ? e.message : "unknown",
    };
  }

  await db
    .update(schema.wechatQrUploads)
    .set({ status: "replaced" })
    .where(eq(schema.wechatQrUploads.status, "active"));

  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.insert(schema.wechatQrUploads).values({
    uploadedBy: userId,
    blobUrl: upload.url,
    historyKey: upload.historyKey,
    validationResult: validation.raw,
    status: "active",
    expiresAt,
  });

  revalidatePath("/zh/community");

  return { ok: true, url: upload.url, expiresAt: expiresAt.toISOString() };
}
