"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import type { WechatQrUpload } from "@/lib/db/schema";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { uploadWechatQrAction } from "./actions";

// Use the local proxy route instead of the raw Aliyun URL — Henry's
// bucket ACL is private so the public Aliyun URL 403s; /api/wechat-qr
// reads with the RAM user's GetObject scope and serves with edge cache.
const LIVE_QR_URL = "/api/wechat-qr";

function useCountdown(expiresAt: Date | null) {
  const [msLeft, setMsLeft] = useState<number>(
    expiresAt ? expiresAt.getTime() - Date.now() : -1,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      setMsLeft(expiresAt.getTime() - Date.now());
    }, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return msLeft;
}

function CountdownBadge({ expiresAt }: { expiresAt: Date }) {
  const msLeft = useCountdown(expiresAt);
  const daysLeft = Math.floor(msLeft / 86400000);

  if (msLeft <= 0)
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        已过期
      </Badge>
    );
  if (daysLeft < 2)
    return (
      <Badge variant="destructive">
        {daysLeft === 0 ? "今天过期" : `${daysLeft}天后过期`}
      </Badge>
    );
  if (daysLeft < 5)
    return (
      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
        {daysLeft}天后过期
      </Badge>
    );
  return (
    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
      {daysLeft}天后过期
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return (
      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
        当前
      </Badge>
    );
  if (status === "replaced") return <Badge variant="secondary">已替换</Badge>;
  return <Badge variant="destructive">已拒绝</Badge>;
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  return `${diffDays}天前`;
}

interface Props {
  current: WechatQrUpload | null;
  history: WechatQrUpload[];
}

export function WechatQrPanel({ current, history }: Props) {
  const t = useTranslations("collaboratorWechatQr");
  const router = useRouter();

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; url: string }
    | { ok: false; error: string; reasoning?: string }
    | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadWechatQrAction(fd);
      setResult(res);
      if (res.ok) {
        setFile(null);
        setPreview(null);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {t("panelTitle")}
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("currentQr")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {LIVE_QR_URL ? (
              <Image
                src={LIVE_QR_URL}
                alt="WeChat group QR"
                width={192}
                height={192}
                unoptimized
                className="h-48 w-48 rounded-lg object-contain ring-1 ring-foreground/10"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                No QR configured
              </div>
            )}
            {current ? (
              <CountdownBadge expiresAt={new Date(current.expiresAt)} />
            ) : (
              <Badge variant="secondary">{t("expired")}</Badge>
            )}
          </CardContent>
          {current && (
            <CardFooter className="flex justify-between text-xs text-muted-foreground">
              <span>
                {t("uploadedBy")}: {current.uploadedBy.slice(0, 8)}
              </span>
              <span>{formatRelative(new Date(current.uploadedAt))}</span>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("uploadCta")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <button
              type="button"
              aria-label={t("dropZoneHint")}
              className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 rounded object-contain"
                />
              ) : (
                <p>{t("dropZoneHint")}</p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </button>

            {result && !result.ok && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-medium">
                  {t("validationFailed")}: {result.error}
                </p>
                {result.reasoning && (
                  <p className="mt-1 text-muted-foreground">
                    {result.reasoning}
                  </p>
                )}
              </div>
            )}

            {result?.ok && (
              <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-600 dark:text-green-400">
                {t("uploadSuccess")}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={!file || submitting}
              className="w-full"
            >
              {submitting ? t("validating") : t("rotateNow")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("historyEmpty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="font-mono text-muted-foreground">
                      {row.uploadedBy.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatRelative(new Date(row.uploadedAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
