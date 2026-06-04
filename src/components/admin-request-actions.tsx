"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";

type Status = "open" | "fulfilled" | "dismissed";
type Action =
  | "fulfill"
  | "dismiss"
  | "reopen"
  | "approve_image"
  | "reject_image";

export function AdminRequestActions({
  id,
  status,
  defaultSlug,
  imageUrl,
  imageReviewStatus,
}: {
  id: string;
  status: Status;
  defaultSlug?: string | null;
  imageUrl?: string | null;
  imageReviewStatus?: string;
}) {
  const t = useTranslations("admin.requestActions");
  const router = useRouter();
  const [busy, setBusy] = useState<null | Action>(null);
  const [, startTransition] = useTransition();
  const [showFulfill, setShowFulfill] = useState(false);
  const [slug, setSlug] = useState(defaultSlug ?? "");
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action, payload: Record<string, unknown> = {}) {
    setError(null);
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(j?.error ?? res.statusText);
        return;
      }
      setShowFulfill(false);
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        {imageUrl && imageReviewStatus !== "approved" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void run("approve_image")}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-xs font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {busy === "approve_image" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            {t("approveImage")}
          </button>
        ) : null}
        {imageUrl && imageReviewStatus !== "rejected" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void run("reject_image")}
            className="inline-flex h-8 items-center justify-center rounded-full border border-rose-200 bg-chip-danger-bg px-3 text-xs font-medium text-chip-danger-fg transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800/60 dark:hover:border-rose-700 dark:hover:bg-rose-900/40"
          >
            {busy === "reject_image" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            {t("rejectImage")}
          </button>
        ) : null}
        {status !== "fulfilled" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowFulfill((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Sparkles className="size-3.5" />
            {t("fulfill")}
          </button>
        ) : null}
        {status === "open" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void run("dismiss")}
            aria-label={t("dismiss")}
            title={t("dismiss")}
            className="inline-flex size-8 items-center justify-center rounded-full border border-rose-200 bg-chip-danger-bg text-chip-danger-fg transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800/60 dark:hover:border-rose-700 dark:hover:bg-rose-900/40"
          >
            {busy === "dismiss" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
          </button>
        ) : null}
        {status !== "open" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void run("reopen")}
            aria-label={t("reopen")}
            title={t("reopen")}
            className="inline-flex size-8 items-center justify-center rounded-full border border-amber-200 bg-chip-warning-bg text-chip-warning-fg transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800/60 dark:hover:border-amber-700 dark:hover:bg-amber-900/40"
          >
            {busy === "reopen" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>

      {showFulfill ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run("fulfill", { petSlug: slug });
          }}
          className="flex items-center gap-1.5 rounded-full border border-border-base bg-surface px-2 py-1"
        >
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted-4 uppercase">
            {t("slug")}
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t("placeholder")}
            className="h-7 w-44 bg-transparent text-xs text-stone-900 outline-none placeholder:text-muted-4 dark:text-stone-100"
          />
          <button
            type="submit"
            disabled={disabled || slug.trim().length === 0}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-600 px-2.5 text-[11px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy === "fulfill" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            {t("mark")}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="font-mono text-[10px] tracking-[0.12em] text-rose-600 uppercase">
          {error.replace(/_/g, " ")}
        </p>
      ) : null}
    </div>
  );
}
