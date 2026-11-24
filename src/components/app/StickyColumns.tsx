"use client";

// Smart sticky columns for two/three-column page layouts.
// Mark each column with `data-sticky-col`. When columns sit side by side and one is shorter, the shorter
// one scrolls normally until its last card is in view, then stays pinned while the longer column keeps
// scrolling, so both end level and no blank area opens up beneath it. Works for any content length
// (any account, any data) because heights are measured live. Stacked layouts (tablet/phone) are left alone.
// Mounted once by AppNav, so every signed-in page gets it.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const BOTTOM_GAP = 24;
const TOP_GAP = 20;

export default function StickyColumns() {
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    const observed = new WeakSet<Element>();
    const ro = new ResizeObserver(() => schedule());

    function update() {
      const nav = document.querySelector<HTMLElement>("[data-app-chrome]");
      const navH = nav ? nav.getBoundingClientRect().height : 0;
      const pinTop = navH + TOP_GAP;
      const vh = window.innerHeight;
      const cols = document.querySelectorAll<HTMLElement>("[data-sticky-col]");
      cols.forEach((el) => {
        if (!observed.has(el)) {
          ro.observe(el);
          observed.add(el);
        }
        const parent = el.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll<HTMLElement>(":scope > [data-sticky-col]")) : [];
        // Active only when at least two marked columns are actually side by side (different x positions).
        const visible = siblings.filter((s) => s.offsetHeight > 0 && getComputedStyle(s).display !== "contents");
        const lefts = new Set(visible.map((s) => Math.round(s.getBoundingClientRect().left)));
        const sideBySide = visible.length > 1 && lefts.size > 1 && el.offsetHeight > 0;
        if (!sideBySide) {
          el.removeAttribute("data-sticky-active");
          return;
        }
        const h = el.offsetHeight;
        // Fits under the nav: pin to the top. Taller than the viewport: pin when its bottom reaches the bottom.
        const top = h + pinTop + BOTTOM_GAP <= vh ? pinTop : vh - h - BOTTOM_GAP;
        el.style.setProperty("--stick-top", `${Math.round(top)}px`);
        el.setAttribute("data-sticky-active", "");
      });
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    // Columns can appear after data loads; re-scan when the DOM changes (batched to one frame).
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return null;
}
