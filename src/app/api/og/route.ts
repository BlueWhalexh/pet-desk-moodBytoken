// Root OG image proxy. Crawlers fetch this URL and we choose the asset
// per their User-Agent:
//   - WeChat in-app (MicroMessenger): serve 1:1 og-wechat.png so the link
//     preview renders without cropping the wordmark
//   - Everyone else: serve the standard 1.91:1 og.png
//
// This keeps the [locale] tree fully static (its generateMetadata always
// emits the same `og:image` URL — `/api/og`). Without this route, reading
// `headers()` inside the layout's generateMetadata would force every
// route under [locale] to render at request time just to swap the OG.
//
// Crawlers don't follow redirects reliably, so we stream the chosen file
// instead of returning a 302. Cache for an hour at the edge — long enough
// to absorb most preview crawlers, short enough to roll a new banner.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_HEADER = "public, max-age=3600, s-maxage=3600";

function pickAsset(userAgent: string): {
  filename: string;
  width: number;
  height: number;
} {
  if (userAgent.includes("MicroMessenger")) {
    return { filename: "og-wechat.png", width: 1200, height: 1200 };
  }
  return { filename: "og.png", width: 1200, height: 630 };
}

export async function GET(req: Request): Promise<Response> {
  const ua = req.headers.get("user-agent") ?? "";
  const asset = pickAsset(ua);

  let buf: Buffer;
  try {
    buf = await readFile(join(process.cwd(), "public", asset.filename));
  } catch {
    return new NextResponse("not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": CACHE_HEADER,
      "x-petdex-og-variant": asset.filename,
      "x-petdex-og-width": String(asset.width),
      "x-petdex-og-height": String(asset.height),
      // Hint to caches/CDN that we vary the response by client UA so
      // mainland WeChat previews don't get the desktop variant from a
      // shared cache layer (and vice versa).
      vary: "User-Agent",
    },
  });
}
