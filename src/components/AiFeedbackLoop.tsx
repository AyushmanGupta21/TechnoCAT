"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./AiFeedbackLoop.module.css";

export default function AiFeedbackLoop() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

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
    <section className={styles.section}>
      {/* Subtle Background Decorative Accents */}
      <div className={styles.bgOrbLeft} aria-hidden="true" />
      <div className={styles.bgDotGrid} aria-hidden="true" />
      <div className={styles.bgSwirlRight} aria-hidden="true">
        <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 38C28 18 52 18 46 36C41 50 24 44 34 28C46 10 86 24 132 52"
            stroke="#BAE6FD"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.headingWrap}>
            <span className={styles.sparkleLeft} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="10" y2="2" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="14" y1="12" x2="4" y2="10" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="16" y1="18" x2="8" y2="20" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>

            <h2 className={styles.heading}>
              The Ultimate <span className={styles.highlight}>Mock-to-Mastery</span> Loop
            </h2>

            <span className={styles.sparkleRight} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="6" y1="6" x2="14" y2="2" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="10" y1="12" x2="20" y2="10" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="8" y1="18" x2="16" y2="20" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <p className={styles.subheading}>
            TechnoCAT is not just a mock series—it&apos;s a complete ecosystem that adapts to your weaknesses and guarantees improvement.
          </p>
        </div>

        {/* 3 Connected Step Cards */}
        <div className={styles.loopGrid}>
          {/* ================= STEP 01: TAKE A MOCK ================= */}
          <div
            className={styles.stepCard}
            onClick={() => handleCardClick("/browse?section=pyqs#pyq-section")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick("/browse?section=pyqs#pyq-section");
              }
            }}
            title="Click to explore mock tests"
          >
            <div className={styles.badgeHalo}>
              <div className={`${styles.stepNumber} ${styles.badgeBlue}`}>01</div>
            </div>

            <div className={styles.cardTextGroup}>
              <h3 className={styles.stepTitle}>Take a Mock</h3>
              <p className={styles.stepDesc}>
                Attempt CAT-level questions in a highly accurate simulation environment.
              </p>
            </div>

            {/* Internal Mock Interface Illustration */}
            <div className={styles.visualCard}>
              <div className={styles.mockTopBar}>
                <span style={{ background: "#FB7185" }} />
                <span style={{ background: "#FBBF24" }} />
                <span style={{ background: "#34D399" }} />
              </div>

              <div className={styles.mockInterfaceBody}>
                {/* Left: Timer + Options A, B, C, D */}
                <div className={styles.mockLeftCol}>
                  <div className={styles.mockTimerRow}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 14" />
                    </svg>
                    <div className={styles.mockTimerText}>
                      <span className={styles.mockTimerLabel}>Time Left</span>
                      <span className={styles.mockTimerValue}>01:59:32</span>
                    </div>
                  </div>

                  <div className={styles.mockOptionsList}>
                    {["A", "B", "C", "D"].map((opt, idx) => (
                      <div key={opt} className={styles.mockOptionRow}>
                        <span className={`${styles.mockOptionCircle} ${idx === 0 ? styles.mockOptionActive : ""}`}>
                          {opt}
                        </span>
                        <div className={styles.mockOptionLines}>
                          <span className={styles.mockLinePrimary} />
                          <span className={styles.mockLineSecondary} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Question Number Grid + Submit Mock Button */}
                <div className={styles.mockRightCol}>
                  <div className={styles.questionPaletteGrid}>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                      <span
                        key={num}
                        className={`${styles.paletteCell} ${num === 1 ? styles.paletteCellActive : ""}`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                  <div className={styles.submitMockPill}>Submit Mock</div>
                </div>
              </div>
            </div>

            {/* Bottom Message Strip */}
            <div className={`${styles.bottomMessage} ${styles.msgBlue}`}>
              <span className={styles.msgIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </span>
              <span>Practice under real exam conditions.</span>
            </div>
          </div>

          {/* ================= CONNECTOR 1 -> 2 ================= */}
          <div className={styles.connectorWrap} aria-hidden="true">
            <svg className={styles.connectorArc} viewBox="0 0 80 42" fill="none">
              <path
                d="M2 36 C 24 8, 56 8, 78 36"
                stroke="#93C5FD"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles.connectorCircle}>
              <svg className={styles.connectorArrowIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </div>
          </div>

          {/* ================= STEP 02: AI ANALYSIS ================= */}
          <div
            className={styles.stepCard}
            onClick={() => handleCardClick("/intelligence/ai-analysis")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick("/intelligence/ai-analysis");
              }
            }}
            title="Click to view AI Analysis"
          >
            <div className={styles.badgeHalo}>
              <div className={`${styles.stepNumber} ${styles.badgeCyan}`}>02</div>
            </div>

            <div className={styles.cardTextGroup}>
              <h3 className={styles.stepTitle}>AI Analysis</h3>
              <p className={styles.stepDesc}>
                Our engine detects your weakest topics and tracks time-wasting patterns.
              </p>
            </div>

            {/* Internal AI Analysis Illustration */}
            <div className={styles.visualCard}>
              <div className={styles.analysisCardInner}>
                <div className={styles.analysisTopRow}>
                  <span className={styles.analysisTitle}>Error Analysis</span>
                  <div className={styles.aiChipBox}>
                    <span>AI</span>
                  </div>
                </div>

                <div className={styles.analysisContentRow}>
                  {/* Donut Chart */}
                  <div className={styles.donutContainer}>
                    <svg viewBox="0 0 84 84" className={styles.donutSvg}>
                      <circle cx="42" cy="42" r="27" fill="none" stroke="#EFF6FF" strokeWidth="12" />
                      <circle
                        cx="42"
                        cy="42"
                        r="27"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        strokeDasharray="60 170"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="42"
                        cy="42"
                        r="27"
                        fill="none"
                        stroke="#34D399"
                        strokeWidth="12"
                        strokeDasharray="34 170"
                        strokeDashoffset="-60"
                      />
                      <circle
                        cx="42"
                        cy="42"
                        r="27"
                        fill="none"
                        stroke="#FBBF24"
                        strokeWidth="12"
                        strokeDasharray="28 170"
                        strokeDashoffset="-94"
                      />
                      <circle
                        cx="42"
                        cy="42"
                        r="27"
                        fill="none"
                        stroke="#FB7185"
                        strokeWidth="12"
                        strokeDasharray="48 170"
                        strokeDashoffset="-122"
                      />
                    </svg>
                  </div>

                  {/* Error Categories */}
                  <div className={styles.errorCategoryList}>
                    <div className={styles.errorCatRow}>
                      <span className={styles.catDot} style={{ background: "#FB7185" }} />
                      <span>Concept Error</span>
                    </div>
                    <div className={styles.errorCatRow}>
                      <span className={styles.catDot} style={{ background: "#FDBA74" }} />
                      <span>Speed Error</span>
                    </div>
                    <div className={styles.errorCatRow}>
                      <span className={styles.catDot} style={{ background: "#FBBF24" }} />
                      <span>Calculation Error</span>
                    </div>
                    <div className={styles.errorCatRow}>
                      <span className={styles.catDot} style={{ background: "#34D399" }} />
                      <span>Question Selection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Message Strip */}
            <div className={`${styles.bottomMessage} ${styles.msgCyan}`}>
              <span className={styles.msgIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
              </span>
              <span>Understand exactly where you lose marks.</span>
            </div>
          </div>

          {/* ================= CONNECTOR 2 -> 3 ================= */}
          <div className={styles.connectorWrap} aria-hidden="true">
            <svg className={styles.connectorArc} viewBox="0 0 80 42" fill="none">
              <path
                d="M2 36 C 24 8, 56 8, 78 36"
                stroke="#93C5FD"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles.connectorCircle}>
              <svg className={styles.connectorArrowIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </div>
          </div>

          {/* ================= STEP 03: TARGETED IMPROVEMENT ================= */}
          <div
            className={styles.stepCard}
            onClick={() => handleCardClick("/topics")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick("/topics");
              }
            }}
            title="Click to start targeted practice"
          >
            <div className={styles.badgeHalo}>
              <div className={`${styles.stepNumber} ${styles.badgeTeal}`}>03</div>
            </div>

            <div className={styles.cardTextGroup}>
              <h3 className={styles.stepTitle}>Targeted Improvement</h3>
              <p className={styles.stepDesc}>
                Get customized sectional drills focused purely on your weak areas.
              </p>
            </div>

            {/* Internal Improvement Plan Illustration */}
            <div className={styles.visualCard}>
              <div className={styles.planCardInner}>
                <div className={styles.planTopRow}>
                  <span className={styles.planTitle}>Your Improvement Plan</span>
                  <span className={styles.weakTopicsPill}>Weak Topics ▾</span>
                </div>

                <div className={styles.planBodyRow}>
                  {/* Left: 4 Plan Features */}
                  <div className={styles.planItemsList}>
                    <div className={styles.planItem}>
                      <span className={styles.planItemIcon} style={{ background: "#FFE4E6", color: "#F43F5E" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                      </span>
                      <span>Topic-wise Practice</span>
                    </div>
                    <div className={styles.planItem}>
                      <span className={styles.planItemIcon} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
                      </span>
                      <span>Personalized Quizzes</span>
                    </div>
                    <div className={styles.planItem}>
                      <span className={styles.planItemIcon} style={{ background: "#D1FAE5", color: "#059669" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </span>
                      <span>Performance Tracking</span>
                    </div>
                    <div className={styles.planItem}>
                      <span className={styles.planItemIcon} style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </span>
                      <span>Smart Recommendations</span>
                    </div>
                  </div>

                  {/* Right: Upward Progress Bars & Curve */}
                  <div className={styles.planGraphBox}>
                    <svg viewBox="0 0 92 78" className={styles.planGraphSvg}>
                      <path
                        d="M10 48 C 30 42, 54 28, 80 10"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <polyline
                        points="73 9 81 9 80 17"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect x="10" y="58" width="11" height="14" rx="2.5" fill="#DBEAFE" />
                      <rect x="29" y="50" width="11" height="22" rx="2.5" fill="#BFDBFE" />
                      <rect x="48" y="39" width="11" height="33" rx="2.5" fill="#93C5FD" />
                      <rect x="67" y="25" width="11" height="47" rx="2.5" fill="#60A5FA" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Message Strip */}
            <div className={`${styles.bottomMessage} ${styles.msgTeal}`}>
              <span className={styles.msgIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </span>
              <span>Turn your weak areas into strong ones.</span>
            </div>
          </div>
        </div>

        {/* AI Doubt Solver Banner */}
        <div className={styles.aiTutorBanner}>
          <div className={styles.aiTutorContent}>
            <h3 className={styles.aiTutorTitle}>24x7 Instant AI Doubt Solver</h3>
            <p className={styles.aiTutorDesc}>
              Stuck on a tricky DILR set or a tough Quant question? Our Chat Tutor breaks down any problem step-by-step, anytime.
            </p>
            <button
              className={styles.demoBtn}
              onClick={() => handleCardClick("/topics/qa-quantitative-ability")}
            >
              Try Chat Tutor Demo
            </button>
          </div>
          <div
            className={styles.aiTutorMockup}
            onClick={() => handleCardClick("/topics/qa-quantitative-ability")}
            style={{ cursor: "pointer" }}
            title="Click to open AI Doubt Tutor"
          >
            <div className={styles.chatBubbleUser}>How to solve Q.4 efficiently?</div>
            <div className={styles.chatBubbleAi}>
              <strong>Chat Tutor:</strong> Notice that (x+2) and (x-3) are inversely proportional...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
