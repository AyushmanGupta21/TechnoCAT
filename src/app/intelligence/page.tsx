"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./intelligence.module.css";
import Image from "next/image";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { useAuth } from "@/context/AuthContext";
import AIMentorDrawer from "@/components/AIMentorDrawer";
import BrandLogo from "@/components/BrandLogo";
import type { StudentMetrics } from "@/lib/metrics/types";
import type { ChallengeData, ChallengeTask, ChallengeTaskIcon } from "@/lib/challenge";

function formatChallengeDate(ymd: string): string {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return ymd;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function renderTaskStatusIcon(task: ChallengeTask, size = 20) {
  if (task.done || task.status === "completed") {
    return (
      <span
        title="Completed automatically"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "#ECFDF5",
          border: "1.5px solid #10B981",
          color: "#10B981",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }

  if (task.status === "upcoming") {
    return (
      <span
        title="Upcoming task"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "#F8FAFC",
          border: "1.5px solid #CBD5E1",
          color: "#94A3B8",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
      </span>
    );
  }

  // Not completed (today pending or past missed) -> red cross
  return (
    <span
      title={task.status === "missed" ? "Not completed (missed)" : "Not completed yet"}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "#FEF2F2",
        border: "1.5px solid #EF4444",
        color: "#EF4444",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
  );
}

const TASK_ICON_THEME: Record<ChallengeTaskIcon, { bg: string; color: string }> = {
  mock: { bg: "#EFF6FF", color: "#2563EB" },
  analysis: { bg: "#F5F3FF", color: "#7C3AED" },
  lesson: { bg: "#ECFDF5", color: "#059669" },
  quiz: { bg: "#FFF7ED", color: "#EA580C" },
  study: { bg: "#F0F9FF", color: "#0284C7" },
  planner: { bg: "#FEFCE8", color: "#CA8A04" },
  mentor: { bg: "#EEF2FF", color: "#4F46E5" },
  mistakes: { bg: "#FEF2F2", color: "#DC2626" },
  community: { bg: "#F0FDFA", color: "#0D9488" },
};

function renderTaskCategoryIcon(icon: ChallengeTaskIcon) {
  const theme = TASK_ICON_THEME[icon] ?? TASK_ICON_THEME.mock;
  return (
    <div style={{ background: theme.bg, color: theme.color, borderRadius: "12px", padding: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon === "mock" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )}
      {icon === "analysis" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )}
      {icon === "lesson" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )}
      {icon === "quiz" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )}
      {icon === "study" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
      {icon === "planner" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )}
      {icon === "mentor" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
      {icon === "mistakes" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {icon === "community" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )}
    </div>
  );
}

type ComponentKey = "concepts" | "accuracy" | "speed" | "consistency";

interface ComponentConfig {
  key: ComponentKey;
  label: string;
  color: string;
  definition: string;
  improve: { text: string; href: string; cta: string };
}

// Plain-language definitions mirror src/lib/metrics/compute.ts (the single source of truth).
const READINESS_COMPONENTS: ComponentConfig[] = [
  {
    key: "concepts",
    label: "Concepts",
    color: "#0EA5E9",
    definition: "Share of the CAT syllabus lessons (QA, DILR and VARC courses) you have completed.",
    improve: { text: "Complete the next lessons in your QA, DILR and VARC courses.", href: "/topics", cta: "Open My Topics" },
  },
  {
    key: "accuracy",
    label: "Accuracy",
    color: "#2DD4BF",
    definition: "Percent of answered questions you got right in timed tests (PYQ sections, module and grand quizzes). Needs at least 5 answers.",
    improve: { text: "Review your wrong answers and revisit the linked lessons before your next timed test.", href: "/intelligence/error-tracking", cta: "Review Mistakes" },
  },
  {
    key: "speed",
    label: "Speed",
    color: "#F59E0B",
    definition: "Pace index from your average time per answered question in timed tests: 100 at 90 s/question or faster, 0 at 240 s or slower.",
    improve: { text: "Practise timed PYQ sections and aim for the CAT pace per question.", href: "/browse#pyq-section", cta: "Practise PYQs" },
  },
  {
    key: "consistency",
    label: "Consistency",
    color: "#8B5CF6",
    definition: "Percent of the last 14 days on which you studied for at least 2 minutes.",
    improve: { text: "Study a little every day: even a short lesson keeps the day active.", href: "/dashboard", cta: "Go to Dashboard" },
  },
];

const SYLLABUS_TOPIC_IDS = ["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"];

/** Course (topic) id for a lesson id such as "qa-8-1" → "qa-quantitative-ability". */
function topicIdForLesson(lessonId: string | null): string | null {
  const id = (lessonId || "").toLowerCase();
  if (id.startsWith("qa-")) return "qa-quantitative-ability";
  if (id.startsWith("dilr-")) return "dilr-data-interpretation";
  if (id.startsWith("varc-")) return "varc-verbal-ability";
  return null;
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Updated ${d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`;
}

interface FlowStepConfig {
  id: number;
  label: string;
  shortDesc: string;
  title: string;
  description: string;
  tips: string[];
  ctaText: string;
  ctaHref: string;
  themeColor: string;
  badgeBg: string;
}

const FLOW_STEPS_CONFIG: FlowStepConfig[] = [
  {
    id: 1,
    label: "TAKE A MOCK",
    shortDesc: "Simulate real exam conditions",
    title: "Take a Full or Sectional Mock Exam",
    description: "Attempt a full-length 2-hour mock or 40-minute sectional mock under strict exam constraints. TechnoCAT replicates the real TCS-iON interface, sectional timers, marking scheme (+3 / -1), and virtual calculator to build your psychological stamina and pacing.",
    tips: [
      "Take mocks during your actual CAT exam slot (e.g., 8:30 AM, 12:30 PM, or 4:30 PM).",
      "Never pause or restart midway — train your brain to adapt to unexpected tough questions.",
      "Practice round-1 skimming to pick the highest accuracy 'sitter' questions first."
    ],
    ctaText: "Browse Mock Tests",
    ctaHref: "/browse",
    themeColor: "#2563EB",
    badgeBg: "#EFF6FF"
  },
  {
    id: 2,
    label: "ANALYZE PERFORMANCE",
    shortDesc: "Deep-dive into sectional scores",
    title: "In-Depth Performance Analytics",
    description: "Don't just look at the raw composite score. Evaluate your sectional percentiles, accuracy rates, attempt velocity, and time spent per question. Understand where your minutes were spent productively vs. where you got bogged down.",
    tips: [
      "Compare your attempt-to-accuracy ratio across VARC, DILR, and QA.",
      "Inspect time wasted on questions you ended up leaving blank or getting wrong.",
      "Benchmark your sectional pacing against 99th percentile target timelines."
    ],
    ctaText: "View Performance Analytics",
    ctaHref: "/analytics",
    themeColor: "#4F46E5",
    badgeBg: "#EEF2FF"
  },
  {
    id: 3,
    label: "IDENTIFY MISTAKES",
    shortDesc: "Pinpoint & classify every error",
    title: "Review & Track Your Errors",
    description: "Every incorrect question is a golden opportunity. TechnoCAT's Error Tracker lists every wrong answer from your tests with the correct answer and explanation, grouped by section and concept, and links each concept to the lesson that teaches it.",
    tips: [
      "A negative mark costs 4 marks (+3 unearned + 1 deduction) — eliminate wild guesses.",
      "Log unforced errors in your Error Diary so you never repeat the same blunder twice.",
      "Review correct answers too to discover faster, more elegant alternative shortcuts."
    ],
    ctaText: "Open Error Tracker",
    ctaHref: "/intelligence/error-tracking",
    themeColor: "#E11D48",
    badgeBg: "#FFF1F2"
  },
  {
    id: 4,
    label: "GET INSIGHTS",
    shortDesc: "Data-driven recommendations",
    title: "Performance Analysis & Recommendations",
    description: "The Performance Analysis page turns your recorded tests into a clear picture: section scores, your score trend, where your mistakes cluster by section and concept, and a step-by-step plan built from your weakest concepts.",
    tips: [
      "Start with the weakest concept on your list: it is where marks are easiest to recover.",
      "Compare accuracy and pace across VARC, DILR and QA to decide where to practise.",
      "Track your CAT Readiness Meter week over week to confirm progress."
    ],
    ctaText: "Open Performance Analysis",
    ctaHref: "/intelligence/ai-analysis",
    themeColor: "#0284C7",
    badgeBg: "#F0F9FF"
  },
  {
    id: 5,
    label: "TARGET WEAK TOPICS",
    shortDesc: "Focused drills on low-accuracy topics",
    title: "Targeted Drills & Concept Mastery",
    description: "Zero in on the specific topic clusters where your accuracy dropped below 60%. Practice focused topic quizzes, review foundational theories, and solve previous year CAT questions to turn weak spots into dependable strengths.",
    tips: [
      "Dedicate 70% of non-mock study hours to high-weightage identified weak areas.",
      "Practice topic quizzes under 1.5 to 2 minutes-per-question time caps.",
      "Solve at least 20-30 varied problem types per subtopic before retaking a full mock."
    ],
    ctaText: "Practice Topic Quizzes",
    ctaHref: "/topics",
    themeColor: "#D97706",
    badgeBg: "#FFFBEB"
  },
  {
    id: 6,
    label: "IMPROVE YOUR SCORE",
    shortDesc: "Retest, measure & close the loop",
    title: "Re-Attempt & Measure Readiness",
    description: "Armed with identified mistakes, data-driven insights, and reinforced concepts, step back into your next mock test. Watch your accuracy improve, negative marks shrink, and overall CAT percentile climb. Repeat this continuous improvement loop to reach your target 99+ percentile.",
    tips: [
      "Implement 1 or 2 specific strategy tweaks per new mock test (e.g., skip Set 1 in DILR if hard).",
      "Monitor your CAT Readiness Meter trend week over week to verify upward progress.",
      "Consistency across 15–25 completed mock cycles builds unbreakable test-day confidence."
    ],
    ctaText: "Check Readiness Meter",
    ctaHref: "#readiness-meter",
    themeColor: "#16A34A",
    badgeBg: "#F0FDF4"
  }
];

export default function IntelligenceHubPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedInsight, setSelectedInsight] = useState<ComponentKey | null>(null);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [selectedChallengeDay, setSelectedChallengeDay] = useState<number | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMentorDrawerOpen, setIsMentorDrawerOpen] = useState(false);

  useEffect(() => {
    if (activeFlowStep !== null) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setActiveFlowStep(null);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeFlowStep]);

  const refreshChallenge = useCallback(async () => {
    try {
      const chalRes = await fetch("/api/intelligence/challenge");
      if (chalRes.ok) {
        const text = await chalRes.text();
        if (text && text.trim().length > 0) {
          setChallengeData(JSON.parse(text) as ChallengeData);
        }
      }
    } catch {
      // Ignore transient refresh errors
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboard = async () => {
      try {
        // Auth is carried by the httpOnly session cookie.
        const [metricsRes, chalRes] = await Promise.all([
          fetch("/api/me/metrics"),
          fetch("/api/intelligence/challenge")
        ]);

        if (metricsRes.ok) {
          setMetrics((await metricsRes.json()) as StudentMetrics);
          setMetricsError(null);
        } else {
          setMetricsError(
            metricsRes.status === 401
              ? "Please log in to see your readiness."
              : "We could not load your readiness right now. Please refresh to try again."
          );
        }

        if (chalRes.ok) {
          const text = await chalRes.text();
          if (text && text.trim().length > 0) {
            const data = JSON.parse(text);
            setChallengeData(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch data:", err);
        setMetricsError("We could not load your readiness right now. Please refresh to try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id, authLoading]);

  // Auto-refresh challenge checklist when returning to the page/tab after completing tasks
  useEffect(() => {
    if (authLoading || !user) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshChallenge();
      }
    };
    const handleFocus = () => {
      void refreshChallenge();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [authLoading, user, refreshChallenge]);

  // CAT Readiness: the single breakdown, straight from /api/me/metrics.
  const readinessScore = metrics?.readiness.score ?? null;
  const components = metrics?.readiness.components;
  const weights = metrics?.readiness.weights;
  const strokeOffset = 264 - (264 * (readinessScore ?? 0)) / 100;

  // Weight actually used in the score (speed is left out until there is timing data; the rest is rescaled).
  const activeWeightSum = components && weights
    ? READINESS_COMPONENTS.reduce((s, c) => (components[c.key] === null ? s : s + weights[c.key]), 0)
    : 0;
  /** Readiness points this component is currently holding back (0 when at 100). */
  const pointsHeldBack = (key: ComponentKey): number | null => {
    if (!components || !weights || activeWeightSum === 0) return null;
    const v = components[key];
    if (v === null) return null;
    return Math.round(((100 - v) * weights[key]) / activeWeightSum);
  };

  // What is affecting readiness: the two lowest available components (only if below 100)…
  const lowestComponents = components
    ? READINESS_COMPONENTS
        .filter((c) => components[c.key] !== null && (components[c.key] as number) < 100)
        .sort((a, b) => (components[a.key] as number) - (components[b.key] as number))
        .slice(0, 2)
    : [];
  // …and the weakest concepts from graded answers.
  const weakConcepts = (metrics?.concepts.weak ?? []).slice(0, 4);
  const hasAffecting = lowestComponents.length > 0 || weakConcepts.length > 0;

  // Legacy shape still accepted by the mentor drawer.
  const mentorReadiness = metrics && components && readinessScore !== null
    ? {
        readiness: readinessScore,
        concepts: components.concepts,
        accuracy: components.accuracy ?? 0,
        speed: components.speed ?? 0,
        consistency: components.consistency,
        hasActivity: metrics.hasActivity,
      }
    : undefined;

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== STICKY TOP NAVBAR ===== */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <BrandLogo height={70} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Speak & Assess", href: "/mock-viva-prep" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navLink} ${item.href === "/intelligence" ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile Dropdown */}
            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HEADER HERO SECTION ===== */}
      <div className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Intelligence Hub Hero */}
          <div className={styles.heroRow}>
            <div className={styles.heroLeft}>
              <div className={styles.badgeLabel}>
                <span className={styles.sparkleIcon}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
                  </svg>
                </span> AI-Powered Learning
              </div>
              <h1 className={styles.heroHeading}>
                Your CAT Preparation, <br />
                <span className={styles.heroHighlight}>Powered by Intelligence.</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Practice smarter, understand your mistakes, track your progress and get personalized insights — all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent}>

        {/* EXPLORE FEATURES */}
        <section className={styles.featuresSection}>
          <div className={styles.toolsSectionHeader}>
            <div className={styles.toolsTitleGroup}>
              <span className={styles.toolsSparkle} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M11 3L13 9" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M4 7L9 11" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M2 14L8 15" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
              <h2 className={styles.toolsSectionTitle}>
                Explore Your <span className={styles.toolsTitleHighlight}>Intelligence</span> Tools
              </h2>
              <p className={styles.toolsSectionSubtitle}>
                Everything you need to understand your CAT preparation better.
              </p>
            </div>
            <div className={styles.toolsDotMatrix} aria-hidden="true">
              {Array.from({ length: 16 }).map((_, idx) => (
                <span key={idx} className={styles.toolsDot} />
              ))}
            </div>
          </div>

          <div className={styles.featuresGrid}>
            {/* Card 1: Performance Analysis */}
            <Link href="/intelligence/ai-analysis" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgBlue}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 20 9 4 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>Performance Analysis</h3>
                  <p className={styles.featureDesc}>See section scores, your score trend and where your mistakes cluster, built from your recorded tests.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                    </span>
                    <span>Strengths &amp; Weaknesses</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <circle cx="12" cy="12" r="5"></circle>
                        <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                      </svg>
                    </span>
                    <span>Section-wise Insights</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipMint}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path>
                      </svg>
                    </span>
                    <span>Personalized Recommendations</span>
                  </div>
                </div>

                {/* Mini UI Preview: AI Chart + AI Bot Overlay */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.aiBrowserCard}>
                    <div className={styles.aiBrowserTop}>
                      <span className={styles.aiTopDot}></span>
                      <span className={styles.aiTopDot}></span>
                      <span className={styles.aiTopDot}></span>
                    </div>
                    <div className={styles.aiChartBody}>
                      <svg viewBox="0 0 120 62" className={styles.aiMiniSvg}>
                        <rect x="10" y="38" width="12" height="20" rx="3" fill="#E0F2FE" />
                        <rect x="30" y="28" width="12" height="30" rx="3" fill="#BAE6FD" />
                        <rect x="50" y="32" width="12" height="26" rx="3" fill="#E0F2FE" />
                        <rect x="70" y="20" width="12" height="38" rx="3" fill="#93C5FD" />
                        <rect x="90" y="14" width="12" height="44" rx="3" fill="#BFDBFE" />
                        <polyline
                          points="16,36 36,24 56,29 76,16 96,9"
                          fill="none"
                          stroke="#0EA5E9"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="16" cy="36" r="3" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="2" />
                        <circle cx="36" cy="24" r="3" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="2" />
                        <circle cx="56" cy="29" r="3" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="2" />
                        <circle cx="76" cy="16" r="3" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="2" />
                        <circle cx="96" cy="9" r="3" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.aiBotFloatCard}>
                    <div className={styles.aiBotAvatar}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="2" x2="12" y2="5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="2" r="1.5" fill="#38BDF8" />
                        <rect x="4" y="5" width="16" height="13" rx="5" fill="#2563EB" />
                        <circle cx="9.5" cy="11.5" r="1.6" fill="#FFFFFF" />
                        <circle cx="14.5" cy="11.5" r="1.6" fill="#FFFFFF" />
                        <path d="M9.5 15h5" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className={styles.aiBotTextCol}>
                      <span className={styles.aiBotHeading}>Insights</span>
                      <span className={styles.aiSkelBarBlue}></span>
                      <span className={styles.aiSkelBarGray}></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>View Analysis</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>

            {/* Card 2: Error Tracking */}
            <Link href="/intelligence/error-tracking" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgTeal}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"></circle>
                    <line x1="12" y1="8" x2="12" y2="12.5"></line>
                    <circle cx="12" cy="16" r="0.8" fill="currentColor"></circle>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>Error Tracking</h3>
                  <p className={styles.featureDesc}>Review every wrong answer with the correct answer and explanation, grouped by section and concept.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipRose}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </span>
                    <span>By Concept</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <polyline points="12 7 12 12 15 14"></polyline>
                      </svg>
                    </span>
                    <span>By Section</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <line x1="8" y1="6" x2="16" y2="6"></line>
                        <line x1="8" y1="11" x2="10" y2="11"></line>
                        <line x1="14" y1="11" x2="16" y2="11"></line>
                        <line x1="8" y1="16" x2="10" y2="16"></line>
                        <line x1="14" y1="16" x2="16" y2="16"></line>
                      </svg>
                    </span>
                    <span>Correct Answers</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"></path>
                        <circle cx="12" cy="16.5" r="0.8" fill="currentColor"></circle>
                      </svg>
                    </span>
                    <span>Explanations</span>
                  </div>
                </div>

                {/* Mini UI Preview: Donut Chart + Error Analysis Card */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.errorDonutCard}>
                    <svg viewBox="0 0 100 100" className={styles.errorDonutSvg}>
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#E2E8F0" strokeWidth="18" />
                      {/* Blue segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="18"
                        strokeDasharray="68 201"
                        strokeDashoffset="50"
                      />
                      {/* Teal segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#14B8A6"
                        strokeWidth="18"
                        strokeDasharray="45 201"
                        strokeDashoffset="-18"
                      />
                      {/* Amber segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#FBBF24"
                        strokeWidth="18"
                        strokeDasharray="40 201"
                        strokeDashoffset="-63"
                      />
                      {/* Coral/Rose segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#FB7185"
                        strokeWidth="18"
                        strokeDasharray="48 201"
                        strokeDashoffset="-103"
                      />
                    </svg>
                  </div>
                  <div className={styles.errorLegendFloat}>
                    <div className={styles.errorLegendHeader}>
                      <span className={styles.legendDotTeal}></span>
                      <span>Error Analysis</span>
                    </div>
                    <div className={styles.errorLegendRow}>
                      <span className={styles.legendDotRose}></span>
                      <span className={styles.legendBarLong}></span>
                    </div>
                    <div className={styles.errorLegendRow}>
                      <span className={styles.legendDotPurple}></span>
                      <span className={styles.legendBarMed}></span>
                    </div>
                    <div className={styles.errorLegendRow}>
                      <span className={styles.legendDotBlue}></span>
                      <span className={styles.legendBarShort}></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>Track My Errors</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>

            {/* Card 3: B-School Predictor */}
            <Link href="/intelligence/b-school-predictor" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgCyan}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>B-School Predictor</h3>
                  <p className={styles.featureDesc}>Explore profile and percentile-based B-school possibilities using your CAT performance.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                    </span>
                    <span>Percentile Analysis</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 22 7 12 2"></polygon>
                        <line x1="6" y1="7" x2="6" y2="17"></line>
                        <line x1="12" y1="7" x2="12" y2="17"></line>
                        <line x1="18" y1="7" x2="18" y2="17"></line>
                        <line x1="2" y1="20" x2="22" y2="20"></line>
                      </svg>
                    </span>
                    <span>College Predictions</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipMint}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <span>Profile-Based Insights</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </span>
                    <span>Shortlist Recommendations</span>
                  </div>
                </div>

                {/* Mini UI Preview: Your B-School Chances */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.bschoolCapBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4L2 9L12 14L22 9L12 4Z" fill="#2563EB" />
                      <path d="M6 11.5V16C8.5 18 15.5 18 18 16V11.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className={styles.bschoolMiniCard}>
                    <div className={styles.bschoolCardHeader}>Your B-School Chances</div>
                    <div className={styles.bschoolRow}>
                      <span className={styles.bschoolBankIcon}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                          <polygon points="12 2 2 7 22 7 12 2"></polygon>
                          <line x1="6" y1="7" x2="6" y2="17"></line>
                          <line x1="12" y1="7" x2="12" y2="17"></line>
                          <line x1="18" y1="7" x2="18" y2="17"></line>
                          <line x1="2" y1="20" x2="22" y2="20"></line>
                        </svg>
                      </span>
                      <div className={styles.bschoolBars}>
                        <div className={styles.bschoolBarTrack}>
                          <span className={styles.bschoolBarBlue} style={{ width: '68%' }}></span>
                        </div>
                        <span className={styles.bschoolSubTrack}></span>
                      </div>
                    </div>
                    <div className={styles.bschoolRow}>
                      <span className={styles.bschoolBankIcon}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                          <polygon points="12 2 2 7 22 7 12 2"></polygon>
                          <line x1="6" y1="7" x2="6" y2="17"></line>
                          <line x1="12" y1="7" x2="12" y2="17"></line>
                          <line x1="18" y1="7" x2="18" y2="17"></line>
                          <line x1="2" y1="20" x2="22" y2="20"></line>
                        </svg>
                      </span>
                      <div className={styles.bschoolBars}>
                        <div className={styles.bschoolBarTrack}>
                          <span className={styles.bschoolBarSky} style={{ width: '56%' }}></span>
                        </div>
                        <span className={styles.bschoolSubTrack}></span>
                      </div>
                    </div>
                    <div className={styles.bschoolRow}>
                      <span className={styles.bschoolBankIconTeal}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2">
                          <polygon points="12 2 2 7 22 7 12 2"></polygon>
                          <line x1="6" y1="7" x2="6" y2="17"></line>
                          <line x1="12" y1="7" x2="12" y2="17"></line>
                          <line x1="18" y1="7" x2="18" y2="17"></line>
                          <line x1="2" y1="20" x2="22" y2="20"></line>
                        </svg>
                      </span>
                      <div className={styles.bschoolBars}>
                        <div className={styles.bschoolBarTrack}>
                          <span className={styles.bschoolBarTeal} style={{ width: '74%' }}></span>
                        </div>
                        <span className={styles.bschoolSubTrack}></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>Check My Profile</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>

            {/* Card 4: Sectional & Full Mocks */}
            <Link href="/browse#pyq-section" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgLavender}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>Sectional &amp; Full Mocks</h3>
                  <p className={styles.featureDesc}>Practice with full-length CAT mocks and section-wise tests designed for realistic exam preparation.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </span>
                    <span>Full-Length Mocks</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </span>
                    <span>Sectional Tests</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipMint}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </span>
                    <span>Real Exam Interface</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
                      </svg>
                    </span>
                    <span>Detailed Solutions</span>
                  </div>
                </div>

                {/* Mini UI Preview: CAT Mock Test Window */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.mockMiniWindow}>
                    <div className={styles.mockWinHeader}>
                      <div className={styles.mockTrafficDots}>
                        <span className={styles.dotRed}></span>
                        <span className={styles.dotYellow}></span>
                        <span className={styles.dotGreen}></span>
                      </div>
                      <span className={styles.mockTimerBadge}>01:59:32</span>
                    </div>
                    <div className={styles.mockWinBody}>
                      <div className={styles.mockWinTitle}>CAT Mock Test</div>
                      <div className={styles.mockStepRow}>
                        <span className={styles.mockStepActive}>1</span>
                        <span className={styles.mockStepLine}></span>
                        <span className={styles.mockStepNode}>2</span>
                        <span className={styles.mockStepLine}></span>
                        <span className={styles.mockStepNode}>3</span>
                        <span className={styles.mockStepLine}></span>
                        <span className={styles.mockStepNode}>4</span>
                        <span className={styles.mockStepLine}></span>
                        <span className={styles.mockStepNode}>5</span>
                      </div>
                      <div className={styles.mockOptionsList}>
                        <div className={styles.mockOptRow}>
                          <span className={styles.mockOptBadgeActive}>A</span>
                          <span className={styles.mockOptBarActive}></span>
                        </div>
                        <div className={styles.mockOptRow}>
                          <span className={styles.mockOptBadge}>B</span>
                          <span className={styles.mockOptBar}></span>
                        </div>
                        <div className={styles.mockOptRow}>
                          <span className={styles.mockOptBadge}>D</span>
                          <span className={styles.mockOptBarShort}></span>
                        </div>
                      </div>
                      <div className={styles.mockSubmitRow}>
                        <span className={styles.mockSubmitPill}>Submit Mock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>Explore Mocks</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>

            {/* Card 5: Detailed Analytics */}
            <Link href="/analytics" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgBlue}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>Detailed Analytics</h3>
                  <p className={styles.featureDesc}>Track your score, percentile, accuracy, speed and topic-wise performance over time.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                      </svg>
                    </span>
                    <span>Score &amp; Percentile</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <circle cx="12" cy="12" r="5"></circle>
                        <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                      </svg>
                    </span>
                    <span>Accuracy &amp; Speed</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipMint}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                    </span>
                    <span>Topic-wise Analysis</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </span>
                    <span>Performance Trends</span>
                  </div>
                </div>

                {/* Mini UI Preview: Performance Trend + Legend */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.trendMiniCard}>
                    <div className={styles.trendCardTitle}>Performance Trend</div>
                    <svg viewBox="0 0 130 64" className={styles.trendMiniSvg}>
                      <defs>
                        <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <line x1="12" y1="10" x2="12" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="36" y1="10" x2="36" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="60" y1="10" x2="60" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="84" y1="10" x2="84" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="108" y1="10" x2="108" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                      <path
                        d="M12,45 L36,35 L60,26 L84,29 L108,18 L122,12 L122,56 L12,56 Z"
                        fill="url(#trendAreaFill)"
                      />
                      <polyline
                        points="12,45 36,35 60,26 84,29 108,18 122,12"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="45" r="2.5" fill="#2563EB" />
                      <circle cx="36" cy="35" r="2.5" fill="#2563EB" />
                      <circle cx="60" cy="26" r="2.5" fill="#2563EB" />
                      <circle cx="84" cy="29" r="2.5" fill="#2563EB" />
                      <circle cx="108" cy="18" r="2.5" fill="#2563EB" />
                      <circle cx="122" cy="12" r="2.5" fill="#2563EB" />
                    </svg>
                  </div>
                  <div className={styles.trendLegendFloat}>
                    <div className={styles.trendLegendItem}>
                      <span className={styles.legendDotBlue}></span>
                      <span>Accuracy</span>
                    </div>
                    <div className={styles.trendLegendItem}>
                      <span className={styles.legendDotRose}></span>
                      <span>Speed</span>
                    </div>
                    <div className={styles.trendLegendItem}>
                      <span className={styles.legendDotAmber}></span>
                      <span>Percentile</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>View Analytics</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>

            {/* Card 6: Learning Community */}
            <Link href="/intelligence/community" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgTeal}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>Learning Community</h3>
                  <p className={styles.featureDesc}>Connect with fellow CAT aspirants, discuss strategies, solve challenges and stay motivated.</p>
                </div>
              </div>

              <div className={styles.featureBodyRow}>
                <div className={styles.featureChipsList}>
                  <div className={`${styles.featureChip} ${styles.chipBlue}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </span>
                    <span>Ask Doubts</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      </svg>
                    </span>
                    <span>Discussion Forums</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipMint}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path>
                      </svg>
                    </span>
                    <span>Strategy Sharing</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </span>
                    <span>Peer Learning</span>
                  </div>
                </div>

                {/* Mini UI Preview: Community Thread */}
                <div className={styles.featureVisualWrap} aria-hidden="true">
                  <div className={styles.commGroupBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className={styles.commMiniCard}>
                    <div className={styles.commTopBar}></div>
                    <div className={styles.commThreadList}>
                      <div className={styles.commMsgRow}>
                        <span className={styles.commAvatarBlue}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </span>
                        <div className={styles.commBubbleWhite}>
                          <span className={styles.commLineLong}></span>
                          <span className={styles.commLineMed}></span>
                        </div>
                      </div>
                      <div className={styles.commMsgRow}>
                        <span className={styles.commAvatarPurple}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </span>
                        <div className={styles.commBubblePurple}>
                          <span className={styles.commLinePurpleLong}></span>
                          <span className={styles.commLinePurpleShort}></span>
                        </div>
                      </div>
                      <div className={styles.commMsgRow}>
                        <span className={styles.commAvatarTeal}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </span>
                        <div className={styles.commBubbleMint}>
                          <span className={styles.commLineMintLong}></span>
                          <span className={styles.commLineMintShort}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>Join Community</span>
                <span className={styles.featureCtaCircle}>&rarr;</span>
              </div>
            </Link>
          </div>
        </section>

        {/* INTELLIGENCE FLOW */}
        <section className={styles.flowSection} aria-label="Your Complete CAT Improvement Loop">
          <h2 className={styles.sectionTitle}>Your Complete CAT Improvement Loop</h2>
          <p className={styles.flowSectionSubtitle}>
            Click any step below to explore in-depth guidance, strategies, and action items.
          </p>
          <div className={styles.flowContainer}>
            {FLOW_STEPS_CONFIG.map((step, idx) => {
              const isActive = activeFlowStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`${styles.flowStep} ${isActive ? styles.flowStepActive : ""}`}
                    onClick={() => setActiveFlowStep(step.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Step ${step.id}: ${step.label}. Click to view details`}
                    title={`Click to view details for Step ${step.id}: ${step.label}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveFlowStep(step.id);
                      }
                    }}
                  >
                    <div className={styles.flowNodeWrapper}>
                      <div className={styles.flowNode}>{step.id}</div>
                      <div className={styles.flowNodeShadow} aria-hidden="true" />
                    </div>
                    <span className={styles.flowText}>{step.label}</span>
                  </div>

                  {idx < FLOW_STEPS_CONFIG.length - 1 && (
                    <div className={styles.flowArrow} aria-hidden="true">
                      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className={styles.flowArrowSvg}>
                        <path d="M1 6H21M21 6L16.5 1.5M21 6L16.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Details Popup Modal */}
          {activeFlowStep !== null && (() => {
            const currentStep = FLOW_STEPS_CONFIG.find((s) => s.id === activeFlowStep) || FLOW_STEPS_CONFIG[0];
            const prevStepId = currentStep.id === 1 ? FLOW_STEPS_CONFIG.length : currentStep.id - 1;
            const nextStepId = currentStep.id === FLOW_STEPS_CONFIG.length ? 1 : currentStep.id + 1;

            return (
              <div
                className={styles.flowModalOverlay}
                onClick={() => setActiveFlowStep(null)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="flow-step-modal-title"
              >
                <div
                  className={styles.flowModalCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.flowModalHeader}>
                    <div className={styles.flowModalHeaderLeft}>
                      <span
                        className={styles.flowModalStepBadge}
                        style={{
                          backgroundColor: currentStep.badgeBg,
                          color: currentStep.themeColor,
                        }}
                      >
                        Step {currentStep.id} of 6
                      </span>
                      <span className={styles.flowModalStepShortDesc}>
                        {currentStep.shortDesc}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.flowModalCloseBtn}
                      onClick={() => setActiveFlowStep(null)}
                      aria-label="Close step details"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className={styles.flowModalBody}>
                    <div className={styles.flowModalTitleRow}>
                      <span
                        className={styles.flowModalShortLabel}
                        style={{ color: currentStep.themeColor }}
                      >
                        {currentStep.label}
                      </span>
                      <h3 id="flow-step-modal-title" className={styles.flowModalMainTitle}>
                        {currentStep.title}
                      </h3>
                    </div>

                    <p className={styles.flowModalDescription}>
                      {currentStep.description}
                    </p>

                    <div className={styles.flowModalTipsBox}>
                      <div className={styles.flowModalTipsTitle}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={currentStep.themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>Key Focus &amp; Pro Tips</span>
                      </div>
                      <ul className={styles.flowModalTipsList}>
                        {currentStep.tips.map((tip, tIdx) => (
                          <li key={tIdx} className={styles.flowModalTipItem}>
                            <span
                              className={styles.flowModalTipBullet}
                              style={{
                                backgroundColor: currentStep.badgeBg,
                                color: currentStep.themeColor,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              aria-hidden="true"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={styles.flowModalFooter}>
                    <div className={styles.flowModalNavGroup}>
                      <button
                        type="button"
                        className={styles.flowModalNavBtn}
                        onClick={() => setActiveFlowStep(prevStepId)}
                        title="Previous Step"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className={styles.flowModalNavBtn}
                        onClick={() => setActiveFlowStep(nextStepId)}
                        title={currentStep.id === 6 ? "Loop back to Step 1" : "Next Step"}
                      >
                        {currentStep.id === 6 ? "Loop to 1 ↺" : "Next"}
                      </button>
                    </div>

                    {currentStep.ctaHref.startsWith("#") ? (
                      <button
                        type="button"
                        className={styles.flowModalCtaBtn}
                        style={{ backgroundColor: currentStep.themeColor }}
                        onClick={() => {
                          setActiveFlowStep(null);
                          const target = document.querySelector(currentStep.ctaHref);
                          target?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <span>{currentStep.ctaText}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    ) : (
                      <Link
                        href={currentStep.ctaHref}
                        className={styles.flowModalCtaBtn}
                        style={{ backgroundColor: currentStep.themeColor }}
                        onClick={() => setActiveFlowStep(null)}
                      >
                        <span>{currentStep.ctaText}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        <div className={styles.bottomGrid}>
          {/* CAT READINESS METER */}
          <section id="readiness-meter" className={styles.readinessSection} style={{position: 'relative'}}>
            <div className={styles.readinessHeader}>
              <h2 className={styles.sectionTitleSmall}>CAT Readiness Meter</h2>
              {metrics && <span className={styles.readinessBadge}>{formatUpdated(metrics.generatedAt)}</span>}
            </div>

            {isLoading ? (
              <div className={styles.readinessMain}>
                <p className={styles.metricDef}>Loading your readiness...</p>
              </div>
            ) : metricsError || !metrics || !components || !weights ? (
              <div className={styles.emptyAffectingState} style={{ marginBottom: 32 }}>
                <div className={styles.emptyAffectingText}>
                  <p className={styles.emptyAffectingTitle}>{metricsError ?? "Readiness is not available yet."}</p>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.readinessMain}>
                  {/* Circular Score */}
                  <div className={styles.readinessScoreBox}>
                    <div className={styles.circularProgress}>
                      <svg viewBox="0 0 100 100" className={styles.progressSvg}>
                        <circle cx="50" cy="50" r="42" className={styles.progressBg}></circle>
                        {readinessScore !== null && (
                          <circle cx="50" cy="50" r="42" className={styles.progressValue} style={{ strokeDashoffset: strokeOffset }}></circle>
                        )}
                      </svg>
                      <div className={styles.scoreText}>
                        {readinessScore !== null ? (
                          <span className={styles.scoreNumber}>{readinessScore}<span className={styles.scorePercent}>/100</span></span>
                        ) : (
                          <span className={styles.scoreNumber} aria-label="Not available yet">&ndash;</span>
                        )}
                        <span className={styles.scoreLabel}>Readiness</span>
                      </div>
                    </div>
                  </div>

                  {/* The four components, with weights and definitions */}
                  <div className={styles.readinessMetrics}>
                    {READINESS_COMPONENTS.map((c) => {
                      const v = components[c.key];
                      return (
                        <div key={c.key} className={styles.metricItem}>
                          <div className={styles.metricTop}>
                            <span className={styles.metricLabel}>
                              {c.label} <span className={styles.metricWeight}>&middot; {Math.round(weights[c.key] * 100)}% weight</span>
                            </span>
                            <span className={styles.metricVal}>{v === null ? "No data yet" : `${Math.round(v)}/100`}</span>
                          </div>
                          <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${v ?? 0}%`, background: c.color}}></div></div>
                          <p className={styles.metricDef}>{c.definition}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className={styles.metricDef} style={{ marginTop: -24, marginBottom: 32 }}>
                  {readinessScore === null
                    ? "Your readiness score appears after your first timed test (a PYQ section, module quiz or grand quiz) with at least 5 answers. Until then, concepts and consistency are shown on their own."
                    : components.speed === null
                      ? "Readiness = weighted average of the components above. Speed has no timing data yet, so it is left out and the other weights are rescaled."
                      : "Readiness = weighted average of the four components above."}
                </p>

                {/* Affecting Readiness */}
                <div className={styles.affectingSection}>
                  <h3 className={styles.affectingTitle}>What is affecting your readiness?</h3>
                  {hasAffecting ? (
                    <div className={styles.insightCards}>
                      {lowestComponents.map((c) => {
                        const v = components[c.key] as number;
                        const held = pointsHeldBack(c.key);
                        return (
                          <div
                            key={c.key}
                            className={`${styles.insightCard} ${selectedInsight === c.key ? styles.insightActive : ''}`}
                            onClick={() => setSelectedInsight(c.key)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedInsight(c.key); } }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={`${styles.insightIconBox} ${v < 50 ? styles.iconWarn : styles.iconNeutral}`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                            </div>
                            <div className={styles.insightContent}>
                              <span className={styles.insightName}>{c.label} is {Math.round(v)}/100</span>
                              <span className={styles.insightDesc}>
                                {held !== null && held > 0
                                  ? `One of your lowest components; it holds back about ${held} readiness point${held === 1 ? "" : "s"}.`
                                  : "One of your lowest components."}
                              </span>
                            </div>
                            <div className={styles.insightTap}>Tap to understand &rarr;</div>
                          </div>
                        );
                      })}
                      {weakConcepts.map((wc) => {
                        const topicId = topicIdForLesson(wc.lessonId);
                        const body = (
                          <>
                            <div className={`${styles.insightIconBox} ${styles.iconWarn}`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            </div>
                            <div className={styles.insightContent}>
                              <span className={styles.insightName}>Weak concept: {wc.concept}{wc.section ? ` (${wc.section})` : ""}</span>
                              <span className={styles.insightDesc}>
                                {wc.correct} of {wc.attempted} correct ({Math.round(wc.accuracy)}% accuracy).
                              </span>
                            </div>
                            {topicId && <div className={styles.insightTap}>Open lesson &rarr;</div>}
                          </>
                        );
                        return topicId ? (
                          <Link key={`${wc.concept}-${wc.section}`} href={`/topics/${topicId}`} className={styles.insightCard} style={{ textDecoration: "none" }}>
                            {body}
                          </Link>
                        ) : (
                          <div key={`${wc.concept}-${wc.section}`} className={styles.insightCard}>{body}</div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyAffectingState}>
                      <div className={styles.emptyAffectingIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      <div className={styles.emptyAffectingText}>
                        <p className={styles.emptyAffectingTitle}>
                          {metrics.hasActivity
                            ? "Nothing is holding your readiness back right now."
                            : "Start your CAT preparation to see what affects your readiness."}
                        </p>
                        <p className={styles.emptyAffectingSubtitle}>
                          Complete lessons and attempt a timed PYQ section; weak concepts appear once you have answered at least 3 questions on a concept.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedInsight && metrics && components && weights && (() => {
              const c = READINESS_COMPONENTS.find((x) => x.key === selectedInsight);
              const v = components[selectedInsight];
              if (!c || v === null) return null;
              const held = pointsHeldBack(selectedInsight);
              const syllabusDone = metrics.courses.topics
                .filter((t) => SYLLABUS_TOPIC_IDS.includes(t.topicId))
                .reduce((s, t) => s + t.lessonsCompleted, 0);
              return (
                <>
                  <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50}} onClick={() => setSelectedInsight(null)}></div>
                  <div className={styles.detailPanel}>
                    <button className={styles.panelClose} onClick={() => setSelectedInsight(null)} aria-label="Close">&times;</button>
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${v < 50 ? styles.iconWarn : styles.iconNeutral}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>{c.label}</h4>
                            <span className={`${styles.impactBadge} ${styles.impactMedium}`}>WEIGHT: {Math.round(weights[c.key] * 100)}%</span>
                          </div>
                          <p className={styles.panelDesc}>{c.definition}</p>
                        </div>
                      </div>

                      <h5 className={styles.panelSubtitle}>Where you are</h5>
                      <ul className={styles.panelList}>
                        <li>Your {c.label.toLowerCase()} score is {Math.round(v)}/100.</li>
                        {c.key === "concepts" && (
                          <li>{syllabusDone} of {metrics.courses.syllabusLessons} syllabus lessons completed.</li>
                        )}
                        {c.key === "accuracy" && (
                          <li>{metrics.accuracy.correct} correct out of {metrics.accuracy.attempted} answered in timed tests.</li>
                        )}
                        {c.key === "speed" && metrics.speed.secondsPerQuestion !== null && (
                          <li>You average {metrics.speed.secondsPerQuestion} s per answered question; CAT pace is about {metrics.speed.benchmarkSecondsPerQuestion} s.</li>
                        )}
                        {c.key === "consistency" && (
                          <li>You studied on {metrics.consistency.activeDaysLast14} of the last 14 days.</li>
                        )}
                        {held !== null && held > 0 && (
                          <li>Raising it to 100 would add about {held} point{held === 1 ? "" : "s"} to your readiness.</li>
                        )}
                      </ul>

                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>{c.improve.text}</li>
                      </ul>

                      <Link href={c.improve.href} className={styles.actionBtn} style={{ display: "inline-flex", marginTop: 16 }} onClick={() => setSelectedInsight(null)}>
                        {c.improve.cta} &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              );
            })()}
            {/* 7-Day Challenge */}
            <div className={styles.challengeSection} style={{position: 'relative'}}>
              {challengeData ? (
                <>
                  <div className={styles.challengeHeaderRow}>
                    <div>
                      <h3 className={styles.challengeTitle}>
                        Your 7-Day CAT Challenge
                        {challengeData.cycleNumber > 1 ? ` · Week ${challengeData.cycleNumber}` : ""}
                      </h3>
                      <p className={styles.challengeSubtitle} style={{fontSize: '14px', color: '#64748B', marginTop: '4px'}}>
                        Fresh daily goals with automatic progress verification. Click any day to inspect its checklist.
                      </p>
                    </div>
                    {challengeData.completedDays === 7 ? (
                      <div className={styles.challengeCta} style={{background: '#10B981', color: '#FFFFFF', marginTop: 0}}>
                        7-Day Journey Completed!
                      </div>
                    ) : (
                      <div className={styles.challengeProgressBadge} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', background: '#F0F9FF', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', color: '#0369A1'
                      }}>
                        {challengeData.completedDays} / {challengeData.totalDays} Days Complete
                        <div style={{width: '60px', height: '6px', background: '#E0F2FE', borderRadius: '3px', overflow: 'hidden'}}>
                          <div style={{width: `${(challengeData.completedDays / 7) * 100}%`, height: '100%', background: '#0EA5E9'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.timeline}>
                    {challengeData.days.map((d) => {
                      const isToday = d.day === challengeData.currentDay;
                      return (
                        <div
                          key={d.day}
                          onClick={() => setSelectedChallengeDay(d.day)}
                          title={`Day ${d.day}: ${d.title} (${d.progress.tasksDone}/${d.progress.tasksTotal} done)`}
                          className={`${styles.timelineDay} ${d.status === 'completed' ? styles.dayCompleted : d.status === 'today' ? styles.dayToday : d.status === 'incomplete' ? styles.dayIncomplete : styles.dayUpcoming}`}
                          style={{ cursor: 'pointer', opacity: d.status === 'upcoming' ? 0.65 : 1 }}
                        >
                          <div className={styles.dayCircle} style={{
                            borderColor: d.status === 'incomplete' ? '#FCA5A5' : d.status === 'completed' ? '#10B981' : '',
                            background: d.status === 'incomplete' ? '#FEF2F2' : d.status === 'completed' ? '#10B981' : ''
                          }}>
                            {d.status === 'completed' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : d.status === 'today' ? (
                              <span className={styles.dayDot}></span>
                            ) : d.status === 'incomplete' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            ) : null}
                          </div>
                          <span className={styles.dayLabel} style={{
                            color: d.status === 'incomplete' ? '#EF4444' : d.status === 'completed' ? '#059669' : '',
                            fontWeight: isToday ? '700' : '600'
                          }}>
                            {isToday ? "Today" : `Day ${d.day}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Today's Challenge Summary Card */}
                  {(() => {
                    const todayInfo =
                      challengeData.days.find((d) => d.day === challengeData.currentDay) ||
                      challengeData.days.find((d) => d.status === "today");
                    if (!todayInfo) return null;
                    const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                    return (
                      <div className={styles.challengeDetailCard} style={{
                        marginTop: '24px',
                        padding: '24px 28px',
                        background: '#F8FAFC',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        position: 'relative',
                        cursor: 'pointer'
                      }} onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px'}}>
                          <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                            Day {todayInfo.day} Focus: <span style={{color: '#2563EB'}}>{todayInfo.title}</span>
                          </h4>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#0369A1',
                            background: '#E0F2FE',
                            padding: '4px 10px',
                            borderRadius: '999px'
                          }}>
                            Auto-verified Checklist
                          </span>
                        </div>
                        
                        <p style={{fontSize: '14px', color: '#475569', margin: '0 0 20px 0', lineHeight: 1.5}}>{todayInfo.desc}</p>
                        
                        <div style={{fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                          TASKS PROGRESS ({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})
                        </div>
                        <ul style={{listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {todayInfo.tasks.map((t) => (
                            <li key={t.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '10px 14px',
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              border: `1px solid ${t.done ? '#A7F3D0' : '#FECACA'}`,
                              fontSize: '14px',
                              color: '#334155'
                            }}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0}}>
                                {renderTaskStatusIcon(t, 22)}
                                <span style={{
                                  fontWeight: 500,
                                  textDecoration: t.done ? 'line-through' : 'none',
                                  color: t.done ? '#64748B' : '#0F172A'
                                }}>
                                  {t.name}
                                </span>
                              </div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                flexShrink: 0,
                                background: t.done ? '#ECFDF5' : '#FEF2F2',
                                color: t.done ? '#059669' : '#DC2626'
                              }}>
                                {t.done ? "Done" : "Not done"}
                              </span>
                            </li>
                          ))}
                        </ul>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                          <span style={{fontSize: '12px', color: '#64748B'}}>
                            Tip: Click any day circle above to view other days&apos; tasks.
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedChallengeDay(todayInfo.day); }}
                            style={{
                              background: isComplete ? '#ECFDF5' : '#FFFFFF',
                              color: isComplete ? '#059669' : '#2563EB',
                              border: `1px solid ${isComplete ? '#A7F3D0' : '#BFDBFE'}`,
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'background 0.2s'
                            }}
                          >
                            {isComplete ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                Today&apos;s Challenge Completed
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            ) : (
                              <>
                                <span>Start Today&apos;s Challenge</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div style={{padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px'}}>
                  Loading your journey...
                </div>
              )}
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className={styles.quickActionsSection}>
            <h2 className={styles.sectionTitleSmall}>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <Link href="/browse#pyq-section" className={styles.actionBtn}>Start a Mock</Link>
              <Link href="/analytics" className={styles.actionBtnSecondary}>View My Analytics</Link>
              <button
                type="button"
                onClick={() => setIsMentorDrawerOpen(true)}
                className={styles.actionBtnSecondary}
              >
                Ask AI Mentor
              </button>
              <Link href="/intelligence/error-tracking" className={styles.actionBtnSecondary}>Review Mistakes</Link>
            </div>
          </section>
        </div>

      
          {/* SLIDE OUT PANEL OVERLAY for Challenge */}
            {selectedChallengeDay !== null && challengeData && (
              <>
                <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50, backdropFilter: 'blur(4px)'}} onClick={() => setSelectedChallengeDay(null)}></div>
                
                <div className="challenge-drawer" style={{
                  position: "fixed", 
                  top: '16px', 
                  right: '16px', 
                  bottom: '16px', 
                  zIndex: 51, 
                  background: "#FFFFFF", 
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", 
                  width: '42vw', minWidth: 'min(520px, calc(100vw - 32px))', maxWidth: '680px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '24px',
                  overflow: 'hidden'
                }}>
                  
                  {(() => {
                    const dayInfo = challengeData.days.find((d) => d.day === selectedChallengeDay);
                    if (!dayInfo) return null;

                    const isToday = dayInfo.day === challengeData.currentDay;
                    const isCompleted = dayInfo.status === "completed";
                    const isMissedDay = dayInfo.status === "incomplete";
                    const isUpcoming = dayInfo.status === "upcoming";
                    const nextPendingTask = dayInfo.tasks.find((t) => !t.done);

                    const statusBadgeStyle = isCompleted
                      ? { bg: "#ECFDF5", color: "#059669", label: "Completed" }
                      : isMissedDay
                        ? { bg: "#FEF2F2", color: "#DC2626", label: "Missed" }
                        : isUpcoming
                          ? { bg: "#F1F5F9", color: "#64748B", label: "Upcoming" }
                          : { bg: "#EFF6FF", color: "#2563EB", label: "In Progress" };

                    return (
                      <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                        {/* Header (Fixed) */}
                        <header className="challenge-header" style={{padding: "24px 32px", borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0}}>
                          <button type="button" className={styles.panelClose} style={{position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B'}} onClick={() => setSelectedChallengeDay(null)} aria-label="Close challenge drawer">&times;</button>
                          
                          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                            <div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                                <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                                  {isToday ? "Today's Challenge" : `Day ${dayInfo.day} Challenge`}
                                </h2>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '3px 10px',
                                  borderRadius: '999px',
                                  background: statusBadgeStyle.bg,
                                  color: statusBadgeStyle.color
                                }}>
                                  {statusBadgeStyle.label}
                                </span>
                              </div>
                              <p style={{fontSize: '14px', color: '#64748B', margin: '4px 0 0 0'}}>
                                Day {dayInfo.day} of 7
                                {challengeData.cycleNumber > 1 ? ` · Week ${challengeData.cycleNumber}` : ""}
                              </p>
                            </div>
                          </div>
                          
                          <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginRight: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              <span style={{fontSize: '13px', fontWeight: '700', color: '#0F172A'}}>{formatChallengeDate(dayInfo.date)}</span>
                            </div>
                            <span style={{fontSize: '10px', color: '#94A3B8'}}>Challenge Date</span>
                          </div>
                        </header>
                        {/* Scrollable Content */}
                        <main className="challenge-content" style={{flexGrow: 1, overflowY: "auto", padding: '24px 32px'}}>
                          
                          {/* Day Focus Card */}
                          <div style={{background: '#F8FAFC', borderRadius: '20px', padding: '24px', marginBottom: '28px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                              <div style={{background: '#D1FAE5', color: '#059669', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                              </div>
                              <span style={{fontSize: '14px', fontWeight: '700', color: '#0F172A'}}>
                                {isToday ? "Today's Focus" : `Day ${dayInfo.day} Focus`}
                              </span>
                            </div>
                            
                            <h3 style={{fontSize: '20px', fontWeight: '700', color: '#2563EB', margin: '0 0 12px 0'}}>{dayInfo.title}</h3>
                            <p style={{fontSize: '14px', color: '#475569', margin: '0 0 20px 0', lineHeight: '1.5'}}>{dayInfo.desc}</p>
                            
                            <div style={{borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '12px'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3" style={{flexShrink: 0, marginTop: '2px'}}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 -1 8 1 8z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 7-1 8 1 8z"></path></svg>
                              <div style={{flexGrow: 1}}>
                                <p style={{fontSize: '14px', fontStyle: 'italic', color: '#3B82F6', margin: '0 0 8px 0'}}>&ldquo;{dayInfo.quote}&rdquo;</p>
                                <p style={{fontSize: '13px', color: '#3B82F6', textAlign: 'right', margin: 0}}>— TechnoCAT</p>
                              </div>
                            </div>
                          </div>
  
                          {/* Tasks Section */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '16px'}}>
                            <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                              Tasks ({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})
                            </h3>
                            <span style={{fontSize: '12px', color: '#64748B'}}>
                              {isUpcoming
                                ? `Unlocks on ${formatChallengeDate(dayInfo.date)}`
                                : `Complete all ${dayInfo.progress.tasksTotal} tasks to finish Day ${dayInfo.day}`}
                            </span>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                            {dayInfo.tasks.map((task) => {
                              const borderColor = task.done
                                ? "#10B981"
                                : task.status === "upcoming"
                                  ? "#E2E8F0"
                                  : "#FCA5A5";

                              const taskPill = task.done
                                ? { bg: "#ECFDF5", color: "#059669", text: "Done" }
                                : task.status === "missed"
                                  ? { bg: "#FEF2F2", color: "#DC2626", text: "Missed" }
                                  : task.status === "upcoming"
                                    ? { bg: "#F1F5F9", color: "#64748B", text: "Upcoming" }
                                    : { bg: "#FEF2F2", color: "#DC2626", text: "Not done" };

                              const cardInner = (
                                <div style={{
                                  background: '#FFFFFF',
                                  border: `1.5px solid ${borderColor}`,
                                  borderRadius: '16px',
                                  padding: '18px 20px',
                                  display: 'flex',
                                  gap: '16px',
                                  alignItems: 'center',
                                  transition: 'border-color 0.2s, box-shadow 0.2s',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                  opacity: isUpcoming ? 0.72 : 1,
                                }}>
                                  {/* Auto-checked status circle (check or cross) */}
                                  <div style={{flexShrink: 0}}>
                                    {renderTaskStatusIcon(task, 26)}
                                  </div>
                                  
                                  {/* Category Icon Block */}
                                  {renderTaskCategoryIcon(task.icon)}
                                  
                                  <div style={{flexGrow: 1, minWidth: 0}}>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px'}}>
                                      <h5 style={{
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: task.done ? '#475569' : '#0F172A',
                                        textDecoration: task.done ? 'line-through' : 'none',
                                        margin: 0
                                      }}>
                                        {task.name}
                                      </h5>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        background: taskPill.bg,
                                        color: taskPill.color,
                                        flexShrink: 0
                                      }}>
                                        {taskPill.text}
                                      </span>
                                    </div>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.45}}>
                                      {task.description}
                                    </p>
                                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {task.duration}
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                                        {task.tag}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {!isUpcoming && !task.done && isToday && (
                                    <div style={{flexShrink: 0, paddingLeft: '4px'}}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                  )}
                                </div>
                              );

                              if (isUpcoming || !isToday) {
                                return <div key={task.id}>{cardInner}</div>;
                              }

                              if (task.action === "open-mentor") {
                                return (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedChallengeDay(null);
                                      setIsMentorDrawerOpen(true);
                                    }}
                                    style={{
                                      all: "unset",
                                      display: "block",
                                      width: "100%",
                                      cursor: "pointer",
                                      textAlign: "left",
                                    }}
                                  >
                                    {cardInner}
                                  </button>
                                );
                              }

                              return (
                                <Link
                                  key={task.id}
                                  href={task.href}
                                  style={{textDecoration: 'none', color: 'inherit', display: 'block'}}
                                >
                                  {cardInner}
                                </Link>
                              );
                            })}
                          </div>

                          {/* Motivation Card */}
                          <div style={{background: '#ECFDF5', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px'}}>
                            <div>
                              <h4 style={{fontSize: '15px', fontWeight: '700', color: '#065F46', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Complete today&apos;s challenge to:
                              </h4>
                              <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#065F46', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Improve your CAT readiness</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Build an unbroken 7-day streak</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Master every CAT prep habit</li>
                              </ul>
                            </div>
                            <div style={{textAlign: 'center', flexShrink: 0, paddingLeft: '16px', borderLeft: '1px solid #D1FAE5'}}>
                              <div style={{marginBottom: '8px', color: '#059669', display: 'flex', justifyContent: 'center'}}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                  <path d="M4 22h16" />
                                  <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
                                  <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" />
                                </svg>
                              </div>
                              <div style={{fontSize: '14px', fontWeight: '700', color: '#065F46'}}>Keep Going!</div>
                              <div style={{fontSize: '11px', color: '#047857', marginTop: '4px'}}>Consistency creates results.</div>
                            </div>
                          </div>
                          
                        </main>
                        {/* Bottom CTA (Fixed at bottom) */}
                        <footer className="challenge-footer" style={{padding: "24px 32px", borderTop: '1px solid #F1F5F9', background: '#FFFFFF', flexShrink: 0}}>
                          {isCompleted ? (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                padding: '16px',
                                borderRadius: '16px',
                                fontWeight: '700',
                                fontSize: '16px',
                              }}
                            >
                              <span>Day {dayInfo.day} Completed</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : !isToday ? (
                            <button
                              type="button"
                              onClick={() => setSelectedChallengeDay(challengeData.currentDay)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '16px',
                                borderRadius: '16px',
                                fontWeight: '700',
                                fontSize: '16px',
                                cursor: 'pointer',
                              }}
                            >
                              <span>Jump to Today&apos;s Challenge (Day {challengeData.currentDay})</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                          ) : nextPendingTask?.action === "open-mentor" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChallengeDay(null);
                                setIsMentorDrawerOpen(true);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '16px',
                                borderRadius: '16px',
                                fontWeight: '700',
                                fontSize: '16px',
                                cursor: 'pointer',
                              }}
                            >
                              <span>Start: {nextPendingTask.name}</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                          ) : (
                            <Link
                              href={nextPendingTask?.href || "/topics"}
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                padding: '16px',
                                borderRadius: '16px',
                                fontWeight: '700',
                                fontSize: '16px',
                                textDecoration: 'none',
                                transition: 'background 0.2s',
                              }}
                            >
                              <span>{nextPendingTask ? `Start: ${nextPendingTask.name}` : "Start Today's Challenge"}</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </Link>
                          )}
                          <p style={{fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0', textAlign: 'center'}}>
                            Tasks are verified automatically from your real activity—marked with a checkmark once completed, or a cross if not completed.
                          </p>
                        </footer>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

        {/* Ask AI Mentor Right-Side Drawer */}
        <AIMentorDrawer
          isOpen={isMentorDrawerOpen}
          onClose={() => {
            setIsMentorDrawerOpen(false);
            void refreshChallenge();
          }}
          userName={user?.fullName}
          userId={user?.id}
          readinessData={mentorReadiness}
        />

        </main>
    </div>
  );
}






