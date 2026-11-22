"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Search,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { Reveal, RevealGroup, RevealItem, GradientText, SpotlightCard, type Tint } from "@/components/landing/motion";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ENROLLED_TOPIC_IDS } from "@/lib/demo";
import { pushNotification } from "@/services/notificationService";
import PYQSection from "@/components/pyq/PYQSection";
import PYQYearModal from "@/components/pyq/PYQYearModal";
import styles from "./browse.module.css";

type SectionKey = "qa" | "dilr" | "varc" | "other";

/** Visual grouping only (marker colour + card tint); filtering logic lives in filteredTopics. */
function sectionOf(t: { id: string; category: string }): SectionKey {
  const id = t.id.toLowerCase();
  const cat = t.category.toLowerCase();
  if (id.startsWith("qa-") || cat.includes("quant")) return "qa";
  if (id.startsWith("dilr-") || cat.includes("data") || cat.includes("dilr")) return "dilr";
  if (id.startsWith("varc-") || cat.includes("verbal") || cat.includes("varc")) return "varc";
  return "other";
}

const SECTION_TINT: Record<SectionKey, Tint> = { qa: "violet", dilr: "teal", varc: "blue", other: "amber" };

const CATEGORY_CARDS = [
  {
    key: "qa" as const,
    query: "Quantitative",
    label: "Quantitative Ability",
    lessons: 51,
    topics: 12,
    subtopics: "Algebra, Arithmetic, Modern Math and more",
    aria: "Browse Quantitative Ability topics",
  },
  {
    key: "dilr" as const,
    query: "Data",
    label: "DILR",
    lessons: 20,
    topics: 8,
    subtopics: "Data Interpretation, Logical Reasoning, Set Theory and more",
    aria: "Browse DILR topics",
  },
  {
    key: "varc" as const,
    query: "Verbal",
    label: "VARC",
    lessons: 18,
    topics: 9,
    subtopics: "Reading Comprehension, Para Jumbles, Para Summary and more",
    aria: "Browse VARC topics",
  },
];

/** Small coded data vignette for each section card (decorative). */
function SectionVignette({ k }: { k: SectionKey }) {
  if (k === "qa") {
    return (
      <svg className={styles.vignette} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <line x1="4" y1="50" x2="92" y2="50" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
        <rect x="12" y="34" width="8" height="16" rx="2" fill="currentColor" opacity="0.22" />
        <rect x="34" y="24" width="8" height="26" rx="2" fill="currentColor" opacity="0.32" />
        <rect x="56" y="16" width="8" height="34" rx="2" fill="currentColor" opacity="0.42" />
        <path d="M8 40 L30 28 L52 32 L80 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="10" r="3.5" fill="currentColor" />
      </svg>
    );
  }
  if (k === "dilr") {
    return (
      <svg className={styles.vignette} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={14 + c * 15}
              y={6 + r * 12}
              width="11"
              height="8"
              rx="2"
              fill="currentColor"
              opacity={(r * 5 + c) % 3 === 0 ? 0.65 : (r + c) % 2 === 0 ? 0.3 : 0.14}
            />
          ))
        )}
      </svg>
    );
  }
  return (
    <svg className={styles.vignette} viewBox="0 0 96 56" fill="none" aria-hidden="true">
      <rect x="24" y="4" width="54" height="48" rx="6" stroke="currentColor" strokeOpacity="0.35" />
      <line x1="32" y1="15" x2="66" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="24" x2="70" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <line x1="32" y1="33" x2="60" y2="33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <line x1="32" y1="42" x2="50" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export default function BrowsePage() {
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");

  const [enrolledTopics, setEnrolledTopics] = useState<string[]>(() => {
    return isDemo ? [...DEMO_ENROLLED_TOPIC_IDS] : [];
  });

  const [enrollingTopicId, setEnrollingTopicId] = useState<string | null>(null);
  // Per-topic progress (read from the same progress response as enrolment) for the card meters.
  const [progressById, setProgressById] = useState<Record<string, { percent: number; done: number }>>({});
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
      setEnrolledTopics([...DEMO_ENROLLED_TOPIC_IDS]);
    } else {
      fetch("/api/topics/progress")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.progress && Array.isArray(data.progress)) {
            const active = data.progress.map((p: any) => p.topic_id);
            setEnrolledTopics(active);
            const map: Record<string, { percent: number; done: number }> = {};
            data.progress.forEach((p: any) => {
              map[p.topic_id] = {
                percent: Number(p.progress_percent) || 0,
                done: Array.isArray(p.completed_lessons) ? p.completed_lessons.length : 0,
              };
            });
            setProgressById(map);
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
            icon: "learning",
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


  const totalLessons = TOPICS_DATA.reduce((acc, t) => acc + (t.totalLessons || 0), 0);

  return (
    <div className={styles.browseWrapper}>
      <AppNav />

      {/* ===== PAGE HEADER + SEARCH ===== */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Reveal className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>
                <span className={styles.kickerLine} aria-hidden="true" />
                Course library
              </span>
              <h1 className={styles.heroTitle}>
                What do you want to <GradientText>learn today?</GradientText>
              </h1>
              <p className={styles.heroSubtitle}>
                The complete CAT curriculum, from Quant to VARC, with past papers and full mocks below.
              </p>
            </div>

            <div className={styles.heroSide}>
              <label className={styles.searchBox}>
                <Search className={styles.searchIcon} size={18} aria-hidden="true" />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search 'Algebra', 'Reading Comprehension'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search courses"
                />
              </label>
              <dl className={styles.heroStats}>
                <div>
                  <dt>Courses</dt>
                  <dd>{TOPICS_DATA.length}</dd>
                </div>
                <div>
                  <dt>Lessons</dt>
                  <dd>{totalLessons}</dd>
                </div>
                <div>
                  <dt>Enrolled</dt>
                  <dd>{enrolledTopics.length}</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`${styles.mainContent} ${styles.container}`}>
        {/* Categories (only show if not searching) */}
        {!searchQuery && (
          <section className={styles.categorySection} aria-label="Browse by category">
            <div className={styles.sectionHeadRow}>
              <h2 className={styles.sectionTitle}>Browse by section</h2>
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
                View all <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>

            <RevealGroup className={styles.categoryGrid}>
              {CATEGORY_CARDS.map((c) => (
                <RevealItem key={c.key} className={styles.categoryItem}>
                  <SpotlightCard
                    tint={SECTION_TINT[c.key]}
                    className={styles.categoryCard}
                    data-section={c.key}
                    onClick={() => setSearchQuery(c.query)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSearchQuery(c.query);
                      }
                    }}
                    aria-label={c.aria}
                  >
                    <div className={styles.categoryTop}>
                      <span className={styles.sectionMarker} aria-hidden="true" />
                      <h3 className={styles.categoryCardTitle}>{c.label}</h3>
                      <span className={styles.categoryArrow} aria-hidden="true">
                        <ArrowRight size={16} />
                      </span>
                    </div>
                    <p className={styles.categoryStats}>
                      <span>{c.lessons}</span> lessons <span className={styles.statSep}>/</span>{" "}
                      <span>{c.topics}</span> topics
                    </p>
                    <p className={styles.categorySubtopics}>{c.subtopics}</p>
                    <SectionVignette k={c.key} />
                  </SpotlightCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        )}

        {/* PYQ Search Match Banner */}
        {matchesPYQ && (
          <Reveal className={`glass-card ${styles.pyqSearchResultBanner}`} data-tint="amber">
            <div className={styles.pyqSearchLeft}>
              <span className={styles.pyqSearchBadge}>
                <FileText size={14} aria-hidden="true" /> Past paper found
              </span>
              <h3 className={styles.pyqSearchTitle}>CAT 2024 official question papers</h3>
              <p className={styles.pyqSearchDesc}>
                Authentic questions across Slot 1, Slot 2 &amp; Slot 3. Covers VARC, DILR and Quantitative Ability with
                step-by-step verified solutions and timed, proctored attempts.
              </p>
            </div>
            <button
              type="button"
              className={styles.pyqSearchBtn}
              onClick={() => setSearchPYQModalOpen(true)}
            >
              <span>Explore CAT 2024 papers</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </Reveal>
        )}

        {/* Course Grid */}
        <div id="all-topics-section" className={styles.topicsHeaderRow}>
          <h2 className={styles.sectionTitle}>
            {searchQuery ? (
              <>
                Results for <span className={styles.queryEcho}>&ldquo;{searchQuery}&rdquo;</span>
              </>
            ) : (
              "All courses"
            )}
          </h2>
          {searchQuery ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryTab("All");
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to sections
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
                  <span className={styles.sortLabelPrefix}>Sort</span>
                  <span className={styles.sortLabelValue}>{sortBy}</span>
                  <ChevronDown
                    className={`${styles.sortChevron} ${sortDropdownOpen ? styles.sortChevronOpen : ""}`}
                    size={15}
                    aria-hidden="true"
                  />
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
                        {sortBy === opt && <Check size={15} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {filteredTopics.length === 0 ? (
          <div className={styles.noResults}>No courses match your search.</div>
        ) : (
          <RevealGroup className={styles.topicsGrid}>
            {filteredTopics.map((topic) => {
              const isEnrolled = enrolledTopics.includes(topic.id);
              const section = sectionOf(topic);
              const prog = isDemo
                ? { percent: topic.progressPercent || 0, done: topic.completedLessonsCount || 0 }
                : progressById[topic.id] || { percent: 0, done: 0 };
              const percent = Math.max(0, Math.min(100, Math.round(prog.percent)));

              return (
                <RevealItem key={topic.id} className={styles.topicItem}>
                  <SpotlightCard as="article" tint={SECTION_TINT[section]} className={styles.topicCard} data-section={section}>
                    {/* Banner */}
                    <div className={styles.cardBanner} style={{ background: topic.bannerGradient || "#1F2937" }}>
                      {topic.bannerImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={topic.bannerImage} alt={topic.title} className={styles.cardBannerBg} />
                      )}
                      <span className={styles.bannerShade} aria-hidden="true" />
                      <span className={styles.topicBadge}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {topic.category}
                      </span>
                      {isEnrolled && <span className={styles.enrolledFlag}>Enrolled</span>}
                    </div>

                    {/* Body */}
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{topic.title}</h3>
                      <p className={styles.cardDesc}>{topic.description}</p>

                      <div className={styles.instructorRow}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={topic.instructor.avatar} alt={topic.instructor.name} className={styles.instructorAvatar} />
                        <div className={styles.instructorInfo}>
                          <span className={styles.instructorName}>{topic.instructor.name}</span>
                          <span className={styles.instructorRole}>{topic.instructor.role}</span>
                        </div>
                      </div>

                      {isEnrolled ? (
                        <div className={styles.progressBlock}>
                          <div className={styles.progressHead}>
                            <span>
                              <b>{prog.done}</b>/{topic.totalLessons} lessons
                            </span>
                            <span className={styles.progressPct}>{percent}%</span>
                          </div>
                          <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className={styles.progressBlock}>
                          <div className={styles.progressHead}>
                            <span>
                              <b>{topic.totalLessons}</b> lessons
                            </span>
                            <span className={styles.progressMuted}>Not started</span>
                          </div>
                          <div className={styles.progressTrack} />
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        {isEnrolled ? (
                          <button
                            type="button"
                            className={`${styles.enrollBtn} ${styles.btnSecondary}`}
                            onClick={() => router.push(`/topics/${topic.id}`)}
                          >
                            {percent > 0 ? "Resume course" : "Go to course"}
                            <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.enrollBtn} ${styles.btnPrimary}`}
                            disabled={enrollingTopicId === topic.id}
                            onClick={() => handleEnroll(topic.id, topic.title)}
                          >
                            {enrollingTopicId === topic.id ? "Enrolling..." : "Enroll now"}
                            <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
        )}

        {/* Past papers & full mocks (rendered by PYQSection) */}
        {!searchQuery && (
          <div className={styles.pyqWrap}>
            <PYQSection />
          </div>
        )}
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
