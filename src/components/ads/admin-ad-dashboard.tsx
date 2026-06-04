import Link from "next/link";

import { getTranslations } from "next-intl/server";

import {
  ADMIN_AD_CAMPAIGN_STATUSES,
  type AdminAdCampaignFilters,
  type AdminAdCampaignStatusFilter,
} from "@/lib/ads/admin-filters";
import { formatUsd } from "@/lib/ads/packages";
import type {
  AdminAdCampaignOverview,
  AdminAdvertiserCampaign,
} from "@/lib/ads/queries";
import { withLocale } from "@/lib/locale-routing";

import {
  AdCampaignCard,
  formatAdDuration,
  formatAdMetricNumber,
} from "@/components/ads/ad-campaign-card";

import type { Locale } from "@/i18n/config";

const STATUS_OPTIONS: AdminAdCampaignStatusFilter[] = [
  "all",
  ...ADMIN_AD_CAMPAIGN_STATUSES,
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

export async function AdminAdDashboard({
  overview,
  campaigns,
  totalCount,
  filters,
  locale,
}: {
  overview: AdminAdCampaignOverview;
  campaigns: AdminAdvertiserCampaign[];
  totalCount: number;
  filters: AdminAdCampaignFilters;
  locale: Locale;
}) {
  const t = await getTranslations("admin.campaigns");
  const tAd = await getTranslations("advertise.dashboard");
  const clearHref = withLocale("/admin/campaigns", locale);
  const cardLabels = {
    progress: tAd("progress"),
    destination: tAd("destination"),
    removedFallback: tAd("removedFallback"),
    created: (date: string) => tAd("created", { date }),
    activated: (date: string) => tAd("activated", { date }),
    metrics: {
      package: tAd("metrics.package"),
      served: tAd("metrics.served"),
      remaining: tAd("metrics.remaining"),
      spend: tAd("metrics.spend"),
      clicks: tAd("metrics.clicks"),
      ctr: tAd("metrics.ctr"),
      avgTime: tAd("metrics.avgTime"),
    },
    chartWindows: {
      eightHours: tAd("chart.windows.eightHours"),
      day: tAd("chart.windows.day"),
      week: tAd("chart.windows.week"),
      month: tAd("chart.windows.month"),
    },
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-16 md:px-8">
      <header>
        <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-2">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("overview.totalCampaigns")}
          value={formatAdMetricNumber(overview.totalCampaigns)}
          detail={t("overview.totalSpend", {
            value: formatUsd(overview.totalSpendCents),
          })}
        />
        <StatCard
          label={t("overview.active")}
          value={formatAdMetricNumber(overview.activeCampaigns)}
          detail={t("overview.statusDetail", {
            paused: formatAdMetricNumber(overview.pausedCampaigns),
            exhausted: formatAdMetricNumber(overview.exhaustedCampaigns),
          })}
        />
        <StatCard
          label={t("overview.pendingPayment")}
          value={formatAdMetricNumber(overview.pendingPaymentCampaigns)}
          detail={t("overview.deletedDetail", {
            count: formatAdMetricNumber(overview.deletedCampaigns),
          })}
        />
        <StatCard
          label={t("overview.inventory")}
          value={formatAdMetricNumber(overview.totalPackageViews)}
          detail={t("overview.servedDetail", {
            value: formatAdMetricNumber(overview.totalViewsServed),
          })}
        />
        <StatCard
          label={t("overview.impressions")}
          value={formatAdMetricNumber(overview.totalImpressions)}
          detail={t("overview.rawImpressionsDetail")}
        />
        <StatCard
          label={t("overview.clicks")}
          value={formatAdMetricNumber(overview.clicks)}
          detail={t("overview.ctr", { value: `${overview.ctr.toFixed(2)}%` })}
        />
        <StatCard
          label={t("overview.hovers")}
          value={formatAdMetricNumber(overview.hovers)}
          detail={t("overview.dismissals", {
            value: formatAdMetricNumber(overview.dismissals),
          })}
        />
        <StatCard
          label={t("overview.avgTime")}
          value={formatAdDuration(overview.avgTimeInViewMs)}
          detail={t("overview.avgTimeDetail")}
        />
      </div>

      <form
        action={clearHref}
        className="rounded-3xl border border-border-base bg-surface/80 p-4 backdrop-blur md:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[180px_1fr_140px_auto_auto] md:items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("filters.status")}
            <select
              name="status"
              defaultValue={filters.status}
              className="h-10 rounded-2xl border border-border-base bg-background px-3 text-sm text-foreground outline-none transition focus:border-brand"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("filters.search")}
            <input
              name="q"
              defaultValue={filters.q}
              placeholder={t("filters.searchPlaceholder")}
              className="h-10 rounded-2xl border border-border-base bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-3 focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("filters.limit")}
            <select
              name="limit"
              defaultValue={String(filters.limit)}
              className="h-10 rounded-2xl border border-border-base bg-background px-3 text-sm text-foreground outline-none transition focus:border-brand"
            >
              {LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-inverse px-4 text-sm font-medium text-on-inverse transition hover:bg-inverse-hover"
          >
            {t("filters.apply")}
          </button>
          <Link
            href={clearHref}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border-base bg-background px-4 text-sm font-medium text-foreground transition hover:border-brand/60 hover:text-brand"
          >
            {t("filters.clear")}
          </Link>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-3 uppercase">
          {t("showing", {
            shown: formatAdMetricNumber(campaigns.length),
            total: formatAdMetricNumber(totalCount),
          })}
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border-base bg-surface/60 p-10 text-center text-sm text-muted-2">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-5">
          {campaigns.map((campaign) => (
            <AdCampaignCard
              key={campaign.id}
              campaign={campaign}
              labels={cardLabels}
              ownerDetails={{
                title: t("owner.title"),
                userIdLabel: t("owner.userId"),
                contactEmailLabel: t("owner.contactEmail"),
                companyLabel: t("owner.company"),
                userId: campaign.userId,
                contactEmail: campaign.contactEmail,
                companyName: campaign.companyName,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-border-base bg-surface/80 p-4 backdrop-blur">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-2">{detail}</p>
    </article>
  );
}
