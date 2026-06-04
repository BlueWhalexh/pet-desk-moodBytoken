import {
  type AdminAdCampaignSearchParams,
  parseAdminAdCampaignFilters,
} from "@/lib/ads/admin-filters";
import {
  getAdminAdCampaignOverview,
  getAdminAdCampaigns,
} from "@/lib/ads/queries";

import { AdminAdDashboard } from "@/components/ads/admin-ad-dashboard";

import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Petdex Admin · Campaigns",
  robots: { index: false, follow: false },
};

export default async function AdminCampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AdminAdCampaignSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const filters = parseAdminAdCampaignFilters(resolvedSearchParams);
  const [overview, campaignList] = await Promise.all([
    getAdminAdCampaignOverview(),
    getAdminAdCampaigns(filters),
  ]);

  return (
    <AdminAdDashboard
      overview={overview}
      campaigns={campaignList.campaigns}
      totalCount={campaignList.totalCount}
      filters={filters}
      locale={locale as Locale}
    />
  );
}
