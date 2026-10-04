"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./intelligence.module.css";
import Image from "next/image";
import PostLoginNavActions from "@/components/PostLoginNavActions";

interface ChallengeData {
  startDate: string;
  currentDay: number;
  completedDays: number;
  totalDays: number;
  days: {
    day: number;
    date: string;
    status: 'completed' | 'incomplete' | 'today' | 'upcoming';
    title: string;
    desc: string;
    tasks: { name: string; done: boolean }[];
    progress: { tasksDone: number; tasksTotal: number };
  }[];
}

interface DashboardData {
  metrics: {
    inProgressCourses: number;
    completedCourses: number;
    watchingTime: string;
    pointsEarned: number;
  };
  summary: {
    totalHoursWeek: number;
    avgHoursDay: number;
    courseHoursWeek: number;
    challengeHoursWeek: number;
  };
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
    title: "Classify & Track Your Errors",
    description: "Every incorrect question is a golden opportunity. Classify your errors into Conceptual Gaps, Calculation Slips, Misread Questions, or Panic Guesses. TechnoCAT's Error Tracker maps mistakes directly to your preparation log.",
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
    label: "GET AI INSIGHTS",
    shortDesc: "AI diagnostic recommendations",
    title: "AI Diagnostic Analysis & Recommendations",
    description: "TechnoCAT AI analyzes your entire mock attempt trajectory to reveal subconscious patterns: section-3 fatigue, overconfidence in geometry, or getting trapped in lengthy DILR sets. Get actionable recommendations tailored specifically to your test profile.",
    tips: [
      "Review your AI-generated Weakness Radar to focus on high-yield topic improvements.",
      "Follow recommended question selection rules based on your proven sectional strengths.",
      "Monitor your predicted percentile bracket with the CAT Readiness Meter."
    ],
    ctaText: "Explore AI Insights",
    ctaHref: "/intelligence/ai-analysis",
    themeColor: "#0284C7",
    badgeBg: "#F0F9FF"
  },
  {
    id: 5,
    label: "TARGET WEAK TOPICS",
    shortDesc: "Focused drills on low-accuracy topics",
    title: "Targeted Drills & Concept Mastery",
    description: "Zero in on the specific topic clusters where your accuracy dropped below 65%. Practice focused topic quizzes, review foundational theories, and solve previous year CAT questions to turn weak spots into dependable strengths.",
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
    description: "Armed with identified mistakes, AI insights, and reinforced concepts, step back into your next mock test. Watch your accuracy improve, negative marks shrink, and overall CAT percentile climb. Repeat this continuous improvement loop to reach your target 99+ percentile.",
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
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [selectedChallengeDay, setSelectedChallengeDay] = useState<number | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveFlowStep(null);
      }
    };
    if (activeFlowStep !== null) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeFlowStep]);

  useEffect(() => {
            const fetchDashboard = async () => {
      try {
        const [dashRes, chalRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/intelligence/challenge")
        ]);

        if (dashRes.ok) {
          const text = await dashRes.text();
          if (text && text.trim().length > 0) {
            setDashboardData(JSON.parse(text));
          }
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
      } finally {
        setIsLoading(false);
      }
    };
      fetchDashboard();
  }, []);


  const calcConcepts = () => {
    if (!dashboardData) return 85;
    const completed = dashboardData.metrics.completedCourses || 0;
    const inProgress = dashboardData.metrics.inProgressCourses || 0;
    return Math.min(100, Math.max(10, Math.floor(((completed * 2 + inProgress) / 10) * 100)));
  };

  const calcSpeed = () => {
    if (!dashboardData) return 64;
    const challenge = dashboardData.summary.challengeHoursWeek || 0;
    return Math.min(100, Math.max(10, Math.floor((challenge / 30) * 100)));
  };

  const calcConsistency = () => {
    if (!dashboardData) return 90;
    const avg = dashboardData.summary.avgHoursDay || 0;
    return Math.min(100, Math.max(10, Math.floor((avg / 6) * 100)));
  };

  const calcAccuracy = () => {
    if (!dashboardData) return 72;
    const points = dashboardData.metrics.pointsEarned || 0;
    return Math.min(100, Math.max(10, Math.floor((points / 1200) * 100)));
  };

  const concepts = isLoading ? 0 : calcConcepts();
  const speed = isLoading ? 0 : calcSpeed();
  const consistency = isLoading ? 0 : calcConsistency();
  const accuracy = isLoading ? 0 : calcAccuracy();
  const readiness = isLoading ? 0 : Math.floor((concepts + speed + consistency + accuracy) / 4);
  
  const strokeOffset = 264 - (264 * readiness) / 100;

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== HEADER SECTION (Mirrored from Dashboard) ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Mock Viva Prep", href: "#" },
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

          {/* Intelligence Hub Hero */}
          <div className={styles.heroRow}>
            <div className={styles.heroLeft}>
              <div className={styles.badgeLabel}>
                <span className={styles.sparkleIcon}>✨</span> AI-Powered Learning
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
      </header>

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
            {/* Card 1: AI Performance Analysis */}
            <Link href="/intelligence/ai-analysis" className={styles.featureCard}>
              <div className={styles.featureHeaderRow}>
                <div className={`${styles.featureIcon} ${styles.bgBlue}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 20 9 4 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className={styles.featureHeadText}>
                  <h3 className={styles.featureTitle}>AI Performance Analysis</h3>
                  <p className={styles.featureDesc}>Get personalized insights from your mock-test performance and discover exactly where you need to improve.</p>
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
                      <span className={styles.aiBotHeading}>AI Insights</span>
                      <span className={styles.aiSkelBarBlue}></span>
                      <span className={styles.aiSkelBarGray}></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.featureCta}>
                <span>View AI Analysis</span>
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
                  <p className={styles.featureDesc}>Track repeated mistakes, identify error patterns and understand the concepts behind your wrong answers.</p>
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
                    <span>Concept Error</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipAmber}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <polyline points="12 7 12 12 15 14"></polyline>
                      </svg>
                    </span>
                    <span>Speed Error</span>
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
                    <span>Calculation Error</span>
                  </div>
                  <div className={`${styles.featureChip} ${styles.chipPurple}`}>
                    <span className={styles.chipIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"></path>
                        <circle cx="12" cy="16.5" r="0.8" fill="currentColor"></circle>
                      </svg>
                    </span>
                    <span>Question Selection</span>
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
                      ✕
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
                              }}
                              aria-hidden="true"
                            >
                              ✓
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
              <span className={styles.readinessBadge}>Updated Today</span>
            </div>

            <div className={styles.readinessMain}>
              {/* Circular Score */}
              <div className={styles.readinessScoreBox}>
                <div className={styles.circularProgress}>
                  <svg viewBox="0 0 100 100" className={styles.progressSvg}>
                    <circle cx="50" cy="50" r="42" className={styles.progressBg}></circle>
                    <circle cx="50" cy="50" r="42" className={styles.progressValue} style={{ strokeDashoffset: strokeOffset }}></circle>
                  </svg>
                  <div className={styles.scoreText}>
                    <span className={styles.scoreNumber}>{readiness}<span className={styles.scorePercent}>%</span></span>
                    <span className={styles.scoreLabel}>Readiness</span>
                  </div>
                </div>
              </div>

              {/* 4 Metrics */}
              <div className={styles.readinessMetrics}>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Concepts</span>
                    <span className={styles.metricVal}>{concepts}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${concepts}%`, background: '#0EA5E9'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Accuracy</span>
                    <span className={styles.metricVal}>{accuracy}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${accuracy}%`, background: '#2DD4BF'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Speed</span>
                    <span className={styles.metricVal}>{speed}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${speed}%`, background: '#F59E0B'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Consistency</span>
                    <span className={styles.metricVal}>{consistency}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${consistency}%`, background: '#8B5CF6'}}></div></div>
                </div>
              </div>
            </div>

            {/* Affecting Readiness */}
            <div className={styles.affectingSection}>
              <h3 className={styles.affectingTitle}>What is affecting your readiness?</h3>
              <div className={styles.insightCards}>
                <div className={`${styles.insightCard} ${selectedInsight === 'speed' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('speed')}>
                  <div className={`${styles.insightIconBox} ${styles.iconWarn}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Speed Under Pressure</span>
                    <span className={styles.insightDesc}>Taking too long on tricky QA questions.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
                <div className={`${styles.insightCard} ${selectedInsight === 'dilr' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('dilr')}>
                  <div className={`${styles.insightIconBox} ${styles.iconGood}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>DILR Set Selection</span>
                    <span className={styles.insightDesc}>Excellent accuracy in choosing the right sets.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
                <div className={`${styles.insightCard} ${selectedInsight === 'mock' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('mock')}>
                  <div className={`${styles.insightIconBox} ${styles.iconNeutral}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Mock Consistency</span>
                    <span className={styles.insightDesc}>Consistent scores, but lacking breakthroughs.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
              </div>
            </div>

            {selectedInsight && (
              <>
                <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50}} onClick={() => setSelectedInsight(null)}></div>
                <div className={styles.detailPanel}>
                  <button className={styles.panelClose} onClick={() => setSelectedInsight(null)}>&times;</button>
                  
                  {selectedInsight === 'speed' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconWarn}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>Speed Under Pressure</h4>
                            <span className={`${styles.impactBadge} ${styles.impactHigh}`}>IMPACT: HIGH</span>
                          </div>
                          <p className={styles.panelDesc}>You are taking more time than expected on QA questions, especially in the last part of the section.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>You spend more time on complex calculation-based questions.</li>
                        <li>This reduces the time left for easier questions.</li>
                        <li>Leads to lower attempt rate and higher pressure.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Practice timed QA sets (15-20 min).</li>
                        <li>Focus on quick calculation techniques and shortcuts.</li>
                        <li>Avoid spending too much time on a single question.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Try solving 1 timed QA set daily to improve your speed and confidence.</div>
                      </div>
                      
                      <div className={styles.panelVisual}>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Current</span>
                          <span className={styles.pvValWarn}>3.2 min/q</span>
                        </div>
                        <div className={styles.pvArrow}>&rarr;</div>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Target</span>
                          <span className={styles.pvValGood}>2.0 min/q</span>
                        </div>
                      </div>

                      
                    </div>
                  )}

                  {selectedInsight === 'dilr' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconGood}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>DILR Set Selection</h4>
                            <span className={`${styles.impactBadge} ${styles.impactMedium}`}>IMPACT: MEDIUM</span>
                          </div>
                          <p className={styles.panelDesc}>Your accuracy is good, but you are not selecting the most suitable sets, which is affecting your overall score.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>Difficulty in identifying high-scoring sets.</li>
                        <li>Spending time on low-value sets.</li>
                        <li>Inconsistent approach to set analysis.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Practice set-selection strategies.</li>
                        <li>Focus on question types and patterns.</li>
                        <li>Attempt more sectional DILR sets.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Spend 1-2 minutes analyzing each set before attempting.</div>
                      </div>
                      
                      <div className={styles.panelVisual}>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Current</span>
                          <span className={styles.pvValNeutral}>Poor Selection</span>
                        </div>
                        <div className={styles.pvArrow}>&rarr;</div>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Target</span>
                          <span className={styles.pvValGood}>Higher Attempts</span>
                        </div>
                      </div>

                      
                    </div>
                  )}

                  {selectedInsight === 'mock' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconNeutral}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>Mock Consistency</h4>
                            <span className={`${styles.impactBadge} ${styles.impactMedium2}`}>IMPACT: MEDIUM</span>
                          </div>
                          <p className={styles.panelDesc}>Your scores are consistent, but you are not seeing significant improvement over time.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>Limited number of full mock attempts.</li>
                        <li>Inconsistent performance in some sections.</li>
                        <li>Lack of post-mock analysis and revision.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Take more full-length mocks (at least 2 per week).</li>
                        <li>Analyze mistakes after each mock.</li>
                        <li>Focus on weak topics and track progress.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Consistency with analysis = real improvement.</div>
                      </div>
                      
                      <div className={styles.panelVisualPath}>
                        <span>TAKE MOCK</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span>ANALYZE</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span>FIX WEAKNESS</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span className={styles.pvValGood}>IMPROVE</span>
                      </div>

                      
                    </div>
                  )}

                </div>
              </>
            )}


            {/* 7-Day Challenge */}
            <div className={styles.challengeSection} style={{position: 'relative'}}>
              {challengeData ? (
                <>
                  <div className={styles.challengeHeaderRow}>
                    <div>
                      <h3 className={styles.challengeTitle}>Your 7-Day CAT Challenge</h3>
                      <p className={styles.challengeSubtitle} style={{fontSize: '14px', color: '#64748B', marginTop: '4px'}}>
                        Your personalized CAT improvement journey starts today.
                      </p>
                    </div>
                    {challengeData.completedDays === 7 ? (
                      <div className={styles.challengeCta} style={{background: '#10B981'}}>
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
                    {challengeData.days.map((d) => (
                      <div 
                        key={d.day} 
                        onClick={() => setSelectedChallengeDay(d.day)}
                        className={`${styles.timelineDay} ${d.status === 'completed' ? styles.dayCompleted : d.status === 'today' ? styles.dayToday : d.status === 'incomplete' ? styles.dayIncomplete : styles.dayUpcoming}`}
                        style={{ cursor: 'pointer', opacity: (d.status === 'upcoming' || d.status === 'incomplete') ? 0.7 : 1 }}
                      >
                        <div className={styles.dayCircle} style={{
                          borderColor: d.status === 'incomplete' ? '#FCA5A5' : '',
                          background: d.status === 'incomplete' ? '#FEF2F2' : ''
                        }}>
                          {d.status === 'completed' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : d.status === 'today' ? (
                            <span className={styles.dayDot}></span>
                          ) : d.status === 'incomplete' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          ) : null}
                        </div>
                        <span className={styles.dayLabel} style={{
                          color: d.status === 'incomplete' ? '#EF4444' : '',
                          fontWeight: d.status === 'today' ? 'bold' : 'normal'
                        }}>
                          {d.status === 'today' ? "Today" : `Day ${d.day}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  
                    
                    {/* Static Today's Challenge Summary Card */}
                    {(() => {
                      const todayInfo = challengeData.days.find((d: any) => d.status === 'today') || challengeData.days.find((d: any) => d.day === challengeData.currentDay);
                      if (!todayInfo) return null;
                      const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                      return (
                        <div className={styles.challengeDetailCard} style={{
                          marginTop: '24px',
                          padding: '24px 32px',
                          background: '#F8FAFC',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          position: 'relative',
                          cursor: 'pointer'
                        }} onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                          <div style={{marginBottom: '12px'}}>
                            <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                              Today's Focus: <span style={{color: '#2563EB'}}>{todayInfo.title}</span>
                            </h4>
                          </div>
                          
                          <p style={{fontSize: '14px', color: '#475569', marginBottom: '24px'}}>{todayInfo.desc}</p>
                          
                          <div style={{fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                            TASKS PROGRESS ({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})
                          </div>
                          <ul style={{listStyle: 'none', padding: 0, margin: '0 0 24px 0'}}>
                            {todayInfo.tasks.map((t: any, idx: number) => (
                              <li key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#334155'}}>
                                {t.done ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                                <span style={{textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1}}>{t.name}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <button onClick={(e) => { e.stopPropagation(); setSelectedChallengeDay(todayInfo.day); }} style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '32px',
                            background: 'transparent',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background 0.2s'
                          }}>
                            {isComplete ? "Challenge Completed ✓" : "Start Today's Challenge"}
                            {!isComplete && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </button>
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
              <Link href="/intelligence/ai-analysis" className={styles.actionBtnSecondary}>Ask AI Mentor</Link>
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
                    const dayInfo = challengeData.days.find((d: any) => d.day === selectedChallengeDay);
                    if (!dayInfo) return null;
                    
                    const isCompleted = dayInfo.progress.tasksDone === dayInfo.progress.tasksTotal;
                    const task1 = dayInfo.tasks[0];
                    const task2 = dayInfo.tasks[1];
  
                    return (
                      <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                        {/* Header (Fixed) */}
                        <header className="challenge-header" style={{padding: "24px 32px", borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0}}>
                          <button className={styles.panelClose} style={{position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B'}} onClick={() => setSelectedChallengeDay(null)}>&times;</button>
                          
                          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                            
                            <div>
                              <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0}}>Today's Challenge</h2>
                              <p style={{fontSize: '14px', color: '#64748B', margin: '4px 0 0 0'}}>Day {dayInfo.day} of 7</p>
                            </div>
                          </div>
                          
                          <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginRight: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              <span style={{fontSize: '13px', fontWeight: '700', color: '#0F172A'}}>{new Date(challengeData.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                            </div>
                            <span style={{fontSize: '10px', color: '#94A3B8'}}>Started</span>
                          </div>
                        </header>
                        {/* Scrollable Content */}
                        <main className="challenge-content" style={{flexGrow: 1, overflowY: "auto", padding: '24px 32px'}}>
                          
                          {/* Today's Focus Card */}
                          <div style={{background: '#F8FAFC', borderRadius: '20px', padding: '24px', marginBottom: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                              <div style={{background: '#D1FAE5', color: '#059669', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                              </div>
                              <span style={{fontSize: '14px', fontWeight: '700', color: '#0F172A'}}>Today's Focus</span>
                            </div>
                            
                            <h3 style={{fontSize: '20px', fontWeight: '700', color: '#2563EB', margin: '0 0 12px 0'}}>{dayInfo.title}</h3>
                            <p style={{fontSize: '14px', color: '#475569', margin: '0 0 20px 0', lineHeight: '1.5'}}>{dayInfo.desc}</p>
                            
                            <div style={{borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '12px'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3" style={{flexShrink: 0, marginTop: '2px'}}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 -1 8 1 8z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 7-1 8 1 8z"></path></svg>
                              <div style={{flexGrow: 1}}>
                                <p style={{fontSize: '14px', fontStyle: 'italic', color: '#3B82F6', margin: '0 0 8px 0'}}>"Track your progress, learn from your mistakes, and come back stronger."</p>
                                <p style={{fontSize: '13px', color: '#3B82F6', textAlign: 'right', margin: 0}}>— TechnoCAT</p>
                              </div>
                            </div>
                          </div>
  
                          {/* Tasks Section */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px'}}>
                            <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                              Tasks ({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                            </h3>
                            <span style={{fontSize: '13px', color: '#64748B'}}>Complete both tasks to finish Day {dayInfo.day}</span>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            {/* Task 1 */}
                            {task1 && (
                              <Link href={task1.done ? "#" : "/dashboard"} style={{textDecoration: 'none', color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task1.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task1.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#EFF6FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task1.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Attempt and submit a full-length CAT mock test.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 2 hours
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> All sections
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                            
                            {/* Task 2 */}
                            {task2 && (
                              <Link href={task2.done ? "#" : (task1.done ? "/intelligence/ai-analysis" : "#")} style={{textDecoration: 'none', pointerEvents: (!task1.done && !task2.done) ? 'none' : 'auto', opacity: (!task1.done && !task2.done) ? 0.6 : 1, color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task2.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task2.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#F5F3FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task2.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Review your performance, check detailed analysis and identify weak areas.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 10-15 mins
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> AI Insights
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                          </div>

                          {/* Motivation Card */}
                          <div style={{background: '#ECFDF5', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px'}}>
                            <div>
                              <h4 style={{fontSize: '15px', fontWeight: '700', color: '#065F46', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Complete today's challenge to:
                              </h4>
                              <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#065F46', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Improve your CAT readiness</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Unlock tomorrow's challenge</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Build a consistent study habit</li>
                              </ul>
                            </div>
                            <div style={{textAlign: 'center', flexShrink: 0, paddingLeft: '16px', borderLeft: '1px solid #D1FAE5'}}>
                              <div style={{fontSize: '40px', marginBottom: '8px'}}>🏆</div>
                              <div style={{fontSize: '14px', fontWeight: '700', color: '#065F46'}}>Keep Going!</div>
                              <div style={{fontSize: '11px', color: '#047857', marginTop: '4px'}}>Consistency creates results.</div>
                            </div>
                          </div>
                          
                        </main>
                        {/* Bottom CTA (Fixed at bottom) */}
                        <footer className="challenge-footer" style={{padding: "24px 32px", borderTop: '1px solid #F1F5F9', background: '#FFFFFF', flexShrink: 0}}>
                          <Link 
                            href={isCompleted ? '/intelligence' : (task1.done ? '/intelligence/ai-analysis' : '/browse')}
                            style={{
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              gap: '8px', 
                              background: isCompleted ? '#F1F5F9' : '#2563EB', 
                              color: isCompleted ? '#475569' : '#FFFFFF', 
                              padding: '16px', 
                              borderRadius: '16px', 
                              fontWeight: '700', 
                              fontSize: '16px', 
                              textDecoration: 'none',
                              transition: 'background 0.2s',
                              cursor: isCompleted ? 'default' : 'pointer'
                            }}
                          >
                            {isCompleted ? "Challenge Completed ✓" : (task1.done ? "Continue Analysis" : "Start Today's Challenge")}
                            {!isCompleted && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </Link>
                          <p style={{fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0', textAlign: 'center'}}>You'll be redirected to the relevant section. Your progress will be tracked automatically.</p>
                        </footer>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

        </main>
    </div>
  );
}






