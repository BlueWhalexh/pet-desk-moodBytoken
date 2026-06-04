import { listSubscribers } from "@/lib/admin/mailing-queries";

export const metadata = {
  title: "Subscribers | Petdex Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const search = sp.q?.trim() ?? "";

  const { rows, total } = await listSubscribers({
    search: search || undefined,
    limit: PAGE_SIZE,
    offset,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
          Admin · Mailing · Subscribers
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Subscribers
        </h1>
        <p className="mt-1 text-sm text-muted-3">
          {total} total · page {page} of {totalPages}
        </p>
      </header>

      <form action="" method="GET" className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="search email…"
          className="h-10 w-72 rounded-full border border-border-base bg-transparent px-4 text-sm"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-full border border-border-base px-4 text-sm font-medium hover:bg-surface"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border-base bg-surface/76 backdrop-blur">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-base text-left text-xs text-muted-3 uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Locale</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Unsub at</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-muted-3"
                >
                  No matches.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-border-base last:border-b-0"
                >
                  <td className="px-5 py-3 break-all">{r.email}</td>
                  <td className="px-5 py-3 font-mono text-xs">{r.locale}</td>
                  <td className="px-5 py-3">
                    {r.unsubscribedMarketing ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-destructive/10 px-2 text-xs text-destructive">
                        opted-out
                      </span>
                    ) : (
                      <span className="inline-flex h-6 items-center rounded-full bg-brand-tint px-2 text-xs text-brand-deep">
                        opted-in
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-3">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-muted-3">
                    {r.unsubscribedAt
                      ? new Date(r.unsubscribedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <a
            href={`?q=${encodeURIComponent(search)}&page=${Math.max(1, page - 1)}`}
            className={`underline-offset-4 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:underline"}`}
          >
            ← Prev
          </a>
          <a
            href={`?q=${encodeURIComponent(search)}&page=${Math.min(totalPages, page + 1)}`}
            className={`underline-offset-4 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:underline"}`}
          >
            Next →
          </a>
        </div>
      ) : null}
    </section>
  );
}
