import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { canManageCreatorCollections } from "@/lib/collection-access";
import { revalidateCollectionTags } from "@/lib/db/cached-aggregates";
import { db, schema } from "@/lib/db/client";
import { requireSameOrigin } from "@/lib/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 280;

type Params = { id: string };

type PatchBody = {
  title?: string;
  description?: string;
  externalUrl?: string | null;
  coverPetSlug?: string | null;
  petSlugs?: string[];
};

// Edit one of the caller's personal collections. Featured/admin
// collections are NOT editable here even if owner_id matches — those
// are admin-curated.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<Params> },
): Promise<Response> {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await canManageCreatorCollections(userId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const collection = await db.query.petCollections.findFirst({
    where: eq(schema.petCollections.id, id),
  });
  if (!collection || collection.ownerId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (collection.featured) {
    return NextResponse.json(
      { error: "featured_not_editable" },
      { status: 403 },
    );
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Partial<typeof schema.petCollections.$inferInsert> = {};

  if (body.title !== undefined) {
    const t = body.title.trim();
    if (t.length < 2 || t.length > MAX_TITLE) {
      return NextResponse.json({ error: "title_length" }, { status: 400 });
    }
    patch.title = t;
  }

  if (body.description !== undefined) {
    const d = body.description.trim();
    if (d.length > MAX_DESCRIPTION) {
      return NextResponse.json(
        { error: "description_length" },
        { status: 400 },
      );
    }
    patch.description = d;
  }

  if (body.externalUrl !== undefined) {
    const u = normalizeExternalUrl(body.externalUrl);
    if (u === false) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    patch.externalUrl = u;
  }

  if (body.petSlugs !== undefined) {
    const approvedPets = await db
      .select({ slug: schema.submittedPets.slug })
      .from(schema.submittedPets)
      .where(
        and(
          eq(schema.submittedPets.ownerId, userId),
          eq(schema.submittedPets.status, "approved"),
        ),
      );
    const allowedSlugs = new Set(approvedPets.map((p) => p.slug));
    const petSlugs = unique(body.petSlugs).filter((s) => allowedSlugs.has(s));

    await db
      .delete(schema.petCollectionItems)
      .where(eq(schema.petCollectionItems.collectionId, id));
    if (petSlugs.length > 0) {
      await db.insert(schema.petCollectionItems).values(
        petSlugs.map((petSlug, index) => ({
          collectionId: id,
          petSlug,
          position: index + 1,
        })),
      );
    }

    const cover =
      body.coverPetSlug && petSlugs.includes(body.coverPetSlug)
        ? body.coverPetSlug
        : (petSlugs[0] ?? null);
    patch.coverPetSlug = cover;
  } else if (body.coverPetSlug !== undefined) {
    // Cover-only update — verify the slug is currently in the collection.
    const items = await db
      .select({ slug: schema.petCollectionItems.petSlug })
      .from(schema.petCollectionItems)
      .where(eq(schema.petCollectionItems.collectionId, id));
    const set = new Set(items.map((r) => r.slug));
    if (body.coverPetSlug && !set.has(body.coverPetSlug)) {
      return NextResponse.json(
        { error: "cover_not_in_collection" },
        { status: 400 },
      );
    }
    patch.coverPetSlug = body.coverPetSlug ?? null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  patch.updatedAt = new Date();
  await db
    .update(schema.petCollections)
    .set(patch)
    .where(eq(schema.petCollections.id, id));

  await revalidateCollectionTags(collection.slug);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<Params> },
): Promise<Response> {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const collection = await db.query.petCollections.findFirst({
    where: eq(schema.petCollections.id, id),
  });
  if (!collection || collection.ownerId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (collection.featured) {
    return NextResponse.json(
      { error: "featured_not_deletable" },
      { status: 403 },
    );
  }

  await db
    .delete(schema.petCollections)
    .where(eq(schema.petCollections.id, id));

  await revalidateCollectionTags(collection.slug);

  return NextResponse.json({ ok: true });
}

function unique(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const slug = value.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

function normalizeExternalUrl(
  value: string | null | undefined,
): string | null | false {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.length > 300) return false;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return url.toString();
  } catch {
    return false;
  }
}
