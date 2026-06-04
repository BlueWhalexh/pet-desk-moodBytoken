import "server-only";

// Cap on personal (unfeatured) collections per creator. Featured ones
// are admin-curated promotions and do not count.
export const MAX_OWNER_COLLECTIONS = 10;

// Personal collections are open to every signed-in user. The endpoint
// still validates ownership of the pets being added and the cap, so
// the gate exists at the action level (you can only edit your own
// collection items, you can only create up to MAX_OWNER_COLLECTIONS).
//
// Kept as an async function so existing callers (`await canManage...`)
// don't have to change shape.
export async function canManageCreatorCollections(
  userId: string | null | undefined,
): Promise<boolean> {
  return Boolean(userId);
}
