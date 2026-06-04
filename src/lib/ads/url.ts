import { R2_PUBLIC_BASE } from "@/lib/r2";

export type AdUtmFields = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
};

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
];

export function validateAdDestinationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isAllowedAdImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const base = new URL(R2_PUBLIC_BASE);
    return (
      url.protocol === "https:" &&
      url.host === base.host &&
      url.pathname.startsWith("/ads/")
    );
  } catch {
    return false;
  }
}

export function buildAdClickUrl(
  destinationUrl: string,
  utm: AdUtmFields,
): string {
  const url = new URL(destinationUrl);
  const entries: Array<[keyof AdUtmFields, string]> = [
    ["utmSource", "utm_source"],
    ["utmMedium", "utm_medium"],
    ["utmCampaign", "utm_campaign"],
    ["utmTerm", "utm_term"],
    ["utmContent", "utm_content"],
  ];
  const customUtm = entries.some(([key]) => cleanUtmValue(utm[key]));

  if (!customUtm) {
    if (!url.searchParams.has("utm_source"))
      url.searchParams.set("utm_source", "petdex");
    return url.toString();
  }

  for (const [key, param] of entries) {
    const value = cleanUtmValue(utm[key]);
    if (value) url.searchParams.set(param, value);
  }
  return url.toString();
}

export function cleanUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
}
