// Pure-JS batch key helpers. Importable from client components — no
// DB or Node-only deps. The server-side query that lists available
// batches lives in dex-batch.server.ts so client bundles don't drag
// the Drizzle client.

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});

export function getBatchKey(approvedAt: Date): string {
  return approvedAt.toISOString().slice(0, 7);
}

export function formatBatchLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return `Class of ${MONTH_LABEL.format(date)} ${year}`;
}
