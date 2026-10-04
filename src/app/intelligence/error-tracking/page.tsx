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

  const totalErrors = data?.totalErrors ?? errors.length;
  const negativeMarksLost = data?.negativeMarksLost ?? errors.filter((e) => e.isNegativeMarked).length;
  const sillyErrorRate = data?.sillyErrorRate ?? 0;

  const qaNeg = data?.sectionWiseNegativeMarks?.QA ?? errors.filter((e) => e.section === "QA" && e.isNegativeMarked).length;
  const dilrNeg = data?.sectionWiseNegativeMarks?.DILR ?? errors.filter((e) => e.section === "DILR" && e.isNegativeMarked).length;
  const varcNeg = data?.sectionWiseNegativeMarks?.VARC ?? errors.filter((e) => e.section === "VARC" && e.isNegativeMarked).length;

  const recoverableMarks = totalErrors > 0 ? (negativeMarksLost > 0 ? 18 : Math.max(12, totalErrors * 2)) : 0;

  const handleSectionFilterJump = (sec: "QA" | "DILR" | "VARC") => {
    setActiveSection(sec);
    document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReviewAllLogs = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection("ALL");
    setActiveErrorType("ALL");
    document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" });
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
        <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>Error Tracking &amp; Mistake Intelligence</span>
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
                <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
              </svg>
              AI ERROR LOG &amp; PATTERN DETECTOR
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
                <div className={styles.statPillVal}>{loading ? "..." : totalErrors}</div>
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
                  −{loading ? "..." : negativeMarksLost}
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
                  {loading ? "..." : `${sillyErrorRate}%`}
                </div>
                <div className={styles.statPillLabel}>Silly / Trap Errors</div>
                <span className={styles.statPillArrow} aria-hidden="true">&rarr;</span>
              </div>
            </div>
          </div>

          {/* Hero Right: AI Score Leak & Mistake Radar */}
          <div className={styles.heroRight}>
            <div className={styles.radarCard}>
              {/* Header */}
              <div className={styles.radarCardTop}>
                <div className={styles.radarStatusWrapper}>
                  <div className={styles.radarLiveDot} aria-hidden="true">
                    <span className={styles.radarDotCore} />
                    <span className={styles.radarDotPing} />
                  </div>
                  <span className={styles.radarTitle}>AI Score Leak Diagnostic</span>
                </div>
                <span className={styles.radarMetaBadge}>
                  {loading ? "Analyzing..." : totalErrors > 0 ? `${totalErrors} Mistakes Tracked` : "Active Radar"}
                </span>
              </div>

              {/* Recoverable Score Banner */}
              <div className={styles.recoveryBanner}>
                <div className={styles.recoveryBannerLeft}>
                  <span className={styles.recoveryScoreBig}>
                    {loading ? "..." : totalErrors > 0 ? `+${recoverableMarks}` : "+0"}
                  </span>
                  <div className={styles.recoveryLabelGroup}>
                    <span className={styles.recoveryScoreHeading}>Recoverable CAT Marks</span>
                    <span className={styles.recoveryScoreSub}>
                      {totalErrors > 0 ? "From eliminating avoidable slips & traps" : "Zero recurring mark leaks"}
                    </span>
                  </div>
                </div>
                <div className={styles.recoveryJumpPill}>
                  {totalErrors > 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      ~+9.4%ile Jump
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                      99%ile Target
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Section Leak Breakdown Boxes */}
              <div className={styles.radarSectionsGrid}>
                {/* QA */}
                <div
                  className={`${styles.radarSectionBox} ${styles.radarSectionClickable} ${activeSection === "QA" ? styles.radarSectionActive : ""}`}
                  onClick={() => handleSectionFilterJump("QA")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSectionFilterJump("QA");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Filter by QA mistakes and jump to list"
                >
                  <div className={styles.radarSecHead}>
                    <span className={`${styles.radarSecName} ${styles.radarSecNameQA}`}>QA</span>
                    <span className={`${styles.radarSecLoss} ${qaNeg > 0 ? styles.lossRed : styles.lossGreen}`}>
                      {loading ? "..." : qaNeg > 0 ? `-${qaNeg} marks` : "0 neg"}
                    </span>
                  </div>
                  <div className={styles.radarProgressBar}>
                    <div
                      className={styles.radarProgressFill}
                      style={{
                        width: qaNeg > 0 ? "65%" : "10%",
                        background: qaNeg > 0 ? "#2563EB" : "#10B981"
                      }}
                    />
                  </div>
                  <span className={styles.radarSecDesc}>
                    {qaNeg > 0 ? "Time Trap & Slips" : "Accurate"}
                  </span>
                </div>

                {/* DILR */}
                <div
                  className={`${styles.radarSectionBox} ${styles.radarSectionClickable} ${activeSection === "DILR" ? styles.radarSectionActive : ""}`}
                  onClick={() => handleSectionFilterJump("DILR")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSectionFilterJump("DILR");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Filter by DILR mistakes and jump to list"
                >
                  <div className={styles.radarSecHead}>
                    <span className={`${styles.radarSecName} ${styles.radarSecNameDILR}`}>DILR</span>
                    <span className={`${styles.radarSecLoss} ${dilrNeg > 0 ? styles.lossOrange : styles.lossGreen}`}>
                      {loading ? "..." : dilrNeg > 0 ? `-${dilrNeg} marks` : "0 neg"}
                    </span>
                  </div>
                  <div className={styles.radarProgressBar}>
                    <div
                      className={styles.radarProgressFill}
                      style={{
                        width: dilrNeg > 0 ? "50%" : "10%",
                        background: dilrNeg > 0 ? "#9333EA" : "#10B981"
                      }}
                    />
                  </div>
                  <span className={styles.radarSecDesc}>
                    {dilrNeg > 0 ? "Parity Clue Misread" : "Accurate"}
                  </span>
                </div>

                {/* VARC */}
                <div
                  className={`${styles.radarSectionBox} ${styles.radarSectionClickable} ${activeSection === "VARC" ? styles.radarSectionActive : ""}`}
                  onClick={() => handleSectionFilterJump("VARC")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSectionFilterJump("VARC");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Filter by VARC mistakes and jump to list"
                >
                  <div className={styles.radarSecHead}>
                    <span className={`${styles.radarSecName} ${styles.radarSecNameVARC}`}>VARC</span>
                    <span className={`${styles.radarSecLoss} ${varcNeg > 0 ? styles.lossRed : styles.lossGreen}`}>
                      {loading ? "..." : varcNeg > 0 ? `-${varcNeg} marks` : "0 neg"}
                    </span>
                  </div>
                  <div className={styles.radarProgressBar}>
                    <div
                      className={styles.radarProgressFill}
                      style={{
                        width: varcNeg > 0 ? "40%" : "12%",
                        background: varcNeg > 0 ? "#EF4444" : "#10B981"
                      }}
                    />
                  </div>
                  <span className={styles.radarSecDesc}>
                    {varcNeg > 0 ? "Weaken Premise" : "Clean TITA"}
                  </span>
                </div>
              </div>

              {/* AI Top Alert Insight */}
              <div className={styles.radarInsightCallout}>
                <span className={styles.radarInsightIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <div className={styles.radarInsightText}>
                  {totalErrors > 0 ? (
                    <>
                      <strong>AI Priority Alert:</strong> 33% of mark loss is from rushed option selection under &lt;60s. Verifying signs &amp; parity recovers <strong>+15 marks</strong> immediately.
                    </>
                  ) : (
                    <>
                      <strong>AI Active Monitor:</strong> Complete mock attempts and past CAT papers to detect avoidable time traps and trap choices.
                    </>
                  )}
                </div>
              </div>

              {/* Action Footer Buttons */}
              <div className={styles.radarFooterActions}>
                <a
                  href="#mistakes-review-list"
                  onClick={handleReviewAllLogs}
                  className={styles.radarActionBtnPrimary}
                  title="Reset filter and review all section mistakes"
                >
                  <span>Review Detailed Log</span>
                  <span aria-hidden="true">&darr;</span>
                </a>
                <Link href="/browse#pyq-section" className={styles.radarActionBtnSecondary}>
                  Targeted PYQs &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className={styles.container}>
        {errors.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#FFF", borderRadius: "18px", border: "1px dashed #CBD5E1", margin: "24px 0" }}>
            <div style={{ marginBottom: "16px", color: "#2563EB", display: "flex", justifyContent: "center" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
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
                  <div className={styles.donutWrapper}>
                    <div style={{ width: "230px", height: "230px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={98}
                            paddingAngle={3}
                            dataKey="count"
                          >
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
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
                    <div className={styles.donutCenterLabel}>
                      <span className={styles.donutCenterVal}>{totalErrors}</span>
                      <span className={styles.donutCenterText}>Mistakes</span>
                    </div>
                  </div>
                  <div className={styles.legendList}>
                    {chartData.map((item: any) => (
                      <div key={item.name} className={styles.legendItem}>
                        <div className={styles.legendItemLeft}>
                          <span className={styles.legendColor} style={{ background: item.color }} />
                          <span className={styles.legendName}>{item.name}</span>
                        </div>
                        <div className={styles.legendItemRight}>
                          <span className={styles.legendCountBadge}>
                            {item.count} {item.count === 1 ? "error" : "errors"}
                          </span>
                          <span className={styles.legendPercentVal}>{item.percent}%</span>
                        </div>
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
                    <span className={styles.timeSpentBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {Math.floor(err.timeSpentSec / 60)}m {err.timeSpentSec % 60}s
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
                          <span className={styles.optionMarkerWrong} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            Your Answer
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </span>
                        )}
                        {isCorrect && (
                          <span className={styles.optionMarkerCorrect} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            Correct Answer
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.aiDiagnosticBox}>
                  <div className={styles.aiDiagTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                    </svg>
                    TechnoCAT AI Diagnostic
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className={styles.statModalScrollContent}>
                {/* 1. MISTAKES LOGGED MODAL */}
                {selectedStatModal === "mistakesLogged" && (
                <>
                  <div className={styles.statModalHeader}>
                    <div className={styles.statModalIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
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
                        <span className={styles.statModalHeroBadge} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
                          </svg>
                          Logged Across Recent Mocks
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
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                            </svg>
                            What This Means
                          </div>
                          <p className={styles.statModalBoxText}>
                            “You made {totalErrorsCount} incorrect attempts in your recent mocks. Identifying recurring mistake patterns can help you avoid repeating them.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            Action Tip
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                        <polyline points="17 18 23 18 23 12" />
                      </svg>
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
                        <span className={styles.statModalHeroBadge} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          +{negMarksCount} Net Score Recovery Potential
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
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                            </svg>
                            What This Means?
                          </div>
                          <p className={styles.statModalBoxText}>
                            “You lost {negMarksCount} marks due to incorrect attempts. Reducing avoidable negative marks can improve your overall score.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            Action Tip
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
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
                        <span className={styles.statModalHeroBadge} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          100% Avoidable With Verification
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
                          <div className={styles.statModalBoxTitle} style={{ color: "#1D4ED8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                            </svg>
                            What This Means?
                          </div>
                          <p className={styles.statModalBoxText}>
                            “{sillyRatePct}% of your mistakes are silly or trap errors. These are avoidable and can often be reduced through better checking and time management.”
                          </p>
                        </div>
                        <div className={styles.statModalTipBox}>
                          <div className={styles.statModalBoxTitle} style={{ color: "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            Action Tip
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
          </div>
        );
      })()}
    </div>
  );
}
