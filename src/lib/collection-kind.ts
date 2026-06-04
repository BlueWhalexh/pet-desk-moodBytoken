// Maps a collection slug to a coarse kind so the UI can group/tag.
// Patterns we seed:
//   - franchise-<slug>            → "franchise" (Pokemon, BanG Dream)
//   - category-<slug>             → "category" (Cats, Developer)
//   - category-<a>-<b>             → "category-sub" (Cozy Cat)
// Anything else is "other" (legacy hand-curated collections).

export type CollectionKind =
  | "franchise"
  | "category"
  | "category-sub"
  | "other";

export function collectionKind(slug: string): CollectionKind {
  if (slug.startsWith("franchise-")) return "franchise";
  if (slug.startsWith("category-")) {
    const rest = slug.slice("category-".length);
    return rest.includes("-") ? "category-sub" : "category";
  }
  return "other";
}

export const KIND_SLUG: Record<CollectionKind, string> = {
  franchise: "franchise",
  category: "category",
  "category-sub": "categorySub",
  other: "other",
};
