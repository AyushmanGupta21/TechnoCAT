"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Clock3 } from "lucide-react";
import styles from "./TwoModesSection.module.css";
import ui from "@/components/landing/ui.module.css";
import { GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, EASE_OUT, useReplay } from "@/components/landing/motion";
import { useAuth } from "@/context/AuthContext";
import { useExamMode, type ExamMode } from "@/lib/examMode";

// One data colour per checklist item (accents only)
const CHECK_COLORS = ["var(--data-blue)", "var(--data-teal)", "var(--data-violet)", "var(--data-amber)"];
const CHECK_COLORS_DARK = ["#93c5fd", "#5eead4", "#c4b5fd", "#fcd34d"];

const CLASSIC_FEATURES = ["Actual CAT interface", "Smart navigation", "Sectional timing", "Real exam simulation"];
const MODERN_FEATURES = [
  "Smooth, interactive interface",
  "Quick navigation between tabs",
  "Enhanced analytics",
  "Distraction-free experience",
];

// Question palette states for the classic mock preview
const PALETTE: Array<"answered" | "review" | "visited" | "none" | "current"> = [
  "answered", "answered", "visited", "answered", "review", "answered", "none", "answered",
  "answered", "visited", "answered", "current", "none", "none", "none", "none",
];

export default function TwoModesSection() {
  const rv = useReplay();
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();

  const [, setExamMode] = useExamMode();
  // Remember the chosen interface so the next timed attempt opens in it (switchable any time in the exam).
  const handleModeClick = (mode: ExamMode) => (e: React.MouseEvent) => {
    setExamMode(mode);
    if (!user || user.isGuest) {
      e.preventDefault();
      openAuthModal("signin");
    }
  };

  const optionIn = (i: number) => ({
    initial: { opacity: 0, x: reduce ? 0 : -10 },
    animate: rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : -10 },
    transition: { duration: 0.5, delay: reduce ? 0 : 0.25 + i * 0.07, ease: EASE_OUT },
  });

  return (
    <section className={`${ui.section} ${styles.sec}`} id="two-modes">
      <div className={ui.container}>
        <SectionHead
          eyebrow="Two exam modes"
          title={
            <>
              Sit every mock <GradientText>the way you prefer</GradientText>
            </>
          }
          lede="Classic mirrors the actual CAT interface. Modern is built for focus. Switch any time."
          className={styles.compactHead}
        />

        <RevealGroup className={styles.grid} stagger={0.05}>
          {/* Classic */}
          <RevealItem className={styles.cell}>
            <SpotlightCard className={styles.card} tint="teal">
              <div className={styles.cardHead}>
                <div className={styles.cardTitles}>
                  <h3 className={styles.cardTitle}>Classic mode</h3>
                  <p className={styles.cardSub}>Mode 01 · the real CAT experience</p>
                </div>
                <Link href="/browse#pyq-section" onClick={handleModeClick("classic")} className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSm} ${styles.tryBtn}`}>
                  Try now
                  <ArrowRight size={16} strokeWidth={1.75} data-arrow />
                </Link>
              </div>

              <ul className={styles.features}>
                {CLASSIC_FEATURES.map((f, i) => (
                  <li key={f}>
                    <Check size={16} strokeWidth={2.25} className={styles.check} style={{ color: CHECK_COLORS[i] }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Classic interface preview */}
              <div className={styles.screen} aria-hidden="true">
                <div className={styles.classicBar}>
                  <span>CAT mock · Classic mode</span>
                  <span className={`${ui.figure} ${styles.timer}`}>
                    <Clock3 size={13} strokeWidth={1.75} /> 38:12
                  </span>
                </div>
                <div className={styles.classicBody}>
                  <div className={styles.classicMain}>
                    <div className={styles.qMeta}>
                      <span>Question 12</span>
                      <span className={ui.figure}>+3 / −1</span>
                    </div>
                    <p className={styles.qText}>
                      If the ratio of work done by (x+2) workers in (x−3) days to the work done by (x+4) workers in
                      (x−2) days is…
                    </p>
                    <div className={styles.radios}>
                      {["9 : 10", "3 : 4", "8 : 9", "5 : 6"].map((o, i) => (
                        <motion.div key={o} className={`${styles.radio} ${i === 2 ? styles.radioOn : ""}`} {...optionIn(i)}>
                          <span className={styles.radioDot} />
                          <span className={ui.figure}>{o}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className={styles.classicActions}>
                      <span>Previous</span>
                      <span>Chat tutor</span>
                      <span className={styles.classicNext}>Save &amp; next</span>
                    </div>
                  </div>
                  <div className={styles.palette}>
                    {PALETTE.map((s, i) => (
                      <motion.span
                        key={i}
                        className={`${styles.pal} ${styles[`pal_${s}`]}`}
                        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                        animate={rv ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.6 }}
                        transition={{ duration: 0.35, delay: reduce ? 0 : 0.3 + i * 0.025, ease: EASE_OUT }}
                      >
                        {i + 1}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </RevealItem>

          <div className={styles.or} aria-hidden="true">
            <span>or</span>
          </div>

          {/* Modern */}
          <RevealItem className={styles.cell}>
            <SpotlightCard tone="dark" className={`${styles.card} ${styles.cardDark}`}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitles}>
                  <h3 className={styles.cardTitle}>Modern mode</h3>
                  <p className={styles.cardSub}>Mode 02 · the TechnoCAT interface</p>
                </div>
                <Link href="/browse#pyq-section" onClick={handleModeClick("modern")} className={`${ui.btn} ${ui.btnLight} ${ui.btnSm} ${styles.tryBtn}`}>
                  Try now
                  <ArrowRight size={16} strokeWidth={1.75} data-arrow />
                </Link>
              </div>

              <ul className={styles.features}>
                {MODERN_FEATURES.map((f, i) => (
                  <li key={f}>
                    <Check size={16} strokeWidth={2.25} className={styles.check} style={{ color: CHECK_COLORS_DARK[i] }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Modern interface preview */}
              <div className={`${styles.screen} ${styles.screenModern}`} aria-hidden="true">
                <div className={styles.modernTop}>
                  <span className={styles.modernTabs}>
                    <span className={styles.tabOn}>VARC</span>
                    <span>DILR</span>
                    <span>QA</span>
                  </span>
                  <span className={`${ui.figure} ${styles.modernTimer}`}>24:50</span>
                </div>
                <div className={styles.modernBody}>
                  <p className={styles.modernQ}>
                    The passage mentions several examples of corporations that claimed their actions were necessary
                    for…
                  </p>
                  <div className={styles.modernOpts}>
                    {["Option A", "Option B", "Option C", "Option D"].map((o, i) => (
                      <motion.div key={o} className={`${styles.modernOpt} ${i === 1 ? styles.modernOptOn : ""}`} {...optionIn(i)}>
                        <span className={styles.optKey}>{String.fromCharCode(65 + i)}</span>
                        {o}
                      </motion.div>
                    ))}
                  </div>
                  <div className={styles.spark}>
                    <div className={styles.sparkLabel}>
                      <span>Accuracy this section</span>
                      <span className={ui.figure}>82%</span>
                    </div>
                    <svg viewBox="0 0 200 44" preserveAspectRatio="none" className={styles.sparkSvg}>
                      <defs>
                        <linearGradient id="tmSpark" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="60%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M0 36 C 20 34, 30 26, 50 28 S 80 18, 100 20 S 140 10, 160 12 S 190 6, 200 4"
                        fill="none"
                        stroke="url(#tmSpark)"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        initial={{ pathLength: reduce ? 1 : 0 }}
                        animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
                        transition={{ duration: 0.55, delay: 0.4, ease: EASE_OUT }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}
