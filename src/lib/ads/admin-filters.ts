export const ADMIN_AD_CAMPAIGN_STATUSES = [
  "pending_payment",
  "active",
  "exhausted",
  "paused",
  "deleted",
] as const;

export type AdminAdCampaignStatus = (typeof ADMIN_AD_CAMPAIGN_STATUSES)[number];

export type AdminAdCampaignStatusFilter = AdminAdCampaignStatus | "all";

export type AdminAdCampaignFilters = {
  status: AdminAdCampaignStatusFilter;
  q: string;
  limit: number;
};

export type AdminAdCampaignSearchParams = Record<
  string,
  string | string[] | undefined
>;

export const DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT = 25;
export const MAX_ADMIN_AD_CAMPAIGN_LIMIT = 100;

const STATUS_VALUES = new Set<string>(["all", ...ADMIN_AD_CAMPAIGN_STATUSES]);

export function parseAdminAdCampaignFilters(
  searchParams: AdminAdCampaignSearchParams = {},
): AdminAdCampaignFilters {
  const rawStatus = getFirst(searchParams.status) ?? "all";
  const status = STATUS_VALUES.has(rawStatus)
    ? (rawStatus as AdminAdCampaignStatusFilter)
    : "all";
  const q = (getFirst(searchParams.q) ?? "").trim();
  const limit = clampLimit(getFirst(searchParams.limit));

  return { status, q, limit };
}

function getFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function clampLimit(value: string | undefined): number {
  if (!value) return DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_ADMIN_AD_CAMPAIGN_LIMIT);
}
