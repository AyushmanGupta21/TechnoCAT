"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./WhyStandOutSection.module.css";

interface FeatureCardData {
  id: string;
  badgeType: "ai" | "play" | "star";
  topTag?: string;
  title: string;
  body: string;
  href: string;
  renderVisual: () => React.ReactNode;
}

const features: FeatureCardData[] = [
  {
    id: "ai",
    badgeType: "ai",
    href: "/topics",
    title: "Detailed CAT Mock Video Solutions",
    body: "TechnoCAT provides detailed video solutions for both full length and sectional CAT mock tests.",
    renderVisual: () => (
      <div className={styles.visualContainer}>
        <div className={styles.videoVisualLayout}>
          {/* Left Mini Video Player Card */}
          <div className={styles.miniVideoPlayer}>
            <div className={styles.miniVideoScreen}>
              <div className={styles.miniPlayCircle}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </div>
              <div className={styles.miniVideoLines}>
                <span className={styles.lineDark} />
                <span className={styles.lineMed} />
                <span className={styles.lineLight} />
              </div>
            </div>
            <div className={styles.miniProgressTrack}>
              <div className={styles.miniProgressFill} />
              <div className={styles.miniProgressThumb} />
            </div>
          </div>

          {/* Right Question -> Solution -> Concept Steps */}
          <div className={styles.videoStepPills}>
            <div className={styles.videoStepPill}>
              <span className={`${styles.stepIcon} ${styles.stepCyan}`}>?</span>
              <span className={styles.stepLabel}>Question</span>
            </div>
            <div className={styles.videoStepPill}>
              <span className={`${styles.stepIcon} ${styles.stepPurple}`}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </span>
              <span className={styles.stepLabel}>Solution</span>
            </div>
            <div className={styles.videoStepPill}>
              <span className={`${styles.stepIcon} ${styles.stepGreen}`}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              <span className={styles.stepLabel}>Concept</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "error",
    badgeType: "play",
    href: "/intelligence/error-tracking",
    title: "Error Tracker (AI-Based CAT Mock Analysis)",
    body: "This feature tracks all your errors after completing the CAT mock test and provides analysis. Manually analyzing any mock requires a lot of time.",
    renderVisual: () => (
      <div className={styles.visualContainer}>
        <div className={styles.errorDashboardCard}>
          <div className={styles.errorHeaderRow}>
            <span className={styles.errorHeaderTitle}>Error Analysis</span>
            <div className={styles.windowDots}>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={styles.errorBodyRow}>
            {/* Donut Chart SVG */}
            <div className={styles.donutWrap}>
              <svg viewBox="0 0 80 80" className={styles.donutSvg}>
                <circle cx="40" cy="40" r="26" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                {/* Blue segment */}
                <circle
                  cx="40"
                  cy="40"
                  r="26"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  strokeDasharray="62 164"
                  strokeDashoffset="0"
                />
                {/* Teal segment */}
                <circle
                  cx="40"
                  cy="40"
                  r="26"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="36 164"
                  strokeDashoffset="-62"
                />
                {/* Pink/Coral segment */}
                <circle
                  cx="40"
                  cy="40"
                  r="26"
                  fill="none"
                  stroke="#FB7185"
                  strokeWidth="12"
                  strokeDasharray="34 164"
                  strokeDashoffset="-98"
                />
                {/* Amber segment */}
                <circle
                  cx="40"
                  cy="40"
                  r="26"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="12"
                  strokeDasharray="32 164"
                  strokeDashoffset="-132"
                />
              </svg>
            </div>

            {/* Error Categories Legend */}
            <div className={styles.errorLegend}>
              <div className={styles.errorLegendItem}>
                <span className={styles.legendDot} style={{ background: "#FB7185" }} />
                <span>Concept Error</span>
              </div>
              <div className={styles.errorLegendItem}>
                <span className={styles.legendDot} style={{ background: "#60A5FA" }} />
                <span>Speed Error</span>
              </div>
              <div className={styles.errorLegendItem}>
                <span className={styles.legendDot} style={{ background: "#FBBF24" }} />
                <span>Calculation Error</span>
              </div>
              <div className={styles.errorLegendItem}>
                <span className={styles.legendDot} style={{ background: "#10B981" }} />
                <span>Question Selection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "analysis",
    badgeType: "play",
    href: "/intelligence/ai-analysis",
    title: "Analysis Across All CAT Mocks",
    body: "Keep a track of your skill level across all CAT mocks: Attempted, Time Taken, Correct, and Incorrect across all the CAT mock.",
    renderVisual: () => (
      <div className={styles.visualContainerPlain}>
        {/* Top Graph Box */}
        <div className={styles.progressGraphCard}>
          <div className={styles.progressTopRow}>
            <span className={styles.progressTitle}>Your Progress</span>
            <span className={styles.sectionsPill}>All Sections ▾</span>
          </div>
          <svg viewBox="0 0 220 58" className={styles.lineChartSvg}>
            <defs>
              <linearGradient id="progressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="8" y1="16" x2="212" y2="16" stroke="#EFF6FF" strokeWidth="1" />
            <line x1="8" y1="34" x2="212" y2="34" stroke="#EFF6FF" strokeWidth="1" />
            <line x1="8" y1="50" x2="212" y2="50" stroke="#EFF6FF" strokeWidth="1" />
            <path
              d="M16 46 C 42 38, 60 24, 80 25 C 100 26, 114 42, 132 39 C 152 35, 168 24, 204 14 L 204 54 L 16 54 Z"
              fill="url(#progressAreaGrad)"
            />
            <path
              d="M16 46 C 42 38, 60 24, 80 25 C 100 26, 114 42, 132 39 C 152 35, 168 24, 204 14"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="46" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="48" cy="34" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="80" cy="25" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="128" cy="40" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="166" cy="24" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="204" cy="14" r="3.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.2" />
          </svg>
        </div>

        {/* Bottom 3 Metric Pills */}
        <div className={styles.metricTrioGrid}>
          <div className={`${styles.metricMiniCard} ${styles.metricGreen}`}>
            <span className={styles.metricMiniIcon} style={{ color: "#10B981" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>
            <span className={styles.metricMiniText}>
              Accuracy <em className={styles.upArrow}>↑</em>
            </span>
          </div>
          <div className={`${styles.metricMiniCard} ${styles.metricAmber}`}>
            <span className={styles.metricMiniIcon} style={{ color: "#F59E0B" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className={styles.metricMiniText}>
              Speed <em className={styles.upArrow}>↑</em>
            </span>
          </div>
          <div className={`${styles.metricMiniCard} ${styles.metricBlue}`}>
            <span className={styles.metricMiniIcon} style={{ color: "#2563EB" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className={styles.metricMiniText}>
              Consistency <em className={styles.upArrow}>↑</em>
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "best",
    badgeType: "star",
    topTag: "BEST CAT MOCK TEST.",
    href: "/browse?section=pyqs#pyq-section",
    title: "Best CAT Mock Test",
    body: "TechnoCAT's CAT mock test interface is really flexible to use. Even if power input gets cut, your mock will automatically get resumed.",
    renderVisual: () => (
      <div className={styles.visualContainerPlain}>
        <div className={styles.mockSimLayout}>
          {/* Left Mini Mock Simulator Window */}
          <div className={styles.mockWindowCard}>
            <div className={styles.mockWindowBar}>
              <span style={{ background: "#FB7185" }} />
              <span style={{ background: "#FBBF24" }} />
              <span style={{ background: "#34D399" }} />
            </div>
            <div className={styles.mockWindowBody}>
              <div className={styles.timerRow}>
                <div className={styles.timerClockIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
                <div className={styles.timerDigitsWrap}>
                  <span className={styles.timerSmallLbl}>Time Left</span>
                  <span className={styles.timerDigits}>01:59:32</span>
                </div>
              </div>

              <div className={styles.mcqOptionsList}>
                {["A", "B", "C", "D"].map((opt, idx) => (
                  <div key={opt} className={styles.mcqOptionRow}>
                    <span className={`${styles.mcqBubble} ${idx === 1 ? styles.mcqBubbleActive : ""}`}>
                      {opt}
                    </span>
                    <span className={`${styles.mcqBar} ${idx === 1 ? styles.mcqBarActive : ""}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Feature Status Pills */}
          <div className={styles.mockFeaturePills}>
            <div className={styles.mockFeaturePill}>
              <span className={`${styles.mockFeatIcon} ${styles.featGreen}`}>✓</span>
              <span className={styles.mockFeatText}>Auto Save</span>
            </div>
            <div className={styles.mockFeaturePill}>
              <span className={`${styles.mockFeatIcon} ${styles.featBlue}`}>↻</span>
              <span className={styles.mockFeatText}>Resume Anytime</span>
            </div>
            <div className={styles.mockFeaturePill}>
              <span className={`${styles.mockFeatIcon} ${styles.featPurple}`}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <span className={styles.mockFeatText}>Detailed Analysis</span>
            </div>
          </div>
        </div>
      </div>
    ),
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
      openAuthModal("signup");
    } else {
      router.push(href);
    }
  };

  const renderBadgeIcon = (type: FeatureCardData["badgeType"]) => {
    if (type === "ai") {
      return <span className={styles.badgeAiText}>AI</span>;
    }
    if (type === "star") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="6 4 20 12 6 20 6 4" />
      </svg>
    );
  };

  return (
    <section className={styles.section} id="why-stand-out">
      {/* Subtle Background Decorative Accents */}
      <div className={styles.bgCircleLeft} aria-hidden="true" />
      <div className={styles.bgDotGrid} aria-hidden="true" />
      <div className={styles.bgOrbLeft} aria-hidden="true" />
      <div className={styles.bgPaperPlane} aria-hidden="true">
        <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M28 18C56 16 74 36 102 36C118 36 128 28 144 32"
            stroke="#BAE6FD"
            strokeWidth="1.6"
            strokeDasharray="4 5"
            strokeLinecap="round"
          />
          <path
            d="M12 16L30 10L24 26L20 19L12 16Z"
            fill="#E0F2FE"
            stroke="#0EA5E9"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className={styles.container}>
        {/* Header Area */}
        <div className={styles.headerBlock}>
          <div className={styles.conceptTag}>CONCEPTUALISED BY INDRAJEET SINGH</div>

          <div className={styles.headingWrapper}>
            <span className={styles.sparkleLeft} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="10" y2="2" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="14" y1="12" x2="4" y2="10" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="16" y1="18" x2="8" y2="20" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>

            <h2 className={styles.heading}>
              Why do <span className={styles.headingHighlight}>TechnoCAT</span> CAT Mocks Stand Out?
            </h2>

            <span className={styles.sparkleRight} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="6" y1="6" x2="14" y2="2" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="10" y1="12" x2="20" y2="10" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="8" y1="18" x2="16" y2="20" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <p className={styles.subHeading}>
            Everything you need to practice smarter, understand your mistakes, and improve your CAT performance.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className={styles.grid}>
          {features.map((f) => (
            <div
              key={f.id}
              className={styles.card}
              onClick={() => handleCardClick(f.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(f.href);
                }
              }}
            >
              {/* Card Header: Icon + Title */}
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  {renderBadgeIcon(f.badgeType)}
                </span>
                <div className={styles.titleWrap}>
                  {f.topTag && <div className={styles.cardTopTag}>{f.topTag}</div>}
                  <h3 className={styles.cardTitle}>{f.title}</h3>
                </div>
              </div>

              {/* Card Description */}
              <p className={styles.cardBody}>{f.body}</p>

              {/* Card Mini Visual Illustration */}
              <div className={styles.visualArea}>{f.renderVisual()}</div>

              {/* Bottom Action: View More + */}
              <button
                type="button"
                className={styles.viewMoreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(f.href);
                }}
              >
                <span>View More</span>
                <span className={styles.viewMoreIcon} aria-hidden="true">
                  +
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

