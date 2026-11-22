"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarDays,
  CircleCheck,
  CircleMinus,
  Clock,
  Download,
  FileText,
  Flame,
  GraduationCap,
  Lock,
  Puzzle,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { GradientText, Reveal, RevealGroup, RevealItem, CountUp, type Tint } from "@/components/landing/motion";
import MetricInspectorModal, { type MetricId } from "@/components/MetricInspectorModal";
import TopicQuizModal from "@/components/TopicQuizModal";
import type { StudentMetrics, SectionKey, TestRecord, ConceptStat } from "@/lib/metrics/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import styles from "./analytics.module.css";

// My Analytics: history & performance. Every number comes from GET /api/me/metrics
// (src/lib/metrics/compute.ts defines each metric); demo and real accounts share this code path.

type Timeframe = "7d" | "30d" | "all";
type KindFilter = "all" | TestRecord["kind"];
type Tab = "overview" | "topics" | "mocks" | "achievements";

const SECTIONS: SectionKey[] = ["VARC", "DILR", "QA"];
const SECTION_NAMES: Record<SectionKey, string> = {
  QA: "Quantitative Ability",
  DILR: "Data Interpretation & Logical Reasoning",
  VARC: "Verbal Ability & Reading Comprehension",
};
// App-wide section colours (globals.css --data-*): VARC blue, DILR teal, QA violet.
const SECTION_COLORS: Record<SectionKey, string> = { VARC: "#3b82f6", DILR: "#14b8a6", QA: "#8b5cf6" };
const SECTION_TINTS: Record<SectionKey, Tint> = { VARC: "blue", DILR: "teal", QA: "violet" };
const LESSON_COLOR = "#3b82f6";
const PRACTICE_COLOR = "#f59e0b";
const KIND_LABELS: Record<TestRecord["kind"], string> = {
  pyq: "PYQ section",
  module_quiz: "Module quiz",
  grand_quiz: "Grand quiz",
  lesson_practice: "Lesson practice",
  topic_drill: "Practice drills",
};
const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pyq", label: "PYQ sections" },
  { id: "module_quiz", label: "Module quizzes" },
  { id: "grand_quiz", label: "Grand quizzes" },
  { id: "lesson_practice", label: "Lesson practice" },
];
const TIMEFRAME_LABELS: Record<Timeframe, string> = { "7d": "Last 7 days", "30d": "Last 30 days", all: "All time" };
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ACTIVE_SECONDS = 120;

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "topics", label: "Courses & concepts", Icon: Target },
  { id: "mocks", label: "Test history", Icon: FileText },
  { id: "achievements", label: "Badges & certificate", Icon: Award },
];

const BADGE_ICONS: Record<string, { Icon: LucideIcon; tint: Tint }> = {
  trophy: { Icon: Trophy, tint: "amber" },
  puzzle: { Icon: Puzzle, tint: "violet" },
  flame: { Icon: Flame, tint: "coral" },
  trend: { Icon: TrendingUp, tint: "teal" },
  bolt: { Icon: Zap, tint: "blue" },
  star: { Icon: Star, tint: "amber" },
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e4e9f2",
  boxShadow: "0 12px 28px -12px rgba(23, 47, 110, 0.25)",
  fontSize: 12,
  fontFamily: "var(--ff-sans)",
  padding: "8px 12px",
};
const AXIS_TICK = { fill: "#66708a", fontSize: 11, fontFamily: "var(--ff-mono)" };

function fmtDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
}

function fmtPace(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDayShort(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadTestHistoryCsv(tests: TestRecord[], timeframe: Timeframe) {
  const header = [
    "Date", "Test", "Type", "Section", "Score", "Max score", "Score %", "Correct", "Wrong", "Answered",
    "Questions", "Accuracy %", "Duration (s)", "Seconds per question", "Estimated percentile", "Passed",
  ];
  const lines = tests.map((t) =>
    [
      t.submittedAt, t.title, KIND_LABELS[t.kind], t.section, t.score, t.maxScore, t.percentage, t.correct, t.wrong,
      t.attempted, t.questionCount, t.accuracy, t.durationSeconds, t.secondsPerQuestion, t.estimatedPercentile,
      t.passed === null ? "" : t.passed ? "Yes" : "No",
    ].map(csvCell).join(",")
  );
  const csv = "\uFEFF" + [header.join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `technocat-test-history-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function SectionChip({ section }: { section: SectionKey | null | undefined }) {
  const color = section ? SECTION_COLORS[section] : "#98a1b5";
  return (
    <span className={styles.sectionChip} style={{ "--chip": color } as React.CSSProperties}>
      {section ?? "Other"}
    </span>
  );
}

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab");

  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loadError, setLoadError] = useState<"unauthorized" | "failed" | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | SectionKey>("ALL");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTabParam === "achievements"
      ? "achievements"
      : initialTabParam === "history" || initialTabParam === "mocks"
      ? "mocks"
      : initialTabParam === "topics"
      ? "topics"
      : "overview"
  );
  const [inspectingMetricId, setInspectingMetricId] = useState<MetricId | null>(null);
  const [activeQuizModal, setActiveQuizModal] = useState<{ topicId: string; topicTitle: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    fetch("/api/me/metrics")
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 401) return setLoadError("unauthorized");
        if (!r.ok) return setLoadError("failed");
        setMetrics((await r.json()) as StudentMetrics);
      })
      .catch(() => {
        if (!cancelled) setLoadError("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDrill = (topicId: string, topicTitle: string) => {
    setActiveQuizModal({ topicId, topicTitle });
  };

  // ── Tests: union of recent (all kinds, capped) and every PYQ, newest first ──
  const allTests = useMemo(() => {
    if (!metrics) return [];
    const byId = new Map<string, TestRecord>();
    for (const t of [...metrics.tests.recent, ...metrics.tests.pyq]) byId.set(t.attemptId, t);
    return [...byId.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [metrics]);

  const periodTests = useMemo(() => {
    if (!metrics || timeframe === "all") return allTests;
    const cutoff = Date.parse(metrics.generatedAt) - (timeframe === "7d" ? 7 : 30) * DAY_MS;
    return allTests.filter((t) => Date.parse(t.submittedAt) >= cutoff);
  }, [allTests, metrics, timeframe]);

  const visibleTests = useMemo(
    () => (kindFilter === "all" ? periodTests : periodTests.filter((t) => t.kind === kindFilter)),
    [periodTests, kindFilter]
  );

  const scoreTrend = useMemo(
    () =>
      [...visibleTests]
        .reverse()
        .map((t) => {
          const label = new Date(t.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return { name: `${label} · ${t.title}`, label, percentage: t.percentage };
        }),
    [visibleTests]
  );

  // ── Daily study (the API provides the last 30 days) ──
  const windowDays: 7 | 30 = timeframe === "7d" ? 7 : 30;
  const dailyWindow = useMemo(() => (metrics ? metrics.studyTime.daily.slice(-windowDays) : []), [metrics, windowDays]);
  const activityData = useMemo(
    () =>
      dailyWindow.map((d) => ({
        day: fmtDayShort(d.date),
        learning: Math.round(d.learningSeconds / 60),
        practice: Math.round(d.practiceSeconds / 60),
      })),
    [dailyWindow]
  );
  const windowTotalSeconds = dailyWindow.reduce((s, d) => s + d.learningSeconds + d.practiceSeconds, 0);

  // ── Study time by section (all time, from course study time) ──
  const knowledgeData = useMemo(() => {
    if (!metrics) return [];
    const secs: Record<string, number> = { QA: 0, DILR: 0, VARC: 0, OTHER: 0 };
    for (const t of metrics.courses.topics) secs[t.section ?? "OTHER"] += t.studySeconds;
    const total = Object.values(secs).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    const rows = [
      { key: "QA", name: "Quantitative Ability", color: SECTION_COLORS.QA },
      { key: "DILR", name: "DILR", color: SECTION_COLORS.DILR },
      { key: "VARC", name: "VARC", color: SECTION_COLORS.VARC },
      { key: "OTHER", name: "Other courses", color: "#98a1b5" },
    ];
    return rows
      .filter((r) => secs[r.key] > 0)
      .map((r) => ({ name: r.name, color: r.color, value: Math.round((secs[r.key] / total) * 100), hours: fmtDuration(secs[r.key]) }));
  }, [metrics]);

  // ── Topics & concepts ──
  const filteredTopics = useMemo(
    () => (metrics ? metrics.courses.topics.filter((t) => sectionFilter === "ALL" || t.section === sectionFilter) : []),
    [metrics, sectionFilter]
  );
  const concepts = useMemo(() => {
    if (!metrics) return [] as (ConceptStat & { tier: "weak" | "strong" | "steady" })[];
    // Every concept with at least 3 answers; tier marks weak (<60%) and strong (≥80%) ones.
    return metrics.concepts.all
      .map((c) => ({ ...c, tier: (c.accuracy < 60 ? "weak" : c.accuracy >= 80 ? "strong" : "steady") as "weak" | "strong" | "steady" }))
      .filter((c) => sectionFilter === "ALL" || c.section === sectionFilter);
  }, [metrics, sectionFilter]);
  const topicForSection = (section: SectionKey | null) =>
    section && metrics ? metrics.courses.topics.find((t) => t.section === section) ?? null : null;

  // ── Badges: simple, fixed criteria on real metrics ──
  const badges = useMemo(() => {
    if (!metrics) return [];
    const sectionsAttempted = SECTIONS.filter((s) => metrics.sections[s].pyqAttempts > 0).length;
    const list = [
      { id: "first-pyq", title: "First PYQ section", desc: "Submit your first CAT past-year (PYQ) section.", icon: "trophy", current: metrics.tests.pyq.length, target: 1, unit: "section" },
      { id: "all-sections", title: "All-rounder", desc: "Attempt a PYQ section in each of VARC, DILR and QA.", icon: "puzzle", current: sectionsAttempted, target: 3, unit: "sections" },
      { id: "streak-7", title: "7-day streak", desc: "Study on 7 consecutive days (at least 2 minutes a day). Counts your best streak.", icon: "flame", current: metrics.streak.best, target: 7, unit: "days" },
      { id: "lessons-10", title: "10 lessons completed", desc: "Complete 10 lessons in any course.", icon: "trend", current: metrics.courses.lessonsCompleted, target: 10, unit: "lessons" },
      { id: "modules-3", title: "Module finisher", desc: "Pass 3 different module quizzes.", icon: "bolt", current: metrics.tests.modulesPassed, target: 3, unit: "modules" },
      { id: "accuracy-80", title: "Sharp shooter", desc: "Reach 80% overall accuracy in timed tests (at least 5 answers).", icon: "star", current: metrics.accuracy.overall ?? 0, target: 80, unit: "%" },
    ];
    return list.map((b) => {
      const unlocked = b.current >= b.target;
      const progress = b.unit === "%" ? (metrics.accuracy.overall === null ? "no accuracy yet" : `${b.current}% / 80%`) : `${Math.min(b.current, b.target)}/${b.target} ${b.unit}`;
      return { ...b, unlocked, progress: Math.min(1, b.current / b.target), status: unlocked ? "Unlocked · criterion met" : progress };
    });
  }, [metrics]);

  // Certificate progress = syllabus coverage (lessons completed in the VARC, DILR and QA courses).
  const syllabusDone = metrics?.courses.syllabusLessonsCompleted ?? 0;
  const syllabusLessons = metrics?.courses.syllabusLessons ?? 0;
  const certPercent = syllabusLessons > 0 ? Math.min(100, Math.round((syllabusDone / syllabusLessons) * 100)) : 0;

  // ── KPI values ──
  const m = metrics;
  const pace = m?.speed.secondsPerQuestion ?? null;
  const bench = m?.speed.benchmarkSecondsPerQuestion ?? 109;
  const anyPercentileShown = m ? m.percentile.overallEstimate !== null || SECTIONS.some((s) => m.sections[s].estimatedPercentile !== null) : false;
  const sectionsWithData = m ? SECTIONS.filter((s) => m.sections[s].attempted > 0 || m.sections[s].pyqAttempts > 0) : [];
  const last14 = m ? m.studyTime.daily.slice(-14) : [];
  const last7 = m ? m.studyTime.daily.slice(-7) : [];
  const last7Max = Math.max(1, ...last7.map((d) => d.learningSeconds + d.practiceSeconds));
  const recentPyqs = m ? [...m.tests.pyq].slice(0, 8).reverse() : [];
  const recentPyqMaxWrong = Math.max(1, ...recentPyqs.map((t) => t.wrong));

  const emptyBox = (title: string, text: string, cta?: { href: string; label: string }) => (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateText}>{text}</p>
      {cta && (
        <Link href={cta.href} className={`${styles.btn} ${styles.btnPrimary}`}>
          <span>{cta.label}</span>
        </Link>
      )}
    </div>
  );

  return (
    <div className={styles.analyticsWrapper}>
      <AppNav />

      {/* ===== PAGE HEADER ===== */}
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <RevealGroup className={styles.pageHeaderRow}>
            <div className={styles.pageHeaderText}>
              <RevealItem>
                <h1 className={styles.pageTitle}>
                  My performance <GradientText>analytics</GradientText>
                </h1>
              </RevealItem>
              <RevealItem>
                <p className={styles.pageSubtitle}>
                  Test history, accuracy, pace and estimated percentile from your recorded activity. Click any card to see how it is calculated.
                </p>
              </RevealItem>
            </div>
            <RevealItem className={styles.pageActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                disabled={periodTests.length === 0}
                title={
                  periodTests.length === 0
                    ? "No tests in the selected period to export"
                    : `Download ${periodTests.length} test${periodTests.length === 1 ? "" : "s"} (${TIMEFRAME_LABELS[timeframe]}) as CSV`
                }
                onClick={() => downloadTestHistoryCsv(periodTests, timeframe)}
              >
                <Download size={16} strokeWidth={2.2} aria-hidden="true" />
                Export CSV
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleDrill("qa-quantitative-ability", "CAT Diagnostic Drill")}>
                <Zap size={16} strokeWidth={2.2} aria-hidden="true" />
                Drill weak areas
              </button>
            </RevealItem>
          </RevealGroup>

          {/* View tabs */}
          <Reveal delay={0.1} className={styles.tabsRow}>
            <div className={styles.viewTabs} role="tablist" aria-label="Analytics views">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className={`${styles.viewTab} ${activeTab === id ? styles.viewTabActive : ""}`}
                >
                  <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Timeframe: filters test history, daily study charts and the CSV export */}
            {m && (activeTab === "overview" || activeTab === "mocks") && (
              <div className={styles.timeframeGroup}>
                <span className={styles.timeframeHint}>
                  <Clock size={14} strokeWidth={2.2} aria-hidden="true" />
                  {activeTab === "overview" ? "Applies to the daily study chart and daily average" : "Applies to the test list, score trend and CSV export"}
                </span>
                <div className={styles.segmented} role="group" aria-label="Analysis period">
                  {(["7d", "30d", "all"] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      aria-pressed={timeframe === tf}
                      className={`${styles.segment} ${timeframe === tf ? styles.segmentActive : ""}`}
                    >
                      {TIMEFRAME_LABELS[tf]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </header>

      {/* ===== MAIN ANALYTICS CONTENT ===== */}
      <main className={`${styles.container} ${styles.mainContent}`}>
        {!m ? (
          loadError === "unauthorized" ? (
            emptyBox("Please sign in", "Sign in to see your performance history and analytics.", { href: "/", label: "Go to sign in" })
          ) : loadError === "failed" ? (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>Could not load your analytics</h3>
              <p className={styles.emptyStateText}>Something went wrong while loading your metrics. Please try again.</p>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : (
            <div className={styles.loadingState} aria-busy="true">
              <span className={styles.loadingBar} />
              <span className={styles.loadingText}>Loading your analytics…</span>
            </div>
          )
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* Headline indicators (all time) */}
                <section aria-labelledby="kpi-heading">
                  <div className={styles.sectionHead}>
                    <h2 id="kpi-heading" className={styles.sectionTitle}>
                      Core indicators
                    </h2>
                    <span className={styles.sectionMeta}>All time</span>
                  </div>

                  <RevealGroup className={styles.statGrid}>
                    {/* 1. Estimated percentile (featured) */}
                    <RevealItem className={styles.statCellFeatured}>
                      <button
                        type="button"
                        className={`${styles.statCard} ${styles.statFeatured}`}
                        onClick={() => setInspectingMetricId("percentile")}
                        title={m.percentile.disclaimer}
                      >
                        <span className={styles.statLabel}>
                          <Target size={16} strokeWidth={2.2} aria-hidden="true" />
                          Estimated CAT percentile
                          <ArrowUpRight size={16} className={styles.statArrow} aria-hidden="true" />
                        </span>
                        <span className={styles.statValueRow}>
                          {m.percentile.overallEstimate !== null ? (
                            <>
                              <CountUp
                                to={m.percentile.overallEstimate}
                                decimals={Number.isInteger(m.percentile.overallEstimate) ? 0 : 1}
                                className={styles.statValueXL}
                              />
                              <span className={styles.statUnit}>%ile</span>
                            </>
                          ) : (
                            <span className={styles.statValueXL}>—</span>
                          )}
                        </span>
                        <span className={styles.statSub}>
                          {m.percentile.overallEstimate !== null
                            ? `From an overall PYQ score of ${m.percentile.overallScore} / ${SECTIONS.reduce((s, k) => s + m.sections[k].maxScore, 0)}`
                            : m.percentile.basis}
                        </span>

                        {/* Percentile scale */}
                        <span className={styles.pctScale} aria-hidden="true">
                          <span className={styles.pctTrack} />
                          {m.percentile.overallEstimate !== null && (
                            <span className={styles.pctMarker} style={{ left: `${Math.min(100, Math.max(0, m.percentile.overallEstimate))}%` }} />
                          )}
                          <span className={styles.pctTicks}>
                            <span>0</span>
                            <span>50</span>
                            <span>90</span>
                            <span>100</span>
                          </span>
                        </span>

                        <span className={styles.pctSections}>
                          {SECTIONS.map((s) => (
                            <span key={s} className={styles.pctSection}>
                              <span className={styles.pctSectionDot} style={{ background: SECTION_COLORS[s] }} />
                              <span className={styles.pctSectionName}>{s}</span>
                              <span className={styles.pctSectionVal}>
                                {m.sections[s].estimatedPercentile !== null ? m.sections[s].estimatedPercentile : "—"}
                              </span>
                            </span>
                          ))}
                        </span>

                        <span className={styles.statFoot}>
                          <span className={`${styles.dot} ${m.percentile.overallEstimate !== null ? styles.dotLight : styles.dotWarn}`} />
                          {m.percentile.overallEstimate !== null
                            ? "Estimated"
                            : `${SECTIONS.filter((s) => m.sections[s].latestScore !== null).length}/3 sections attempted`}
                        </span>
                        <span className={styles.featuredDisclaimer}>{m.percentile.disclaimer}</span>
                      </button>
                    </RevealItem>

                    {/* 2. Accuracy */}
                    <RevealItem className={styles.statCell}>
                      <button
                        type="button"
                        className={`glass-card ${styles.statCard}`}
                        data-tint="teal"
                        onClick={() => setInspectingMetricId("accuracy")}
                        title="See how accuracy is calculated"
                      >
                        <span className={styles.statLabel}>
                          <TrendingUp size={16} strokeWidth={2.2} className={styles.iconTeal} aria-hidden="true" />
                          Overall accuracy
                          <ArrowUpRight size={16} className={styles.statArrow} aria-hidden="true" />
                        </span>
                        <span className={styles.statValueRow}>
                          {m.accuracy.overall !== null ? (
                            <>
                              <CountUp to={m.accuracy.overall} className={styles.statValue} />
                              <span className={styles.statUnitDark}>%</span>
                            </>
                          ) : (
                            <span className={styles.statValue}>—</span>
                          )}
                        </span>
                        <span className={styles.splitBar} aria-hidden="true">
                          <span style={{ flexGrow: m.accuracy.correct || 0, background: "var(--data-emerald)" }} />
                          <span style={{ flexGrow: Math.max(0, m.accuracy.attempted - m.accuracy.correct), background: "var(--data-coral)" }} />
                          {m.accuracy.attempted === 0 && <span style={{ flexGrow: 1, background: "var(--line)" }} />}
                        </span>
                        <span className={styles.statSubDark}>
                          {m.accuracy.overall !== null
                            ? `${m.accuracy.correct} of ${m.accuracy.attempted} answered questions correct (timed tests)`
                            : `Answer at least 5 questions in timed tests (PYQ sections or quizzes) to see your accuracy. So far: ${m.accuracy.attempted}.`}
                        </span>
                        <span className={styles.statFootDark}>
                          <span className={`${styles.dot} ${m.accuracy.overall !== null && m.accuracy.overall >= 60 ? styles.dotGood : styles.dotBad}`} />
                          {m.accuracy.overall === null ? "Not enough answers" : m.accuracy.overall >= 80 ? "Strong (80%+)" : m.accuracy.overall >= 60 ? "Moderate (60–80%)" : "Needs work (below 60%)"}
                        </span>
                      </button>
                    </RevealItem>

                    {/* 3. Pace */}
                    <RevealItem className={styles.statCell}>
                      <button
                        type="button"
                        className={`glass-card ${styles.statCard}`}
                        data-tint="violet"
                        onClick={() => setInspectingMetricId("speed")}
                        title="See how pace is calculated"
                      >
                        <span className={styles.statLabel}>
                          <Timer size={16} strokeWidth={2.2} className={styles.iconViolet} aria-hidden="true" />
                          Pace per question
                          <ArrowUpRight size={16} className={styles.statArrow} aria-hidden="true" />
                        </span>
                        <span className={styles.statValueRow}>
                          <span className={styles.statValue}>{pace !== null ? fmtPace(pace) : "—"}</span>
                          {pace !== null && <span className={styles.statUnitDark}>/ Q</span>}
                        </span>
                        {pace !== null && (
                          <span className={styles.paceBars} aria-hidden="true">
                            <span className={styles.paceRow}>
                              <span className={styles.paceKey}>You</span>
                              <span className={styles.paceTrack}>
                                <span style={{ width: `${(pace / Math.max(pace, bench)) * 100}%`, background: "var(--data-violet)" }} />
                              </span>
                            </span>
                            <span className={styles.paceRow}>
                              <span className={styles.paceKey}>CAT</span>
                              <span className={styles.paceTrack}>
                                <span style={{ width: `${(bench / Math.max(pace, bench)) * 100}%`, background: "var(--ink-4)" }} />
                              </span>
                            </span>
                          </span>
                        )}
                        <span className={styles.statSubDark}>
                          {pace !== null ? `CAT pace: ${fmtPace(bench)} / Q (120 min for 66 questions)` : "Take a timed test (PYQ section or quiz) to measure your pace."}
                        </span>
                        <span className={styles.statFootDark}>
                          <span className={`${styles.dot} ${styles.dotInfo}`} />
                          {pace === null
                            ? "No timed tests yet"
                            : pace === bench
                            ? "Exactly at CAT pace"
                            : `${Math.abs(pace - bench)}s ${pace > bench ? "slower" : "faster"} than CAT pace`}
                        </span>
                      </button>
                    </RevealItem>

                    {/* 4. Negative marks */}
                    <RevealItem className={styles.statCell}>
                      <button
                        type="button"
                        className={`glass-card ${styles.statCard}`}
                        data-tint="coral"
                        onClick={() => setInspectingMetricId("negativeMarking")}
                        title="See how negative marks are counted"
                      >
                        <span className={styles.statLabel}>
                          <CircleMinus size={16} strokeWidth={2.2} className={styles.iconCoral} aria-hidden="true" />
                          Marks lost to negatives
                          <ArrowUpRight size={16} className={styles.statArrow} aria-hidden="true" />
                        </span>
                        <span className={styles.statValueRow}>
                          <span className={`${styles.statValue} ${styles.valueCoral}`}>{m.tests.pyq.length ? `−${m.accuracy.negativeMarksLost}` : "—"}</span>
                          {m.tests.pyq.length > 0 && <span className={styles.statUnitDark}>marks</span>}
                        </span>
                        {recentPyqs.length > 0 && (
                          <span className={styles.miniBars} aria-hidden="true">
                            {recentPyqs.map((t) => (
                              <span key={t.attemptId} style={{ height: `${Math.max(8, (t.wrong / recentPyqMaxWrong) * 100)}%` }} />
                            ))}
                          </span>
                        )}
                        <span className={styles.statSubDark}>
                          {m.tests.pyq.length
                            ? `${m.accuracy.negativeMarksLost} wrong MCQ answer${m.accuracy.negativeMarksLost === 1 ? "" : "s"} in PYQ sections, −1 each`
                            : "Attempt a PYQ section to track negative marking."}
                        </span>
                        <span className={styles.statFootDark}>
                          <span className={`${styles.dot} ${styles.dotBad}`} />
                          {m.tests.pyq.length ? `Across ${m.tests.pyq.length} PYQ section${m.tests.pyq.length === 1 ? "" : "s"} · TITA has no penalty` : "No PYQ sections yet"}
                        </span>
                      </button>
                    </RevealItem>
                  </RevealGroup>
                </section>

                {/* Study habits */}
                <section aria-labelledby="habits-heading">
                  <div className={styles.sectionHead}>
                    <h2 id="habits-heading" className={styles.sectionTitle}>
                      Study habits
                    </h2>
                    <span className={styles.sectionMeta}>Click for day-by-day logs</span>
                  </div>

                  <RevealGroup className={styles.habitsGrid}>
                    <RevealItem>
                      <button type="button" className={`glass-card ${styles.habitCard}`} data-tint="blue" onClick={() => setInspectingMetricId("dailyAverage")}>
                        <span className={styles.habitTitle}>
                          <Clock size={16} strokeWidth={2.2} className={styles.iconBlue} aria-hidden="true" />
                          Daily average
                        </span>
                        <span className={styles.habitValue}>
                          {fmtDuration(Math.round(windowTotalSeconds / windowDays))}
                          <small> / day</small>
                        </span>
                        <span className={styles.habitMeta}>
                          {fmtDuration(windowTotalSeconds)} over the last {windowDays} days
                        </span>
                      </button>
                    </RevealItem>

                    <RevealItem>
                      <button type="button" className={`glass-card ${styles.habitCard}`} data-tint="amber" onClick={() => setInspectingMetricId("weeklyVolume")}>
                        <span className={styles.habitTitle}>
                          <CalendarDays size={16} strokeWidth={2.2} className={styles.iconAmber} aria-hidden="true" />
                          Last 7 days
                        </span>
                        <span className={styles.habitValueRow}>
                          <span className={styles.habitValue}>{fmtDuration(m.studyTime.last7DaysSeconds)}</span>
                          <span className={styles.weekBars} aria-hidden="true">
                            {last7.map((d) => (
                              <span key={d.date} style={{ height: `${Math.max(6, ((d.learningSeconds + d.practiceSeconds) / last7Max) * 100)}%` }} />
                            ))}
                          </span>
                        </span>
                        <span className={styles.habitMeta}>Today: {fmtDuration(m.studyTime.todaySeconds)}</span>
                      </button>
                    </RevealItem>

                    <RevealItem>
                      <button type="button" className={`glass-card ${styles.habitCard}`} data-tint="teal" onClick={() => setInspectingMetricId("consistency")}>
                        <span className={styles.habitTitle}>
                          <CircleCheck size={16} strokeWidth={2.2} className={styles.iconTeal} aria-hidden="true" />
                          Consistency
                        </span>
                        <span className={styles.habitValue}>
                          {m.consistency.activeDaysLast14}
                          <small> / 14 days</small>
                        </span>
                        <span className={styles.dayCells} aria-hidden="true">
                          {last14.map((d) => (
                            <span key={d.date} className={d.learningSeconds + d.practiceSeconds >= MIN_ACTIVE_SECONDS ? styles.dayOn : ""} />
                          ))}
                        </span>
                        <span className={styles.habitMeta}>{m.consistency.score}% of the last 14 days active</span>
                      </button>
                    </RevealItem>

                    <RevealItem>
                      <button type="button" className={`glass-card ${styles.habitCard}`} data-tint="coral" onClick={() => setInspectingMetricId("streak")}>
                        <span className={styles.habitTitle}>
                          <Flame size={16} strokeWidth={2.2} className={styles.iconCoral} aria-hidden="true" />
                          Study streak
                        </span>
                        <span className={styles.habitValue}>
                          {m.streak.current}
                          <small> day{m.streak.current === 1 ? "" : "s"}</small>
                        </span>
                        <span className={styles.streakTrack} aria-hidden="true">
                          <span style={{ width: `${m.streak.best > 0 ? Math.min(100, (m.streak.current / m.streak.best) * 100) : 0}%` }} />
                        </span>
                        <span className={styles.habitMeta}>
                          Best: {m.streak.best} day{m.streak.best === 1 ? "" : "s"}
                          {!m.streak.activeToday && m.streak.current > 0 ? " · study today to keep it" : ""}
                        </span>
                      </button>
                    </RevealItem>
                  </RevealGroup>
                </section>

                {/* Charts */}
                <div className={styles.chartsGrid}>
                  {/* Main chart: daily study minutes */}
                  <Reveal className={`${styles.panel} ${styles.mainChartPanel}`}>
                    <div className={styles.panelHead}>
                      <div>
                        <h3 className={styles.panelTitle}>Daily study time</h3>
                        <p className={styles.panelSub}>
                          Minutes of lessons vs practice (quizzes, PYQs, lesson practice), last {windowDays} days
                          {timeframe === "all" ? " (daily history covers the last 30 days)" : ""}
                        </p>
                      </div>
                      <div className={styles.legend}>
                        <span className={styles.legendItem}>
                          <span className={styles.legendSwatch} style={{ background: LESSON_COLOR }} />
                          Lessons
                        </span>
                        <span className={styles.legendItem}>
                          <span className={styles.legendSwatch} style={{ background: PRACTICE_COLOR }} />
                          Practice
                        </span>
                      </div>
                    </div>

                    <div className={styles.mainChart}>
                      {windowTotalSeconds === 0 ? (
                        <div className={styles.chartEmpty}>
                          No study time recorded in the last {windowDays} days. Open a lesson or a PYQ section and your time will appear here.
                        </div>
                      ) : (
                        mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{ top: 10, right: 6, left: -18, bottom: 0 }} barCategoryGap="22%">
                              <defs>
                                <linearGradient id="anLessonFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#60a5fa" />
                                  <stop offset="100%" stopColor={LESSON_COLOR} />
                                </linearGradient>
                                <linearGradient id="anPracticeFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#fbbf24" />
                                  <stop offset="100%" stopColor={PRACTICE_COLOR} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e4e9f2" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} minTickGap={12} />
                              <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} unit="m" allowDecimals={false} />
                              <Tooltip
                                cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value: any, name: any) => [`${value} min`, name]}
                              />
                              <Bar dataKey="learning" name="Lessons" fill="url(#anLessonFill)" stackId="a" />
                              <Bar dataKey="practice" name="Practice" fill="url(#anPracticeFill)" radius={[5, 5, 0, 0]} stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      )}
                    </div>
                  </Reveal>

                  {/* Study time by section */}
                  <Reveal delay={0.08} className={styles.panel}>
                    <div className={styles.panelHead}>
                      <div>
                        <h3 className={styles.panelTitle}>Time by section</h3>
                        <p className={styles.panelSub}>All-time study time recorded in each course</p>
                      </div>
                    </div>

                    {knowledgeData.length === 0 ? (
                      <div className={styles.donutBox}>
                        <div className={styles.chartEmpty}>No course study time recorded yet. Start a lesson in any course to see where your time goes.</div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.donutBox}>
                          {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={knowledgeData}
                                  innerRadius="62%"
                                  outerRadius="92%"
                                  paddingAngle={knowledgeData.length > 1 ? 3 : 0}
                                  cornerRadius={4}
                                  stroke="none"
                                  dataKey="value"
                                >
                                  {knowledgeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any, name: any) => [`${value}% of course study time`, name]} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                        <ul className={styles.donutLegend}>
                          {knowledgeData.map((item) => (
                            <li key={item.name} className={styles.donutLegendItem}>
                              <span className={styles.legendLeft}>
                                <span className={styles.legendSwatch} style={{ background: item.color }} />
                                <span className={styles.legendName}>{item.name}</span>
                              </span>
                              <span className={styles.legendRight}>
                                <span>{item.hours}</span>
                                <span className={styles.legendPercent}>{item.value}%</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Reveal>
                </div>

                {/* Section breakdown */}
                <Reveal className={styles.panel}>
                  <div className={styles.panelHead}>
                    <div>
                      <h3 className={styles.panelTitle}>Section breakdown</h3>
                      <p className={styles.panelSub}>
                        Accuracy in timed tests per section, with your latest full-section PYQ score and its estimated percentile. All time.
                      </p>
                    </div>
                  </div>

                  {sectionsWithData.length === 0 ? (
                    emptyBox(
                      "No section data yet",
                      "Take a PYQ section or a module quiz. Your accuracy, scores and estimated percentile per section will appear here.",
                      { href: "/browse#pyq-section", label: "Browse PYQ sections" }
                    )
                  ) : (
                    <RevealGroup className={styles.sectionGrid}>
                      {SECTIONS.map((s) => {
                        const x = m.sections[s];
                        return (
                          <RevealItem key={s}>
                            <div className={`glass-card ${styles.sectionCard}`} data-tint={SECTION_TINTS[s]} style={{ "--sec": SECTION_COLORS[s] } as React.CSSProperties}>
                              <div className={styles.sectionCardTop}>
                                <span className={styles.sectionCode}>{s}</span>
                                <span className={styles.sectionName}>{SECTION_NAMES[s]}</span>
                              </div>
                              <div className={styles.sectionAcc}>
                                <span className={styles.sectionAccValue}>{x.accuracy !== null ? `${x.accuracy}%` : "—"}</span>
                                <span className={styles.sectionAccLabel}>
                                  {x.accuracy !== null ? `accuracy · ${x.correct}/${x.attempted}` : "No timed answers yet"}
                                </span>
                              </div>
                              <div className={styles.sectionBar} title={x.accuracy !== null ? `Accuracy: ${x.accuracy}%` : "No data"}>
                                <span style={{ width: `${x.accuracy ?? 0}%` }} />
                              </div>
                              <dl className={styles.sectionStats}>
                                <div>
                                  <dt>Latest PYQ</dt>
                                  <dd>{x.latestScore !== null ? `${x.latestScore}/${x.maxScore}` : "—"}</dd>
                                </div>
                                <div>
                                  <dt>Best</dt>
                                  <dd>{x.bestScore !== null ? x.bestScore : "—"}</dd>
                                </div>
                                <div>
                                  <dt>Est. %ile</dt>
                                  <dd>{x.estimatedPercentile !== null ? x.estimatedPercentile : "—"}</dd>
                                </div>
                              </dl>
                              {x.latestScore === null && <span className={styles.sectionNote}>PYQ attempts: {x.pyqAttempts}</span>}
                            </div>
                          </RevealItem>
                        );
                      })}
                    </RevealGroup>
                  )}
                  {anyPercentileShown && <p className={styles.disclaimerText}>Estimated percentiles: {m.percentile.disclaimer}</p>}
                </Reveal>
              </>
            )}

            {/* TAB 2: COURSES & CONCEPTS */}
            {activeTab === "topics" && (
              <>
                <Reveal className={styles.panel}>
                  <div className={styles.panelHead}>
                    <div>
                      <h2 className={styles.panelTitle}>Course progress</h2>
                      <p className={styles.panelSub}>Lessons completed, study time and points earned in each course you have started.</p>
                    </div>

                    <div className={styles.filterChips} role="group" aria-label="Filter by section">
                      {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setSectionFilter(sec)}
                          aria-pressed={sectionFilter === sec}
                          className={`${styles.filterChip} ${sectionFilter === sec ? styles.filterChipActive : ""}`}
                        >
                          {sec !== "ALL" && <span className={styles.chipDot} style={{ background: SECTION_COLORS[sec] }} />}
                          {sec === "ALL" ? "All" : sec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTopics.length === 0 ? (
                    emptyBox(
                      m.courses.topics.length === 0 ? "No courses started yet" : `No ${sectionFilter} course started yet`,
                      "Open a course and complete a lesson; your progress will show up here.",
                      { href: "/topics", label: "Browse courses" }
                    )
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Status</th>
                            <th>Progress</th>
                            <th className={styles.num}>Lessons</th>
                            <th className={styles.num}>Study time</th>
                            <th className={styles.num}>Points</th>
                            <th aria-label="Action" />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTopics.map((t) => (
                            <tr key={t.topicId}>
                              <td>
                                <Link href={`/topics/${t.topicId}`} className={styles.rowTitleLink}>
                                  {t.title}
                                </Link>
                              </td>
                              <td>
                                <SectionChip section={t.section} />
                              </td>
                              <td>
                                <span
                                  className={`${styles.statusTag} ${
                                    t.progressPercent >= 100 ? styles.tagGood : t.progressPercent > 0 ? styles.tagInfo : styles.tagMuted
                                  }`}
                                >
                                  {t.progressPercent >= 100 ? "Completed" : t.progressPercent > 0 ? "In progress" : "Not started"}
                                </span>
                              </td>
                              <td>
                                <div className={styles.barCell}>
                                  <div className={styles.barTrack}>
                                    <div
                                      className={styles.barFill}
                                      style={{ width: `${Math.min(100, t.progressPercent)}%`, background: t.section ? SECTION_COLORS[t.section] : "var(--data-blue)" }}
                                    />
                                  </div>
                                  <span className={styles.barValue}>{Math.round(t.progressPercent)}%</span>
                                </div>
                              </td>
                              <td className={styles.num}>
                                {t.lessonsCompleted} / {t.totalLessons}
                              </td>
                              <td className={styles.num}>{fmtDuration(t.studySeconds)}</td>
                              <td className={styles.num}>{t.pointsEarned}</td>
                              <td>
                                <button className={styles.rowAction} onClick={() => handleDrill(t.topicId, t.title)} title={`Generate a practice quiz for ${t.title}`}>
                                  <Zap size={14} strokeWidth={2.4} aria-hidden="true" />
                                  <span>Drill topic</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Reveal>

                <Reveal className={styles.panel}>
                  <div className={styles.panelHead}>
                    <div>
                      <h2 className={styles.panelTitle}>Concept accuracy</h2>
                      <p className={styles.panelSub}>
                        Concepts with at least 3 answered questions across quizzes and PYQs: below 60% needs work, 80% and above is strong.
                      </p>
                    </div>
                  </div>

                  {concepts.length === 0 ? (
                    emptyBox(
                      "No concept accuracy yet",
                      m.accuracy.attempted === 0
                        ? "Answer questions in module quizzes or PYQ sections. Once a concept has 3 or more answers, its accuracy appears here."
                        : "None of your concepts is below 60% or at 80%+ yet (or none has 3 answers). Keep practising to build a clearer picture."
                    )
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Concept</th>
                            <th>Section</th>
                            <th>Tier</th>
                            <th>Accuracy</th>
                            <th className={styles.num}>Correct / answered</th>
                            <th aria-label="Action" />
                          </tr>
                        </thead>
                        <tbody>
                          {concepts.map((c) => {
                            const topic = topicForSection(c.section);
                            const tierColor = c.tier === "strong" ? "var(--data-emerald)" : c.tier === "weak" ? "var(--data-coral)" : "var(--data-amber)";
                            return (
                              <tr key={`${c.tier}-${c.concept}-${c.section}`}>
                                <td>
                                  <span className={styles.rowTitle}>{c.concept}</span>
                                </td>
                                <td>{c.section ? <SectionChip section={c.section} /> : <span className={styles.muted}>—</span>}</td>
                                <td>
                                  <span className={`${styles.statusTag} ${c.tier === "strong" ? styles.tagGood : c.tier === "weak" ? styles.tagBad : styles.tagWarn}`}>
                                    {c.tier === "strong" ? "Strong" : c.tier === "weak" ? "Needs work" : "Steady"}
                                  </span>
                                </td>
                                <td>
                                  <div className={styles.barCell}>
                                    <div className={styles.barTrack}>
                                      <div className={styles.barFill} style={{ width: `${c.accuracy}%`, background: tierColor }} />
                                    </div>
                                    <span className={styles.barValue}>{c.accuracy}%</span>
                                  </div>
                                </td>
                                <td className={styles.num}>
                                  {c.correct} / {c.attempted}
                                </td>
                                <td>
                                  {topic ? (
                                    <Link href={`/topics/${topic.topicId}`} className={styles.rowAction}>
                                      <span>Open {c.section} course</span>
                                    </Link>
                                  ) : (
                                    <span className={styles.muted}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Reveal>
              </>
            )}

            {/* TAB 3: TEST HISTORY */}
            {activeTab === "mocks" && (
              <Reveal className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Test history</h2>
                    <p className={styles.panelSub}>
                      Every submitted PYQ section, module quiz, grand quiz and lesson practice, newest first ({TIMEFRAME_LABELS[timeframe].toLowerCase()}).
                    </p>
                  </div>

                  <div className={styles.filterChips} role="group" aria-label="Filter by test type">
                    {KIND_FILTERS.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setKindFilter(k.id)}
                        aria-pressed={kindFilter === k.id}
                        className={`${styles.filterChip} ${kindFilter === k.id ? styles.filterChipActive : ""}`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleTests.length === 0 ? (
                  allTests.length === 0 ? (
                    emptyBox(
                      "No tests attempted yet",
                      "Attempt a CAT past-year (PYQ) section or a module quiz. Your scores, accuracy, pace and, for full PYQ sections, an estimated percentile will be listed here.",
                      { href: "/browse#pyq-section", label: "Attempt a PYQ section" }
                    )
                  ) : (
                    emptyBox(
                      "Nothing in this view",
                      `No ${kindFilter === "all" ? "tests" : KIND_FILTERS.find((k) => k.id === kindFilter)!.label.toLowerCase()} in the selected period. Try a longer period or another filter.`
                    )
                  )
                ) : (
                  <>
                    {/* Score trend (% of maximum, oldest to newest) */}
                    <div className={styles.trendBox}>
                      <p className={styles.trendLabel}>Score trend · % of maximum marks, oldest to newest</p>
                      <div className={styles.trendChart}>
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={scoreTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                              <defs>
                                <linearGradient id="anScoreStroke" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#2563eb" />
                                  <stop offset="60%" stopColor="#3b82f6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                                <linearGradient id="anScoreFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e4e9f2" />
                              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={12} />
                              <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} unit="%" />
                              <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.name ?? ""}
                                formatter={(value: any) => [`${value}%`, "Score"]}
                              />
                              <Area
                                type="monotone"
                                dataKey="percentage"
                                stroke="url(#anScoreStroke)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#anScoreFill)"
                                name="Score %"
                                dot={{ r: 3, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }}
                                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th className={styles.num}>Score</th>
                            <th className={styles.num}>Accuracy</th>
                            <th className={styles.num}>Pace</th>
                            <th className={styles.num}>Est. %ile</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleTests.map((t) => (
                            <tr key={t.attemptId}>
                              <td>
                                <span className={styles.rowTitleWithDot}>
                                  <span className={styles.chipDot} style={{ background: t.section ? SECTION_COLORS[t.section] : "#98a1b5" }} />
                                  <span className={styles.rowTitle}>{t.title}</span>
                                </span>
                              </td>
                              <td>
                                <span className={styles.kindTag}>{KIND_LABELS[t.kind]}</span>
                              </td>
                              <td className={styles.muted}>{fmtDate(t.submittedAt)}</td>
                              <td className={styles.num}>
                                <span className={styles.scoreValue}>
                                  {t.score} <span className={styles.muted}>/ {t.maxScore}</span>
                                </span>
                              </td>
                              <td className={styles.num}>{t.accuracy !== null ? `${t.accuracy}% (${t.correct}/${t.attempted})` : `0/${t.questionCount} answered`}</td>
                              <td className={styles.num}>{t.secondsPerQuestion !== null ? `${fmtPace(t.secondsPerQuestion)} / Q` : "—"}</td>
                              <td className={styles.num}>
                                {t.estimatedPercentile !== null ? (
                                  <span className={styles.pctValue} title={m.percentile.disclaimer}>
                                    {t.estimatedPercentile} <span className={styles.muted}>(est.)</span>
                                  </span>
                                ) : (
                                  <span className={styles.muted} title={t.kind === "pyq" ? "Only full PYQ sections get an estimate" : "Estimates are for PYQ sections only"}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td>
                                {t.passed === null ? (
                                  <span className={`${styles.statusTag} ${styles.tagInfo}`}>Submitted</span>
                                ) : (
                                  <span className={`${styles.statusTag} ${t.passed ? styles.tagGood : styles.tagBad}`}>{t.passed ? "Passed" : "Not passed"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {visibleTests.some((t) => t.estimatedPercentile !== null) && (
                      <p className={styles.disclaimerText}>Estimated percentiles: {m.percentile.disclaimer}</p>
                    )}
                  </>
                )}
              </Reveal>
            )}

            {/* TAB 4: BADGES & CERTIFICATE */}
            {activeTab === "achievements" && (
              <>
                <section aria-labelledby="badges-heading">
                  <div className={styles.sectionHead}>
                    <h2 id="badges-heading" className={styles.sectionTitle}>
                      Badges & milestones
                    </h2>
                    <span className={styles.sectionMeta}>
                      {badges.filter((b) => b.unlocked).length} of {badges.length} unlocked · each badge has one fixed criterion
                    </span>
                  </div>

                  <RevealGroup className={styles.badgeGrid}>
                    {badges.map((b) => {
                      const { Icon, tint } = BADGE_ICONS[b.icon] ?? { Icon: Award, tint: "blue" as Tint };
                      return (
                        <RevealItem key={b.id}>
                          <div className={`glass-card ${styles.badgeCard} ${!b.unlocked ? styles.badgeLocked : ""}`} data-tint={tint}>
                            <div className={styles.badgeTop}>
                              <span className={styles.badgeMedal}>
                                <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                              </span>
                              <span className={`${styles.badgeState} ${b.unlocked ? styles.badgeStateOn : ""}`}>
                                {b.unlocked ? <CircleCheck size={14} strokeWidth={2.4} aria-hidden="true" /> : <Lock size={13} strokeWidth={2.4} aria-hidden="true" />}
                                {b.unlocked ? "Unlocked" : "Locked"}
                              </span>
                            </div>
                            <h3 className={styles.badgeTitle}>{b.title}</h3>
                            <p className={styles.badgeDesc}>{b.desc}</p>
                            <div className={styles.badgeProgress}>
                              <span className={styles.badgeTrack}>
                                <span style={{ width: `${b.progress * 100}%` }} />
                              </span>
                              <span className={styles.badgeStatus}>{b.status}</span>
                            </div>
                          </div>
                        </RevealItem>
                      );
                    })}
                  </RevealGroup>
                </section>

                {/* Certificate progress = syllabus coverage */}
                <Reveal className={styles.certificateBanner}>
                  <div className={styles.certText}>
                    <span className={styles.certKicker}>
                      <GraduationCap size={16} strokeWidth={2.2} aria-hidden="true" />
                      Syllabus coverage
                    </span>
                    <h2 className={styles.certTitle}>Course completion certificate</h2>
                    <p className={styles.certDesc}>
                      Progress is your CAT syllabus coverage: {syllabusDone} of {syllabusLessons} lessons completed across the VARC, DILR and QA courses. Complete every lesson to reach 100%.
                    </p>
                  </div>
                  <div className={styles.certRing} style={{ "--p": certPercent } as React.CSSProperties}>
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <defs>
                        <linearGradient id="anCertGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#93c5fd" />
                          <stop offset="100%" stopColor="#67e8f9" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="60" r="50" className={styles.certRingTrack} />
                      <circle cx="60" cy="60" r="50" className={styles.certRingFill} pathLength={100} strokeDasharray={`${certPercent} 100`} />
                    </svg>
                    <div className={styles.certRingLabel}>
                      <span className={styles.certPercent}>{certPercent}%</span>
                      <span className={styles.certSub}>Syllabus covered</span>
                    </div>
                  </div>
                </Reveal>
              </>
            )}
          </>
        )}
      </main>

      {/* ===== METRIC DETAILS MODAL ===== */}
      {inspectingMetricId && m && (
        <MetricInspectorModal
          metricId={inspectingMetricId}
          metrics={m}
          windowDays={windowDays}
          onClose={() => setInspectingMetricId(null)}
          onDrillAction={(topicId, topicTitle) => {
            setInspectingMetricId(null);
            setActiveQuizModal({ topicId, topicTitle });
          }}
        />
      )}

      {/* ===== PRACTICE QUIZ MODAL ===== */}
      {activeQuizModal && (
        <TopicQuizModal
          topicId={activeQuizModal.topicId}
          topicTitle={activeQuizModal.topicTitle}
          onClose={() => setActiveQuizModal(null)}
        />
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--canvas)" }} />}>
      <AnalyticsPageContent />
    </React.Suspense>
  );
}
