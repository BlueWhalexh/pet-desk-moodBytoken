"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 16;

export function ZhLayoutSpacer({ children }: { children: React.ReactNode }) {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setAtTop(window.scrollY <= SCROLL_THRESHOLD_PX);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`transition-[padding-top] duration-200 ease-out ${
        atTop ? "pt-8" : "pt-0"
      }`}
    >
      {children}
    </div>
  );
}
