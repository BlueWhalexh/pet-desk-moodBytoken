import Link from "next/link";

import {
  getAudienceCounts,
  listCampaignBatches,
} from "@/lib/admin/mailing-queries";

import { localizePath } from "@/i18n/config";

export const metadata = {
  title: "Mailing | Petdex Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MailingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [batches, audience] = await Promise.all([
    listCampaignBatches(),
    getAudienceCounts(),
  ]);

  const newPath = localizePath(locale, "/admin/mailing/new");
  const subsPath = localizePath(locale, "/admin/mailing/subscribers");

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
            Admin · Mailing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Broadcasts
          </h1>
          <p className="mt-1 text-sm text-muted-3">
            {audience.optedIn} opted-in · {audience.optedOut} opted-out ·{" "}
            {audience.total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={subsPath}
            className="inline-flex h-10 items-center rounded-full border border-border-base px-4 text-sm font-medium hover:bg-surface"
          >
            Subscribers
          </Link>
          <Link
            href={newPath}
            className="inline-flex h-10 items-center rounded-full bg-inverse px-4 text-sm font-medium text-on-inverse hover:bg-inverse-hover"
          >
            New broadcast
          </Link>
        </div>
      </header>

      {batches.length === 0 ? (
        <div className="rounded-2xl border border-border-base bg-surface/76 p-6 backdrop-blur">
          <p className="text-base font-semibold">No broadcasts yet.</p>
          <p className="mt-2 text-sm leading-6 text-muted-2">
            When you send a campaign from{" "}
            <Link
              href={newPath}
              className="underline underline-offset-4 hover:text-foreground"
            >
              New broadcast
            </Link>
            , it will appear here with delivery + open metrics.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-base bg-surface/76 backdrop-blur">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left text-xs text-muted-3 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Batch</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3 font-medium">Delivered</th>
                <th className="px-5 py-3 font-medium">Opened</th>
                <th className="px-5 py-3 font-medium">Bounced</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.batchKey}
                  className="border-b border-border-base last:border-b-0"
                >
                  <td className="px-5 py-3 font-mono text-xs">{b.batchKey}</td>
                  <td className="px-5 py-3">{b.campaign}</td>
                  <td className="px-5 py-3">
                    {b.sent}/{b.total}
                  </td>
                  <td className="px-5 py-3">{b.delivered}</td>
                  <td className="px-5 py-3">{b.opened}</td>
                  <td className="px-5 py-3">{b.bounced}</td>
                  <td className="px-5 py-3 text-muted-3">
                    {b.firstSentAt
                      ? new Date(b.firstSentAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
