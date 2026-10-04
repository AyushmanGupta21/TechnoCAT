"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import { pushNotification } from "@/services/notificationService";
import PYQSection from "@/components/pyq/PYQSection";
import PYQYearModal from "@/components/pyq/PYQYearModal";
import styles from "./browse.module.css";

export default function BrowsePage() {
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");

  const [enrolledTopics, setEnrolledTopics] = useState<string[]>(() => {
    return isDemo ? ["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"] : [];
  });

  const [enrollingTopicId, setEnrollingTopicId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<"All" | "Quantitative" | "DILR" | "VARC">("All");
  const [sortBy, setSortBy] = useState<"Recommended" | "Recently Added" | "Most Popular" | "A–Z">("Recommended");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [searchPYQModalOpen, setSearchPYQModalOpen] = useState(false);
  const router = useRouter();

  // Close sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortDropdownOpen]);

  useEffect(() => {
    if (isDemo) {
      setEnrolledTopics(["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"]);
    } else {
      fetch("/api/topics/progress")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.progress && Array.isArray(data.progress)) {
            const active = data.progress.map((p: any) => p.topic_id);
            setEnrolledTopics(active);
          }
        })
        .catch(() => {});
    }
  }, [isDemo, user?.id]);

  const handleEnroll = async (topicId: string, topicTitle: string) => {
    if (enrolledTopics.includes(topicId)) {
      router.push(`/topics/${topicId}`);
      return;
    }

    if (isDemo) {
      setEnrolledTopics((prev) => [...prev, topicId]);
      router.push(`/topics/${topicId}`);
      return;
    }

    setEnrollingTopicId(topicId);
    try {
      const res = await fetch("/api/topics/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (res.ok) {
        setEnrolledTopics((prev) => [...prev, topicId]);
        pushNotification(
          {
            type: "milestone",
            category: "learning",
            title: `Enrolled: ${topicTitle}`,
            desc: `Successfully enrolled in ${topicTitle}. You can access it anytime from My Topics!`,
            actionUrl: `/topics/${topicId}`,
            actionLabel: "Go to Course",
            icon: "🎓",
            iconBg: "#EFF6FF",
            iconColor: "#2563EB",
          },
          user?.id
        );
        router.push(`/topics/${topicId}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to enroll. Please try again.");
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setEnrollingTopicId(null);
    }
  };

  useEffect(() => {
    const scrollToPyq = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      const search = window.location.search;
      const shouldScroll =
        hash === "#pyq-section" ||
        hash === "#pyqs" ||
        hash === "#mocks" ||
        search.includes("section=pyq") ||
        search.includes("section=mocks");

      if (shouldScroll) {
        const performScroll = () => {
          const el = document.getElementById("pyq-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };

        // Staggered attempts ensure accuracy as cards/images render
        performScroll();
        const t1 = setTimeout(performScroll, 100);
        const t2 = setTimeout(performScroll, 300);
        const t3 = setTimeout(performScroll, 600);
        const t4 = setTimeout(performScroll, 1000);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    };

    const cleanup = scrollToPyq();
    window.addEventListener("hashchange", scrollToPyq);
    window.addEventListener("popstate", scrollToPyq);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener("hashchange", scrollToPyq);
      window.removeEventListener("popstate", scrollToPyq);
    };
  }, []);

  // Search match for PYQs
  const matchesPYQ = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const lower = searchQuery.toLowerCase();
    return (
      lower.includes("pyq") ||
      lower.includes("past") ||
      lower.includes("previous") ||
      lower.includes("2024") ||
      lower.includes("paper") ||
      lower.includes("slot") ||
      lower.includes("varc") ||
      lower.includes("dilr") ||
      lower.includes("quant")
    );
  }, [searchQuery]);

  // Filter and sort topics based on category tab, search query, and sort option
  const filteredTopics = useMemo(() => {
    let list = [...TOPICS_DATA];

    if (selectedCategoryTab === "Quantitative") {
      list = list.filter(
        (t) =>
          t.category.toLowerCase().includes("quant") ||
          t.id.toLowerCase().startsWith("qa-") ||
          t.title.toLowerCase().includes("quant")
      );
    } else if (selectedCategoryTab === "DILR") {
      list = list.filter(
        (t) =>
          t.category.toLowerCase().includes("data") ||
          t.category.toLowerCase().includes("dilr") ||
          t.id.toLowerCase().startsWith("dilr-") ||
          t.title.toLowerCase().includes("dilr")
      );
    } else if (selectedCategoryTab === "VARC") {
      list = list.filter(
        (t) =>
          t.category.toLowerCase().includes("verbal") ||
          t.category.toLowerCase().includes("varc") ||
          t.id.toLowerCase().startsWith("varc-") ||
          t.title.toLowerCase().includes("varc")
      );
    }

    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(lowerQ) ||
        t.category.toLowerCase().includes(lowerQ) ||
        t.description.toLowerCase().includes(lowerQ)
      );
    }

    // Sort options: Recommended, Recently Added, Most Popular, A–Z
    if (sortBy === "A–Z") {
      list.sort((a, b) => {
        const titleA = a.shortTitle || a.title;
        const titleB = b.shortTitle || b.title;
        return titleA.localeCompare(titleB);
      });
    } else if (sortBy === "Most Popular") {
      list.sort((a, b) => (b.totalLessons || 0) - (a.totalLessons || 0));
    } else if (sortBy === "Recently Added") {
      list.reverse();
    }
    // "Recommended" preserves default ordering

    return list;
  }, [selectedCategoryTab, searchQuery, sortBy]);


  return (
    <div className={styles.browseWrapper}>
      {/* ===== HEADER ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav}>
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                    setActiveNav(item.name);
                  }}
                  className={`${styles.navLink} ${activeNav === item.name ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HERO SEARCH ===== */}
      <section className={styles.heroSection}>
        <div className={styles.pillBadge}>★ Explore CAT Syllabus</div>
        <h1 className={styles.heroTitle}>
          What do you want to <span className={styles.headingHighlight}>learn today?</span>
        </h1>
        <p className={styles.heroSubtitle}>Explore the complete CAT curriculum, from Quant to VARC.</p>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search for 'Algebra', 'Reading Comprehension', etc..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent}>
        {/* Categories (only show if not searching) */}
        {!searchQuery && (
          <section className={styles.categorySection} aria-label="Browse by Category">
            <div className={styles.categoryHeaderRow}>
              <h2 className={styles.sectionTitle}>Browse by Category</h2>
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => {
                  const el = document.getElementById("all-topics-section");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollBy({ top: 380, behavior: "smooth" });
                  }
                }}
                aria-label="View all topics"
              >
                View All <span className={styles.viewAllArrow}>&rarr;</span>
              </button>
            </div>

            <div className={styles.categoryGrid}>
              {/* Card 1: Quantitative Ability */}
              <div
                className={styles.categoryCard}
                onClick={() => setSearchQuery("Quantitative")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSearchQuery("Quantitative");
                  }
                }}
                aria-label="Browse Quantitative Ability topics"
              >
                <div className={styles.categoryCardTopRow}>
                  <div className={styles.categoryCardLeft}>
                    <div className={`${styles.categoryIconBox} ${styles.quantIconBox}`}>
                      {/* Mathematical Sigma / Math icon */}
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 4H6l7 8-7 8h13" />
                      </svg>
                    </div>
                    <div className={styles.categoryMetaStack}>
                      <h3 className={styles.categoryCardTitle}>Quantitative Ability</h3>
                      <p className={styles.categoryCardStats}>51 Lessons • 12 Topics</p>
                    </div>
                  </div>

                  <div className={styles.categoryArrowBtn} aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>

                <div className={styles.categoryCardBottom}>
                  <p className={styles.categorySubtopicsText}>
                    Algebra, Arithmetic, Modern Math and more
                  </p>
                </div>

                {/* Subtle mathematical decorative visual */}
                <svg
                  className={`${styles.cardBgDeco} ${styles.quantDeco}`}
                  width="96"
                  height="68"
                  viewBox="0 0 96 68"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 52 L36 36 L58 44 L80 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="80" cy="18" r="3" fill="currentColor" />
                  <line
                    x1="10"
                    y1="58"
                    x2="88"
                    y2="58"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <rect x="18" y="44" width="6" height="14" rx="2" fill="currentColor" opacity="0.3" />
                  <rect x="40" y="32" width="6" height="26" rx="2" fill="currentColor" opacity="0.3" />
                  <rect x="62" y="24" width="6" height="34" rx="2" fill="currentColor" opacity="0.3" />
                </svg>
              </div>

              {/* Card 2: DILR */}
              <div
                className={styles.categoryCard}
                onClick={() => setSearchQuery("Data")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSearchQuery("Data");
                  }
                }}
                aria-label="Browse DILR topics"
              >
                <div className={styles.categoryCardTopRow}>
                  <div className={styles.categoryCardLeft}>
                    <div className={`${styles.categoryIconBox} ${styles.dilrIconBox}`}>
                      {/* Analytics / chart icon */}
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 3v18h18" />
                        <rect x="7" y="13" width="3" height="5" rx="0.8" fill="currentColor" opacity="0.4" />
                        <rect x="12" y="9" width="3" height="9" rx="0.8" fill="currentColor" opacity="0.6" />
                        <rect x="17" y="5" width="3" height="13" rx="0.8" fill="currentColor" />
                      </svg>
                    </div>
                    <div className={styles.categoryMetaStack}>
                      <h3 className={styles.categoryCardTitle}>DILR</h3>
                      <p className={styles.categoryCardStats}>20 Lessons • 8 Topics</p>
                    </div>
                  </div>

                  <div className={styles.categoryArrowBtn} aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>

                <div className={styles.categoryCardBottom}>
                  <p className={styles.categorySubtopicsText}>
                    Data Interpretation, Logical Reasoning, Set Theory and more
                  </p>
                </div>

                {/* Subtle geometric / analytics chart shapes */}
                <svg
                  className={`${styles.cardBgDeco} ${styles.dilrDeco}`}
                  width="96"
                  height="68"
                  viewBox="0 0 96 68"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="16" y="36" width="16" height="24" rx="3" fill="currentColor" opacity="0.25" />
                  <rect x="38" y="22" width="16" height="38" rx="3" fill="currentColor" opacity="0.4" />
                  <rect x="60" y="12" width="16" height="48" rx="3" fill="currentColor" opacity="0.6" />
                  <line x1="10" y1="62" x2="84" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Card 3: VARC */}
              <div
                className={styles.categoryCard}
                onClick={() => setSearchQuery("Verbal")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSearchQuery("Verbal");
                  }
                }}
                aria-label="Browse VARC topics"
              >
                <div className={styles.categoryCardTopRow}>
                  <div className={styles.categoryCardLeft}>
                    <div className={`${styles.categoryIconBox} ${styles.varcIconBox}`}>
                      {/* Book / reading icon */}
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                    <div className={styles.categoryMetaStack}>
                      <h3 className={styles.categoryCardTitle}>VARC</h3>
                      <p className={styles.categoryCardStats}>18 Lessons • 9 Topics</p>
                    </div>
                  </div>

                  <div className={styles.categoryArrowBtn} aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>

                <div className={styles.categoryCardBottom}>
                  <p className={styles.categorySubtopicsText}>
                    Reading Comprehension, Para Jumbles, Para Summary and more
                  </p>
                </div>

                {/* Subtle document / reading lines */}
                <svg
                  className={`${styles.cardBgDeco} ${styles.varcDeco}`}
                  width="96"
                  height="68"
                  viewBox="0 0 96 68"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="28" y="12" width="46" height="48" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
                  <line x1="36" y1="22" x2="62" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="36" y1="30" x2="66" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="36" y1="38" x2="58" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="36" y1="46" x2="50" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
            </div>
          </section>
        )}


        {/* PYQ Search Match Banner */}
        {matchesPYQ && (
          <div className={styles.pyqSearchResultBanner}>
            <div className={styles.pyqSearchLeft}>
              <span className={styles.pyqSearchBadge}>PYQ Question Paper Found</span>
              <h3 className={styles.pyqSearchTitle}>CAT 2024 Official Question Papers</h3>
              <p className={styles.pyqSearchDesc}>
                Access authentic questions across Slot 1, Slot 2 &amp; Slot 3. Covers VARC, DILR, and Quantitative Ability with step-by-step verified solutions and timed CAT exam proctoring.
              </p>
            </div>
            <button
              type="button"
              className={styles.pyqSearchBtn}
              onClick={() => setSearchPYQModalOpen(true)}
            >
              <span>Explore CAT 2024 PYQs</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}

        {/* Course Grid */}
        <div id="all-topics-section" className={styles.topicsHeaderRow}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            {searchQuery ? `Search Results for "${searchQuery}"` : "All Topics"}
          </h2>
          {searchQuery ? (
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryTab("All");
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Categories
            </button>
          ) : (
            <div className={styles.topicsControls}>
              <div className={styles.segmentedNav} role="tablist" aria-label="Topic categories">
                {(["All", "Quantitative", "DILR", "VARC"] as const).map((tab) => {
                  const isActive = selectedCategoryTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`${styles.segmentedNavItem} ${isActive ? styles.segmentedNavItemActive : ""}`}
                      onClick={() => setSelectedCategoryTab(tab)}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className={styles.sortContainer} ref={sortRef}>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => setSortDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={sortDropdownOpen}
                  aria-label={`Sort topics, currently sorted by ${sortBy}`}
                >
                  <span className={styles.sortLabelPrefix}>Sort by:</span>
                  <span className={styles.sortLabelValue}>{sortBy}</span>
                  <svg
                    className={`${styles.sortChevron} ${sortDropdownOpen ? styles.sortChevronOpen : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {sortDropdownOpen && (
                  <div className={styles.sortDropdownMenu} role="listbox">
                    {(["Recommended", "Recently Added", "Most Popular", "A–Z"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={sortBy === opt}
                        className={`${styles.sortMenuItem} ${sortBy === opt ? styles.sortMenuItemActive : ""}`}
                        onClick={() => {
                          setSortBy(opt);
                          setSortDropdownOpen(false);
                        }}
                      >
                        <span>{opt}</span>
                        {sortBy === opt && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        
        {filteredTopics.length === 0 ? (
          <div className={styles.noResults}>No topics found matching your search.</div>
        ) : (
          <div className={styles.topicsGrid}>
            {filteredTopics.map(topic => {
              const isEnrolled = enrolledTopics.includes(topic.id);

              return (
                <div key={topic.id} className={styles.topicCard}>
                  {/* Banner */}
                  <div className={styles.cardBanner} style={{ background: topic.bannerGradient || "#1F2937" }}>
                    {topic.bannerImage && (
                      <img 
                        src={topic.bannerImage} 
                        alt={topic.title}
                        className={styles.cardBannerBg}
                      />
                    )}
                    <div className={styles.topicBadge}>{topic.category}</div>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{topic.title}</h3>
                    <p className={styles.cardDesc}>{topic.description}</p>
                    
                    <div className={styles.instructorRow}>
                      <img src={topic.instructor.avatar} alt={topic.instructor.name} className={styles.instructorAvatar} />
                      <div className={styles.instructorInfo}>
                        <span className={styles.instructorName}>{topic.instructor.name}</span>
                        <span className={styles.instructorRole}>{topic.instructor.role}</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      {isEnrolled ? (
                        <button 
                          className={`${styles.enrollBtn} ${styles.btnSecondary}`}
                          onClick={() => router.push(`/topics/${topic.id}`)}
                        >
                          Go to Course
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      ) : (
                        <button 
                          className={`${styles.enrollBtn} ${styles.btnPrimary}`}
                          disabled={enrollingTopicId === topic.id}
                          onClick={() => handleEnroll(topic.id, topic.title)}
                        >
                          {enrollingTopicId === topic.id ? "Enrolling..." : "Enroll Now"}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Previous Year Questions (PYQs) Section (Listed below all topics) */}
        {!searchQuery && <PYQSection />}
      </main>


      {/* PYQ Year Modal from Search Banner */}
      {searchPYQModalOpen && (
        <PYQYearModal
          isOpen={true}
          year={2024}
          onClose={() => setSearchPYQModalOpen(false)}
        />
      )}
    </div>
  );
}