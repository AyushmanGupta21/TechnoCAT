"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./error-tracking.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface ErrorItem {
  id: string;
  source: string;
  section: "QA" | "DILR" | "VARC";
  topic: string;
  subtopic: string;
  errorType: "Calculation Error" | "Concept Gap" | "Time Pressure" | "Trap/Misread" | "Guesswork";
  timeSpentSec: number;
  expectedTimeSec: number;
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  selectedOption: string;
  correctOption: string;
  isNegativeMarked: boolean;
  aiDiagnostic: string;
  recoveryAction: string;
  recommendedLessonHref: string;
  date: string;
}

export default function ErrorTrackingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"ALL" | "QA" | "DILR" | "VARC">("ALL");
  const [activeErrorType, setActiveErrorType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatModal, setSelectedStatModal] = useState<
    "mistakesLogged" | "negativeMarksLost" | "sillyTrapErrors" | null
  >(null);

  useEffect(() => {
    if (!selectedStatModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedStatModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStatModal]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/intelligence/error-tracking");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error loading error tracking:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const errors: ErrorItem[] = data?.errors || [];

  const filteredErrors = errors.filter((err) => {
    if (activeSection !== "ALL" && err.section !== activeSection) return false;
    if (activeErrorType !== "ALL" && err.errorType !== activeErrorType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        err.topic.toLowerCase().includes(q) ||
        err.subtopic.toLowerCase().includes(q) ||
        err.questionText.toLowerCase().includes(q) ||
        err.source.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const chartData = data?.mistakeCategories || [];

  const renderErrorTypeBadge = (type: string) => {
    switch (type) {
      case "Calculation Error":
        return <span className={`${styles.errorBadge} ${styles.errorCalc}`}>Calculation Error</span>;
      case "Concept Gap":
        return <span className={`${styles.errorBadge} ${styles.errorConcept}`}>Concept Gap</span>;
      case "Time Pressure":
        return <span className={`${styles.errorBadge} ${styles.errorTime}`}>Time Pressure</span>;
      case "Trap/Misread":
        return <span className={`${styles.errorBadge} ${styles.errorTrap}`}>Trap / Misread</span>;
      default:
        return <span className={`${styles.errorBadge} ${styles.errorGuess}`}>Guesswork</span>;
    }
  };

  const renderSectionBadge = (sec: string) => {
    switch (sec) {
      case "QA":
        return <span className={`${styles.sectionBadge} ${styles.badgeQA}`}>QA (Quant)</span>;
      case "DILR":
        return <span className={`${styles.sectionBadge} ${styles.badgeDILR}`}>DILR</span>;
      default:
        return <span className={`${styles.sectionBadge} ${styles.badgeVARC}`}>VARC</span>;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Sticky App Header */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Error Tracking Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
              <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence">Intelligence Hub</Link> &gt; <span>Error Tracking &amp; Mistake Intelligence</span>
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span>✦</span> AI ERROR LOG &amp; PATTERN DETECTOR
          </div>
          <h1 className={styles.heroTitle}>
            Stop Repeating the <span>Same Mistakes.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            TechnoCAT diagnoses every incorrect answer and time trap across your mock attempts and CAT PYQs.
            Convert recurring negative marks into scoring opportunities.
          </p>
          <div className={styles.statRow}>
            <div
              className={`${styles.statPill} ${styles.statPillClickable}`}
              onClick={() => setSelectedStatModal("mistakesLogged")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedStatModal("mistakesLogged");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open Mistakes Logged details"
            >
              <div className={styles.statPillVal}>{loading ? "..." : data?.totalErrors ?? 0}</div>
              <div className={styles.statPillLabel}>Mistakes Logged</div>
              <span className={styles.statPillArrow} aria-hidden="true">&rarr;</span>
            </div>
            <div
              className={`${styles.statPill} ${styles.statPillClickable}`}
              onClick={() => setSelectedStatModal("negativeMarksLost")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedStatModal("negativeMarksLost");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open Negative Marks Lost details"
            >
              <div className={styles.statPillVal} style={{ color: "#DC2626" }}>
                −{loading ? "..." : data?.negativeMarksLost ?? 0}
              </div>
              <div className={styles.statPillLabel}>Negative Marks Lost</div>
              <span className={styles.statPillArrow} aria-hidden="true">&rarr;</span>
            </div>
            <div
              className={`${styles.statPill} ${styles.statPillClickable}`}
              onClick={() => setSelectedStatModal("sillyTrapErrors")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedStatModal("sillyTrapErrors");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open Silly / Trap Errors details"
            >
              <div className={styles.statPillVal} style={{ color: "#D97706" }}>
                {loading ? "..." : `${data?.sillyErrorRate ?? 0}%`}
              </div>
              <div className={styles.statPillLabel}>Silly / Trap Errors</div>
              <span className={styles.statPillArrow} aria-hidden="true">&rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className={styles.container}>
        {errors.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#FFF", borderRadius: "18px", border: "1px dashed #CBD5E1", margin: "24px 0" }}>
            <div style={{ fontSize: "44px", marginBottom: "16px" }}>🎯</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "0 0 10px 0" }}>No Mistake Patterns Logged Yet</h2>
            <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "540px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
              TechnoCAT AI analyzes your proctored mock attempts and past CAT papers to detect calculation slips, trap options, and timing panic. Attempt your first mock or past paper to populate this dashboard!
            </p>
            <Link href="/browse#pyq-section" style={{ display: "inline-flex", textDecoration: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, color: "#fff", background: "#2563EB" }}>
              Attempt CAT Mock or PYQ →
            </Link>
          </div>
        ) : (
          <>
            {/* Analytics & Pattern Breakdown */}
            <div className={styles.analyticsGrid}>
              {/* Donut Chart: Error Category Breakdown */}
              <div className={styles.analyticsCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Why You Lost Marks</h2>
                  <span className={styles.cardBadge}>Aggregated Across Mocks</span>
                </div>
                <div className={styles.chartContainer}>
                  <div style={{ width: "180px", height: "180px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any, props: any) => [
                            `${value} mistakes (${props.payload.percent}%)`,
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.legendList}>
                    {chartData.map((item: any) => (
                      <div key={item.name} className={styles.legendItem}>
                        <div>
                          <span className={styles.legendColor} style={{ background: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span style={{ color: "#64748B" }}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Yield Actionable Traps */}
              <div className={styles.analyticsCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>High-Yield Score Recoveries</h2>
                  <span className={styles.cardBadge}>AI Priority Fixes</span>
                </div>
                <div className={styles.recoveryTipsList}>
                  <div className={styles.tipItem}>
                    <span className={styles.tipHighlight}>+9 Marks Recovery • QA Algebra &amp; Arithmetic</span>
                    Eliminate square-root sign slips and reciprocal base errors. In quadratic roots, always consider negative solutions.
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipHighlight}>+6 Marks Recovery • DILR Set Selection</span>
                    Two sets had &gt;6 minutes spent without yielding a single correct answer. Bail out within 3 minutes if clue parity doesn't simplify.
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipHighlight}>+4 Marks Recovery • VARC Reading Comprehension</span>
                    In 'WEAKEN' questions, identify the premise vs conclusion. Do not pick options that strengthen diffusion when causality is questioned.
                  </div>
                </div>
              </div>
            </div>

        {/* Filter Bar */}
        <div id="mistakes-review-list" className={styles.filterBar}>
          <div className={styles.subjectTabs}>
            {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
              <button
                key={sec}
                className={`${styles.tabBtn} ${activeSection === sec ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveSection(sec)}
              >
                {sec === "ALL" ? "All Sections" : sec}
              </button>
            ))}
          </div>

          <div className={styles.errorTypePills}>
            {["ALL", "Calculation Error", "Concept Gap", "Time Pressure", "Trap/Misread"].map((type) => (
              <button
                key={type}
                className={`${styles.pillBtn} ${activeErrorType === type ? styles.pillBtnActive : ""}`}
                onClick={() => setActiveErrorType(type)}
              >
                {type === "ALL" ? "All Error Types" : type}
              </button>
            ))}
          </div>

          <div className={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search topic or question..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Detailed Mistake Log Cards */}
        <div className={styles.questionsList}>
          {filteredErrors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>No mistakes found for this filter</h3>
              <p style={{ color: "#64748B", fontSize: "14px" }}>Try selecting another subject or clearing your search term.</p>
            </div>
          ) : (
            filteredErrors.map((err) => (
              <div key={err.id} className={styles.questionCard}>
                <div className={styles.qHeader}>
                  <div className={styles.qTags}>
                    {renderSectionBadge(err.section)}
                    <span className={styles.sourceBadge}>{err.source} &bull; {err.topic} &bull; {err.subtopic}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {renderErrorTypeBadge(err.errorType)}
                    <span className={styles.timeSpentBadge}>
                      ⏱️ {Math.floor(err.timeSpentSec / 60)}m {err.timeSpentSec % 60}s
                    </span>
                  </div>
                </div>

                <div className={styles.qBody}>
                  {err.questionText}
                </div>

                <div className={styles.optionsGrid}>
                  {err.options.map((opt) => {
                    const isSelected = opt.label === err.selectedOption;
                    const isCorrect = opt.isCorrect;

                    let optStyle = styles.optionItem;
                    if (isSelected && !isCorrect) optStyle = `${styles.optionItem} ${styles.optionSelectedWrong}`;
                    if (isCorrect) optStyle = `${styles.optionItem} ${styles.optionCorrect}`;

                    return (
                      <div key={opt.label} className={optStyle}>
                        <span>
                          <strong>{opt.label}.</strong> {opt.text}
                        </span>
                        {isSelected && !isCorrect && (
                          <span className={styles.optionMarkerWrong}>Your Answer ✕</span>
                        )}
                        {isCorrect && (
                          <span className={styles.optionMarkerCorrect}>Correct Answer ✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.aiDiagnosticBox}>
                  <div className={styles.aiDiagTitle}>
                    <span>💡</span> TechnoCAT AI Diagnostic
                  </div>
                  <p className={styles.aiDiagText}>{err.aiDiagnostic}</p>
                  <div className={styles.recoveryAction}>
                    <strong>Actionable Fix:</strong> {err.recoveryAction}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Recorded on {err.date}</span>
                  <Link href={err.recommendedLessonHref} className={`${styles.btnAction} ${styles.btnPrimaryAction}`}>
                    Review Concept Lesson &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    )}
  </main>

      {/* AI Error Log Statistic Detail Modal */}
      {selectedStatModal && (() => {
        const totalErrorsCount = Number(data?.totalErrors ?? errors.length ?? 0);
        const negMarksCount = Number(data?.negativeMarksLost ?? 0);
        const sillyRatePct = Number(data?.sillyErrorRate ?? 0);
        const hasErrorData = totalErrorsCount > 0;

        const secNeg = data?.sectionWiseNegativeMarks || { VARC: 1, DILR: 3, QA: 1 };
        const maxSecNeg = Math.max(1, secNeg.VARC || 0, secNeg.DILR || 0, secNeg.QA || 0);

        const trendList: Array<{ name: string; mistakes: number; negativeMarks: number; sillyRate: number }> =
          Array.isArray(data?.recentMistakeTrend) ? data.recentMistakeTrend : [];

        const trapTypesList: Array<{ name: string; percent: number; color: string }> =
          Array.isArray(data?.trapTypes) ? data.trapTypes : [];

        const donutDistribution = chartData.map((c: any) => ({
          ...c,
          displayLabel:
            c.name === "Concept Gap"
              ? "Concept Error"
              : c.name === "Trap/Misread"
              ? "Silly Mistake"
              : c.name === "Guesswork"
              ? "Wrong Selection"
              : c.name
        }));

        return (
          <div
            className={styles.statModalOverlay}
            onClick={() => setSelectedStatModal(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="error-stat-modal-title"
          >
            <div
              className={styles.statModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.statModalClose}
                onClick={() => setSelectedStatModal(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* 1. MISTAKES LOGGED MODAL */}
              {selectedStatModal === "mistakesLogged" && (
                <>
                  <div className={styles.statModalHeader}>
                    <div className={styles.statModalIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      📋
                    </div>
                    <h3 id="error-stat-modal-title" className={styles.statModalTitle}>
                      Mistakes Logged
                    </h3>
                  </div>
                  <p className={styles.statModalSubtitle}>
                    A detailed view of your incorrect answers across mocks.
                  </p>

                  {!hasErrorData ? (
                    <div className={styles.statModalEmptyState}>
                      <h4 className={styles.statModalEmptyTitle}>No mistake patterns yet</h4>
                      <p className={styles.statModalEmptySub}>
                        Complete a mock test to unlock your AI error analysis.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.statModalHeroBox}>
                        <div className={styles.statModalHeroLeft}>
                          <span className={styles.statModalHeroLabel}>Total Mistakes</span>
                          <span className={styles.statModalHeroValue} style={{ color: "#2563EB" }}>
                            {totalErrorsCount}
                          </span>
                        </div>
                        <span className={styles.statModalHeroBadge}>
                          ✦ Logged Across Recent Mocks
                        </span>
                      </div>

                      <div className={styles.statModalGridTwo}>
                        {/* Mistake Distribution Donut */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Mistake Distribution</h4>
                          <div className={styles.statModalDonutRow}>
                            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={donutDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={34}
                                    outerRadius={52}
                                    paddingAngle={3}
                                    dataKey="count"
                                  >
                                    {donutDistribution.map((entry: any, idx: number) => (
                                      <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(val: any, _name: any, props: any) => [
                                      `${val} (${props.payload.percent}%)`,
                                      props.payload.displayLabel
                                    ]}
                                    contentStyle={{
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      border: "1px solid #BAE6FD"
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className={styles.statModalDonutLegend}>
                              {donutDistribution.map((item: any) => (
                                <div key={item.name} className={styles.statModalLegendItem}>
                                  <span className={styles.statModalLegendLeft}>
                                    <span
                                      className={styles.statModalLegendDot}
                                      style={{ background: item.color }}
                                    />
                                    <span>{item.displayLabel}</span>
                                  </span>
                                  <span style={{ color: "#64748B" }}>{item.percent}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Recent Mistake Trend */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Recent Mistake Trend (Mock 1 → Mock 5)</h4>
                          <div style={{ width: "100%", height: 135 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendList} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    background: "#FFF",
                                    border: "1px solid #BAE6FD",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                  }}
                                  formatter={(val: any) => [`${val} mistakes`, "Mistakes"]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="mistakes"
                                  stroke="#2563EB"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: "#2563EB", stroke: "#FFF", strokeWidth: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className={styles.statModalInfoGrid}>
                        <div className={styles.statModalMeaningBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8" }}>
                            <span>💡</span> What This Means
                          </div>
                          <p className={styles.statModalBoxText}>
                            “You made {totalErrorsCount} incorrect attempts in your recent mocks. Identifying recurring mistake patterns can help you avoid repeating them.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669" }}>
                            <span>🎯</span> Action Tip
                          </div>
                          <p className={styles.statModalBoxText}>
                            “Review these mistakes, understand the root cause, and practice similar questions.”
                          </p>
                        </div>
                      </div>

                      <div className={styles.statModalFooter}>
                        <button
                          type="button"
                          className={styles.statModalCtaBtn}
                          onClick={() => {
                            setActiveSection("ALL");
                            setActiveErrorType("ALL");
                            setSelectedStatModal(null);
                            setTimeout(() => {
                              document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" });
                            }, 80);
                          }}
                        >
                          View All Mistakes &rarr;
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 2. NEGATIVE MARKS LOST MODAL */}
              {selectedStatModal === "negativeMarksLost" && (
                <>
                  <div className={styles.statModalHeader}>
                    <div className={styles.statModalIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      📉
                    </div>
                    <h3 id="error-stat-modal-title" className={styles.statModalTitle}>
                      Negative Marks Lost
                    </h3>
                  </div>
                  <p className={styles.statModalSubtitle}>
                    Understand how many marks you are losing due to incorrect answers.
                  </p>

                  {!hasErrorData ? (
                    <div className={styles.statModalEmptyState}>
                      <h4 className={styles.statModalEmptyTitle}>No mistake patterns yet</h4>
                      <p className={styles.statModalEmptySub}>
                        Complete a mock test to unlock your AI error analysis.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.statModalHeroBox}>
                        <div className={styles.statModalHeroLeft}>
                          <span className={styles.statModalHeroLabel}>Total Negative Marks</span>
                          <span className={styles.statModalHeroValue} style={{ color: "#DC2626" }}>
                            −{negMarksCount}
                          </span>
                        </div>
                        <span className={styles.statModalHeroBadge}>
                          ⚡ +{negMarksCount} Net Score Recovery Potential
                        </span>
                      </div>

                      <div className={styles.statModalGridTwo}>
                        {/* Section-wise Breakdown */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Section-wise Breakdown</h4>
                          <div className={styles.statModalSectionList}>
                            {[
                              { name: "VARC", val: secNeg.VARC ?? 1, color: "#0EA5E9" },
                              { name: "DILR", val: secNeg.DILR ?? 3, color: "#2563EB" },
                              { name: "QA", val: secNeg.QA ?? 1, color: "#06B6D4" }
                            ].map((sec) => (
                              <div key={sec.name} className={styles.statModalSectionItem}>
                                <div className={styles.statModalSectionTop}>
                                  <span>{sec.name}</span>
                                  <span style={{ color: "#DC2626", fontWeight: 800 }}>−{sec.val}</span>
                                </div>
                                <div className={styles.statModalBar}>
                                  <div
                                    className={styles.statModalBarFill}
                                    style={{
                                      width: `${Math.min(100, Math.round((sec.val / maxSecNeg) * 100))}%`,
                                      background: sec.color
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Negative Marks Trend */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Negative Marks Trend (Mock 1 → Mock 5)</h4>
                          <div style={{ width: "100%", height: 135 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendList} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    background: "#FFF",
                                    border: "1px solid #BAE6FD",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                  }}
                                  formatter={(val: any) => [`−${val} marks`, "Negative Marks"]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="negativeMarks"
                                  stroke="#0EA5E9"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: "#2563EB", stroke: "#FFF", strokeWidth: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className={styles.statModalInfoGrid}>
                        <div className={styles.statModalMeaningBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8" }}>
                            <span>💡</span> What This Means?
                          </div>
                          <p className={styles.statModalBoxText}>
                            “You lost {negMarksCount} marks due to incorrect attempts. Reducing avoidable negative marks can improve your overall score.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669" }}>
                            <span>🎯</span> Action Tip
                          </div>
                          <p className={styles.statModalBoxText}>
                            “Focus on improving accuracy and avoid random guesses.”
                          </p>
                        </div>
                      </div>

                      <div className={styles.statModalFooter}>
                        <Link
                          href="/intelligence/ai-analysis#mistake-section"
                          className={styles.statModalCtaBtn}
                        >
                          View Error Analysis &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 3. SILLY / TRAP ERRORS MODAL */}
              {selectedStatModal === "sillyTrapErrors" && (
                <>
                  <div className={styles.statModalHeader}>
                    <div className={styles.statModalIcon} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                      ⚠️
                    </div>
                    <h3 id="error-stat-modal-title" className={styles.statModalTitle}>
                      Silly / Trap Errors
                    </h3>
                  </div>
                  <p className={styles.statModalSubtitle}>
                    Detect and reduce avoidable mistakes that are costing you marks.
                  </p>

                  {!hasErrorData ? (
                    <div className={styles.statModalEmptyState}>
                      <h4 className={styles.statModalEmptyTitle}>No mistake patterns yet</h4>
                      <p className={styles.statModalEmptySub}>
                        Complete a mock test to unlock your AI error analysis.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.statModalHeroBox}>
                        <div className={styles.statModalHeroLeft}>
                          <span className={styles.statModalHeroLabel}>Silly / Trap Error Rate</span>
                          <span className={styles.statModalHeroValue} style={{ color: "#D97706" }}>
                            {sillyRatePct}%
                          </span>
                        </div>
                        <span className={styles.statModalHeroBadge}>
                          🛡️ 100% Avoidable With Verification
                        </span>
                      </div>

                      <div className={styles.statModalGridTwo}>
                        {/* Common Trap Types */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Common Trap Types</h4>
                          <div className={styles.statModalSectionList}>
                            {trapTypesList.map((trap) => (
                              <div key={trap.name} className={styles.statModalSectionItem}>
                                <div className={styles.statModalSectionTop}>
                                  <span>{trap.name}</span>
                                  <span style={{ color: "#0284C7", fontWeight: 800 }}>{trap.percent}%</span>
                                </div>
                                <div className={styles.statModalBar}>
                                  <div
                                    className={styles.statModalBarFill}
                                    style={{ width: `${trap.percent}%`, background: trap.color }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Error Rate Trend */}
                        <div className={styles.statModalPanel}>
                          <h4 className={styles.statModalPanelTitle}>Error Rate Trend (Mock 1 → Mock 5)</h4>
                          <div style={{ width: "100%", height: 155 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendList} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                  contentStyle={{
                                    background: "#FFF",
                                    border: "1px solid #BAE6FD",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                  }}
                                  formatter={(val: any) => [`${val}%`, "Trap Error Rate"]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="sillyRate"
                                  stroke="#0EA5E9"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: "#2563EB", stroke: "#FFF", strokeWidth: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className={styles.statModalInfoGrid}>
                        <div className={styles.statModalMeaningBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8" }}>
                            <span>💡</span> What This Means?
                          </div>
                          <p className={styles.statModalBoxText}>
                            “{sillyRatePct}% of your mistakes are silly or trap errors. These are avoidable and can often be reduced through better checking and time management.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669" }}>
                            <span>🎯</span> Action Tip
                          </div>
                          <p className={styles.statModalBoxText}>
                            “Take timed practice sets and double-check important details before submitting.”
                          </p>
                        </div>
                      </div>

                      <div className={styles.statModalFooter}>
                        <Link
                          href="/browse#pyq-section"
                          className={styles.statModalCtaBtn}
                        >
                          Practice Now &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
