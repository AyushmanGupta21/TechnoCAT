"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import AppNav from "@/components/app/AppNav";
import PageHeader, { pageHeaderStyles } from "@/components/app/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ENROLLED_TOPIC_IDS } from "@/lib/demo";
import styles from "./topics.module.css";

type SectionKey = "qa" | "dilr" | "varc" | "other";

/** Visual grouping only (marker colour). */
function sectionOf(t: { id: string; category: string }): SectionKey {
  const id = t.id.toLowerCase();
  const cat = t.category.toLowerCase();
  if (id.startsWith("qa-") || cat.includes("quant")) return "qa";
  if (id.startsWith("dilr-") || cat.includes("data") || cat.includes("dilr")) return "dilr";
  if (id.startsWith("varc-") || cat.includes("verbal") || cat.includes("varc")) return "varc";
  return "other";
}

const SECTION_ORDER: SectionKey[] = ["qa", "dilr", "varc", "other"];
const SECTION_LABEL: Record<SectionKey, string> = {
  qa: "Quant (QA)",
  dilr: "DILR",
  varc: "VARC",
  other: "Other courses",
};

const categories = [
  "All Topics",
  "Quantitative Aptitude",
  "Data Interpretation",
  "Verbal Ability",
  "Design & Illustration",
];

export default function TopicsListPage() {
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [userProgressMap, setUserProgressMap] = useState<Record<string, any>>({});
  const [loadingProgress, setLoadingProgress] = useState(!isDemo);

  useEffect(() => {
    if (!isDemo) {
      setLoadingProgress(true);
      fetch("/api/topics/progress")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.progress && Array.isArray(data.progress)) {
            const map: Record<string, any> = {};
            data.progress.forEach((p: any) => {
              map[p.topic_id] = p;
            });
            setUserProgressMap(map);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingProgress(false);
        });
    } else {
      setLoadingProgress(false);
    }
  }, [isDemo, user?.id]);

  // For real users, only topics present in userProgressMap are enrolled courses.
  // For the demo user, restrict to the demo-enrolled topics so unenrolled catalog items stay in Browse only.
  const enrolledTopics = useMemo(() => {
    if (isDemo) {
      return TOPICS_DATA.filter((topic: any) =>
        (DEMO_ENROLLED_TOPIC_IDS as readonly string[]).includes(topic.id)
      );
    }
    return TOPICS_DATA.filter((topic: any) => Boolean(userProgressMap[topic.id]));
  }, [isDemo, userProgressMap]);

  const filteredTopics = enrolledTopics.filter((topic: any) => {
    const matchesCategory =
      selectedCategory === "All Topics" || topic.category === selectedCategory;
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getProgress = (topic: any) => {
    const userProgress = userProgressMap[topic.id];
    const rawPercent = isDemo ? topic.progressPercent : userProgress ? userProgress.progress_percent : 0;
    const completedLessons = isDemo
      ? topic.completedLessonsCount
      : userProgress?.completed_lessons?.length || 0;
    const progressPercent = Math.max(0, Math.min(100, Math.round(Number(rawPercent) || 0)));
    return { progressPercent, completedLessons: Math.max(0, completedLessons || 0) };
  };

  /** First lesson not yet completed (same completion source as the progress figures). */
  const getNextLesson = (topic: any) => {
    const lessons: any[] = Array.isArray(topic.lessons) ? topic.lessons : [];
    if (isDemo) return lessons.find((l) => !l.completed) || null;
    const done: unknown = userProgressMap[topic.id]?.completed_lessons;
    const doneIds = new Set(Array.isArray(done) ? (done as string[]) : []);
    return lessons.find((l) => !doneIds.has(l.id)) || null;
  };

  const summary = enrolledTopics.reduce(
    (acc: { lessons: number; done: number }, t: any) => {
      acc.lessons += t.totalLessons || 0;
      acc.done += getProgress(t).completedLessons;
      return acc;
    },
    { lessons: 0, done: 0 }
  );
  const overallPercent = summary.lessons > 0 ? Math.min(100, Math.round((summary.done / summary.lessons) * 100)) : 0;

  // Course states and per-section lesson totals for the progress panel
  const courseStates = enrolledTopics.reduce(
    (acc: { done: number; active: number; fresh: number }, t: any) => {
      const p = getProgress(t).progressPercent;
      if (p >= 100) acc.done += 1;
      else if (p > 0) acc.active += 1;
      else acc.fresh += 1;
      return acc;
    },
    { done: 0, active: 0, fresh: 0 }
  );
  const sectionTotals = SECTION_ORDER.map((key) => {
    const inSection = enrolledTopics.filter((t: any) => sectionOf(t) === key);
    const lessons = inSection.reduce((n: number, t: any) => n + (t.totalLessons || 0), 0);
    const done = inSection.reduce((n: number, t: any) => n + getProgress(t).completedLessons, 0);
    return { key, courses: inSection.length, lessons, done, percent: lessons > 0 ? Math.min(100, Math.round((done / lessons) * 100)) : 0 };
  }).filter((s) => s.courses > 0);

  const showEmpty = !isDemo && !loadingProgress && enrolledTopics.length === 0;
  const showRail = enrolledTopics.length > 0;

  return (
    <div className={styles.topicsWrapper}>
      <AppNav />

      <div className={styles.page}>
        {/* ===== PAGE HEADER ===== */}
        <PageHeader
          eyebrow="Your learning"
          title="My"
          accent="topics"
          subtitle="Your enrolled courses, where you left off, and how far you have come."
          aside={
            <dl className={styles.summaryStats}>
              <div>
                <dt>Enrolled</dt>
                <dd>{enrolledTopics.length}</dd>
              </div>
              <div>
                <dt>Lessons done</dt>
                <dd>
                  {summary.done}
                  <span>/{summary.lessons}</span>
                </dd>
              </div>
            </dl>
          }
          actions={
            <Link href="/browse" className={pageHeaderStyles.primaryAction}>
              Browse courses
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        />

        {showEmpty ? (
          <Reveal className={`glass-card ${styles.emptyEnrollmentCard}`} data-tint="blue">
            <span className={styles.emptyIcon} aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <h2 className={styles.emptyEnrollmentTitle}>You haven&apos;t enrolled in a course yet</h2>
            <p className={styles.emptyEnrollmentDesc}>
              Pick a course from the library across Quantitative Aptitude, DILR and VARC. Once you enroll, it shows up
              here with your progress and a one-click resume.
            </p>
            <Link href="/browse" className={styles.primaryBtn}>
              <span>Browse and enroll</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>
        ) : (
          <>
            {/* ===== TOOLBAR: category tabs left, search right ===== */}
            <div className={styles.toolbar}>
              <div className={styles.categoryTabs} role="tablist" aria-label="Filter by category">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className={styles.searchBox}>
                <Search className={styles.searchIcon} size={16} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search your courses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search your courses"
                />
              </label>
            </div>

            {/* ===== MAIN (courses) + RIGHT COLUMN (progress) ===== */}
            <div className={`${styles.layout} ${showRail ? "" : styles.layoutSingle}`}>
              <main data-sticky-col className={styles.mainCol}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Enrolled courses</h2>
                  {!loadingProgress && enrolledTopics.length > 0 && (
                    <span className={styles.sectionCount}>
                      <b>{filteredTopics.length}</b> of <b>{enrolledTopics.length}</b>
                    </span>
                  )}
                </div>

                {filteredTopics.length === 0 ? (
                  <div className={styles.noResults}>
                    {loadingProgress ? "Loading your courses..." : "No enrolled courses match your filter or search."}
                  </div>
                ) : (
                  <RevealGroup className={styles.rowList}>
                    {filteredTopics.map((topic: any) => {
                      const { progressPercent, completedLessons } = getProgress(topic);
                      const section = sectionOf(topic);
                      const started = progressPercent > 0;
                      const next = progressPercent < 100 ? getNextLesson(topic) : null;

                      return (
                        <RevealItem key={topic.id}>
                          <Link href={`/topics/${topic.id}`} className={styles.topicRow} data-section={section}>
                            {/* Thumbnail */}
                            <div className={styles.rowThumb} style={{ background: topic.bannerGradient || "#1F2937" }}>
                              {topic.bannerImage && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={topic.bannerImage} alt={topic.title} className={styles.cardImage} />
                              )}
                            </div>

                            {/* Title + meta */}
                            <div className={styles.rowMain}>
                              <span className={styles.categoryBadge}>
                                <span className={styles.badgeDot} aria-hidden="true" />
                                {topic.category}
                              </span>
                              <h3 className={styles.cardTitle}>{topic.title}</h3>
                              <div className={styles.instructorRow}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={topic.instructor.avatar} alt={topic.instructor.name} className={styles.instructorAvatar} />
                                <span className={styles.instructorName}>{topic.instructor.name}</span>
                                <span className={styles.instructorRole}>{topic.instructor.role}</span>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className={styles.rowProgress}>
                              <div className={styles.progressHeader}>
                                <span className={styles.progressLabel}>
                                  <b>{completedLessons}</b>/{topic.totalLessons} lessons
                                </span>
                                <span className={styles.progressPercent}>{progressPercent}%</span>
                              </div>
                              <div className={styles.progressBarBg}>
                                <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                              </div>
                              {next && (
                                <p className={styles.nextLesson}>
                                  <span className={styles.nextLabel}>Next</span>
                                  {next.code && <span className={styles.nextCode}>{next.code}</span>}
                                  <span className={styles.nextTitle}>{next.title}</span>
                                </p>
                              )}
                            </div>

                            {/* Resume */}
                            <span className={styles.cardActionBtn}>
                              <span>{started ? "Resume" : "Start"}</span>
                              <ArrowRight size={16} aria-hidden="true" />
                            </span>
                          </Link>
                        </RevealItem>
                      );
                    })}
                  </RevealGroup>
                )}
              </main>

              {/* ===== RIGHT COLUMN: overall progress ===== */}
              {showRail && (
                <aside data-sticky-col className={styles.railCol} aria-label="Your progress">
                  <Reveal className={`glass-card ${styles.railCard}`} data-tint="blue" delay={0.08}>
                    <h2 className={styles.railTitle}>Your progress</h2>

                    <div className={styles.overall}>
                      <span className={styles.overallValue}>
                        {overallPercent}
                        <span>%</span>
                      </span>
                      <span className={styles.overallLabel}>
                        <b>{summary.done}</b> of <b>{summary.lessons}</b> lessons completed
                      </span>
                    </div>
                    <div className={styles.overallBar} aria-hidden="true">
                      <div className={styles.overallFill} style={{ width: `${overallPercent}%` }} />
                    </div>

                    <dl className={styles.stateRow}>
                      <div>
                        <dt>In progress</dt>
                        <dd>{courseStates.active}</dd>
                      </div>
                      <div>
                        <dt>Not started</dt>
                        <dd>{courseStates.fresh}</dd>
                      </div>
                      <div>
                        <dt>Completed</dt>
                        <dd>{courseStates.done}</dd>
                      </div>
                    </dl>

                    <h3 className={styles.railSubTitle}>By section</h3>
                    <ul className={styles.sectionList}>
                      {sectionTotals.map((s) => (
                        <li key={s.key} className={styles.sectionItem} data-section={s.key}>
                          <div className={styles.sectionItemHead}>
                            <span className={styles.sectionName}>
                              <span className={styles.badgeDot} aria-hidden="true" />
                              {SECTION_LABEL[s.key]}
                            </span>
                            <span className={styles.sectionFigures}>
                              <b>{s.done}</b>/{s.lessons}
                              <span className={styles.sectionPct}>{s.percent}%</span>
                            </span>
                          </div>
                          <div className={styles.progressBarBg}>
                            <div className={styles.progressBarFill} style={{ width: `${s.percent}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </aside>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
