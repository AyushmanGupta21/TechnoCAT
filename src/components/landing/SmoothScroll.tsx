"use client";

// Smooth, inertia-style scrolling for the landing page (Lenis).
// Disabled for visitors who prefer reduced motion; in-page anchor links glide to their section.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      anchors: { offset: -88 }, // clear the sticky navbar
      allowNestedScroll: true, // inner scrollable panels scroll natively
      // Pop-ups, menus and inner scroll areas keep their own native scrolling.
      prevent: (node) =>
        Boolean(node.closest('[role="dialog"], [aria-modal="true"], [data-lenis-prevent], [role="menu"], [role="listbox"]')),
    });

    // Lenis drives scrolling, so the CSS smooth-scroll would fight it.
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      html.style.scrollBehavior = prevBehavior;
    };
  }, []);

  return null;
}
