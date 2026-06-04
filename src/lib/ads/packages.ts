export const AD_PACKAGES = {
  impressions_5000: {
    views: 5000,
    priceCents: 5000,
    label: "5,000 impressions",
  },
  impressions_25000: {
    views: 25_000,
    priceCents: 25_000,
    label: "25,000 impressions",
  },
  impressions_100000: {
    views: 100_000,
    priceCents: 100_000,
    label: "100,000 impressions",
  },
} as const;

export type AdPackageId = keyof typeof AD_PACKAGES;

export function isAdPackageId(value: unknown): value is AdPackageId {
  return typeof value === "string" && value in AD_PACKAGES;
}

export function formatUsd(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}
