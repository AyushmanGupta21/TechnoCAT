"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./error-tracking.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
        <div className={styles.headerLeft}>
          <Link href="/dashboard">
            <Image src="/logo.jpg" alt="TechnoCAT Logo" width={180} height={75} className={styles.logo} />
          </Link>
          <nav className={styles.mainNav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/browse" className={styles.navLink}>Browse</Link>
            <Link href="/topics" className={styles.navLink}>My Topics</Link>
            <Link href="/intelligence" className={`${styles.navLink} ${styles.active}`}>Intelligence Hub</Link>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
          </nav>
        </div>
        <PostLoginNavActions />
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
            <div className={styles.statPill}>
              <div className={styles.statPillVal}>{loading ? "..." : data?.totalErrors || 0}</div>
              <div className={styles.statPillLabel}>Mistakes Logged</div>
            </div>
            <div className={styles.statPill}>
              <div className={styles.statPillVal} style={{ color: "#DC2626" }}>
                -{loading ? "..." : data?.negativeMarksLost || 0}
              </div>
              <div className={styles.statPillLabel}>Negative Marks Lost</div>
            </div>
            <div className={styles.statPill}>
              <div className={styles.statPillVal} style={{ color: "#D97706" }}>
                {loading ? "..." : `${data?.sillyErrorRate || 0}%`}
              </div>
              <div className={styles.statPillLabel}>Silly / Trap Errors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className={styles.container}>
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
        <div className={styles.filterBar}>
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
      </main>
    </div>
  );
}
