import {
  AD_PACKAGES,
  type AdPackageId,
  isAdPackageId,
} from "@/lib/ads/packages";
import {
  type AdUtmFields,
  cleanUtmValue,
  isAllowedAdImageUrl,
  validateAdDestinationUrl,
} from "@/lib/ads/url";

export type ValidAdCampaignInput = {
  companyName: string;
  contactEmail: string;
  title: string;
  description: string;
  imageUrl: string;
  destinationUrl: string;
  packageId: AdPackageId;
  packageViews: number;
  priceCents: number;
  acceptedTerms: true;
} & AdUtmFields;

export type ValidAdCampaignUpdateInput = {
  title?: string;
  description?: string;
  imageUrl?: string;
  destinationUrl?: string;
} & Partial<AdUtmFields>;

export type AdValidationResult =
  | { ok: true; value: ValidAdCampaignInput }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAdCampaignInput(body: unknown): AdValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }
  const data = body as Record<string, unknown>;
  const companyName = cleanText(data.companyName, 120);
  const contactEmail = cleanText(data.contactEmail, 254)?.toLowerCase() ?? null;
  const title = cleanText(data.title, 80);
  const description = cleanText(data.description, 180);
  const destinationUrl = validateAdDestinationUrl(data.destinationUrl);

  if (!companyName) return { ok: false, error: "company_name_required" };
  if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
    return { ok: false, error: "contact_email_invalid" };
  }
  if (!title) return { ok: false, error: "title_required" };
  if (!description) return { ok: false, error: "description_required" };
  if (!destinationUrl) return { ok: false, error: "destination_url_invalid" };
  if (!isAllowedAdImageUrl(data.imageUrl)) {
    return { ok: false, error: "image_url_invalid" };
  }
  if (!isAdPackageId(data.packageId)) {
    return { ok: false, error: "package_invalid" };
  }
  if (data.acceptedTerms !== true) {
    return { ok: false, error: "terms_required" };
  }

  const pkg = AD_PACKAGES[data.packageId];
  return {
    ok: true,
    value: {
      companyName,
      contactEmail,
      title,
      description,
      imageUrl: data.imageUrl,
      destinationUrl,
      packageId: data.packageId,
      packageViews: pkg.views,
      priceCents: pkg.priceCents,
      acceptedTerms: true,
      utmSource: cleanUtmValue(data.utmSource),
      utmMedium: cleanUtmValue(data.utmMedium),
      utmCampaign: cleanUtmValue(data.utmCampaign),
      utmTerm: cleanUtmValue(data.utmTerm),
      utmContent: cleanUtmValue(data.utmContent),
    },
  };
}

export function validateAdCampaignUpdateInput(
  body: unknown,
):
  | { ok: true; value: ValidAdCampaignUpdateInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }
  const data = body as Record<string, unknown>;
  const value: ValidAdCampaignUpdateInput = {};

  if (Object.hasOwn(data, "title")) {
    const title = cleanText(data.title, 80);
    if (!title) return { ok: false, error: "title_required" };
    value.title = title;
  }
  if (Object.hasOwn(data, "description")) {
    const description = cleanText(data.description, 180);
    if (!description) return { ok: false, error: "description_required" };
    value.description = description;
  }
  if (Object.hasOwn(data, "imageUrl")) {
    if (!isAllowedAdImageUrl(data.imageUrl)) {
      return { ok: false, error: "image_url_invalid" };
    }
    value.imageUrl = data.imageUrl;
  }
  if (Object.hasOwn(data, "destinationUrl")) {
    const destinationUrl = validateAdDestinationUrl(data.destinationUrl);
    if (!destinationUrl) {
      return { ok: false, error: "destination_url_invalid" };
    }
    value.destinationUrl = destinationUrl;
  }
  if (Object.hasOwn(data, "utmSource")) {
    value.utmSource = cleanUtmValue(data.utmSource);
  }
  if (Object.hasOwn(data, "utmMedium")) {
    value.utmMedium = cleanUtmValue(data.utmMedium);
  }
  if (Object.hasOwn(data, "utmCampaign")) {
    value.utmCampaign = cleanUtmValue(data.utmCampaign);
  }
  if (Object.hasOwn(data, "utmTerm")) {
    value.utmTerm = cleanUtmValue(data.utmTerm);
  }
  if (Object.hasOwn(data, "utmContent")) {
    value.utmContent = cleanUtmValue(data.utmContent);
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: "no_edit_fields" };
  }

  return { ok: true, value };
}

export function validateImpressionInput(body: unknown):
  | {
      ok: true;
      value: {
        campaignId: string;
        sessionId: string;
        requestId: string;
        visibleMs: number;
        path: string;
        locale: string;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object")
    return { ok: false, error: "invalid_body" };
  const data = body as Record<string, unknown>;
  const campaignId = cleanText(data.campaignId, 80);
  const sessionId = cleanText(data.sessionId, 120);
  const requestId = cleanText(data.requestId, 120);
  const path = cleanText(data.path, 512);
  const locale = cleanText(data.locale, 8);
  const visibleMs =
    typeof data.visibleMs === "number" ? Math.floor(data.visibleMs) : 0;

  if (!campaignId) return { ok: false, error: "campaign_id_required" };
  if (!sessionId) return { ok: false, error: "session_id_required" };
  if (!requestId) return { ok: false, error: "request_id_required" };
  if (!path?.startsWith("/")) return { ok: false, error: "path_invalid" };
  if (!locale) return { ok: false, error: "locale_required" };
  if (visibleMs < 2000) return { ok: false, error: "visible_ms_too_low" };

  return {
    ok: true,
    value: { campaignId, sessionId, requestId, visibleMs, path, locale },
  };
}

export function validateAdEventInput(body: unknown):
  | {
      ok: true;
      value: {
        campaignId: string;
        kind: "hover" | "click" | "dismissed" | "time_in_view";
        sessionId: string;
        requestId: string;
        durationMs: number | null;
        path: string;
        locale: string;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object")
    return { ok: false, error: "invalid_body" };
  const data = body as Record<string, unknown>;
  const campaignId = cleanText(data.campaignId, 80);
  const sessionId = cleanText(data.sessionId, 120);
  const requestId = cleanText(data.requestId, 120);
  const path = cleanText(data.path, 512);
  const locale = cleanText(data.locale, 8);
  const kind = data.kind;
  const durationMs =
    typeof data.durationMs === "number"
      ? Math.max(0, Math.floor(data.durationMs))
      : null;

  if (!campaignId) return { ok: false, error: "campaign_id_required" };
  if (
    kind !== "hover" &&
    kind !== "click" &&
    kind !== "dismissed" &&
    kind !== "time_in_view"
  ) {
    return { ok: false, error: "kind_invalid" };
  }
  if (!sessionId) return { ok: false, error: "session_id_required" };
  if (!requestId) return { ok: false, error: "request_id_required" };
  if (!path?.startsWith("/")) return { ok: false, error: "path_invalid" };
  if (!locale) return { ok: false, error: "locale_required" };

  return {
    ok: true,
    value: { campaignId, kind, sessionId, requestId, durationMs, path, locale },
  };
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
