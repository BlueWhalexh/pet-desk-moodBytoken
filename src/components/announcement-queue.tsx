"use client";

import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";

import { safeGetItem, safeSetItem } from "@/lib/utils";

import { DesktopAnnouncementModal } from "@/components/desktop-announcement-modal";
import { GithubStarModal } from "@/components/github-star-modal";

type QueuedAnnouncement = {
  id: string;
  delayMs: number;
  gateMs: number;
  Component: ComponentType<{ onClose: () => void }>;
};

const HOME_PATH_RE = /^\/(?:en|es|zh)?\/?$/;

// Order matters: desktop-launch first (the headline news), then
// github-star as a recurring CTA. Each is one-shot per browser via
// localStorage. Re-bump the id (`_v2`, `_v3`) to force a re-show
// after a major refresh of the modal content.
const QUEUE: QueuedAnnouncement[] = [
  {
    id: "petdex_announce_desktop_v1",
    delayMs: 1200,
    gateMs: 600,
    Component: DesktopAnnouncementModal,
  },
  {
    id: "petdex_announce_github_star_v1",
    delayMs: 600,
    gateMs: 600,
    Component: GithubStarModal,
  },
];

type Phase = "idle" | "showing";

function isEligible(_index: number, pathname: string | null) {
  // Both modals only fire from the home page so contributors landing on
  // /pets/<slug> or /admin don't get hit with marketing.
  return HOME_PATH_RE.test(pathname ?? "/");
}

export function AnnouncementQueue() {
  const pathname = usePathname();
  const [index, setIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const activeItem = useMemo(
    () => (index === null ? null : (QUEUE[index] ?? null)),
    [index],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    for (let nextIndex = 0; nextIndex < QUEUE.length; nextIndex += 1) {
      if (!isEligible(nextIndex, pathname)) continue;
      if (safeGetItem(QUEUE[nextIndex].id) === "1") continue;
      setIndex(nextIndex);
      setPhase("idle");
      return;
    }

    setIndex(null);
    setPhase("idle");
  }, [pathname]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      activeItem === null ||
      phase !== "idle"
    )
      return;

    const timeout = window.setTimeout(() => {
      setPhase("showing");
    }, activeItem.delayMs);

    return () => window.clearTimeout(timeout);
  }, [activeItem, phase]);

  const handleClose = () => {
    if (typeof window === "undefined" || activeItem === null) return;

    safeSetItem(activeItem.id, "1");

    const nextIndex = (() => {
      for (
        let candidate = (index ?? -1) + 1;
        candidate < QUEUE.length;
        candidate += 1
      ) {
        if (!isEligible(candidate, pathname)) continue;
        if (safeGetItem(QUEUE[candidate].id) === "1") continue;
        return candidate;
      }
      return null;
    })();

    window.setTimeout(() => {
      setIndex(nextIndex);
      setPhase("idle");
    }, activeItem.gateMs);
  };

  if (activeItem === null || phase !== "showing") {
    return null;
  }

  const Component = activeItem.Component;
  return <Component onClose={handleClose} />;
}
