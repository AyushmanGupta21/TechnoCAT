"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  CircleQuestionMark,
  Clock3,
  CloudCheck,
  Crosshair,
  Play,
  RotateCw,
  ScanSearch,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EASE_OUT, GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, type Tint, useReplay } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./WhyStandOutSection.module.css";

const inView = { once: false, amount: 0.25 } as const;

/* ---------- Visuals (dark surface) ---------- */

function VideoVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const steps: { label: string; Icon: LucideIcon; color: string }[] = [
    { label: "Question", Icon: CircleQuestionMark, color: "#fbbf24" },
    { label: "Solution", Icon: Play, color: "#2dd4bf" },
    { label: "Concept", Icon: BookOpen, color: "#a78bfa" },
  ];
  return (
    <div className={styles.videoLayout} aria-hidden="true">
      <div className={styles.player}>
        <div className={styles.screen}>
          <span className={styles.playBtn}>
            <Play size={14} strokeWidth={1.75} fill="currentColor" />
          </span>
          <div className={styles.screenLines}>
            <span style={{ width: "70%" }} />
            <span style={{ width: "52%" }} />
            <span style={{ width: "38%" }} />
          </div>
        </div>
        <div className={styles.progressRow}>
          <span className={`${ui.figure} ${styles.time}`}>04:12</span>
          <div className={styles.track}>
            <motion.span
              className={styles.fill}
              initial={{ scaleX: reduce ? 0.62 : 0 }}
              animate={rv ? { scaleX: 0.62 } : { scaleX: reduce ? 0.62 : 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.3 }}
            />
          </div>
        </div>
      </div>
      <ol className={styles.steps}>
        {steps.map(({ label, Icon, color }, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, x: reduce ? 0 : 8 }}
            animate={rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : 8 }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.12, duration: 0.45, ease: EASE_OUT }}
          >
            <Icon size={14} strokeWidth={1.75} style={{ color }} />
            {label}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

const ERRORS = [
  { label: "Concept error", value: 38, color: "linear-gradient(90deg, #fb7185, #f43f5e)" },
  { label: "Speed error", value: 27, color: "linear-gradient(90deg, #fbbf24, #f59e0b)" },
  { label: "Calculation error", value: 21, color: "linear-gradient(90deg, #60a5fa, #3b82f6)" },
  { label: "Question selection", value: 14, color: "linear-gradient(90deg, #2dd4bf, #14b8a6)" },
];

function ErrorVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.panelHead}>
        <span>Error analysis</span>
        <span className={`${ui.figure} ${styles.panelMeta}`}>28 errors</span>
      </div>
      <ul className={styles.bars}>
        {ERRORS.map((e, i) => (
          <li key={e.label}>
            <span className={styles.barLabel}>{e.label}</span>
            <span className={styles.barTrack}>
              <motion.span
                className={styles.barFill}
                style={{ background: e.color }}
                initial={{ scaleX: reduce ? e.value / 40 : 0 }}
                animate={rv ? { scaleX: e.value / 40 } : { scaleX: reduce ? e.value / 40 : 0 }}
                transition={{ delay: reduce ? 0 : 0.2 + i * 0.1, duration: 0.55, ease: EASE_OUT }}
              />
            </span>
            <span className={`${ui.figure} ${styles.barVal}`}>{e.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const line = "M16 46 C 42 38, 60 24, 80 25 C 100 26, 114 42, 132 39 C 152 35, 168 24, 204 14";
  const pts: [number, number][] = [
    [16, 46],
    [48, 34],
    [80, 25],
    [128, 40],
    [166, 24],
    [204, 14],
  ];
  const metrics: { label: string; Icon: LucideIcon; color: string }[] = [
    { label: "Accuracy", Icon: Crosshair, color: "#fb7185" },
    { label: "Speed", Icon: Zap, color: "#fbbf24" },
    { label: "Consistency", Icon: ChartColumn, color: "#2dd4bf" },
  ];
  return (
    <div className={styles.progressWrap} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span>Your progress</span>
          <span className={styles.panelMeta}>All sections</span>
        </div>
        <svg viewBox="0 0 220 58" className={styles.lineSvg}>
          <defs>
            <linearGradient id="whyProgressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="whyProgressLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {[16, 34, 50].map((y) => (
            <line key={y} x1="8" y1={y} x2="212" y2={y} stroke="rgba(255,255,255,0.08)" />
          ))}
          <motion.path
            d={`${line} L 204 54 L 16 54 Z`}
            fill="url(#whyProgressFill)"
            initial={{ opacity: 0 }}
            animate={rv ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: reduce ? 0 : 1.1, duration: 0.55 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#whyProgressLine)"
            strokeWidth="2.25"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.2 }}
          />
          {pts.map(([x, y], i) => (
            <motion.circle
              key={x}
              cx={x}
              cy={y}
              r={i === pts.length - 1 ? 3.5 : 2.6}
              fill="var(--blue-950)"
              stroke={["#60a5fa", "#2dd4bf", "#fbbf24", "#fb7185", "#a78bfa", "#22d3ee"][i]}
              strokeWidth="1.75"
              initial={{ opacity: reduce ? 1 : 0 }}
              animate={rv ? { opacity: 1 } : { opacity: reduce ? 1 : 0 }}
              transition={{ delay: reduce ? 0 : 0.3 + i * 0.2, duration: 0.3 }}
            />
          ))}
        </svg>
      </div>
      <div className={styles.metrics}>
        {metrics.map(({ label, Icon, color }) => (
          <span key={label} className={styles.metric}>
            <Icon size={14} strokeWidth={1.75} style={{ color }} />
            {label}
            <TrendingUp size={13} strokeWidth={1.75} className={styles.up} />
          </span>
        ))}
      </div>
    </div>
  );
}

function SimulatorVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const statuses: { label: string; Icon: LucideIcon; color: string }[] = [
    { label: "Auto save", Icon: CloudCheck, color: "#34d399" },
    { label: "Resume anytime", Icon: RotateCw, color: "#60a5fa" },
    { label: "Detailed analysis", Icon: ScanSearch, color: "#a78bfa" },
  ];
  return (
    <div className={styles.simLayout} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.timerLabel}>
            <Clock3 size={14} strokeWidth={1.75} />
            Time left
          </span>
          <span className={`${ui.figure} ${styles.timerVal}`}>01:59:32</span>
        </div>
        <div className={styles.mcq}>
          {["A", "B", "C", "D"].map((opt, i) => (
            <div key={opt} className={`${styles.mcqRow} ${i === 1 ? styles.mcqActive : ""}`}>
              <span className={styles.mcqKey}>{opt}</span>
              <span className={styles.mcqLine} style={{ width: `${[64, 78, 52, 70][i]}%` }} />
            </div>
          ))}
        </div>
      </div>
      <ul className={styles.status}>
        {statuses.map(({ label, Icon, color }, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={rv ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 6 }}
            transition={{ delay: reduce ? 0 : 0.35 + i * 0.12, duration: 0.45, ease: EASE_OUT }}
          >
            <Icon size={14} strokeWidth={1.75} style={{ color }} />
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

interface FeatureCardData {
  id: string;
  topTag?: string;
  title: string;
  body: string;
  href: string;
  Visual: () => React.ReactElement;
  tint: Tint;
}

const features: FeatureCardData[] = [
  {
    id: "ai",
    href: "/topics",
    title: "Detailed CAT mock video solutions",
    body: "Detailed video solutions for every full-length and sectional CAT mock.",
    Visual: VideoVisual,
    tint: "blue",
  },
  {
    id: "error",
    href: "/intelligence/error-tracking",
    title: "Error tracker (AI-based mock analysis)",
    body: "Every error is tracked and analysed after each mock, work that takes hours by hand.",
    Visual: ErrorVisual,
    tint: "coral",
  },
  {
    id: "analysis",
    href: "/intelligence/ai-analysis",
    title: "Analysis across all CAT mocks",
    body: "Your skill level across every mock: attempts, time taken, correct and incorrect.",
    Visual: ProgressVisual,
    tint: "teal",
  },
  {
    id: "best",
    href: "/browse?section=pyqs#pyq-section",
    title: "Best CAT mock test",
    body: "A flexible interface. If the power goes out, your mock resumes where you left it.",
    Visual: SimulatorVisual,
    tint: "violet",
  },
];

export default function WhyStandOutSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleCardClick = (href: string) => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", href);
      }
      openAuthModal("signin");
    } else {
      router.push(href);
    }
  };

  return (
    <section className={styles.section} id="why-stand-out">
      <div className={ui.container}>
        <SectionHead
          tone="dark"
          eyebrow="Conceptualised by Indrajeet Singh"
          title={<>Why TechnoCAT mocks <GradientText dark>stand out</GradientText></>}
          lede="Practice smarter, understand your mistakes and improve your CAT performance."
          className={styles.head}
        />

        <RevealGroup className={styles.grid} stagger={0.05}>
          {features.map((f) => (
            <RevealItem key={f.id} className={styles.cell}>
              <SpotlightCard
                tone="dark"
                tint={f.tint}
                className={styles.card}
                role="button"
                tabIndex={0}
                aria-label={f.title}
                onClick={() => handleCardClick(f.href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(f.href);
                  }
                }}
              >
                <div className={styles.textCol}>
                  <div className={styles.titleWrap}>
                    {f.topTag && <span className={styles.topTag}>{f.topTag}</span>}
                    <h3 className={styles.cardTitle}>{f.title}</h3>
                  </div>
                  <p className={styles.cardBody}>{f.body}</p>

                <button
                  type="button"
                  className={styles.more}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(f.href);
                  }}
                >
                  View more
                  <ArrowRight size={16} strokeWidth={1.75} />
                </button>
                </div>

                <div className={styles.visualArea}>
                  <f.Visual />
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
