"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./Footer.module.css";
import BrandLogo from "@/components/shared/BrandLogo";
import { ArrowUpRight } from "lucide-react";
import { GradientText, Reveal } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";

interface FooterLinkItem {
  label: string;
  href: string;
}

const footerLinks: { heading: string; links: FooterLinkItem[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Mock tests", href: "/browse" },
      { label: "Sectional tests", href: "/topics" },
      { label: "AI analysis", href: "/intelligence/ai-analysis" },
      { label: "Performance", href: "/dashboard" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Courses", href: "/topics" },
      { label: "Video solutions", href: "/#why-stand-out" },
      { label: "Preparation guide", href: "/#what-you-get" },
      { label: "FAQs", href: "/#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#why-stand-out" },
      { label: "Community", href: "/#community" },
      { label: "Reviews", href: "/#reviews" },
      { label: "Exam modes", href: "/#two-modes" },
    ],
  },
];

const SOCIALS: { name: string; path: React.ReactNode }[] = [
  {
    name: "Facebook",
    path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="currentColor" />,
  },
  {
    name: "Instagram",
    path: (
      <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </g>
    ),
  },
  {
    name: "YouTube",
    path: (
      <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
        <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </g>
    ),
  },
  {
    name: "LinkedIn",
    path: (
      <g fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </g>
    ),
  },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: FooterLinkItem) => {
    const isHash = link.href.startsWith("/#") || link.href.startsWith("#");

    if (!isHash) {
      if (!user || user.isGuest) {
        e.preventDefault();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("technocat_auth_redirect", link.href);
        }
        openAuthModal("signin");
        return;
      }
      e.preventDefault();
      router.push(link.href);
      return;
    }

    if (typeof window !== "undefined" && pathname === "/") {
      const hash = link.href.replace(/^\/?#/, "");
      const el = document.getElementById(hash);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${hash}`);
      }
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={ui.container}>
        <Reveal className={styles.topSection}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logoPlate} aria-label="TechnoCAT home">
              <BrandLogo height={56} />
            </Link>
            <p className={styles.brandTagline}>
              Practice. Analyse. <GradientText dark>Improve.</GradientText>
            </p>
            <p className={styles.brandDesc}>
              A CAT preparation platform built to help you practise smarter, analyse better and improve with every mock.
            </p>

            <div className={styles.socialRow}>
              {SOCIALS.map((s) => (
                <a key={s.name} href="#" onClick={(e) => e.preventDefault()} className={styles.socialIcon} aria-label={s.name}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className={styles.linksGrid}>
            {footerLinks.map((col, ci) => (
              <div
                key={col.heading}
                className={styles.col}
                style={{ "--accent": ["var(--data-cyan)", "var(--data-teal)", "#a78bfa"][ci % 3] } as React.CSSProperties}
              >
                <h4 className={styles.colHeading}>{col.heading}</h4>
                <ul className={styles.linkList}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} onClick={(e) => handleFooterLinkClick(e, link)} className={styles.link}>
                        <span>{link.label}</span>
                        <ArrowUpRight size={14} strokeWidth={1.75} className={styles.linkArrow} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © 2026 TechnoCAT Edu Services Private Limited. All rights reserved.
          </p>
          <p className={styles.madeIn}>
            <span className={ui.liveDot} aria-hidden="true" />
            Made in India
          </p>
        </div>
      </div>
    </footer>
  );
}
