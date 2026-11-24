"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Download, LayoutDashboard, Menu, MessageCircle, UserRound, X } from "lucide-react";
import styles from "./Navbar.module.css";
import BrandLogo from "@/components/shared/BrandLogo";

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
    title: "All courses",
    links: [
      {
        label: "Quantitative ability (QA)",
        href: "/topics/qa-quantitative-ability",
        desc: "Arithmetic, algebra and geometry with video lessons",
        badge: "Popular",
      },
      {
        label: "Data interpretation and LR (DILR)",
        href: "/topics/dilr-data-interpretation",
        desc: "Arrangements, tables, matrix and logic sets",
      },
      {
        label: "Verbal ability and RC (VARC)",
        href: "/topics/varc-reading-comprehension",
        desc: "RC passages, parajumbles, critical reasoning",
      },
      {
        label: "All video topics and AI tutor",
        href: "/topics",
        desc: "Full syllabus, interactive viva and quizzes",
        badge: "AI tutor",
      },
      {
        label: "35 full CAT mock course",
        href: "/#courses",
        desc: "Classic and modern exam simulator with analysis",
      },
    ],
  },
  {
    id: "past-papers",
    title: "Past papers",
    links: [
      {
        label: "CAT 2024 actual papers (all slots)",
        href: "/browse#pyq-section",
        badge: "Latest",
      },
      {
        label: "CAT 2023 Slot 1, 2, 3 with Solutions",
        href: "/browse#pyq-section",
      },
      {
        label: "CAT 2022 Slot 1, 2, 3 with Solutions",
        href: "/browse#pyq-section",
      },
      {
        label: "Attempt a past year paper as mock",
        href: "/browse#pyq-section",
        badge: "Free",
      },
    ],
  },
  {
    id: "mocks",
    title: "Mocks",
    links: [
      {
        label: "TechnoCAT 6.0 full mock",
        href: "/browse?section=mocks&mock=latest#pyq-section",
        badge: "Free",
      },
      {
        label: "35 full-length CAT mocks",
        href: "/#courses",
      },
      {
        label: "45 sectional tests (QA, DILR, VARC)",
        href: "/topics",
      },
      {
        label: "AI mock analysis and benchmark",
        href: "/intelligence/ai-analysis",
        badge: "AI",
      },
    ],
  },
  {
    id: "know-us",
    title: "Know us",
    links: [
      {
        label: "Why TechnoCAT mocks stand out",
        href: "/#why-stand-out",
      },
      {
        label: "Two exam modes (classic vs modern)",
        href: "/#two-modes",
      },
      {
        label: "What you get in TechnoCAT",
        href: "/#what-you-get",
      },
      {
        label: "580+ 99%ilers community",
        href: "/#community",
        badge: "580+",
      },
      {
        label: "Verified student video reviews",
        href: "/#reviews",
      },
      {
        label: "Frequently asked questions",
        href: "/#faq",
      },
    ],
  },
];

const UTILITY_LINKS = [
  { label: "Predict your B-school", href: "/intelligence/b-school-predictor", requiresAuth: true },
  { label: "Free CAT daily target", href: "/dashboard", requiresAuth: true },
  { label: "Free CAT study material", href: "/browse", requiresAuth: true },
  { label: "SOP generator", href: "#", isModal: true },
  { label: "CAT score calculator", href: "/intelligence/ai-analysis", requiresAuth: true },
];

export default function Navbar() {
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    courses: true,
  });

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  // Elevate the bar once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleUtilityClick = (e: React.MouseEvent, link: typeof UTILITY_LINKS[0]) => {
    if (link.isModal) {
      e.preventDefault();
      setModalData({
        badge: "Admissions studio",
        title: "SOP and interview studio",
        description:
          "Craft winning SOPs and practice AI-guided mock interviews tailored to each IIM shortlist and top MBA program criteria.",
        highlights: [
          "Profile-tailored SOP drafts aligned with IIM Ahmedabad, Bangalore, Calcutta specs",
          "Real-time interview simulator scoring your answers on clarity and structure",
          "Extensive archive of previous GD-PI questions and alumni transcripts",
          "Automated suggestions for highlighting academic and work experience achievements"
        ],
        primaryBtnText: "Log in to open SOP studio",
        onPrimaryClick: () => {
          if (!user || user.isGuest) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("technocat_auth_redirect", "/intelligence");
            }
            openAuthModal("signin");
          } else {
            router.push("/intelligence");
          }
        }
      });
      return;
    }

    if (link.requiresAuth && (!user || user.isGuest)) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", link.href);
      }
      openAuthModal("signin");
      return;
    }
  };

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

  // Smooth scroll if URL has a hash or when hash changes
  useEffect(() => {
    const handleHashScroll = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.replace("#", "");
        const timer = setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

  const handleNavLinkClick = (
    e: React.MouseEvent,
    link: SubLink,
    catId: string,
    onClose: () => void
  ) => {
    const isHash = link.href.startsWith("/#") || link.href.startsWith("#");
    const needsAuth = !isHash;

    if (needsAuth && (!user || user.isGuest)) {
      e.preventDefault();
      onClose();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", link.href);
      }
      openAuthModal("signin");
      return;
    }

    onClose();

    if (isHash) {
      const hash = link.href.replace(/^\/?#/, "");
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `#${hash}`);
        }
      }
    }
  };

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

  const isAuthed = !!user && !user.isGuest;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP NAVBAR (Visible >= 1024px)                                     */}
      {/* ========================================================================= */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <div className={styles.mainNav}>
          <div className={styles.mainNavInner}>
            <div className={styles.navLeft}>
              <Link href="/" className={styles.logoLink} aria-label="TechnoCAT home">
                <BrandLogo height={60} />
              </Link>

              <nav className={styles.navLinks} aria-label="Primary">
                {NAV_CATEGORIES.map((cat) => {
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
                        className={`${styles.navLinkBtn} ${isOpen ? styles.navLinkBtnActive : ""}`}
                        aria-expanded={isOpen}
                      >
                        <span>{cat.title}</span>
                        <ChevronDown
                          size={15}
                          strokeWidth={1.75}
                          className={styles.chevron}
                          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            className={styles.dropdownMenu}
                            initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.98 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <div className={styles.dropdownHeader}>
                              <span className={styles.dropdownTitle}>{cat.title}</span>
                            </div>
                            <div className={styles.dropdownGrid}>
                              {cat.links.map((link, i) => (
                                <motion.div
                                  key={link.label}
                                  initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: reduce ? 0 : 0.03 * i }}
                                >
                                  <Link
                                    href={link.href}
                                    onClick={(e) => handleNavLinkClick(e, link, cat.id, () => setActiveDropdown(null))}
                                    className={styles.dropdownItem}
                                  >
                                    <span className={styles.dropdownItemHeader}>
                                      <span className={styles.dropdownItemLabel}>{link.label}</span>
                                      {link.badge && <span className={styles.dropdownBadge}>{link.badge}</span>}
                                    </span>
                                    {link.desc && <span className={styles.dropdownItemDesc}>{link.desc}</span>}
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className={styles.navActions}>
              {isAuthed ? (
                <Link href="/dashboard" className={styles.loginBtn}>
                  <LayoutDashboard size={16} strokeWidth={1.75} />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal("signin")}
                    className={styles.signInLink}
                    aria-label="Log in to TechnoCAT"
                  >
                    Log in
                  </button>
                  <button type="button" onClick={() => openAuthModal("signup")} className={styles.loginBtn}>
                    <span>Start free</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE / TABLET NAVBAR (Visible < 1024px)                               */}
      {/* ========================================================================= */}
      <div className={`${styles.mobileNav} ${scrolled ? styles.mobileNavScrolled : ""}`}>
        <div className={styles.mobileMainBar}>
          <div className={styles.mobileNavLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrawerOpen(true);
              }}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>

            <Link href="/" className={styles.mobileLogoLink} aria-label="TechnoCAT home">
              <BrandLogo height={44} />
            </Link>
          </div>

          <div className={styles.mobileNavRight}>
            {isAuthed ? (
              <Link href="/dashboard" className={styles.mobileLoginBtn}>
                <LayoutDashboard size={15} strokeWidth={1.75} />
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
                aria-label="Log in to TechnoCAT"
              >
                <UserRound size={15} strokeWidth={1.75} />
                <span>Log in</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OUT LEFT DRAWER (Mobile & Tablet Navigation)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            className={styles.drawerBackdrop}
            onClick={closeDrawer}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      <aside
        className={`${styles.drawerPanel} ${drawerOpen ? styles.drawerOpen : styles.drawerClosed}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <Link href="/" onClick={closeDrawer} className={styles.mobileLogoLink}>
              <BrandLogo height={42} />
            </Link>
          </div>

          <button type="button" onClick={closeDrawer} className={styles.drawerCloseBtn} aria-label="Close navigation">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.drawerContent}>
          <div className={styles.drawerAuthBox}>
            {isAuthed && user ? (
              <div className={styles.drawerUserCard}>
                <div className={styles.drawerUserInfo}>
                  <div className={styles.drawerAvatar}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.drawerUserDetails}>
                    <span className={styles.drawerUserName}>{user.fullName || "CAT aspirant"}</span>
                    <span className={styles.drawerUserEmail}>{user.email}</span>
                  </div>
                </div>
                <div className={styles.drawerUserActions}>
                  <Link href="/dashboard" onClick={closeDrawer} className={styles.drawerDashboardBtn}>
                    Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      closeDrawer();
                    }}
                    className={styles.drawerLogoutBtn}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.drawerGuestCard}>
                <div className={styles.drawerGuestHeader}>
                  <span className={styles.drawerGuestTitle}>Welcome to TechnoCAT</span>
                  <span className={styles.drawerGuestSub}>35 full CAT mocks, video solutions and an AI mentor</span>
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
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      openAuthModal("signup");
                    }}
                    className={styles.drawerSignupBtn}
                  >
                    Register free
                  </button>
                </div>
              </div>
            )}
          </div>

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
                      <ChevronDown
                        size={17}
                        strokeWidth={1.75}
                        className={styles.chevron}
                        style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          className={styles.accordionClip}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className={styles.accordionBody}>
                            {cat.links.map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                onClick={(e) => handleNavLinkClick(e, link, cat.id, closeDrawer)}
                                className={styles.accordionLink}
                              >
                                <span className={styles.accordionLinkText}>
                                  <span>{link.label}</span>
                                  {link.desc && <span className={styles.accordionLinkDesc}>{link.desc}</span>}
                                </span>
                                {link.badge && <span className={styles.accordionBadge}>{link.badge}</span>}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.drawerSection}>
            <span className={styles.drawerSectionTitle}>Free preparation tools</span>
            <div className={styles.toolsList}>
              {UTILITY_LINKS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  onClick={(e) => {
                    closeDrawer();
                    handleUtilityClick(e, tool);
                  }}
                  className={styles.toolItem}
                >
                  <span>{tool.label}</span>
                  <ChevronRight size={16} strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.drawerFooter}>
            <a
              href="https://chat.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.drawerWhatsappBtn}
            >
              <MessageCircle size={17} strokeWidth={1.75} />
              <span>Join the WhatsApp group (200K)</span>
            </a>

            <Link
              href="/dashboard"
              onClick={(e) => {
                closeDrawer();
                if (!user || user.isGuest) {
                  e.preventDefault();
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("technocat_auth_redirect", "/dashboard");
                  }
                  openAuthModal("signin");
                }
              }}
              className={styles.drawerDownloadBtn}
            >
              <Download size={16} strokeWidth={1.75} />
              <span>Download the TechnoCAT app</span>
            </Link>
          </div>
        </div>
      </aside>

      <CardInfoModal isOpen={!!modalData} onClose={() => setModalData(null)} data={modalData} />
    </>
  );
}
