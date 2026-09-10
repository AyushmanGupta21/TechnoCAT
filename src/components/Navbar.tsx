"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.css";

interface SubLink {
  label: string;
  href: string;
  badge?: string;
  desc?: string;
}

interface NavCategory {
  id: string;
  title: string;
  links: SubLink[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "courses",
    title: "All Courses",
    links: [
      {
        label: "Quantitative Ability (QA)",
        href: "/topics/qa-quantitative-ability",
        desc: "Arithmetic, Algebra, Geometry with AI Video RAG",
        badge: "Popular",
      },
      {
        label: "Data Interpretation & LR (DILR)",
        href: "/topics/dilr-data-interpretation",
        desc: "Arrangements, Tables, Matrix & Logic sets",
      },
      {
        label: "Verbal Ability & RC (VARC)",
        href: "/topics/varc-reading-comprehension",
        desc: "RC Passages, Parajumbles, Critical Reasoning",
      },
      {
        label: "All Video Topics & AI Tutor",
        href: "/topics",
        desc: "Full syllabus, interactive viva & quiz engine",
        badge: "AI Powered",
      },
      {
        label: "35 Full CAT Mock Course",
        href: "/#courses",
        desc: "Classic & Modern exam simulator with AI analysis",
      },
    ],
  },
  {
    id: "past-papers",
    title: "Past Papers",
    links: [
      {
        label: "CAT 2024 Actual Papers (All Slots)",
        href: "/#icat-mock",
        badge: "Latest",
      },
      {
        label: "CAT 2023 Slot 1, 2, 3 with Solutions",
        href: "/#icat-mock",
      },
      {
        label: "CAT 2022 Slot 1, 2, 3 with Solutions",
        href: "/#icat-mock",
      },
      {
        label: "Attempt Past Year Paper as Mock",
        href: "/#icat-mock",
        badge: "Free",
      },
    ],
  },
  {
    id: "mocks",
    title: "Mocks",
    links: [
      {
        label: "TechnoCAT 6.0 Full Mock",
        href: "/#icat-mock",
        badge: "Free",
      },
      {
        label: "35 Full-Length CAT Mocks",
        href: "/#courses",
      },
      {
        label: "45 Sectional Tests (QA, DILR, VARC)",
        href: "/#courses",
      },
      {
        label: "AI Mock Analysis & Benchmark",
        href: "/#why-stand-out",
        badge: "AI",
      },
    ],
  },
  {
    id: "know-us",
    title: "Know us",
    links: [
      {
        label: "Why TechnoCAT Mocks Stand Out",
        href: "/#why-stand-out",
      },
      {
        label: "Two Exam Modes (Classic vs Modern)",
        href: "/#exam-modes",
      },
      {
        label: "What You Get in TechnoCAT",
        href: "/#what-you-get",
      },
      {
        label: "580+ 99+%ilers Community",
        href: "/#community",
        badge: "580+",
      },
      {
        label: "Verified Student Video Reviews",
        href: "/#reviews",
      },
      {
        label: "Frequently Asked Questions",
        href: "/#faq",
      },
    ],
  },
];

const UTILITY_LINKS = [
  { label: "Predict your BSchool", href: "/#features" },
  { label: "Free CAT Daily Target", href: "/#features" },
  { label: "Free CAT Study Material!", href: "/#features" },
  { label: "SOP Generator", href: "/#features" },
  { label: "CAT Score Calculator", href: "/#features" },
];

export default function Navbar() {
  const { user, openAuthModal, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    courses: true,
  });

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lock body scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Handle ESC key to close drawer or dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseEnter = (catId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(catId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP NAVBAR (Visible >= 1024px)                                     */}
      {/* ========================================================================= */}
      <header className={styles.header}>
        {/* Top utility strip */}
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>


            <ul className={styles.utilityLinks}>
              {UTILITY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Navigation Row */}
        <div className={styles.mainNav}>
          <div className={styles.mainNavInner}>
            <div className={styles.navLeft}>
              {/* Logo */}
              <Link href="/" className={styles.logoLink}>
                <span className={styles.textLogo}>
                  <span className={styles.textLogoTechno}>Techno</span>
                  <span className={styles.textLogoCAT}>CAT</span>
                </span>
              </Link>



              {/* Desktop Nav Items with Dropdowns */}
              <nav className={styles.navLinks}>
                {NAV_CATEGORIES.map((cat, idx) => {
                  const isFirst = idx === 0;
                  const isOpen = activeDropdown === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={styles.dropdownContainer}
                      onMouseEnter={() => handleMouseEnter(cat.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                        className={isFirst ? styles.allCoursesBtn : styles.navLinkBtn}
                        aria-expanded={isOpen}
                      >
                        <span>{cat.title}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {/* Dropdown Floating Menu */}
                      {isOpen && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownHeader}>
                            <span className={styles.dropdownTitle}>{cat.title}</span>
                          </div>
                          <div className={styles.dropdownGrid}>
                            {cat.links.map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                onClick={(e) => {
                                  if (cat.id === "courses" && (!user || user.isGuest)) {
                                    e.preventDefault();
                                    setActiveDropdown(null);
                                    openAuthModal("signin");
                                  } else {
                                    setActiveDropdown(null);
                                  }
                                }}
                                className={styles.dropdownItem}
                              >
                                <div className={styles.dropdownItemHeader}>
                                  <span className={styles.dropdownItemLabel}>
                                    {link.label}
                                  </span>
                                  {link.badge && (
                                    <span className={styles.dropdownBadge}>
                                      {link.badge}
                                    </span>
                                  )}
                                </div>
                                {link.desc && (
                                  <span className={styles.dropdownItemDesc}>
                                    {link.desc}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Right Action: Login / Dashboard Button */}
            <div className={styles.navActions}>
              {user && !user.isGuest ? (
                <Link href="/dashboard" className={styles.loginBtn}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className={styles.loginBtn}
                  aria-label="Login to TechnoCAT"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE / TABLET NAVBAR (Visible < 1024px)                               */}
      {/* ========================================================================= */}
      <div className={styles.mobileNav}>

        {/* Mobile Main Bar */}
        <div className={styles.mobileMainBar}>
          <div className={styles.mobileNavLeft}>
            {/* Hamburger Button on Left */}
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrawerOpen(true);
              }}
              aria-label="Open Navigation Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className={styles.mobileLogoLink}>
              <span className={styles.textLogo}>
                <span className={styles.textLogoTechno}>Techno</span>
                <span className={styles.textLogoCAT}>CAT</span>
              </span>
            </Link>
          </div>

          {/* Right Action: Consistent Login / Dashboard Button on Mobile */}
          <div className={styles.mobileNavRight}>
            {user && !user.isGuest ? (
              <Link href="/dashboard" className={styles.mobileLoginBtn}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                <span>Dashboard</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openAuthModal("signin");
                }}
                className={styles.mobileLoginBtn}
                aria-label="Login to TechnoCAT"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OUT LEFT DRAWER (Mobile & Tablet Navigation)                     */}
      {/* ========================================================================= */}
      {drawerOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.drawerPanel} ${drawerOpen ? styles.drawerOpen : styles.drawerClosed}`}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <Link href="/" onClick={closeDrawer} className={styles.mobileLogoLink}>
              <span className={styles.textLogo}>
                <span className={styles.textLogoTechno}>Techno</span>
                <span className={styles.textLogoCAT}>CAT</span>
              </span>
            </Link>

          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className={styles.drawerCloseBtn}
            aria-label="Close Navigation Drawer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className={styles.drawerContent}>
          {/* User Profile / Authentication Banner */}
          <div className={styles.drawerAuthBox}>
            {user && !user.isGuest ? (
              <div className={styles.drawerUserCard}>
                <div className={styles.drawerUserInfo}>
                  <div className={styles.drawerAvatar}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.drawerUserDetails}>
                    <span className={styles.drawerUserName}>{user.fullName || "CAT Aspirant"}</span>
                    <span className={styles.drawerUserEmail}>{user.email}</span>
                  </div>
                </div>
                <div className={styles.drawerUserActions}>
                  <Link
                    href="/dashboard"
                    onClick={closeDrawer}
                    className={styles.drawerDashboardBtn}
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      closeDrawer();
                    }}
                    className={styles.drawerLogoutBtn}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.drawerGuestCard}>
                <div className={styles.drawerGuestHeader}>
                  <span className={styles.drawerGuestTitle}>Welcome to TechnoCAT</span>
                  <span className={styles.drawerGuestSub}>
                    Get 35 Full CAT Mocks, Video RAG & AI Mentorship
                  </span>
                </div>
                <div className={styles.drawerGuestBtns}>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      openAuthModal("signin");
                    }}
                    className={styles.drawerLoginBtn}
                  >
                    Login / Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      openAuthModal("signup");
                    }}
                    className={styles.drawerSignupBtn}
                  >
                    Register Free
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Nav Accordions */}
          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>Navigation</span>
            <div className={styles.accordionGroup}>
              {NAV_CATEGORIES.map((cat) => {
                const isExpanded = !!expandedAccordions[cat.id];

                return (
                  <div key={cat.id} className={styles.accordionItem}>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(cat.id)}
                      className={styles.accordionHeader}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.accordionTitle}>{cat.title}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className={styles.accordionBody}>
                        {cat.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={(e) => {
                              if (cat.id === "courses" && (!user || user.isGuest)) {
                                e.preventDefault();
                                closeDrawer();
                                openAuthModal("signin");
                              } else {
                                closeDrawer();
                              }
                            }}
                            className={styles.accordionLink}
                          >
                            <div className={styles.accordionLinkText}>
                              <span>{link.label}</span>
                              {link.desc && (
                                <span className={styles.accordionLinkDesc}>
                                  {link.desc}
                                </span>
                              )}
                            </div>
                            {link.badge && (
                              <span className={styles.accordionBadge}>
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free Tools Section */}
          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>Free Preparation Tools</span>
            <div className={styles.toolsList}>
              {UTILITY_LINKS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  onClick={closeDrawer}
                  className={styles.toolItem}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ED1C24"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span>{tool.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Action Footer Buttons in Drawer */}
          <div className={styles.drawerFooter}>
            <a
              href="https://chat.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.drawerWhatsappBtn}
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M260.062 32C138.605 32 40.134 129.701 40.134 250.232c0 41.23 11.532 79.79 31.559 112.687L32 480l121.764-38.682c31.508 17.285 67.745 27.146 106.298 27.146C381.535 468.464 480 370.749 480 250.232 480 129.701 381.535 32 260.062 32zm109.362 301.11c-5.174 12.827-28.574 24.533-38.899 25.072-10.314.547-10.608 7.994-66.84-16.434-56.225-24.434-90.052-83.844-92.719-87.67-2.669-3.812-21.78-31.047-20.749-58.455 1.038-27.413 16.047-40.346 21.404-45.725 5.351-5.387 11.486-6.352 15.232-6.413 4.428-.072 7.296-.132 10.573-.011 3.274.124 8.192-.685 12.45 10.639 4.256 11.323 14.443 39.153 15.746 41.989 1.302 2.839 2.108 6.126.102 9.771-2.012 3.653-3.042 5.935-5.961 9.083-2.935 3.148-6.174 7.042-8.792 9.449-2.92 2.665-5.97 5.572-2.9 11.269 3.068 5.693 13.653 24.356 29.779 39.736 20.725 19.771 38.598 26.329 44.098 29.317 5.515 3.004 8.806 2.67 12.226-.929 3.404-3.599 14.639-15.746 18.596-21.169 3.955-5.438 7.661-4.373 12.742-2.329 5.078 2.052 32.157 16.556 37.673 19.551 5.51 2.989 9.193 4.529 10.51 6.9 1.317 2.38.901 13.531-4.271 26.359z" />
              </svg>
              <span>Join WhatsApp Group (200K)</span>
            </a>

            <Link
              href="/cat-prep-app"
              onClick={closeDrawer}
              className={styles.drawerDownloadBtn}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 15V3" />
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
              </svg>
              <span>Download TechnoCAT App</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
