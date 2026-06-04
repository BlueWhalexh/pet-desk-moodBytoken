import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { updateOwnedAdCampaignCreative } from "@/lib/ads/queries";
import { validateAdCampaignUpdateInput } from "@/lib/ads/validation";
import { adCampaignEditRatelimit } from "@/lib/ratelimit";
import { requireSameOrigin } from "@/lib/same-origin";

export const runtime = "nodejs";

type Params = { id: string };

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

  const { id } = await ctx.params;
  const lim = await adCampaignEditRatelimit.limit(`${userId}:${id}`);
  if (!lim.success) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: lim.reset },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = validateAdCampaignUpdateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await updateOwnedAdCampaignCreative({
    id,
    userId,
    ...parsed.value,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
