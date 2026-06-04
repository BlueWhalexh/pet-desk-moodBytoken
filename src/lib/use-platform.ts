"use client";

import { useEffect, useState } from "react";

/**
 * Coarse platform detection for client-side rendering decisions.
 * Used by the /download CTA and the per-pet "Open in Petdex"
 * button so we don't show a macOS-binary download to a Linux user.
 *
 * Returns "unknown" during SSR / first paint so the calling
 * component can render a neutral placeholder. After hydration the
 * component re-renders with the resolved value.
 *
 * iPadOS deserves a separate bucket because Safari reports it as
 * "MacIntel" with multi-touch; calling that "macos" would surface
 * a binary the iPad can't run.
 */
export type Platform =
  | "unknown"
  | "macos"
  | "linux"
  | "windows"
  | "ios"
  | "ipados"
  | "android"
  | "other";

/**
 * macOS architecture sub-flavor. We ship separate arm64 and Intel DMGs
 * so we need to know which one to surface. Browsers don't expose CPU
 * architecture directly, but a couple of heuristics get us most of the
 * way there — see detectMacArch below for the gory details.
 */
export type MacArch = "arm64" | "intel" | "unknown";

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setPlatform(detectPlatform());
  }, []);

  return platform;
}

/**
 * macOS CPU architecture. Returns "unknown" during SSR + on browsers
 * that don't expose enough signal. The component should fall back to
 * a generic "Download for macOS" link that lands on /download where
 * the user can pick.
 */
export function useMacArch(): MacArch {
  const [arch, setArch] = useState<MacArch>("unknown");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    detectMacArch().then(setArch);
  }, []);

  return arch;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent ?? "";
  // navigator.platform is technically deprecated but still
  // populated on every browser we care about. The replacement
  // (userAgentData) isn't supported on Safari yet, so we keep
  // this and let it gracefully report "other" when both miss.
  const navPlatform =
    (navigator as Navigator & { platform?: string }).platform ?? "";

  if (/iPhone|iPod/i.test(navPlatform) || /iPhone|iPod/i.test(ua)) return "ios";
  // iPadOS in desktop-mode Safari spoofs MacIntel. Multi-touch
  // is the only signal that survives the spoof.
  if (/iPad/i.test(navPlatform) || /iPad/i.test(ua)) return "ipados";
  if (
    navPlatform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return "ipados";
  }
  if (/Android/i.test(ua)) return "android";
  if (/^Mac/i.test(navPlatform) || /Mac OS X/i.test(ua)) return "macos";
  if (/Win/i.test(navPlatform) || /Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(navPlatform) || /Linux/i.test(ua)) return "linux";
  return "other";
}

type UserAgentData = {
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
  }>;
};

/**
 * macOS arch detection — three tiers, fall through:
 *
 * 1. navigator.userAgentData.getHighEntropyValues({architecture}) —
 *    works on Chromium (Chrome/Edge/Brave/Arc). Returns "arm" on
 *    Apple Silicon, "x86" on Intel. Most accurate signal.
 * 2. WebGL renderer string — Safari and Firefox expose the GPU,
 *    which contains "Apple" for M-series and "Intel" / "AMD" for
 *    Intel Macs. Reliable for desktops with discrete graphics; less
 *    so for older integrated Intel chips.
 * 3. Unknown → caller falls back to a neutral "Download" link.
 *
 * We never assume one or the other: a miss is preferred over showing
 * the wrong binary, which would just fail to launch.
 */
async function detectMacArch(): Promise<MacArch> {
  // Tier 1: Chromium high-entropy hints
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const ua = await uaData.getHighEntropyValues(["architecture"]);
      if (ua.architecture === "arm") return "arm64";
      if (ua.architecture === "x86") return "intel";
    } catch {
      // fall through to WebGL
    }
  }

  // Tier 2: WebGL renderer string
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (gl && "getExtension" in gl) {
      const dbg = (gl as WebGLRenderingContext).getExtension(
        "WEBGL_debug_renderer_info",
      );
      if (dbg) {
        const renderer = String(
          (gl as WebGLRenderingContext).getParameter(
            (dbg as { UNMASKED_RENDERER_WEBGL: number })
              .UNMASKED_RENDERER_WEBGL,
          ) ?? "",
        );
        // Apple M-series GPUs render as "Apple M1", "Apple M2", etc.
        // Intel Macs render as "Intel(R) Iris Plus..." or AMD Radeon.
        if (/Apple\s+M\d/.test(renderer)) return "arm64";
        if (/Intel|AMD|Radeon/i.test(renderer)) return "intel";
      }
    }
  } catch {
    // canvas/WebGL blocked — pretend we don't know
  }

  return "unknown";
}
