"use client";

import { useEffect, useState } from "react";

import { Info } from "lucide-react";

// Detects prefers-reduced-motion and renders a discreet hint when the
// user's OS has animations turned off. Pet sprites are CSS animations
// that we deliberately disable under reduced-motion (accessibility
// best practice), but Windows users who toggled "show animations" off
// in system settings often think the page is broken instead of
// realizing the OS asked us to stop. This hint closes that gap.

export function ReducedMotionHint({
  message,
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!reduced) return null;

  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-2xl border border-border-base bg-surface/80 px-3 py-2 text-xs text-muted-2 backdrop-blur ${className}`}
    >
      <Info className="size-3.5 shrink-0 text-brand" aria-hidden />
      <span>
        {message ??
          "Animations are disabled because your system has reduced motion turned on. Toggle the OS setting to see them play."}
      </span>
    </div>
  );
}
