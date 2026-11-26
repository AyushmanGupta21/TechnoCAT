"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ChartColumn,
  ClipboardList,
  Clock3,
  MessageSquareText,
  Target,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Doodle, EASE_OUT, GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, type Tint, useReplay } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./AiFeedbackLoop.module.css";

const inView = { once: false, amount: 0.25 } as const;

/* ---------- Step visuals ---------- */

function MockVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.mockBar}>
        <span className={styles.mockTitle}>QA · Question 1 of 22</span>
        <span className={`${ui.figure} ${styles.timer}`}>
          <Clock3 size={13} strokeWidth={1.75} />
          01:59:32
        </span>
      </div>
      <div className={styles.mockBody}>
        <div className={styles.options}>
          {["A", "B", "C", "D"].map((opt, i) => (
            <motion.div
              key={opt}
              className={`${styles.option} ${i === 1 ? styles.optionActive : ""}`}
              initial={{ opacity: 0, x: reduce ? 0 : -6 }}
              animate={rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : -6 }}
              transition={{ delay: reduce ? 0 : 0.25 + i * 0.07, duration: 0.45, ease: EASE_OUT }}
            >
              <span className={styles.optKey}>{opt}</span>
              <span className={styles.optLine} style={{ width: `${[72, 58, 80, 46][i]}%` }} />
            </motion.div>
          ))}
        </div>
        <div className={styles.palette}>
          {Array.from({ length: 15 }, (_, i) => (
            <span
              key={i}
              className={`${styles.cell} ${i < 5 ? styles.cellDone : ""} ${i === 5 ? styles.cellNow : ""} ${i === 2 ? styles.cellMarked : ""}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const ERROR_CATS = [
  { label: "Concept error", value: 32, color: "var(--data-coral)" },
  { label: "Speed error", value: 26, color: "var(--data-amber)" },
  { label: "Calculation error", value: 22, color: "var(--data-blue)" },
  { label: "Question selection", value: 20, color: "var(--data-teal)" },
];

function AnalysisVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const r = 26;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.visualHead}>
        <span>Error analysis</span>
        <span className={styles.visualTag}>Mock 12</span>
      </div>
      <div className={styles.analysisRow}>
        <svg viewBox="0 0 72 72" className={styles.donut}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--canvas)" strokeWidth="10" />
          {ERROR_CATS.map((c, i) => {
            const start = acc;
            acc += c.value;
            return (
              <motion.circle
                key={c.label}
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke={c.color}
                strokeWidth="10"
                strokeDasharray={`${(c.value / 100) * C - 2} ${C}`}
                strokeDashoffset={-(start / 100) * C}
                style={{ transformBox: "view-box", transformOrigin: "center", rotate: -90 }}
                initial={{ opacity: 0, rotate: reduce ? -90 : -150 }}
                animate={rv ? { opacity: 1, rotate: -90 } : { opacity: 0, rotate: reduce ? -90 : -150 }}
                transition={{ delay: reduce ? 0 : 0.2 + i * 0.12, duration: 0.55, ease: EASE_OUT }}
              />
            );
          })}
          <text x="36" y="40" textAnchor="middle" className={styles.donutText}>
            28
          </text>
        </svg>
        <ul className={styles.cats}>
          {ERROR_CATS.map((c) => (
            <li key={c.label}>
              <span className={styles.catDot} style={{ background: c.color }} />
              <span className={styles.catLabel}>{c.label}</span>
              <span className={`${ui.figure} ${styles.catVal}`}>{c.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const PLAN_ITEMS: { label: string; Icon: LucideIcon; color: string }[] = [
  { label: "Topic-wise practice", Icon: Target, color: "var(--data-coral)" },
  { label: "Personalized quizzes", Icon: ClipboardList, color: "var(--data-blue)" },
  { label: "Performance tracking", Icon: ChartColumn, color: "var(--data-emerald)" },
  { label: "Smart recommendations", Icon: WandSparkles, color: "var(--data-violet)" },
];

function PlanVisual() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const bars = [14, 22, 33, 47];
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.visualHead}>
        <span>Your improvement plan</span>
        <span className={styles.visualTag}>Weak topics</span>
      </div>
      <div className={styles.planRow}>
        <ul className={styles.planList}>
          {PLAN_ITEMS.map(({ label, Icon, color }) => (
            <li key={label}>
              <Icon size={14} strokeWidth={1.75} style={{ color }} />
              {label}
            </li>
          ))}
        </ul>
        <svg viewBox="0 0 92 78" className={styles.planGraph}>
          <defs>
            <linearGradient id="planBarGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="planLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {bars.map((h, i) => (
            <motion.rect
              key={i}
              x={8 + i * 20}
              y={72 - h}
              width="12"
              height={h}
              rx="3"
              fill={["#bfdbfe", "#93c5fd", "#60a5fa", "url(#planBarGrad)"][i]}
              style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
              initial={{ scaleY: reduce ? 1 : 0 }}
              animate={rv ? { scaleY: 1 } : { scaleY: reduce ? 1 : 0 }}
              transition={{ delay: reduce ? 0 : 0.2 + i * 0.1, duration: 0.6, ease: EASE_OUT }}
            />
          ))}
          <motion.path
            d="M10 50 C 30 44, 54 30, 82 12"
            fill="none"
            stroke="url(#planLineGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
            transition={{ delay: reduce ? 0 : 0.6, duration: 0.55, ease: EASE_OUT }}
          />
        </svg>
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    tint: "blue" as Tint,
    title: "Take a mock",
    desc: "Attempt CAT-level questions in an interface that mirrors the real exam.",
    href: "/browse?section=pyqs#pyq-section",
    label: "Explore mock tests",
    Visual: MockVisual,
  },
  {
    n: "02",
    tint: "violet" as Tint,
    title: "AI analysis",
    desc: "The analysis engine finds your weakest topics and the patterns where time goes to waste.",
    href: "/intelligence/ai-analysis",
    label: "View AI analysis",
    Visual: AnalysisVisual,
  },
  {
    n: "03",
    tint: "teal" as Tint,
    title: "Targeted improvement",
    desc: "Sectional drills built around your weak areas, not a generic syllabus.",
    href: "/topics",
    label: "Start targeted practice",
    Visual: PlanVisual,
  },
];

export default function AiFeedbackLoop() {
  const rv = useReplay();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();

  const handleCardClick = (destination: string) => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", destination);
      }
      openAuthModal("signin");
    } else {
      router.push(destination);
    }
  };

  return (
    <>
    <section className={styles.section} id="mock-loop">
      <div className={ui.container}>
        <SectionHead
          eyebrow="How it works"
          title={
            <span className={styles.titleWrap}>
              <Doodle kind="sparkle" className={`${styles.spark} ${styles.sparkL}`} color="var(--data-cyan)" />
              The <GradientText>mock-to-mastery</GradientText> loop
              <Doodle kind="sparkle" className={`${styles.spark} ${styles.sparkR}`} color="var(--data-cyan)" delay={0.55} />
            </span>
          }
          lede="Every test feeds the next step, so practice keeps adapting to your weak areas."
          className={styles.head}
        />

        <div className={styles.loopWrap}>
          <RevealGroup className={styles.loopGrid} stagger={0.05}>
            {STEPS.map((s) => (
              <RevealItem key={s.n} className={styles.stepCell}>
                <SpotlightCard
                  tint={s.tint}
                  className={styles.step}
                  role="button"
                  tabIndex={0}
                  aria-label={s.label}
                  onClick={() => handleCardClick(s.href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(s.href);
                    }
                  }}
                >
                  <div className={styles.stepTop}>
                    <span className={`step-badge ${styles.stepBadge}`} aria-label={`Step ${s.n}`}>
                      {s.n}
                    </span>
                    <ArrowRight size={18} strokeWidth={1.75} className={styles.stepArrow} />
                  </div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                  <s.Visual />
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>

    {/* Chat tutor banner: its own band so each part reads as one screen */}
    <section className={styles.tutorSection} aria-label="Chat tutor">
      <div className={ui.container}>
        <RevealGroup className={styles.tutor} stagger={0.05}>
          <div className={styles.tutorText}>
            <RevealItem>
              <span className={styles.tutorEyebrow}>
                <MessageSquareText size={16} strokeWidth={1.75} />
                Chat tutor, available 24x7
              </span>
            </RevealItem>
            <RevealItem>
              <h3 className={styles.tutorTitle}>Instant AI doubt solver</h3>
            </RevealItem>
            <RevealItem>
              <p className={styles.tutorDesc}>Stuck on a DILR set or a quant question? Get a step-by-step breakdown.</p>
            </RevealItem>
            <RevealItem>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLight}`}
                onClick={() => handleCardClick("/topics/qa-quantitative-ability")}
              >
                Try the chat tutor demo
                <ArrowRight size={18} strokeWidth={1.75} data-arrow />
              </button>
            </RevealItem>
          </div>

          <div
            className={styles.chat}
            onClick={() => handleCardClick("/topics/qa-quantitative-ability")}
            title="Open the AI doubt tutor"
          >
            <motion.div
              className={styles.bubbleUser}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={rv ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 10 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.2 }}
            >
              How do I solve Q.4 efficiently?
            </motion.div>
            <motion.div
              className={styles.typing}
              initial={{ opacity: 0 }}
              animate={rv ? { opacity: reduce ? 0 : [0, 1, 1, 0] } : { opacity: 0 }}
              transition={{ duration: 0.55, times: [0, 0.15, 0.85, 1], delay: 0.7 }}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </motion.div>
            <motion.div
              className={styles.bubbleAi}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={rv ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 10 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: reduce ? 0.8 : 1.9 }}
            >
              <span className={styles.bubbleName}>Chat tutor</span>
              Notice that (x+2) and (x−3) are inversely proportional. Set their product to a constant k, then…
            </motion.div>
          </div>
        </RevealGroup>
      </div>
    </section>
    </>
  );
}
