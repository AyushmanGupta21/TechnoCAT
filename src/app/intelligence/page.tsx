"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock,
  FileText,
  Gauge,
  Info,
  ListChecks,
  MessageCircle,
  Play,
  Quote,
  RotateCcw,
  Target,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./intelligence.module.css";
import { useAuth } from "@/context/AuthContext";
import AIMentorDrawer from "@/components/intelligence/AIMentorDrawer";
import AppNav from "@/components/app/AppNav";
import PageHeader, { pageHeaderStyles } from "@/components/app/PageHeader";
import { CountUp, GradientText, Reveal, RevealGroup, RevealItem, SpotlightCard, type Tint } from "@/components/landing/motion";
import type { StudentMetrics } from "@/lib/metrics/types";
import type { ChallengeData, ChallengeTask, ChallengeTaskIcon } from "@/lib/challenge";

function formatChallengeDate(ymd: string): string {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return ymd;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function renderTaskStatusIcon(task: ChallengeTask, size = 20) {
  const box = { width: `${size}px`, height: `${size}px` };
  const icon = Math.round(size * 0.58);
  if (task.done || task.status === "completed") {
    return (
      <span title="Completed automatically" className={`${styles.statusIcon} ${styles.statusDone}`} style={box}>
        <Check size={icon} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }

  if (task.status === "upcoming") {
    return (
      <span title="Upcoming task" className={`${styles.statusIcon} ${styles.statusUpcoming}`} style={box}>
        <Clock size={icon} strokeWidth={2.4} aria-hidden="true" />
      </span>
    );
  }

  // Not completed (today pending or past missed) -> cross
  return (
    <span
      title={task.status === "missed" ? "Not completed (missed)" : "Not completed yet"}
      className={`${styles.statusIcon} ${styles.statusMissed}`}
      style={box}
    >
      <X size={icon} strokeWidth={3} aria-hidden="true" />
    </span>
  );
}

const TASK_ICON_THEME: Record<ChallengeTaskIcon, { color: string; Icon: LucideIcon }> = {
  mock: { color: "var(--data-blue)", Icon: FileText },
  analysis: { color: "var(--data-violet)", Icon: BarChart3 },
  lesson: { color: "var(--data-emerald)", Icon: Play },
  quiz: { color: "var(--data-amber)", Icon: ListChecks },
  study: { color: "var(--data-cyan)", Icon: Clock },
  planner: { color: "var(--data-amber)", Icon: CalendarDays },
  mentor: { color: "var(--data-blue)", Icon: MessageCircle },
  mistakes: { color: "var(--data-coral)", Icon: CircleAlert },
  community: { color: "var(--data-teal)", Icon: Users },
};

function renderTaskCategoryIcon(icon: ChallengeTaskIcon) {
  const theme = TASK_ICON_THEME[icon] ?? TASK_ICON_THEME.mock;
  const { Icon } = theme;
  return (
    <span className={styles.taskCatIcon} style={{ color: theme.color }} aria-hidden="true">
      <Icon size={18} strokeWidth={2} />
    </span>
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
    color: "var(--data-cyan)",
    definition: "Share of the CAT syllabus lessons (QA, DILR and VARC courses) you have completed.",
    improve: { text: "Complete the next lessons in your QA, DILR and VARC courses.", href: "/topics", cta: "Open my topics" },
  },
  {
    key: "accuracy",
    label: "Accuracy",
    color: "var(--data-teal)",
    definition: "Percent of answered questions you got right in timed tests (PYQ sections, module and grand quizzes). Needs at least 5 answers.",
    improve: { text: "Review your wrong answers and revisit the linked lessons before your next timed test.", href: "/intelligence/error-tracking", cta: "Review mistakes" },
  },
  {
    key: "speed",
    label: "Speed",
    color: "var(--data-amber)",
    definition: "Pace index from your average time per answered question in timed tests: 100 at 90 s/question or faster, 0 at 240 s or slower.",
    improve: { text: "Practise timed PYQ sections and aim for the CAT pace per question.", href: "/browse#pyq-section", cta: "Practise PYQs" },
  },
  {
    key: "consistency",
    label: "Consistency",
    color: "var(--data-violet)",
    definition: "Percent of the last 14 days on which you studied for at least 2 minutes.",
    improve: { text: "Study a little every day: even a short lesson keeps the day active.", href: "/dashboard", cta: "Go to dashboard" },
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
    label: "Take a mock",
    shortDesc: "Simulate real exam conditions",
    title: "Take a full or sectional mock exam",
    description: "Attempt a full-length 2-hour mock or 40-minute sectional mock under strict exam constraints. TechnoCAT replicates the real TCS-iON interface, sectional timers, marking scheme (+3 / -1), and virtual calculator to build your psychological stamina and pacing.",
    tips: [
      "Take mocks during your actual CAT exam slot (e.g., 8:30 AM, 12:30 PM, or 4:30 PM).",
      "Never pause or restart midway — train your brain to adapt to unexpected tough questions.",
      "Practice round-1 skimming to pick the highest accuracy 'sitter' questions first."
    ],
    ctaText: "Browse mock tests",
    ctaHref: "/browse",
    themeColor: "var(--data-blue)",
    badgeBg: "rgb(59 130 246 / 0.1)"
  },
  {
    id: 2,
    label: "Analyse performance",
    shortDesc: "Deep-dive into sectional scores",
    title: "In-depth performance analytics",
    description: "Don't just look at the raw composite score. Evaluate your sectional percentiles, accuracy rates, attempt velocity, and time spent per question. Understand where your minutes were spent productively vs. where you got bogged down.",
    tips: [
      "Compare your attempt-to-accuracy ratio across VARC, DILR, and QA.",
      "Inspect time wasted on questions you ended up leaving blank or getting wrong.",
      "Benchmark your sectional pacing against 99th percentile target timelines."
    ],
    ctaText: "View performance analytics",
    ctaHref: "/analytics",
    themeColor: "var(--data-violet)",
    badgeBg: "rgb(139 92 246 / 0.1)"
  },
  {
    id: 3,
    label: "Identify mistakes",
    shortDesc: "Pinpoint & classify every error",
    title: "Review & track your errors",
    description: "Every incorrect question is a golden opportunity. TechnoCAT's Error Tracker lists every wrong answer from your tests with the correct answer and explanation, grouped by section and concept, and links each concept to the lesson that teaches it.",
    tips: [
      "A negative mark costs 4 marks (+3 unearned + 1 deduction) — eliminate wild guesses.",
      "Log unforced errors in your Error Diary so you never repeat the same blunder twice.",
      "Review correct answers too to discover faster, more elegant alternative shortcuts."
    ],
    ctaText: "Open error tracker",
    ctaHref: "/intelligence/error-tracking",
    themeColor: "var(--data-coral)",
    badgeBg: "rgb(244 63 94 / 0.1)"
  },
  {
    id: 4,
    label: "Get insights",
    shortDesc: "Data-driven recommendations",
    title: "Performance analysis & recommendations",
    description: "The Performance Analysis page turns your recorded tests into a clear picture: section scores, your score trend, where your mistakes cluster by section and concept, and a step-by-step plan built from your weakest concepts.",
    tips: [
      "Start with the weakest concept on your list: it is where marks are easiest to recover.",
      "Compare accuracy and pace across VARC, DILR and QA to decide where to practise.",
      "Track your CAT Readiness Meter week over week to confirm progress."
    ],
    ctaText: "Open performance analysis",
    ctaHref: "/intelligence/ai-analysis",
    themeColor: "var(--data-cyan)",
    badgeBg: "rgb(6 182 212 / 0.1)"
  },
  {
    id: 5,
    label: "Target weak topics",
    shortDesc: "Focused drills on low-accuracy topics",
    title: "Targeted drills & concept mastery",
    description: "Zero in on the specific topic clusters where your accuracy dropped below 60%. Practice focused topic quizzes, review foundational theories, and solve previous year CAT questions to turn weak spots into dependable strengths.",
    tips: [
      "Dedicate 70% of non-mock study hours to high-weightage identified weak areas.",
      "Practice topic quizzes under 1.5 to 2 minutes-per-question time caps.",
      "Solve at least 20-30 varied problem types per subtopic before retaking a full mock."
    ],
    ctaText: "Practice topic quizzes",
    ctaHref: "/topics",
    themeColor: "var(--data-amber)",
    badgeBg: "rgb(245 158 11 / 0.12)"
  },
  {
    id: 6,
    label: "Improve your score",
    shortDesc: "Retest, measure & close the loop",
    title: "Re-attempt & measure readiness",
    description: "Armed with identified mistakes, data-driven insights, and reinforced concepts, step back into your next mock test. Watch your accuracy improve, negative marks shrink, and overall CAT percentile climb. Repeat this continuous improvement loop to reach your target 99+ percentile.",
    tips: [
      "Implement 1 or 2 specific strategy tweaks per new mock test (e.g., skip Set 1 in DILR if hard).",
      "Monitor your CAT Readiness Meter trend week over week to verify upward progress.",
      "Consistency across 15–25 completed mock cycles builds unbreakable test-day confidence."
    ],
    ctaText: "Check readiness meter",
    ctaHref: "#readiness-meter",
    themeColor: "var(--data-emerald)",
    badgeBg: "rgb(16 185 129 / 0.1)"
  }
];

/* ------------------------------------------------------------------ */
/* Tool cards: small coded vignettes instead of icon tiles             */
/* ------------------------------------------------------------------ */

function VignetteAnalysis() {
  return (
    <div className={styles.vigFrame}>
      <svg viewBox="0 0 160 76" className={styles.vigSvg} preserveAspectRatio="none">
        {[{ x: 12, h: 22 }, { x: 40, h: 34 }, { x: 68, h: 28 }, { x: 96, h: 44 }, { x: 124, h: 54 }].map((b, i) => (
          <rect key={i} x={b.x} y={70 - b.h} width="20" height={b.h} rx="4" fill="var(--data-blue)" opacity={0.16 + i * 0.06} />
        ))}
        <polyline points="22,44 50,32 78,38 106,22 134,12" fill="none" stroke="var(--data-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[[22, 44], [50, 32], [78, 38], [106, 22], [134, 12]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.2" fill="#fff" stroke="var(--data-blue)" strokeWidth="2" />
        ))}
      </svg>
      <div className={styles.vigNote}>
        <span className={styles.vigNoteDot} style={{ background: "var(--data-teal)" }} />
        <span className={styles.vigNoteLines}>
          <span style={{ width: "78%" }} />
          <span style={{ width: "52%" }} />
        </span>
      </div>
    </div>
  );
}

function VignetteErrors() {
  const segs = [
    { c: "var(--data-coral)", len: 68, off: 0 },
    { c: "var(--data-amber)", len: 46, off: -68 },
    { c: "var(--data-violet)", len: 40, off: -114 },
    { c: "var(--data-blue)", len: 47, off: -154 },
  ];
  return (
    <div className={`${styles.vigFrame} ${styles.vigRow}`}>
      <svg viewBox="0 0 80 80" className={styles.vigDonut} aria-hidden="true">
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="12" />
        {segs.map((s, i) => (
          <circle
            key={i}
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={s.c}
            strokeWidth="12"
            strokeDasharray={`${s.len - 3} 201`}
            strokeDashoffset={s.off}
            transform="rotate(-90 40 40)"
          />
        ))}
      </svg>
      <div className={styles.vigLegend}>
        {segs.map((s, i) => (
          <span key={i} className={styles.vigLegendRow}>
            <span className={styles.vigNoteDot} style={{ background: s.c }} />
            <span className={styles.vigBar} style={{ width: `${88 - i * 16}%` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function VignetteBschool() {
  const rows = [
    { w: 74, c: "var(--data-violet)" },
    { w: 58, c: "var(--data-blue)" },
    { w: 41, c: "var(--data-teal)" },
  ];
  return (
    <div className={styles.vigFrame}>
      <span className={styles.vigCaption}>Your shortlist</span>
      <div className={styles.vigStack}>
        {rows.map((r, i) => (
          <div key={i} className={styles.vigChanceRow}>
            <span className={styles.vigLabelStub} />
            <span className={styles.vigTrack}>
              <span style={{ width: `${r.w}%`, background: r.c }} />
            </span>
            <span className={styles.vigMono}>{r.w}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VignetteMock() {
  return (
    <div className={styles.vigFrame}>
      <div className={styles.vigMockTop}>
        <span className={styles.vigCaption}>Section 1 · VARC</span>
        <span className={styles.vigTimer}>01:59:32</span>
      </div>
      <div className={styles.vigPalette}>
        {["a", "a", "r", "a", "m", "n", "a", "r", "n", "n", "n", "n"].map((s, i) => (
          <span key={i} className={`${styles.vigQ} ${s === "a" ? styles.vigQa : s === "r" ? styles.vigQr : s === "m" ? styles.vigQm : ""}`}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function VignetteTrend() {
  return (
    <div className={styles.vigFrame}>
      <svg viewBox="0 0 160 70" className={styles.vigSvg} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="intelTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--data-teal)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--data-teal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[18, 36, 54].map((y) => (
          <line key={y} x1="0" x2="160" y1={y} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <path d="M4,52 L34,44 L64,34 L94,38 L124,22 L156,12 L156,70 L4,70 Z" fill="url(#intelTrendFill)" />
        <polyline points="4,52 34,44 64,34 94,38 124,22 156,12" fill="none" stroke="var(--data-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="4,58 34,54 64,50 94,44 124,42 156,34" fill="none" stroke="var(--data-amber)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      </svg>
      <div className={styles.vigKey}>
        <span><i style={{ background: "var(--data-teal)" }} />Accuracy</span>
        <span><i style={{ background: "var(--data-amber)" }} />Percentile</span>
      </div>
    </div>
  );
}

function VignetteCommunity() {
  const rows = [
    { c: "var(--data-blue)", w: ["82%", "56%"], me: false },
    { c: "var(--data-violet)", w: ["70%", "40%"], me: true },
    { c: "var(--data-teal)", w: ["76%", "48%"], me: false },
  ];
  return (
    <div className={`${styles.vigFrame} ${styles.vigStack}`}>
      {rows.map((r, i) => (
        <div key={i} className={`${styles.vigMsg} ${r.me ? styles.vigMsgMe : ""}`}>
          <span className={styles.vigAvatar} style={{ background: r.c }} />
          <span className={styles.vigBubble}>
            <span style={{ width: r.w[0] }} />
            <span style={{ width: r.w[1] }} />
          </span>
        </div>
      ))}
    </div>
  );
}

const TOOLS: {
  href: string;
  title: string;
  desc: string;
  chips: { label: string; color: string }[];
  cta: string;
  tint: Tint;
  Vignette: () => React.JSX.Element;
}[] = [
  {
    href: "/intelligence/ai-analysis",
    title: "Performance analysis",
    desc: "See section scores, your score trend and where your mistakes cluster, built from your recorded tests.",
    chips: [
      { label: "Strengths & weaknesses", color: "var(--data-blue)" },
      { label: "Section-wise insights", color: "var(--data-violet)" },
      { label: "Personalised recommendations", color: "var(--data-teal)" },
    ],
    cta: "View analysis",
    tint: "blue",
    Vignette: VignetteAnalysis,
  },
  {
    href: "/intelligence/error-tracking",
    title: "Error tracking",
    desc: "Review every wrong answer with the correct answer and explanation, grouped by section and concept.",
    chips: [
      { label: "By concept", color: "var(--data-coral)" },
      { label: "By section", color: "var(--data-amber)" },
      { label: "Correct answers", color: "var(--data-blue)" },
      { label: "Explanations", color: "var(--data-violet)" },
    ],
    cta: "Track my errors",
    tint: "coral",
    Vignette: VignetteErrors,
  },
  {
    href: "/intelligence/b-school-predictor",
    title: "B-school predictor",
    desc: "Explore profile and percentile-based B-school possibilities using your CAT performance.",
    chips: [
      { label: "Percentile analysis", color: "var(--data-blue)" },
      { label: "College predictions", color: "var(--data-violet)" },
      { label: "Profile-based insights", color: "var(--data-teal)" },
      { label: "Shortlist recommendations", color: "var(--data-amber)" },
    ],
    cta: "Check my profile",
    tint: "violet",
    Vignette: VignetteBschool,
  },
  {
    href: "/browse#pyq-section",
    title: "Sectional & full mocks",
    desc: "Practice with full-length CAT mocks and section-wise tests designed for realistic exam preparation.",
    chips: [
      { label: "Full-length mocks", color: "var(--data-blue)" },
      { label: "Sectional tests", color: "var(--data-violet)" },
      { label: "Real exam interface", color: "var(--data-teal)" },
      { label: "Detailed solutions", color: "var(--data-amber)" },
    ],
    cta: "Explore mocks",
    tint: "amber",
    Vignette: VignetteMock,
  },
  {
    href: "/analytics",
    title: "Detailed analytics",
    desc: "Track your score, percentile, accuracy, speed and topic-wise performance over time.",
    chips: [
      { label: "Score & percentile", color: "var(--data-blue)" },
      { label: "Accuracy & speed", color: "var(--data-violet)" },
      { label: "Topic-wise analysis", color: "var(--data-teal)" },
      { label: "Performance trends", color: "var(--data-amber)" },
    ],
    cta: "View analytics",
    tint: "teal",
    Vignette: VignetteTrend,
  },
  {
    href: "/intelligence/community",
    title: "Learning community",
    desc: "Connect with fellow CAT aspirants, discuss strategies, solve challenges and stay motivated.",
    chips: [
      { label: "Ask doubts", color: "var(--data-blue)" },
      { label: "Discussion forums", color: "var(--data-violet)" },
      { label: "Strategy sharing", color: "var(--data-teal)" },
      { label: "Peer learning", color: "var(--data-amber)" },
    ],
    cta: "Join community",
    tint: "blue",
    Vignette: VignetteCommunity,
  },
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
    <div className={styles.page}>
      <AppNav />

      <main className={styles.shell}>
        <PageHeader
          title="Intelligence"
          accent="hub"
          subtitle="Your readiness, mistakes and next steps, worked out from your own tests and study time."
          actions={
            <>
              <a href="#readiness-meter" className={pageHeaderStyles.secondaryAction}>
                <Gauge size={18} aria-hidden="true" />
                <span>See readiness</span>
              </a>
              <button type="button" className={pageHeaderStyles.primaryAction} onClick={() => setIsMentorDrawerOpen(true)}>
                <MessageCircle size={18} aria-hidden="true" />
                <span>Ask the AI mentor</span>
              </button>
            </>
          }
        />

        {/* CAT READINESS METER */}
        <section id="readiness-meter" className={styles.section} aria-labelledby="readiness-title">
          <Reveal className={`${styles.sectionHead} ${styles.sectionHeadRow}`}>
            <div>
              <h2 id="readiness-title" className={styles.sectionTitle}>CAT readiness meter</h2>
              <p className={styles.sectionLede}>One score from four weighted components, recalculated from your recorded activity.</p>
            </div>
            {metrics && (
              <span className={styles.updated}>
                <span className={styles.liveDot} aria-hidden="true" />
                {formatUpdated(metrics.generatedAt)}
              </span>
            )}
          </Reveal>

          {isLoading ? (
            <div className={styles.readinessLoading}>
              <p>Loading your readiness...</p>
            </div>
          ) : metricsError || !metrics || !components || !weights ? (
            <div className={`glass-card ${styles.emptyCard}`} data-tint="blue">
              <CircleAlert size={20} aria-hidden="true" />
              <p className={styles.emptyTitle}>{metricsError ?? "Readiness is not available yet."}</p>
            </div>
          ) : (
            <div className={styles.readinessGrid}>
              {/* Featured gauge card */}
              <Reveal className={styles.gaugeCard}>
                <div className={styles.gaugeTop}>
                  <div className={styles.gaugeRing}>
                    <svg viewBox="0 0 100 100" className={styles.gaugeSvg} aria-hidden="true">
                      <defs>
                        <linearGradient id="intelGauge" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#67e8f9" />
                          <stop offset="100%" stopColor="#93b4fd" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="42" className={styles.gaugeTrack} />
                      {readinessScore !== null && (
                        <circle cx="50" cy="50" r="42" className={styles.gaugeValue} style={{ strokeDashoffset: strokeOffset }} />
                      )}
                    </svg>
                    <div className={styles.gaugeCenter}>
                      {readinessScore !== null ? (
                        <span className={styles.gaugeScore}>
                          <CountUp to={readinessScore} />
                          <span className={styles.gaugeOf}>/100</span>
                        </span>
                      ) : (
                        <span className={styles.gaugeScore} aria-label="Not available yet">&ndash;</span>
                      )}
                      <span className={styles.gaugeLabel}>Readiness</span>
                    </div>
                  </div>

                  {/* The four components, with weights and definitions */}
                  <ul className={styles.componentList}>
                    {READINESS_COMPONENTS.map((c) => {
                      const v = components[c.key];
                      return (
                        <li key={c.key} className={styles.componentItem}>
                          <div className={styles.componentTop}>
                            <span className={styles.componentLabel}>
                              <span className={styles.componentSwatch} style={{ background: c.color }} />
                              {c.label}
                              <span className={styles.componentWeight}>{Math.round(weights[c.key] * 100)}%</span>
                            </span>
                            <span className={styles.componentVal}>{v === null ? "No data yet" : `${Math.round(v)}/100`}</span>
                          </div>
                          <div className={styles.componentBar}>
                            <span style={{ width: `${v ?? 0}%`, background: c.color }} />
                          </div>
                          <p className={styles.componentDef}>{c.definition}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <p className={styles.gaugeNote}>
                  {readinessScore === null
                    ? "Your readiness score appears after your first timed test (a PYQ section, module quiz or grand quiz) with at least 5 answers. Until then, concepts and consistency are shown on their own."
                    : components.speed === null
                      ? "Readiness = weighted average of the components above. Speed has no timing data yet, so it is left out and the other weights are rescaled."
                      : "Readiness = weighted average of the four components above."}
                </p>
              </Reveal>

              {/* What's holding you back */}
              <Reveal delay={0.08} className={`glass-card ${styles.backCard}`} data-tint="coral">
                <h3 className={styles.cardTitle}>What&apos;s holding you back</h3>
                {hasAffecting ? (
                  <ul className={styles.backList}>
                    {lowestComponents.map((c) => {
                      const v = components[c.key] as number;
                      const held = pointsHeldBack(c.key);
                      return (
                        <li key={c.key}>
                          <button
                            type="button"
                            className={`${styles.backItem} ${selectedInsight === c.key ? styles.backItemActive : ""}`}
                            onClick={() => setSelectedInsight(c.key)}
                          >
                            <span className={styles.backMarker} style={{ background: c.color }} />
                            <span className={styles.backText}>
                              <span className={styles.backName}>
                                {c.label} is <span className={styles.mono}>{Math.round(v)}/100</span>
                              </span>
                              <span className={styles.backDesc}>
                                {held !== null && held > 0
                                  ? `One of your lowest components; it holds back about ${held} readiness point${held === 1 ? "" : "s"}.`
                                  : "One of your lowest components."}
                              </span>
                            </span>
                            {held !== null && held > 0 && <span className={styles.backPts}>−{held}</span>}
                            <ChevronRight size={16} className={styles.backChevron} aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                    {weakConcepts.map((wc) => {
                      const topicId = topicIdForLesson(wc.lessonId);
                      const body = (
                        <>
                          <span className={styles.backMarker} style={{ background: "var(--data-coral)" }} />
                          <span className={styles.backText}>
                            <span className={styles.backName}>
                              Weak concept: {wc.concept}
                              {wc.section ? ` (${wc.section})` : ""}
                            </span>
                            <span className={styles.backDesc}>
                              {wc.correct} of {wc.attempted} correct ({Math.round(wc.accuracy)}% accuracy).
                            </span>
                          </span>
                          {topicId && (
                            <span className={styles.backLinkHint}>
                              <BookOpen size={14} aria-hidden="true" /> Open lesson
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={`${wc.concept}-${wc.section}`}>
                          {topicId ? (
                            <Link href={`/topics/${topicId}`} className={styles.backItem}>
                              {body}
                            </Link>
                          ) : (
                            <div className={`${styles.backItem} ${styles.backItemStatic}`}>{body}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={styles.backEmpty}>
                    <Target size={20} aria-hidden="true" />
                    <div>
                      <p className={styles.emptyTitle}>
                        {metrics.hasActivity
                          ? "Nothing is holding your readiness back right now."
                          : "Start your CAT preparation to see what affects your readiness."}
                      </p>
                      <p className={styles.emptySub}>
                        Complete lessons and attempt a timed PYQ section; weak concepts appear once you have answered at least 3 questions on a concept.
                      </p>
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          )}
        </section>

        {/* YOUR TOOLS */}
        <section className={styles.section} aria-labelledby="tools-title">
          <Reveal className={styles.sectionHead}>
            <h2 id="tools-title" className={styles.sectionTitle}>
              Your <GradientText>tools</GradientText>
            </h2>
            <p className={styles.sectionLede}>Everything you need to understand your CAT preparation better.</p>
          </Reveal>

          <RevealGroup className={styles.toolGrid}>
            {TOOLS.map((t) => {
              const V = t.Vignette;
              return (
                <RevealItem key={t.href} className={styles.toolCell}>
                  <SpotlightCard tint={t.tint} className={styles.toolCard}>
                    <Link href={t.href} className={styles.toolLink}>
                      <div className={styles.toolVisual} aria-hidden="true">
                        <V />
                      </div>
                      <div className={styles.toolBody}>
                        <h3 className={styles.toolTitle}>{t.title}</h3>
                        <p className={styles.toolDesc}>{t.desc}</p>
                        <ul className={styles.toolChips}>
                          {t.chips.map((c) => (
                            <li key={c.label}>
                              <span className={styles.chipDot} style={{ background: c.color }} />
                              {c.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className={styles.toolCta}>
                        {t.cta}
                        <ArrowUpRight size={16} aria-hidden="true" className={styles.toolArrow} />
                      </span>
                    </Link>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>

        {/* WORK AREA: challenge (main) + quick actions and improvement loop (right column) */}
        <div className={styles.work}>
          <div data-sticky-col className={styles.workMain}>
            {/* 7-DAY CHALLENGE */}
            <section className={styles.section} aria-labelledby="challenge-title">
              {challengeData ? (
                <>
                  <Reveal className={`${styles.sectionHead} ${styles.sectionHeadRow}`}>
                    <div>
                      <h2 id="challenge-title" className={styles.sectionTitle}>
                        Your 7-day CAT challenge
                        {challengeData.cycleNumber > 1 ? <span className={styles.weekTag}> · Week {challengeData.cycleNumber}</span> : ""}
                      </h2>
                      <p className={styles.sectionLede}>Fresh daily goals, checked automatically against your activity. Open any day to see its checklist.</p>
                    </div>
                    {challengeData.completedDays === 7 ? (
                      <span className={styles.journeyDone}>
                        <Trophy size={16} aria-hidden="true" /> 7-day journey completed
                      </span>
                    ) : (
                      <span className={styles.journeyProgress}>
                        <span className={styles.mono}>{challengeData.completedDays} / {challengeData.totalDays}</span> days complete
                        <span className={styles.journeyBar}>
                          <span style={{ width: `${(challengeData.completedDays / 7) * 100}%` }} />
                        </span>
                      </span>
                    )}
                  </Reveal>

                  <RevealGroup className={styles.strip}>
                    {challengeData.days.map((d) => {
                      const isToday = d.day === challengeData.currentDay;
                      const stateClass =
                        d.status === "completed"
                          ? styles.dayCompleted
                          : d.status === "today"
                            ? styles.dayToday
                            : d.status === "incomplete"
                              ? styles.dayIncomplete
                              : styles.dayUpcoming;
                      const pct = d.progress.tasksTotal > 0 ? (d.progress.tasksDone / d.progress.tasksTotal) * 100 : 0;
                      return (
                        <RevealItem key={d.day} className={styles.stripCell}>
                          <button
                            type="button"
                            onClick={() => setSelectedChallengeDay(d.day)}
                            title={`Day ${d.day}: ${d.title} (${d.progress.tasksDone}/${d.progress.tasksTotal} done)`}
                            className={`${styles.day} ${stateClass}`}
                          >
                            <span className={styles.dayLabel}>{isToday ? "Today" : `Day ${d.day}`}</span>
                            <span className={styles.dayCircle} aria-hidden="true">
                              {d.status === "completed" ? (
                                <Check size={16} strokeWidth={3} />
                              ) : d.status === "today" ? (
                                <span className={styles.dayDot} />
                              ) : d.status === "incomplete" ? (
                                <X size={16} strokeWidth={3} />
                              ) : (
                                <span className={styles.dayNum}>{d.day}</span>
                              )}
                            </span>
                            <span className={styles.dayProgress}>
                              <span style={{ width: `${pct}%` }} />
                            </span>
                            <span className={styles.dayCount}>
                              {d.progress.tasksDone}/{d.progress.tasksTotal}
                            </span>
                          </button>
                        </RevealItem>
                      );
                    })}
                  </RevealGroup>

                  {/* Today's challenge summary */}
                  {(() => {
                    const todayInfo =
                      challengeData.days.find((d) => d.day === challengeData.currentDay) ||
                      challengeData.days.find((d) => d.status === "today");
                    if (!todayInfo) return null;
                    const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                    return (
                      <Reveal>
                        <div className={`glass-card ${styles.todayCard}`} data-tint="blue" onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                          <div className={styles.todayHead}>
                            <div>
                              <span className={styles.kicker}>Day {todayInfo.day} focus</span>
                              <h3 className={styles.todayTitle}>{todayInfo.title}</h3>
                            </div>
                            <span className={styles.autoTag}>
                              <ListChecks size={14} aria-hidden="true" /> Auto-verified checklist
                            </span>
                          </div>

                          <p className={styles.todayDesc}>{todayInfo.desc}</p>

                          <div className={styles.todayTasksHead}>
                            Tasks progress <span className={styles.mono}>({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})</span>
                          </div>
                          <ul className={styles.todayTasks}>
                            {todayInfo.tasks.map((t) => (
                              <li key={t.id} className={t.done ? styles.todayTaskDone : ""}>
                                <span className={styles.todayTaskLeft}>
                                  {renderTaskStatusIcon(t, 22)}
                                  <span className={styles.todayTaskName}>{t.name}</span>
                                </span>
                                <span className={`${styles.pill} ${t.done ? styles.pillDone : styles.pillMissed}`}>{t.done ? "Done" : "Not done"}</span>
                              </li>
                            ))}
                          </ul>

                          <div className={styles.todayFoot}>
                            <span className={styles.todayTip}>Tip: open any day above to view its tasks.</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedChallengeDay(todayInfo.day); }}
                              className={`${styles.btn} ${isComplete ? styles.btnDone : styles.btnPrimary}`}
                            >
                              {isComplete ? (
                                <>
                                  Today&apos;s challenge completed
                                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                                </>
                              ) : (
                                <>
                                  <span>Start today&apos;s challenge</span>
                                  <ArrowRight size={16} aria-hidden="true" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })()}
                </>
              ) : (
                <div className={styles.readinessLoading}>
                  <p>Loading your journey...</p>
                </div>
              )}
            </section>
          </div>

          <div data-sticky-col className={styles.workRail}>
            {/* QUICK ACTIONS */}
            <section className={`${styles.section} ${styles.cq}`} aria-labelledby="actions-title">
              <Reveal className={styles.sectionHead}>
                <h2 id="actions-title" className={styles.sectionTitle}>Quick actions</h2>
              </Reveal>
              <RevealGroup className={styles.actionGrid}>
                <RevealItem>
                  <Link href="/browse#pyq-section" className={`${styles.actionCard} ${styles.actionPrimary}`}>
                    <FileText size={18} aria-hidden="true" />
                    <span>Start a mock</span>
                    <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
                  </Link>
                </RevealItem>
                <RevealItem>
                  <Link href="/analytics" className={styles.actionCard}>
                    <BarChart3 size={18} style={{ color: "var(--data-teal)" }} aria-hidden="true" />
                    <span>View my analytics</span>
                    <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
                  </Link>
                </RevealItem>
                <RevealItem>
                  <button type="button" onClick={() => setIsMentorDrawerOpen(true)} className={styles.actionCard}>
                    <MessageCircle size={18} style={{ color: "var(--data-violet)" }} aria-hidden="true" />
                    <span>Ask the AI mentor</span>
                    <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
                  </button>
                </RevealItem>
                <RevealItem>
                  <Link href="/intelligence/error-tracking" className={styles.actionCard}>
                    <ClipboardList size={18} style={{ color: "var(--data-coral)" }} aria-hidden="true" />
                    <span>Review mistakes</span>
                    <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
                  </Link>
                </RevealItem>
              </RevealGroup>
            </section>

          </div>
        </div>

        {/* IMPROVEMENT LOOP: full width below the challenge row (3 x 2 grid on desktop) */}
        <section className={`${styles.section} ${styles.cq}`} aria-labelledby="flow-title">
          <Reveal className={styles.sectionHead}>
            <h2 id="flow-title" className={styles.sectionTitle}>Your CAT improvement loop</h2>
            <p className={styles.sectionLede}>Six steps, repeated after every mock. Open a step for guidance and the next action.</p>
          </Reveal>

          <RevealGroup className={styles.flowTrack}>
            {FLOW_STEPS_CONFIG.map((step) => {
              const isActive = activeFlowStep === step.id;
              return (
                <RevealItem key={step.id} className={styles.flowCell}>
                  <button
                    type="button"
                    className={`${styles.flowStep} ${isActive ? styles.flowStepActive : ""}`}
                    style={{ "--step": step.themeColor, "--step-bg": step.badgeBg } as React.CSSProperties}
                    onClick={() => setActiveFlowStep(step.id)}
                    aria-label={`Step ${step.id}: ${step.label}. Open details`}
                  >
                    <span className={styles.flowNum}>{String(step.id).padStart(2, "0")}</span>
                    <span className={styles.flowLabel}>{step.label}</span>
                    <span className={styles.flowShort}>{step.shortDesc}</span>
                    <ChevronRight size={16} className={styles.flowChevron} aria-hidden="true" />
                  </button>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>


        {/* Step details modal */}
        {activeFlowStep !== null && (() => {
          const currentStep = FLOW_STEPS_CONFIG.find((s) => s.id === activeFlowStep) || FLOW_STEPS_CONFIG[0];
          const prevStepId = currentStep.id === 1 ? FLOW_STEPS_CONFIG.length : currentStep.id - 1;
          const nextStepId = currentStep.id === FLOW_STEPS_CONFIG.length ? 1 : currentStep.id + 1;

          return (
            <div
              className={styles.modalOverlay}
              onClick={() => setActiveFlowStep(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="flow-step-modal-title"
            >
              <div
                className={styles.modalCard}
                style={{ "--step": currentStep.themeColor, "--step-bg": currentStep.badgeBg } as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div className={styles.modalHeaderLeft}>
                    <span className={styles.modalStepBadge}>Step {currentStep.id} of 6</span>
                    <span className={styles.modalShort}>{currentStep.shortDesc}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setActiveFlowStep(null)}
                    aria-label="Close step details"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <span className={styles.modalKicker}>{currentStep.label}</span>
                  <h3 id="flow-step-modal-title" className={styles.modalTitle}>{currentStep.title}</h3>
                  <p className={styles.modalText}>{currentStep.description}</p>

                  <div className={styles.tipsBox}>
                    <div className={styles.tipsTitle}>
                      <Info size={16} aria-hidden="true" />
                      <span>Key focus &amp; tips</span>
                    </div>
                    <ul className={styles.tipsList}>
                      {currentStep.tips.map((tip, tIdx) => (
                        <li key={tIdx}>
                          <span className={styles.tipBullet} aria-hidden="true">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <div className={styles.modalNav}>
                    <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setActiveFlowStep(prevStepId)} title="Previous step">
                      Prev
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => setActiveFlowStep(nextStepId)}
                      title={currentStep.id === 6 ? "Loop back to step 1" : "Next step"}
                    >
                      {currentStep.id === 6 ? (
                        <>
                          Loop to 1 <RotateCcw size={14} aria-hidden="true" />
                        </>
                      ) : (
                        "Next"
                      )}
                    </button>
                  </div>

                  {currentStep.ctaHref.startsWith("#") ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnStep}`}
                      onClick={() => {
                        setActiveFlowStep(null);
                        const target = document.querySelector(currentStep.ctaHref);
                        target?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <span>{currentStep.ctaText}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <Link href={currentStep.ctaHref} className={`${styles.btn} ${styles.btnStep}`} onClick={() => setActiveFlowStep(null)}>
                      <span>{currentStep.ctaText}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Readiness component detail panel */}
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
              <div className={styles.scrim} onClick={() => setSelectedInsight(null)} />
              <aside className={styles.sidePanel} role="dialog" aria-modal="true" aria-label={`${c.label} details`}>
                <div className={styles.sideHead}>
                  <span className={styles.sideSwatch} style={{ background: c.color }} />
                  <div className={styles.sideTitleArea}>
                    <h4 className={styles.sideTitle}>{c.label}</h4>
                    <span className={styles.sideWeight}>Weight {Math.round(weights[c.key] * 100)}%</span>
                  </div>
                  <button type="button" className={styles.iconBtn} onClick={() => setSelectedInsight(null)} aria-label="Close">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className={styles.sideBody}>
                  <p className={styles.sideDesc}>{c.definition}</p>
                  <div className={styles.sideScore}>
                    <span className={styles.sideScoreNum}>{Math.round(v)}</span>
                    <span className={styles.sideScoreOf}>/100</span>
                    <div className={styles.componentBar}>
                      <span style={{ width: `${v}%`, background: c.color }} />
                    </div>
                  </div>

                  <h5 className={styles.sideSub}>Where you are</h5>
                  <ul className={styles.sideList}>
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

                  <h5 className={`${styles.sideSub} ${styles.sideSubGood}`}>How to improve</h5>
                  <ul className={`${styles.sideList} ${styles.sideListCheck}`}>
                    <li>{c.improve.text}</li>
                  </ul>

                  <Link href={c.improve.href} className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSelectedInsight(null)}>
                    {c.improve.cta}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </aside>
            </>
          );
        })()}

        {/* SLIDE-OUT PANEL for the challenge */}
        {selectedChallengeDay !== null && challengeData && (
          <>
            <div className={styles.scrim} onClick={() => setSelectedChallengeDay(null)} />

            <div className={styles.challengeDrawer} role="dialog" aria-modal="true" aria-label="Challenge day details">
              {(() => {
                const dayInfo = challengeData.days.find((d) => d.day === selectedChallengeDay);
                if (!dayInfo) return null;

                const isToday = dayInfo.day === challengeData.currentDay;
                const isCompleted = dayInfo.status === "completed";
                const isMissedDay = dayInfo.status === "incomplete";
                const isUpcoming = dayInfo.status === "upcoming";
                const nextPendingTask = dayInfo.tasks.find((t) => !t.done);

                const statusBadge = isCompleted
                  ? { cls: styles.pillDone, label: "Completed" }
                  : isMissedDay
                    ? { cls: styles.pillMissed, label: "Missed" }
                    : isUpcoming
                      ? { cls: styles.pillMuted, label: "Upcoming" }
                      : { cls: styles.pillBlue, label: "In progress" };

                return (
                  <div className={styles.cdInner}>
                    {/* Header (fixed) */}
                    <header className={styles.cdHeader}>
                      <div className={styles.cdHeadText}>
                        <div className={styles.cdTitleRow}>
                          <h2 className={styles.cdTitle}>{isToday ? "Today's challenge" : `Day ${dayInfo.day} challenge`}</h2>
                          <span className={`${styles.pill} ${statusBadge.cls}`}>{statusBadge.label}</span>
                        </div>
                        <p className={styles.cdMeta}>
                          Day {dayInfo.day} of 7
                          {challengeData.cycleNumber > 1 ? ` · Week ${challengeData.cycleNumber}` : ""}
                          <span className={styles.cdDate}>
                            <CalendarDays size={14} aria-hidden="true" />
                            {formatChallengeDate(dayInfo.date)}
                          </span>
                        </p>
                      </div>
                      <button type="button" className={styles.iconBtn} onClick={() => setSelectedChallengeDay(null)} aria-label="Close challenge drawer">
                        <X size={18} aria-hidden="true" />
                      </button>
                    </header>

                    {/* Scrollable content */}
                    <div className={styles.cdBody}>
                      {/* Day focus */}
                      <div className={styles.cdFocus}>
                        <span className={styles.kicker}>
                          <Target size={14} aria-hidden="true" /> {isToday ? "Today's focus" : `Day ${dayInfo.day} focus`}
                        </span>
                        <h3 className={styles.cdFocusTitle}>{dayInfo.title}</h3>
                        <p className={styles.cdFocusDesc}>{dayInfo.desc}</p>
                        <blockquote className={styles.cdQuote}>
                          <Quote size={16} aria-hidden="true" />
                          <div>
                            <p>&ldquo;{dayInfo.quote}&rdquo;</p>
                            <cite>— TechnoCAT</cite>
                          </div>
                        </blockquote>
                      </div>

                      {/* Tasks */}
                      <div className={styles.cdTasksHead}>
                        <h3 className={styles.cdTasksTitle}>
                          Tasks <span className={styles.mono}>({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})</span>
                        </h3>
                        <span className={styles.cdTasksHint}>
                          {isUpcoming
                            ? `Unlocks on ${formatChallengeDate(dayInfo.date)}`
                            : `Complete all ${dayInfo.progress.tasksTotal} tasks to finish Day ${dayInfo.day}`}
                        </span>
                      </div>

                      <div className={styles.cdTasks}>
                        {dayInfo.tasks.map((task) => {
                          const stateCls = task.done
                            ? styles.taskDone
                            : task.status === "upcoming"
                              ? styles.taskUpcoming
                              : styles.taskMissed;

                          const taskPill = task.done
                            ? { cls: styles.pillDone, text: "Done" }
                            : task.status === "missed"
                              ? { cls: styles.pillMissed, text: "Missed" }
                              : task.status === "upcoming"
                                ? { cls: styles.pillMuted, text: "Upcoming" }
                                : { cls: styles.pillMissed, text: "Not done" };

                          const cardInner = (
                            <div className={`${styles.task} ${stateCls} ${isUpcoming ? styles.taskDim : ""}`}>
                              {renderTaskStatusIcon(task, 26)}
                              <div className={styles.taskMain}>
                                <div className={styles.taskTop}>
                                  <h5 className={styles.taskName}>
                                    {renderTaskCategoryIcon(task.icon)}
                                    <span>{task.name}</span>
                                  </h5>
                                  <span className={`${styles.pill} ${taskPill.cls}`}>{taskPill.text}</span>
                                </div>
                                <p className={styles.taskDesc}>{task.description}</p>
                                <div className={styles.taskMeta}>
                                  <span>
                                    <Clock size={12} aria-hidden="true" /> {task.duration}
                                  </span>
                                  <span>{task.tag}</span>
                                </div>
                              </div>

                              {!isUpcoming && !task.done && isToday && (
                                <ChevronRight size={18} className={styles.taskGo} aria-hidden="true" />
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
                                className={styles.taskBtn}
                                onClick={() => {
                                  setSelectedChallengeDay(null);
                                  setIsMentorDrawerOpen(true);
                                }}
                              >
                                {cardInner}
                              </button>
                            );
                          }

                          return (
                            <Link key={task.id} href={task.href} className={styles.taskBtn}>
                              {cardInner}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Motivation */}
                      <div className={styles.cdMotivation}>
                        <div>
                          <h4 className={styles.cdMotTitle}>Complete today&apos;s challenge to:</h4>
                          <ul className={styles.cdMotList}>
                            <li><Check size={14} strokeWidth={3} aria-hidden="true" /> Improve your CAT readiness</li>
                            <li><Check size={14} strokeWidth={3} aria-hidden="true" /> Build an unbroken 7-day streak</li>
                            <li><Check size={14} strokeWidth={3} aria-hidden="true" /> Master every CAT prep habit</li>
                          </ul>
                        </div>
                        <div className={styles.cdMotSide}>
                          <Trophy size={28} aria-hidden="true" />
                          <strong>Keep going</strong>
                          <span>Consistency creates results.</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA (fixed) */}
                    <footer className={styles.cdFooter}>
                      {isCompleted ? (
                        <div className={styles.cdDoneBar}>
                          <span>Day {dayInfo.day} completed</span>
                          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                        </div>
                      ) : !isToday ? (
                        <button type="button" onClick={() => setSelectedChallengeDay(challengeData.currentDay)} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
                          <span>Jump to today&apos;s challenge (Day {challengeData.currentDay})</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </button>
                      ) : nextPendingTask?.action === "open-mentor" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChallengeDay(null);
                            setIsMentorDrawerOpen(true);
                          }}
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                        >
                          <span>Start: {nextPendingTask.name}</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </button>
                      ) : (
                        <Link href={nextPendingTask?.href || "/topics"} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
                          <span>{nextPendingTask ? `Start: ${nextPendingTask.name}` : "Start today's challenge"}</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                      )}
                      <p className={styles.cdFootNote}>
                        Tasks are verified automatically from your real activity: a check once completed, a cross if not.
                      </p>
                    </footer>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* AI mentor drawer */}
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
