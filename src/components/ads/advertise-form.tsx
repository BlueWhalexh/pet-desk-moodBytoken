"use client";

import { useEffect, useRef, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { Loader2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AD_PACKAGES, type AdPackageId, formatUsd } from "@/lib/ads/packages";

import { AdCard } from "@/components/ads/ad-card";

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting"; message: string }
  | { kind: "error"; message: string };

const PACKAGE_IDS = Object.keys(AD_PACKAGES) as AdPackageId[];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function AdvertiseForm() {
  const t = useTranslations("advertise.form");
  const locale = useLocale();
  const { isSignedIn, user } = useUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewDestinationUrl, setPreviewDestinationUrl] = useState("");
  const [packageId, setPackageId] = useState<AdPackageId>("impressions_5000");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });
  const previewAd = {
    id: "ad-preview",
    title: previewTitle.trim() || t("previewFallbackTitle"),
    description: previewDescription.trim() || t("previewFallbackDescription"),
    imageUrl: imagePreviewUrl ?? "https://example.com/ad-preview.png",
    clickUrl: previewDestinationUrl.trim() || "https://example.com",
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  function handleImageChange(file: File | null) {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }

    setImageFile(file);
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    imagePreviewUrlRef.current = nextPreviewUrl;
    setImagePreviewUrl(nextPreviewUrl);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSignedIn) return;
    if (!imageFile) {
      setState({ kind: "error", message: t("errors.imageRequired") });
      return;
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      setState({ kind: "error", message: t("errors.imageTooLarge") });
      return;
    }

    const form = new FormData(event.currentTarget);
    try {
      setState({ kind: "submitting", message: t("status.uploading") });
      const imageUrl = await uploadImage(imageFile);

      setState({ kind: "submitting", message: t("status.creating") });
      const createRes = await fetch("/api/ads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          contactEmail: form.get("contactEmail"),
          title: form.get("title"),
          description: form.get("description"),
          destinationUrl: form.get("destinationUrl"),
          packageId,
          imageUrl,
          acceptedTerms,
          utmSource: form.get("utmSource"),
          utmMedium: form.get("utmMedium"),
          utmCampaign: form.get("utmCampaign"),
          utmTerm: form.get("utmTerm"),
          utmContent: form.get("utmContent"),
        }),
      });
      const createData = (await createRes.json()) as {
        campaignId?: string;
        error?: string;
      };
      if (!createRes.ok || !createData.campaignId) {
        throw new Error(createData.error ?? t("errors.submitFailed"));
      }

      setState({ kind: "submitting", message: t("status.checkout") });
      const checkoutRes = await fetch("/api/ads/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId: createData.campaignId, locale }),
      });
      const checkoutData = (await checkoutRes.json()) as {
        url?: string;
        error?: string;
      };
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error ?? t("errors.checkoutFailed"));
      }
      window.location.href = checkoutData.url;
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : t("errors.network"),
      });
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-[2rem] border border-border-base bg-surface/82 p-5 shadow-xl shadow-blue-950/5 backdrop-blur md:p-7"
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
        <div className="space-y-6">
          <section className="grid gap-5 md:grid-cols-2">
            <Field label={t("companyName")} name="companyName" required />
            <Field
              label={t("contactEmail")}
              name="contactEmail"
              type="email"
              defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""}
              required
            />
            <Field
              label={t("title")}
              name="title"
              maxLength={80}
              onChange={setPreviewTitle}
              required
            />
            <Field
              label={t("destinationUrl")}
              name="destinationUrl"
              type="url"
              placeholder="https://example.com"
              onChange={setPreviewDestinationUrl}
              required
            />
            <p className="rounded-2xl border border-border-base bg-background px-4 py-3 text-xs leading-5 text-muted-2 md:col-span-2">
              {t("creativeDisclosure")}
            </p>
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-foreground">
                {t("description")}
              </span>
              <textarea
                name="description"
                required
                maxLength={180}
                rows={4}
                onChange={(event) => setPreviewDescription(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border-base bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-3 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-foreground">
                {t("image")}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border-base bg-background px-4 py-8 text-sm text-muted-2 transition hover:border-brand/60 hover:text-foreground"
              >
                <Upload className="size-4" />
                {imageFile ? imageFile.name : t("imageCta")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) =>
                  handleImageChange(event.target.files?.[0] ?? null)
                }
              />
              <p className="mt-2 text-xs text-muted-3">{t("imageHelp")}</p>
            </div>
          </section>

          <details className="rounded-2xl border border-border-base bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {t("utmTitle")}
            </summary>
            <p className="mt-2 text-sm leading-6 text-muted-2">
              {t("utmHelp")}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="utm_source" name="utmSource" />
              <Field label="utm_medium" name="utmMedium" />
              <Field label="utm_campaign" name="utmCampaign" />
              <Field label="utm_term" name="utmTerm" />
              <Field label="utm_content" name="utmContent" />
            </div>
          </details>

          <label className="flex items-start gap-3 rounded-2xl border border-border-base bg-background p-4 text-sm leading-6 text-muted-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 size-4"
              required
            />
            <span>{t("legalAccept")}</span>
          </label>

          {state.kind === "error" ? (
            <p className="rounded-2xl bg-chip-danger-bg p-3 text-sm text-chip-danger-fg">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!isSignedIn || state.kind === "submitting"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-inverse px-6 text-sm font-medium text-on-inverse transition hover:bg-inverse-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.kind === "submitting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {state.message}
              </>
            ) : (
              t("submit")
            )}
          </button>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-border-base bg-background p-4">
            <div className="mb-4">
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted-3 uppercase">
                {t("previewTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-2">
                {t("previewHelp")}
              </p>
            </div>
            <AdCard
              ad={previewAd}
              disableNavigation
              showImagePlaceholder={!imagePreviewUrl}
            />
          </section>

          <section>
            <p className="text-sm font-medium text-foreground">
              {t("package")}
            </p>
            <div className="mt-3 grid gap-3">
              {PACKAGE_IDS.map((id) => {
                const pkg = AD_PACKAGES[id];
                const active = packageId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPackageId(id)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-brand bg-brand-tint text-foreground dark:bg-brand-tint-dark"
                        : "border-border-base bg-background text-muted-2 hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-lg font-semibold text-foreground">
                      {formatUsd(pkg.priceCents)}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] tracking-[0.16em] uppercase">
                      {pkg.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-2">
              {t("pricingTrust")}
            </p>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  placeholder,
  defaultValue,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-2 h-11 w-full rounded-full border border-border-base bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-3 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
      />
    </label>
  );
}

async function uploadImage(file: File): Promise<string> {
  const presignRes = await fetch("/api/ads/image/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const presignData = (await presignRes.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  };
  if (!presignRes.ok || !presignData.uploadUrl || !presignData.publicUrl) {
    throw new Error(presignData.error ?? "Upload failed.");
  }

  const putRes = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Image upload failed.");
  return presignData.publicUrl;
}
