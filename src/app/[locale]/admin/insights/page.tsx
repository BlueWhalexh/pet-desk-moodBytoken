import Link from "next/link";

import { Heart, Plus, Star, TerminalSquare, Users } from "lucide-react";

import {
  getActiveCreators,
  getCurrentlyFeatured,
  getHiddenHits,
  getOverviewStats,
  getQueueDepth,
  getSubmissionVelocity,
} from "@/lib/admin-insights";

import { AdminFeatureToggle } from "@/components/admin-feature-toggle";
import { AdminVelocityChart } from "@/components/admin-velocity-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights | Petdex admin",
  robots: { index: false, follow: false },
};

export default async function AdminInsightsPage() {
  const [
    overview,
    queueDepth,
    velocity,
    hiddenHits,
    activeCreators,
    currentlyFeatured,
  ] = await Promise.all([
    getOverviewStats(),
    getQueueDepth(),
    getSubmissionVelocity(24),
    getHiddenHits(8),
    getActiveCreators(7, 12),
    getCurrentlyFeatured(24),
  ]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-16 md:px-8">
      <header>
        <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
          Insights
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Operational dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-2">
          Numbers Vercel and Clerk don't surface: submission throughput, queue
          health, hidden hits in the catalog, and active creators.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Approved"
          value={overview.totalApproved}
          delta={`+${overview.approvedLast24h} last 24h`}
          icon={<Plus className="size-3.5" />}
        />
        <StatCard
          label="Active creators"
          value={overview.totalCreators}
          delta={`${activeCreators.length} shipped this week`}
          icon={<Users className="size-3.5" />}
        />
        <StatCard
          label="Total likes"
          value={overview.totalLikes}
          delta={`${overview.totalInstalls.toLocaleString()} total installs`}
          icon={<Heart className="size-3.5" />}
        />
        <StatCard
          label="Approved last 7d"
          value={overview.approvedLast7d}
          delta={`${overview.totalRejected} rejected lifetime`}
          icon={<TerminalSquare className="size-3.5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
            Queue depth
          </p>
          <CardTitle className="text-xl md:text-2xl">
            {overview.totalPending === 1
              ? "1 submission waiting"
              : `${overview.totalPending} submissions waiting`}
          </CardTitle>
          <CardAction>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open queue →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <QueueRow
              label="New submissions"
              count={queueDepth.pending}
              ageMinutes={queueDepth.oldestPendingAgeMinutes}
              tone="warning"
            />
            <QueueRow
              label="Pending edits"
              count={queueDepth.pendingEdits}
              ageMinutes={queueDepth.oldestPendingEditAgeMinutes}
              tone="default"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
            Submission velocity
          </p>
          <CardTitle className="text-xl md:text-2xl">
            Hourly submissions, last 24 hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminVelocityChart data={velocity} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
            Hidden hits
          </p>
          <CardTitle className="text-xl md:text-2xl">
            High install-to-like ratio, not yet featured
          </CardTitle>
          <CardDescription>
            Pets quietly converting installs without much heart pressure.
            Promote-worthy candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hiddenHits.length === 0 ? (
            <p className="text-sm text-muted-3">
              Nothing crossed the install threshold yet.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {hiddenHits.map((pet) => {
                const ratio =
                  pet.likeCount > 0
                    ? (pet.installCount / pet.likeCount).toFixed(2)
                    : `${pet.installCount}.0`;
                return (
                  <li
                    key={pet.slug}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex flex-col">
                      <Link
                        href={`/pets/${pet.slug}`}
                        className="font-medium text-foreground transition hover:text-brand"
                      >
                        {pet.displayName}
                      </Link>
                      <span className="font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
                        {pet.slug}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-muted-2 uppercase">
                      <span className="inline-flex items-center gap-1">
                        <TerminalSquare className="size-3" />
                        {pet.installCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3" />
                        {pet.likeCount}
                      </span>
                      <Badge variant="secondary">{ratio}× ratio</Badge>
                      <AdminFeatureToggle
                        petId={pet.id}
                        initialFeatured={false}
                        petName={pet.displayName}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
            <Star className="size-3 fill-current" />
            Currently featured
          </p>
          <CardTitle className="text-xl md:text-2xl">
            {currentlyFeatured.length === 0
              ? "No pets featured"
              : currentlyFeatured.length === 1
                ? "1 pet featured"
                : `${currentlyFeatured.length} pets featured`}
          </CardTitle>
          <CardDescription>
            Featured pets land in the home hero strip and the curated sort's top
            tier. Demote stale ones to free up the slot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentlyFeatured.length === 0 ? (
            <p className="text-sm text-muted-3">
              Promote a hidden hit above or flip the star on a pet from the
              queue.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {currentlyFeatured.map((pet) => (
                <li
                  key={pet.slug}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex flex-col">
                    <Link
                      href={`/pets/${pet.slug}`}
                      className="font-medium text-foreground transition hover:text-brand"
                    >
                      {pet.displayName}
                    </Link>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
                      {pet.slug}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-muted-2 uppercase">
                    <span className="inline-flex items-center gap-1">
                      <TerminalSquare className="size-3" />
                      {pet.installCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" />
                      {pet.likeCount}
                    </span>
                    <AdminFeatureToggle
                      petId={pet.id}
                      initialFeatured={true}
                      petName={pet.displayName}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-brand uppercase">
            Active creators
          </p>
          <CardTitle className="text-xl md:text-2xl">
            Shipped a submission in the last 7 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCreators.length === 0 ? (
            <p className="text-sm text-muted-3">
              No creator activity this week.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {activeCreators.map((creator) => (
                <li
                  key={creator.ownerId}
                  className="flex items-center justify-between rounded-2xl bg-background/40 px-3 py-2 text-sm"
                >
                  <span className="truncate text-foreground">
                    {creator.creditName ?? `${creator.ownerId.slice(-8)}…`}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {creator.approvedCount > 0
                      ? `${creator.approvedCount} approved`
                      : `${formatRelative(creator.lastSubmittedAt)} ago`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: number;
  delta?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
          {icon}
          {label}
        </p>
        <CardTitle className="font-mono text-3xl tracking-tight">
          {value.toLocaleString()}
        </CardTitle>
        {delta ? <CardDescription>{delta}</CardDescription> : null}
      </CardHeader>
    </Card>
  );
}

function QueueRow({
  label,
  count,
  ageMinutes,
  tone,
}: {
  label: string;
  count: number;
  ageMinutes: number | null;
  tone: "warning" | "default";
}) {
  const isStale =
    tone === "warning" &&
    count > 0 &&
    ageMinutes != null &&
    ageMinutes > 24 * 60;
  const tint = isStale
    ? "border-chip-warning-fg/30 bg-chip-warning-bg text-chip-warning-fg"
    : "border-border-base bg-background/40 text-foreground";
  return (
    <div className={`rounded-2xl border px-3 py-3 ${tint}`}>
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-70">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">
        {count}
      </p>
      <p className="mt-1 text-xs opacity-80">
        {count === 0
          ? "All caught up"
          : ageMinutes == null
            ? "Oldest unknown"
            : `Oldest ${formatAge(ageMinutes)}`}
      </p>
    </div>
  );
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.round(hr / 24);
  return `${d}d`;
}
