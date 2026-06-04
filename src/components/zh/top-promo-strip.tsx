import { getLatestApprovedPets } from "@/lib/pets";

import { type StripItem, TopPromoStripClient } from "./top-promo-strip-client";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

function classifyFreshness(approvedAt: string | null): StripItem["freshness"] {
  if (!approvedAt) return "featured";
  const age = Date.now() - new Date(approvedAt).getTime();
  if (age < ONE_DAY_MS) return "just-dropped";
  if (age < ONE_WEEK_MS) return "this-week";
  return "featured";
}

export async function TopPromoStrip() {
  let items: StripItem[] = [];

  try {
    const pets = await getLatestApprovedPets(5);
    items = pets.map((p) => ({
      slug: p.slug,
      name: p.displayName,
      freshness: classifyFreshness(p.approvedAt),
    }));
  } catch {
    // empty array → client renders fallback
  }

  return <TopPromoStripClient items={items} />;
}
