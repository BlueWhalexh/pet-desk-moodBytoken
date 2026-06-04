import { count } from "drizzle-orm";

import { getAudienceCounts } from "@/lib/admin/mailing-queries";
import { db, schema } from "@/lib/db/client";

import { ComposeForm } from "./compose-form";

export const metadata = {
  title: "New broadcast | Petdex Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewBroadcastPage() {
  const [audience, collectionsCount] = await Promise.all([
    getAudienceCounts(),
    db.select({ c: count() }).from(schema.petCollections),
  ]);
  const collectionsReady = Number(collectionsCount[0]?.c ?? 0) > 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-[0.22em] text-brand uppercase">
          Admin · Mailing · New
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New broadcast
        </h1>
        <p className="mt-1 text-sm text-muted-3">
          Template: collections-drop · {audience.optedIn} opted-in
        </p>
      </header>

      <ComposeForm
        optedIn={audience.optedIn}
        byLocale={audience.byLocale}
        collectionsReady={collectionsReady}
      />
    </section>
  );
}
