import { desc, sql as dsql } from "drizzle-orm";

import { db, schema } from "@/lib/db/client";

import { AdminManifestByDayChart } from "@/components/admin-manifest-by-day-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Petdex Admin · Manifest",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminManifestPage() {
  // Last 7 days, basic shape: total fetches, by-day, by-country, by-UA,
  // and the loudest IPs. Anything older than 7d gets pruned periodically
  // (TODO when this becomes noisy).
  const totalRows = await db
    .select({ c: dsql<number>`COUNT(*)::int` })
    .from(schema.manifestFetches);
  const total = totalRows[0]?.c ?? 0;

  const last24Rows = await db
    .select({ c: dsql<number>`COUNT(*)::int` })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '24 hours'`,
    );
  const last24 = last24Rows[0]?.c ?? 0;

  const distinctIpsRows = await db
    .select({
      c: dsql<number>`COUNT(DISTINCT ${schema.manifestFetches.ipHash})::int`,
    })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '24 hours'`,
    );
  const distinct24 = distinctIpsRows[0]?.c ?? 0;

  const byDay = await db
    .select({
      day: dsql<string>`to_char(date_trunc('day', ${schema.manifestFetches.fetchedAt}), 'YYYY-MM-DD')`,
      count: dsql<number>`COUNT(*)::int`,
      slim: dsql<number>`COUNT(*) FILTER (WHERE variant = 'slim')::int`,
      full: dsql<number>`COUNT(*) FILTER (WHERE variant = 'full')::int`,
    })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '14 days'`,
    )
    .groupBy(dsql`date_trunc('day', ${schema.manifestFetches.fetchedAt})`)
    .orderBy(
      desc(dsql`date_trunc('day', ${schema.manifestFetches.fetchedAt})`),
    );

  const byCountry = await db
    .select({
      country: schema.manifestFetches.country,
      count: dsql<number>`COUNT(*)::int`,
    })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '7 days'`,
    )
    .groupBy(schema.manifestFetches.country)
    .orderBy(desc(dsql`COUNT(*)`))
    .limit(10);

  const topIps = await db
    .select({
      ipHash: schema.manifestFetches.ipHash,
      count: dsql<number>`COUNT(*)::int`,
      lastUa: dsql<
        string | null
      >`(ARRAY_AGG(${schema.manifestFetches.userAgent} ORDER BY ${schema.manifestFetches.fetchedAt} DESC))[1]`,
      lastCountry: dsql<
        string | null
      >`(ARRAY_AGG(${schema.manifestFetches.country} ORDER BY ${schema.manifestFetches.fetchedAt} DESC))[1]`,
      lastSeen: dsql<Date>`MAX(${schema.manifestFetches.fetchedAt})`,
    })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '7 days'`,
    )
    .groupBy(schema.manifestFetches.ipHash)
    .orderBy(desc(dsql`COUNT(*)`))
    .limit(20);

  const topUserAgents = await db
    .select({
      userAgent: schema.manifestFetches.userAgent,
      count: dsql<number>`COUNT(*)::int`,
    })
    .from(schema.manifestFetches)
    .where(
      dsql`${schema.manifestFetches.fetchedAt} > NOW() - INTERVAL '7 days'`,
    )
    .groupBy(schema.manifestFetches.userAgent)
    .orderBy(desc(dsql`COUNT(*)`))
    .limit(15);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 pb-12 md:px-8 md:pb-16">
      <header>
        <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
          Telemetry
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Manifest fetches
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-2">
          Who's pulling /api/manifest. IPs are SHA-256 hashed daily so they
          group within a day but can't be reversed.
        </p>
      </header>

      {/* Top-level numbers */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total (all time)" value={total.toLocaleString()} />
        <Stat label="Last 24h" value={last24.toLocaleString()} />
        <Stat label="Distinct IPs (24h)" value={distinct24.toLocaleString()} />
      </div>

      {/* By day chart */}
      {byDay.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
              By day · last 14d
            </p>
            <CardTitle className="text-xl md:text-2xl">
              Daily manifest fetches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminManifestByDayChart data={byDay} />
          </CardContent>
        </Card>
      ) : null}

      {/* Top IPs (loudest) — likely scrapers if count is way out of band. */}
      {topIps.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
              Loudest IPs · last 7d
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-3 uppercase">
                    <th className="pb-2 font-normal">IP hash</th>
                    <th className="pb-2 font-normal">Country</th>
                    <th className="pb-2 font-normal">Last UA</th>
                    <th className="pb-2 pr-2 text-right font-normal">
                      Fetches
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topIps.map((row) => (
                    <tr
                      key={row.ipHash}
                      className="border-t border-black/[0.06] align-top dark:border-white/[0.06]"
                    >
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-2">
                        {row.ipHash.slice(0, 12)}…
                      </td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-sm leading-none">
                            {countryFlag(row.lastCountry)}
                          </span>
                          {row.lastCountry ?? "—"}
                        </span>
                      </td>
                      <td className="max-w-[24rem] truncate py-2 pr-3 text-xs text-muted-2">
                        {row.lastUa ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono text-xs font-semibold text-foreground">
                        {row.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Top UAs */}
      {topUserAgents.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
              Top user-agents · last 7d
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {topUserAgents.map((u) => (
                <li
                  key={u.userAgent ?? "none"}
                  className="flex items-baseline gap-3 border-t border-black/[0.04] pt-1.5 first:border-0 first:pt-0 dark:border-white/[0.04]"
                >
                  <span className="w-16 shrink-0 text-right font-mono text-[11px] font-semibold text-muted-2">
                    {u.count.toLocaleString()}
                  </span>
                  <span className="truncate text-xs text-muted-2">
                    {u.userAgent ?? <em className="text-muted-4">no UA</em>}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* By country */}
      {byCountry.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
              By country · last 7d
            </p>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {byCountry.map((c) => (
                <li
                  key={c.country ?? "none"}
                  className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">
                      {countryFlag(c.country)}
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-muted-2 uppercase">
                      {c.country ?? "—"}
                    </span>
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {c.count.toLocaleString()}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
          {label}
        </p>
        <CardTitle className="font-mono text-2xl tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

// ISO-3166 alpha-2 -> Unicode regional-indicator pair. The flag glyph
// is composed of the two letters offset by 0x1F1A5 from their ASCII
// codepoints. Renders natively on every modern OS (macOS, iOS, Android,
// most Linux distros), Windows uses ZZ-style fallback but still prints
// the country code so we keep the label next to it. Returns a globe
// when the input is null/missing/non-2-char.
function countryFlag(code: string | null): string {
  if (!code || code.length !== 2 || !/^[a-z]{2}$/i.test(code)) return "🌐";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) + 0x1f1a5,
    upper.charCodeAt(1) + 0x1f1a5,
  );
}
