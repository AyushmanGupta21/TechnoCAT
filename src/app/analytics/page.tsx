"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PostLoginNavActions from "@/components/PostLoginNavActions";
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
import BrandLogo from "@/components/BrandLogo";

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
const SECTION_COLORS: Record<SectionKey, string> = { QA: "#2563EB", DILR: "#8B5CF6", VARC: "#10B981" };
const KIND_LABELS: Record<TestRecord["kind"], string> = {
  pyq: "PYQ section",
  module_quiz: "Module quiz",
  grand_quiz: "Grand quiz",
  lesson_practice: "Lesson practice",
  topic_drill: "Practice drills",
};
const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pyq", label: "PYQ Sections" },
  { id: "module_quiz", label: "Module Quizzes" },
  { id: "grand_quiz", label: "Grand Quizzes" },
  { id: "lesson_practice", label: "Lesson Practice" },
];
const TIMEFRAME_LABELS: Record<Timeframe, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", all: "All Time" };
const DAY_MS = 24 * 60 * 60 * 1000;

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

function renderBadgeIcon(iconName: string) {
  switch (iconName) {
    case "trophy":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>
      );
    case "star":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "flame":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c3.5 0 5-2.5 5-5.5 0-3-2-5.5-4-7.5C11 7 9 9 9 11c0 1.5.5 2.5-.5 3.5z" />
          <path d="M12 2c1 3 4 5 4 9a6 6 0 1 1-12 0c0-4 3-7 5-9 1 2 2 3 3 0z" />
        </svg>
      );
    case "trend":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "bolt":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "puzzle":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19.439 7.85c0-1.57.802-2.54 1.636-3.55a.8.8 0 0 0-.616-1.3H17a1 1 0 0 0-1-1c0-.834-.98-1.636-2.55-1.636-1.57 0-2.55.802-2.55 1.636a1 1 0 0 0-1 1H6.46a.8.8 0 0 0-.615 1.3c.834 1.01 1.635 1.98 1.635 3.55 0 1.57-.801 2.54-1.635 3.55a.8.8 0 0 0 .615 1.3H9.9a1 1 0 0 0 1 1c0 .834.98 1.636 2.55 1.636 1.57 0 2.55-.802 2.55-1.636a1 1 0 0 0 1-1h3.46a.8.8 0 0 0 .615-1.3c-.834-1.01-1.635-1.98-1.635-3.55z" />
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

const inspectIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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
      { key: "OTHER", name: "Other courses", color: "#94A3B8" },
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
      { id: "first-pyq", title: "First PYQ Section", desc: "Submit your first CAT past-year (PYQ) section.", icon: "trophy", color: "#fef3c7", current: metrics.tests.pyq.length, target: 1, unit: "section" },
      { id: "all-sections", title: "All-Rounder", desc: "Attempt a PYQ section in each of VARC, DILR and QA.", icon: "puzzle", color: "#f3e8ff", current: sectionsAttempted, target: 3, unit: "sections" },
      { id: "streak-7", title: "7-Day Streak", desc: "Study on 7 consecutive days (at least 2 minutes a day). Counts your best streak.", icon: "flame", color: "#fee2e2", current: metrics.streak.best, target: 7, unit: "days" },
      { id: "lessons-10", title: "10 Lessons Completed", desc: "Complete 10 lessons in any course.", icon: "trend", color: "#dcfce7", current: metrics.courses.lessonsCompleted, target: 10, unit: "lessons" },
      { id: "modules-3", title: "Module Finisher", desc: "Pass 3 different module quizzes.", icon: "bolt", color: "#e0e7ff", current: metrics.tests.modulesPassed, target: 3, unit: "modules" },
      { id: "accuracy-80", title: "Sharp Shooter", desc: "Reach 80% overall accuracy in timed tests (at least 5 answers).", icon: "star", color: "#dbeafe", current: metrics.accuracy.overall ?? 0, target: 80, unit: "%" },
    ];
    return list.map((b) => {
      const unlocked = b.current >= b.target;
      const progress = b.unit === "%" ? (metrics.accuracy.overall === null ? "no accuracy yet" : `${b.current}% / 80%`) : `${Math.min(b.current, b.target)}/${b.target} ${b.unit}`;
      return { ...b, unlocked, status: unlocked ? "Unlocked • criterion met" : `Locked • ${progress}` };
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

  const emptyBox = (title: string, text: string, cta?: { href: string; label: string }) => (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateText}>{text}</p>
      {cta && (
        <Link href={cta.href} className={styles.drillWeakCta} style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <span>{cta.label}</span>
        </Link>
      )}
    </div>
  );

  return (
    <div className={styles.analyticsWrapper}>
      {/* ===== STICKY TOP NAVBAR ===== */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Analytics Navigation">
            <div className={styles.topNavLeft}>
              <Link href="/dashboard" className={styles.brandLogo} title="Back to TechnoCAT Home">
                <BrandLogo height={70} />
              </Link>
              <div className={styles.backNavGroup}>
                <Link href="/dashboard" className={styles.backDashboardBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to Dashboard
                </Link>
                <span className={styles.backNavDivider} aria-hidden="true">|</span>
                <Link href="/intelligence" className={styles.backDashboardBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to Intelligence Hub
                </Link>
              </div>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HEADER SECTION ===== */}
      <div className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <div>
              <div className={styles.pillBadge}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>History & Performance</span>
              </div>
              <h1 className={styles.pageTitle}>
                My Performance & <span className={styles.headingHighlight}>Analytics</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Your test history, accuracy, pace, estimated percentile and study habits, calculated from your recorded activity. Click any card to see exactly how it is calculated.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.drillWeakCta}
                onClick={() => handleDrill("qa-quantitative-ability", "CAT Diagnostic Drill")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Drill Weak Areas</span>
              </button>
              <button
                className={styles.exportBtn}
                disabled={periodTests.length === 0}
                title={
                  periodTests.length === 0
                    ? "No tests in the selected period to export"
                    : `Download ${periodTests.length} test${periodTests.length === 1 ? "" : "s"} (${TIMEFRAME_LABELS[timeframe]}) as CSV`
                }
                onClick={() => downloadTestHistoryCsv(periodTests, timeframe)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Test History (CSV)
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className={styles.viewTabs}>
            {[
              {
                id: "overview",
                label: "Performance Overview",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
              {
                id: "topics",
                label: "Courses & Concepts",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                ),
              },
              {
                id: "mocks",
                label: "Test History",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                ),
              },
              {
                id: "achievements",
                label: "Badges & Certificate",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                  </svg>
                ),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`${styles.viewTab} ${activeTab === tab.id ? styles.viewTabActive : ""}`}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN ANALYTICS CONTENT ===== */}
      <main className={styles.mainContent}>
        {!m ? (
          loadError === "unauthorized" ? (
            emptyBox("Please sign in", "Sign in to see your performance history and analytics.", { href: "/", label: "Go to sign in" })
          ) : loadError === "failed" ? (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>Could not load your analytics</h3>
              <p className={styles.emptyStateText}>Something went wrong while loading your metrics. Please try again.</p>
              <button className={styles.drillWeakCta} onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>Loading your analytics…</div>
          )
        ) : (
          <>
            {/* Timeframe toolbar: filters test history, daily study charts and the CSV export */}
            {(activeTab === "overview" || activeTab === "mocks") && (
              <div className={styles.timeframeToolbar}>
                <div className={styles.toolbarTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Analysis Period</span>
                  <span className={styles.toolbarHint}>
                    {activeTab === "overview"
                      ? "Applies to the daily study chart and daily average. Other indicators are all-time."
                      : "Applies to the test list, score trend and CSV export."}
                  </span>
                </div>

                <div className={styles.timeframePillGroup}>
                  {(["7d", "30d", "all"] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`${styles.timeframePill} ${timeframe === tf ? styles.timeframePillActive : ""}`}
                    >
                      {TIMEFRAME_LABELS[tf]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* 4 headline KPI cards */}
                <div>
                  <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                      <span>Core Exam Indicators (All Time)</span>
                    </h2>
                    <div className={styles.interactiveHint} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                      </svg>
                      <span>Click any card to see how it is calculated</span>
                    </div>
                  </div>

                  <div className={styles.heroGrid}>
                    {/* 1. Estimated percentile */}
                    <div
                      className={`${styles.metricCard} ${styles.metricCardPercentile}`}
                      onClick={() => setInspectingMetricId("percentile")}
                      title={m.percentile.disclaimer}
                    >
                      <div className={styles.cardTopRow}>
                        <div className={styles.cardIconBox}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                        </div>
                        <span className={styles.inspectBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>How it&apos;s estimated</span>
                          {inspectIcon}
                        </span>
                      </div>
                      <div className={styles.cardName}>Estimated CAT Percentile</div>
                      <div className={styles.cardValueRow}>
                        <div className={styles.cardValue}>{m.percentile.overallEstimate !== null ? `${m.percentile.overallEstimate} %ile` : "—"}</div>
                      </div>
                      <div className={styles.cardSub}>
                        {m.percentile.overallEstimate !== null
                          ? `From an overall PYQ score of ${m.percentile.overallScore} / ${SECTIONS.reduce((s, k) => s + m.sections[k].maxScore, 0)}`
                          : m.percentile.basis}
                      </div>
                      <p className={styles.disclaimerText}>{m.percentile.disclaimer}</p>
                      <div className={styles.cardFooterStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={`${styles.indicatorDot} ${m.percentile.overallEstimate !== null ? styles.dotInfo : styles.dotDanger}`}></span>
                          <span style={{ color: m.percentile.overallEstimate !== null ? "#4F46E5" : "#DC2626" }}>
                            {m.percentile.overallEstimate !== null
                              ? "Estimated"
                              : `${SECTIONS.filter((s) => m.sections[s].latestScore !== null).length}/3 sections attempted`}
                          </span>
                        </div>
                        <span className={styles.inspectArrow}>→</span>
                      </div>
                    </div>

                    {/* 2. Accuracy */}
                    <div
                      className={`${styles.metricCard} ${styles.metricCardAccuracy}`}
                      onClick={() => setInspectingMetricId("accuracy")}
                      title="See how accuracy is calculated"
                    >
                      <div className={styles.cardTopRow}>
                        <div className={styles.cardIconBox} style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </div>
                        <span className={styles.inspectBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>Inspect Data</span>
                          {inspectIcon}
                        </span>
                      </div>
                      <div className={styles.cardName}>Overall Accuracy</div>
                      <div className={styles.cardValueRow}>
                        <div className={styles.cardValue} style={{ color: "#059669" }}>
                          {m.accuracy.overall !== null ? `${m.accuracy.overall}%` : "—"}
                        </div>
                      </div>
                      <div className={styles.cardSub}>
                        {m.accuracy.overall !== null
                          ? `${m.accuracy.correct} of ${m.accuracy.attempted} answered questions correct (timed tests)`
                          : `Answer at least 5 questions in timed tests (PYQ sections or quizzes) to see your accuracy. So far: ${m.accuracy.attempted}.`}
                      </div>
                      <div className={styles.cardFooterStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={`${styles.indicatorDot} ${m.accuracy.overall !== null && m.accuracy.overall >= 60 ? styles.dotSuccess : styles.dotDanger}`}></span>
                          <span style={{ color: m.accuracy.overall !== null && m.accuracy.overall >= 60 ? "#059669" : "#DC2626" }}>
                            {m.accuracy.overall === null ? "Not enough answers" : m.accuracy.overall >= 80 ? "Strong (80%+)" : m.accuracy.overall >= 60 ? "Moderate (60–80%)" : "Needs work (below 60%)"}
                          </span>
                        </div>
                        <span className={styles.inspectArrow}>→</span>
                      </div>
                    </div>

                    {/* 3. Pace */}
                    <div
                      className={`${styles.metricCard} ${styles.metricCardSpeed}`}
                      onClick={() => setInspectingMetricId("speed")}
                      title="See how pace is calculated"
                    >
                      <div className={styles.cardTopRow}>
                        <div className={styles.cardIconBox} style={{ background: "#EEF2FF", borderColor: "#C7D2FE" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </div>
                        <span className={styles.inspectBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>Inspect Pacing</span>
                          {inspectIcon}
                        </span>
                      </div>
                      <div className={styles.cardName}>Pace (Time per Question)</div>
                      <div className={styles.cardValueRow}>
                        <div className={styles.cardValue} style={{ color: "#4F46E5" }}>
                          {pace !== null ? `${fmtPace(pace)} / Q` : "—"}
                        </div>
                      </div>
                      <div className={styles.cardSub}>
                        {pace !== null
                          ? `CAT pace: ${fmtPace(bench)} / Q (120 min for 66 questions)`
                          : "Take a timed test (PYQ section or quiz) to measure your pace."}
                      </div>
                      <div className={styles.cardFooterStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={`${styles.indicatorDot} ${styles.dotInfo}`}></span>
                          <span style={{ color: "#4F46E5" }}>
                            {pace === null
                              ? "No timed tests yet"
                              : pace === bench
                              ? "Exactly at CAT pace"
                              : `${Math.abs(pace - bench)}s ${pace > bench ? "slower" : "faster"} than CAT pace`}
                          </span>
                        </div>
                        <span className={styles.inspectArrow}>→</span>
                      </div>
                    </div>

                    {/* 4. Negative marks */}
                    <div
                      className={`${styles.metricCard} ${styles.metricCardPenalty}`}
                      onClick={() => setInspectingMetricId("negativeMarking")}
                      title="See how negative marks are counted"
                    >
                      <div className={styles.cardTopRow}>
                        <div className={styles.cardIconBox} style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <span className={styles.inspectBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>Inspect Loss</span>
                          {inspectIcon}
                        </span>
                      </div>
                      <div className={styles.cardName}>Marks Lost to Negatives</div>
                      <div className={styles.cardValueRow}>
                        <div className={styles.cardValue} style={{ color: "#DC2626" }}>
                          {m.tests.pyq.length ? `−${m.accuracy.negativeMarksLost} marks` : "—"}
                        </div>
                      </div>
                      <div className={styles.cardSub}>
                        {m.tests.pyq.length
                          ? `${m.accuracy.negativeMarksLost} wrong MCQ answer${m.accuracy.negativeMarksLost === 1 ? "" : "s"} in PYQ sections, −1 each`
                          : "Attempt a PYQ section to track negative marking."}
                      </div>
                      <div className={styles.cardFooterStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={`${styles.indicatorDot} ${styles.dotDanger}`}></span>
                          <span style={{ color: "#DC2626" }}>
                            {m.tests.pyq.length ? `Across ${m.tests.pyq.length} PYQ section${m.tests.pyq.length === 1 ? "" : "s"} · TITA has no penalty` : "No PYQ sections yet"}
                          </span>
                        </div>
                        <span className={styles.inspectArrow}>→</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study habits */}
                <div>
                  <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Study Habits & Consistency</span>
                    </h2>
                    <div className={styles.interactiveHint}>
                      <span>Click for day-by-day logs</span>
                    </div>
                  </div>

                  <div className={styles.habitsGrid}>
                    {/* Daily average */}
                    <div className={styles.habitCard} onClick={() => setInspectingMetricId("dailyAverage")}>
                      <div className={styles.habitIconBox} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className={styles.habitInfo}>
                        <div className={styles.habitTitle}>Daily Average</div>
                        <div className={styles.habitValue}>{fmtDuration(Math.round(windowTotalSeconds / windowDays))} / day</div>
                        <div className={styles.habitMeta}>{fmtDuration(windowTotalSeconds)} over the last {windowDays} days</div>
                      </div>
                    </div>

                    {/* Weekly volume */}
                    <div className={styles.habitCard} onClick={() => setInspectingMetricId("weeklyVolume")}>
                      <div className={styles.habitIconBox} style={{ background: "#ECFDF5", color: "#059669" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className={styles.habitInfo}>
                        <div className={styles.habitTitle}>Last 7 Days</div>
                        <div className={styles.habitValue}>{fmtDuration(m.studyTime.last7DaysSeconds)}</div>
                        <div className={styles.habitMeta}>Today: {fmtDuration(m.studyTime.todaySeconds)}</div>
                      </div>
                    </div>

                    {/* Consistency */}
                    <div className={styles.habitCard} onClick={() => setInspectingMetricId("consistency")}>
                      <div className={styles.habitIconBox} style={{ background: "#FAF5FF", color: "#9333EA" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className={styles.habitInfo}>
                        <div className={styles.habitTitle}>Consistency</div>
                        <div className={styles.habitValue}>{m.consistency.activeDaysLast14} / 14 days</div>
                        <div className={styles.habitMeta}>{m.consistency.score}% of the last 14 days active</div>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className={styles.habitCard} onClick={() => setInspectingMetricId("streak")}>
                      <div className={styles.habitIconBox} style={{ background: "#FFF7ED", color: "#EA580C" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c3.5 0 5-2.5 5-5.5 0-3-2-5.5-4-7.5C11 7 9 9 9 11c0 1.5.5 2.5-.5 3.5z" />
                          <path d="M12 2c1 3 4 5 4 9a6 6 0 1 1-12 0c0-4 3-7 5-9 1 2 2 3 3 0z" />
                        </svg>
                      </div>
                      <div className={styles.habitInfo}>
                        <div className={styles.habitTitle}>Active Study Streak</div>
                        <div className={styles.habitValue}>
                          {m.streak.current} day{m.streak.current === 1 ? "" : "s"}
                        </div>
                        <div className={styles.habitMeta}>
                          Best: {m.streak.best} day{m.streak.best === 1 ? "" : "s"}
                          {!m.streak.activeToday && m.streak.current > 0 ? " · study today to keep it" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className={styles.chartsGrid}>
                  {/* Chart 1: daily study minutes */}
                  <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                      <div className={styles.chartTitleArea}>
                        <h3 className={styles.chartTitle}>Daily Study Time (Minutes)</h3>
                        <p className={styles.chartSubtitle}>
                          Lessons vs practice (quizzes, PYQs, lesson practice), last {windowDays} days
                          {timeframe === "all" ? " (daily history covers the last 30 days)" : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: 600 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563EB" }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2563EB" }}></span>
                          Lessons
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#9333EA" }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#9333EA" }}></span>
                          Practice
                        </span>
                      </div>
                    </div>

                    <div className={styles.chartContainer}>
                      {windowTotalSeconds === 0 ? (
                        <div className={styles.chartEmpty}>
                          No study time recorded in the last {windowDays} days. Open a lesson or a PYQ section and your time will appear here.
                        </div>
                      ) : (
                        mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} unit="m" allowDecimals={false} />
                              <Tooltip
                                cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                                contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "12px" }}
                                formatter={(value: any, name: any) => [`${value} min`, name]}
                              />
                              <Bar dataKey="learning" name="Lessons" fill="#2563EB" stackId="a" />
                              <Bar dataKey="practice" name="Practice" fill="#9333EA" radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      )}
                    </div>
                  </div>

                  {/* Chart 2: study time by section */}
                  <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                      <div className={styles.chartTitleArea}>
                        <h3 className={styles.chartTitle}>Study Time by Section</h3>
                        <p className={styles.chartSubtitle}>All-time study time recorded in each course</p>
                      </div>
                    </div>

                    {knowledgeData.length === 0 ? (
                      <div className={styles.chartContainer} style={{ height: "200px" }}>
                        <div className={styles.chartEmpty}>No course study time recorded yet. Start a lesson in any course to see where your time goes.</div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.chartContainer} style={{ height: "200px" }}>
                          {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={knowledgeData} innerRadius={55} outerRadius={80} paddingAngle={knowledgeData.length > 1 ? 5 : 0} dataKey="value">
                                  {knowledgeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                                  formatter={(value: any, name: any) => [`${value}% of course study time`, name]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                        <div className={styles.donutLegend}>
                          {knowledgeData.map((item) => (
                            <div key={item.name} className={styles.donutLegendItem}>
                              <div className={styles.legendLeft}>
                                <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                                <span className={styles.legendName}>{item.name}</span>
                              </div>
                              <div className={styles.legendRight}>
                                <span>{item.hours}</span>
                                <span className={styles.legendPercent}>{item.value}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section breakdown: accuracy by section + PYQ scores */}
                <div className={styles.chartCard}>
                  <div className={styles.chartCardHeader}>
                    <div className={styles.chartTitleArea}>
                      <h3 className={styles.chartTitle}>Section Breakdown</h3>
                      <p className={styles.chartSubtitle}>
                        Accuracy in timed tests per section (bar), with your latest full-section PYQ score and its estimated percentile. All time.
                      </p>
                    </div>
                    <div className={styles.difficultyLegends}>
                      {SECTIONS.map((s) => (
                        <div key={s} className={styles.diffLegendTag}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: SECTION_COLORS[s] }}></span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {sectionsWithData.length === 0 ? (
                    emptyBox(
                      "No section data yet",
                      "Take a PYQ section or a module quiz. Your accuracy, scores and estimated percentile per section will appear here.",
                      { href: "/browse#pyq-section", label: "Browse PYQ sections" }
                    )
                  ) : (
                    <div className={styles.difficultyList}>
                      {SECTIONS.map((s) => {
                        const x = m.sections[s];
                        return (
                          <div key={s} className={styles.difficultyItem}>
                            <div className={styles.difficultyHeader}>
                              <span>{SECTION_NAMES[s]} ({s})</span>
                              <span style={{ color: "#64748B", fontSize: "12px" }}>
                                {x.accuracy !== null ? `Accuracy ${x.accuracy}% (${x.correct}/${x.attempted})` : "No timed answers yet"}
                                {" | "}
                                {x.latestScore !== null ? `Latest PYQ ${x.latestScore}/${x.maxScore}` : `PYQ attempts: ${x.pyqAttempts}`}
                                {x.bestScore !== null && x.bestScore !== x.latestScore ? ` (best ${x.bestScore})` : ""}
                                {x.estimatedPercentile !== null ? ` | Est. ${x.estimatedPercentile} %ile` : ""}
                              </span>
                            </div>
                            <div className={styles.stackedBar}>
                              <div style={{ width: `${x.accuracy ?? 0}%`, background: SECTION_COLORS[s] }} title={x.accuracy !== null ? `Accuracy: ${x.accuracy}%` : "No data"} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {anyPercentileShown && <p className={styles.disclaimerText}>Estimated percentiles: {m.percentile.disclaimer}</p>}
                </div>
              </>
            )}

            {/* TAB 2: COURSES & CONCEPTS */}
            {activeTab === "topics" && (
              <>
                <div className={styles.tableCard}>
                  <div className={styles.tableCardHeader}>
                    <div className={styles.chartTitleArea}>
                      <h2 className={styles.chartTitle}>Course Progress</h2>
                      <p className={styles.chartSubtitle}>Lessons completed, study time and points earned in each course you have started.</p>
                    </div>

                    <div className={styles.sectionFilterPills}>
                      {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setSectionFilter(sec)}
                          className={`${styles.sectionFilterBtn} ${sectionFilter === sec ? styles.sectionFilterBtnActive : ""}`}
                        >
                          {sec}
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
                    <div className={styles.responsiveTableWrap}>
                      <table className={styles.masteryTable}>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Status</th>
                            <th>Progress</th>
                            <th>Lessons</th>
                            <th>Study Time</th>
                            <th>Points</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTopics.map((t) => (
                            <tr key={t.topicId}>
                              <td>
                                <div className={styles.topicNameCell}>
                                  <Link href={`/topics/${t.topicId}`} className={styles.topicTitle} style={{ textDecoration: "none" }}>
                                    {t.title}
                                  </Link>
                                </div>
                              </td>
                              <td>
                                <span className={styles.topicSectionBadge}>{t.section ?? "Other"}</span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.levelTag} ${
                                    t.progressPercent >= 100 ? styles.levelStrong : t.progressPercent > 0 ? styles.levelModerate : styles.levelAttention
                                  }`}
                                >
                                  {t.progressPercent >= 100 ? "Completed" : t.progressPercent > 0 ? "In progress" : "Not started"}
                                </span>
                              </td>
                              <td>
                                <div className={styles.accuracyBarWrap}>
                                  <div className={styles.accuracyBarBg}>
                                    <div className={styles.accuracyBarFill} style={{ width: `${Math.min(100, t.progressPercent)}%`, background: "#2563EB" }} />
                                  </div>
                                  <span className={styles.accuracyPercent}>{Math.round(t.progressPercent)}%</span>
                                </div>
                              </td>
                              <td>
                                {t.lessonsCompleted} / {t.totalLessons}
                              </td>
                              <td>{fmtDuration(t.studySeconds)}</td>
                              <td>{t.pointsEarned}</td>
                              <td>
                                <button
                                  className={styles.drillTableBtn}
                                  onClick={() => handleDrill(t.topicId, t.title)}
                                  title={`Generate a practice quiz for ${t.title}`}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                  </svg>
                                  <span>Drill Topic</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.tableCardHeader}>
                    <div className={styles.chartTitleArea}>
                      <h2 className={styles.chartTitle}>Concept Accuracy: Weak & Strong Areas</h2>
                      <p className={styles.chartSubtitle}>
                        Concepts with at least 3 answered questions across quizzes and PYQs. Listed when accuracy is below 60% (needs work) or 80% and above (strong).
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
                    <div className={styles.responsiveTableWrap}>
                      <table className={styles.masteryTable}>
                        <thead>
                          <tr>
                            <th>Concept</th>
                            <th>Section</th>
                            <th>Tier</th>
                            <th>Accuracy</th>
                            <th>Correct / Answered</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {concepts.map((c) => {
                            const topic = topicForSection(c.section);
                            return (
                              <tr key={`${c.tier}-${c.concept}-${c.section}`}>
                                <td>
                                  <div className={styles.topicNameCell}>
                                    <span className={styles.topicTitle}>{c.concept}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={styles.topicSectionBadge}>{c.section ?? "—"}</span>
                                </td>
                                <td>
                                  <span className={`${styles.levelTag} ${c.tier === "strong" ? styles.levelStrong : styles.levelAttention}`}>
                                    {c.tier === "strong" ? "Strong" : c.tier === "weak" ? "Needs work" : "Steady"}
                                  </span>
                                </td>
                                <td>
                                  <div className={styles.accuracyBarWrap}>
                                    <div className={styles.accuracyBarBg}>
                                      <div
                                        className={styles.accuracyBarFill}
                                        style={{ width: `${c.accuracy}%`, background: c.tier === "strong" ? "#0D9488" : c.tier === "weak" ? "#EF4444" : "#F59E0B" }}
                                      />
                                    </div>
                                    <span className={styles.accuracyPercent}>{c.accuracy}%</span>
                                  </div>
                                </td>
                                <td>
                                  {c.correct} / {c.attempted}
                                </td>
                                <td>
                                  {topic ? (
                                    <Link href={`/topics/${topic.topicId}`} className={styles.drillTableBtn} style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
                                      <span>Open {c.section} course</span>
                                    </Link>
                                  ) : (
                                    <span style={{ color: "#94A3B8" }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 3: TEST HISTORY */}
            {activeTab === "mocks" && (
              <div className={styles.tableCard}>
                <div className={styles.tableCardHeader}>
                  <div className={styles.chartTitleArea}>
                    <h2 className={styles.chartTitle}>Test History: PYQ Sections & Quizzes</h2>
                    <p className={styles.chartSubtitle}>
                      Every submitted CAT past-year (PYQ) section, module quiz, grand quiz and lesson practice, newest first ({TIMEFRAME_LABELS[timeframe].toLowerCase()}).
                    </p>
                  </div>

                  <div className={styles.sectionFilterPills}>
                    {KIND_FILTERS.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setKindFilter(k.id)}
                        className={`${styles.sectionFilterBtn} ${kindFilter === k.id ? styles.sectionFilterBtnActive : ""}`}
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
                    <p className={styles.chartSubtitle} style={{ margin: "0 0 8px 0" }}>
                      Score trend (% of maximum marks, oldest to newest)
                    </p>
                    <div style={{ height: "240px", width: "100%", marginBottom: "16px" }}>
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={scoreTrend}>
                            <defs>
                              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip
                              contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0" }}
                              labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.name ?? ""}
                              formatter={(value: any) => [`${value}%`, "Score"]}
                            />
                            <Area type="monotone" dataKey="percentage" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" name="Score %" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className={styles.responsiveTableWrap}>
                      <table className={styles.masteryTable}>
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Accuracy</th>
                            <th>Pace</th>
                            <th>Est. %ile (PYQ)</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleTests.map((t) => (
                            <tr key={t.attemptId}>
                              <td>
                                <strong style={{ color: "#0F172A" }}>{t.title}</strong>
                              </td>
                              <td>
                                <span className={styles.topicSectionBadge}>{KIND_LABELS[t.kind]}</span>
                              </td>
                              <td style={{ color: "#64748B" }}>{fmtDate(t.submittedAt)}</td>
                              <td>
                                <span style={{ fontWeight: 700, color: "#2563EB" }}>
                                  {t.score} / {t.maxScore}
                                </span>
                              </td>
                              <td>{t.accuracy !== null ? `${t.accuracy}% (${t.correct}/${t.attempted})` : `0/${t.questionCount} answered`}</td>
                              <td>{t.secondsPerQuestion !== null ? `${fmtPace(t.secondsPerQuestion)} / Q` : "—"}</td>
                              <td>
                                {t.estimatedPercentile !== null ? (
                                  <span style={{ fontWeight: 700, color: "#059669" }} title={m.percentile.disclaimer}>
                                    {t.estimatedPercentile} (est.)
                                  </span>
                                ) : (
                                  <span style={{ color: "#94A3B8" }} title={t.kind === "pyq" ? "Only full PYQ sections get an estimate" : "Estimates are for PYQ sections only"}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td>
                                {t.passed === null ? (
                                  <span className={`${styles.levelTag} ${styles.levelModerate}`}>Submitted</span>
                                ) : (
                                  <span className={`${styles.levelTag} ${t.passed ? styles.levelStrong : styles.levelAttention}`}>
                                    {t.passed ? "Passed" : "Not passed"}
                                  </span>
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
              </div>
            )}

            {/* TAB 4: BADGES & CERTIFICATE */}
            {activeTab === "achievements" && (
              <div className={styles.tableCard}>
                <div className={styles.tableCardHeader}>
                  <div className={styles.chartTitleArea}>
                    <h2 className={styles.chartTitle}>Badges & Milestones</h2>
                    <p className={styles.chartSubtitle}>Each badge has one fixed criterion, checked against your recorded activity.</p>
                  </div>
                </div>

                <div className={styles.achievementsGrid}>
                  {badges.map((b) => (
                    <div key={b.id} className={`${styles.badgeCard} ${!b.unlocked ? styles.badgeLocked : ""}`}>
                      <div className={styles.badgeIconBox} style={{ background: b.color }}>
                        {renderBadgeIcon(b.icon)}
                      </div>
                      <div className={styles.badgeBody}>
                        <h3 className={styles.badgeTitle}>{b.title}</h3>
                        <p className={styles.badgeDesc}>{b.desc}</p>
                        <span className={styles.badgeDate}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certificate progress = syllabus coverage */}
                <div className={styles.certificateBanner}>
                  <div>
                    <h3 className={styles.certTitle}>Course Completion Certificate</h3>
                    <p className={styles.certDesc}>
                      Progress is your CAT syllabus coverage: {syllabusDone} of {syllabusLessons} lessons completed across the VARC, DILR and QA courses. Complete every lesson to reach 100%.
                    </p>
                  </div>
                  <div className={styles.certScoreBox}>
                    <div className={styles.certPercent}>{certPercent}%</div>
                    <div className={styles.certSub}>Syllabus Covered</div>
                  </div>
                </div>
              </div>
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
    <React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#F4F6F9" }} />}>
      <AnalyticsPageContent />
    </React.Suspense>
  );
}
