"use client";

// Shared top navigation for every signed-in page (same visual language as the landing Navbar).
// Usage: <AppNav /> at the top of the page; the active link is derived from the current path.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import StickyColumns from "./StickyColumns";
import styles from "./AppNav.module.css";

export const APP_NAV_LINKS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Browse", href: "/browse" },
  { name: "My topics", href: "/topics" },
  { name: "Intelligence Hub", href: "/intelligence" },
  { name: "Speak & Assess", href: "/mock-viva-prep" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNav() {
  const pathname = usePathname() || "";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
    {/* Spacer keeps page content below the fixed bar */}
    <div className={styles.spacer} aria-hidden="true" />
    <StickyColumns />
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`} data-app-chrome>
      <nav className={styles.inner} aria-label="Main">
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>

        <Link href="/dashboard" className={styles.logo} aria-label="TechnoCAT dashboard">
          <BrandLogo height={72} />
        </Link>

        <div className={styles.links}>
          {APP_NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link key={l.href} href={l.href} className={`${styles.link} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
                {l.name}
              </Link>
            );
          })}
        </div>

        <div className={styles.actions}>
          <PostLoginNavActions />
        </div>
      </nav>

      {open && (
        <>
          <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Menu">
            {APP_NAV_LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link key={l.href} href={l.href} className={`${styles.drawerLink} ${active ? styles.drawerActive : ""}`}>
                  {l.name}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </header>
    </>
  );
}
