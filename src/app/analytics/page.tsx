"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import MetricInspectorModal from "@/components/MetricInspectorModal";
import TopicQuizModal from "@/components/TopicQuizModal";
import {
  METRIC_DETAILS,
  TOPIC_MASTERY_LIST,
  MOCK_TEST_HISTORY,
  ACHIEVEMENTS_LIST,
  WEEKLY_ACTIVITY_DATA,
  KNOWLEDGE_DISTRIBUTION_DATA,
  DIFFICULTY_BREAKDOWN_DATA,
  Timeframe,
} from "@/data/analyticsData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import styles from "./analytics.module.css";

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab");

  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "QA" | "DILR" | "VARC">("ALL");
  const [activeTab, setActiveTab] = useState<"overview" | "topics" | "mocks" | "achievements">(
    initialTabParam === "achievements" ? "achievements" : "overview"
  );
  const [inspectingMetricId, setInspectingMetricId] = useState<string | null>(null);
  const [activeQuizModal, setActiveQuizModal] = useState<{ topicId: string; topicTitle: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMasteryList = TOPIC_MASTERY_LIST.filter((item) => {
    if (sectionFilter === "ALL") return true;
    return item.section === sectionFilter;
  });

  const handleDrill = (topicId: string, topicTitle: string) => {
    setActiveQuizModal({ topicId, topicTitle });
  };

  return (
    <div className={styles.analyticsWrapper}>
      {/* ===== DARK UPPER HEADER ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation Bar */}
          <nav className={styles.topNav} aria-label="Analytics Navigation">
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <Link href="/dashboard" className={styles.brandLogo} title="Back to TechnoCAT Home">
                <span className={styles.logoTechno}>Techno</span>
                <span className={styles.logoCAT}>CAT</span>
              </Link>
              <Link href="/dashboard" className={styles.backDashboardBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Dashboard
              </Link>
            </div>

            <PostLoginNavActions />
          </nav>

          {/* Header Title & Quick Actions */}
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>My Performance & Analytics</h1>
              <p className={styles.pageSubtitle}>
                Deep diagnostic insights, projected CAT percentile, pacing index, and habit consistency. Click any card to inspect its exact calculation formula.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.drillWeakCta}
                onClick={() => handleDrill("qa-quantitative-ability", "CAT Diagnostic Drill")}
              >
                <span>⚡ Drill Weak Areas</span>
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => alert("Diagnostic Report exported! A complete PDF breakdown has been downloaded.")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Report
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className={styles.viewTabs}>
            {[
              { id: "overview", label: "📊 Diagnostic Overview" },
              { id: "topics", label: "🎯 Topic Mastery & Weak Areas" },
              { id: "mocks", label: "📝 Proctored Mock History" },
              { id: "achievements", label: "🏆 Badges & Certificates" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${styles.viewTab} ${activeTab === tab.id ? styles.viewTabActive : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===== MAIN ANALYTICS CONTENT ===== */}
      <main className={styles.mainContent}>
        {/* Global Timeframe Toolbar */}
        <div className={styles.timeframeToolbar}>
          <div className={styles.toolbarTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Active Analysis Period</span>
          </div>

          <div className={styles.timeframePillGroup}>
            {(["7d", "30d", "all"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`${styles.timeframePill} ${timeframe === tf ? styles.timeframePillActive : ""}`}
              >
                {tf === "7d" ? "Last 7 Days" : tf === "30d" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            {/* 4 Hero CAT KPI Cards */}
            <div>
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>
                  <span>🎯</span> Core CAT 2026 Examination Indicators
                </h2>
                <div className={styles.interactiveHint}>
                  <span>💡 Click any card to inspect calculation formula</span>
                </div>
              </div>

              <div className={styles.heroGrid}>
                {/* 1. Projected Percentile */}
                <div
                  className={`${styles.metricCard} ${styles.metricCardPercentile}`}
                  onClick={() => setInspectingMetricId("percentile")}
                  title="Click to view Gaussian normal percentile calculation"
                >
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconBox}>🎯</div>
                    <span className={styles.inspectBadge}>
                      Inspect Formula 🔍
                    </span>
                  </div>
                  <div className={styles.cardName}>Projected CAT 2026 %ile</div>
                  <div className={styles.cardValueRow}>
                    <div className={styles.cardValue}>
                      {METRIC_DETAILS.percentile.currentValue[timeframe]}
                    </div>
                  </div>
                  <div className={styles.cardSub}>Target: 99.0+ %ile for IIM A/B/C</div>
                  <div className={styles.cardFooterStatus}>
                    <div className={styles.statusIndicator}>
                      <span className={`${styles.indicatorDot} ${styles.dotSuccess}`}></span>
                      <span style={{ color: "#059669" }}>Top 4% Aspirant Tier</span>
                    </div>
                    <span className={styles.inspectArrow}>→</span>
                  </div>
                </div>

                {/* 2. Overall Accuracy */}
                <div
                  className={`${styles.metricCard} ${styles.metricCardAccuracy}`}
                  onClick={() => setInspectingMetricId("accuracy")}
                  title="Click to inspect question accuracy data"
                >
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconBox} style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}>📈</div>
                    <span className={styles.inspectBadge}>
                      Inspect Data 🔍
                    </span>
                  </div>
                  <div className={styles.cardName}>Overall Accuracy Rate</div>
                  <div className={styles.cardValueRow}>
                    <div className={styles.cardValue} style={{ color: "#059669" }}>
                      {METRIC_DETAILS.accuracy.currentValue[timeframe]}
                    </div>
                  </div>
                  <div className={styles.cardSub}>
                    {timeframe === "7d" ? "38 of 45 questions correct" : timeframe === "30d" ? "134 of 172 questions correct" : "269 of 360 questions correct"}
                  </div>
                  <div className={styles.cardFooterStatus}>
                    <div className={styles.statusIndicator}>
                      <span className={`${styles.indicatorDot} ${styles.dotSuccess}`}></span>
                      <span style={{ color: "#059669" }}>High Precision</span>
                    </div>
                    <span className={styles.inspectArrow}>→</span>
                  </div>
                </div>

                {/* 3. Speed Index */}
                <div
                  className={`${styles.metricCard} ${styles.metricCardSpeed}`}
                  onClick={() => setInspectingMetricId("speed")}
                  title="Click to inspect question pacing and throughput"
                >
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconBox} style={{ background: "#EEF2FF", borderColor: "#C7D2FE" }}>⚡</div>
                    <span className={styles.inspectBadge}>
                      Inspect Pacing 🔍
                    </span>
                  </div>
                  <div className={styles.cardName}>Speed Index (Avg Pacing)</div>
                  <div className={styles.cardValueRow}>
                    <div className={styles.cardValue} style={{ color: "#4F46E5" }}>
                      {METRIC_DETAILS.speed.currentValue[timeframe]}
                    </div>
                  </div>
                  <div className={styles.cardSub}>Optimal CAT target: 1m 50s / Q</div>
                  <div className={styles.cardFooterStatus}>
                    <div className={styles.statusIndicator}>
                      <span className={`${styles.indicatorDot} ${styles.dotInfo}`}></span>
                      <span style={{ color: "#4F46E5" }}>+14s faster than peers</span>
                    </div>
                    <span className={styles.inspectArrow}>→</span>
                  </div>
                </div>

                {/* 4. Negative Marking Penalty */}
                <div
                  className={`${styles.metricCard} ${styles.metricCardPenalty}`}
                  onClick={() => setInspectingMetricId("negativeMarking")}
                  title="Click to inspect negative mark deduction impact"
                >
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconBox} style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>⚠️</div>
                    <span className={styles.inspectBadge}>
                      Inspect Loss 🔍
                    </span>
                  </div>
                  <div className={styles.cardName}>Marks Lost to Negatives</div>
                  <div className={styles.cardValueRow}>
                    <div className={styles.cardValue} style={{ color: "#DC2626" }}>
                      {METRIC_DETAILS.negativeMarking.currentValue[timeframe]}
                    </div>
                  </div>
                  <div className={styles.cardSub}>Over-guessing on low-conviction MCQs</div>
                  <div className={styles.cardFooterStatus}>
                    <div className={styles.statusIndicator}>
                      <span className={`${styles.indicatorDot} ${styles.dotDanger}`}></span>
                      <span style={{ color: "#DC2626" }}>+8.2%ile Recoverable</span>
                    </div>
                    <span className={styles.inspectArrow}>→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Study Habits & Consistency Cards */}
            <div>
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>
                  <span>⏱️</span> Study Habits & Learning Consistency
                </h2>
                <div className={styles.interactiveHint}>
                  <span>Click for habit logs</span>
                </div>
              </div>

              <div className={styles.habitsGrid}>
                {/* Habit 1: Daily Consistency */}
                <div
                  className={styles.habitCard}
                  onClick={() => setInspectingMetricId("dailyConsistency")}
                >
                  <div className={styles.habitIconBox} style={{ background: "#EFF6FF", color: "#2563EB" }}>⏱️</div>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitTitle}>Daily Consistency</div>
                    <div className={styles.habitValue}>{METRIC_DETAILS.dailyConsistency.currentValue[timeframe]}</div>
                    <div className={styles.habitMeta}>86% of 60m target met</div>
                  </div>
                </div>

                {/* Habit 2: Weekly Volume */}
                <div
                  className={styles.habitCard}
                  onClick={() => setInspectingMetricId("weeklyVolume")}
                >
                  <div className={styles.habitIconBox} style={{ background: "#ECFDF5", color: "#059669" }}>📅</div>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitTitle}>Weekly Volume</div>
                    <div className={styles.habitValue}>{METRIC_DETAILS.weeklyVolume.currentValue[timeframe]}</div>
                    <div className={styles.habitMeta}>123% of weekly target</div>
                  </div>
                </div>

                {/* Habit 3: Deep Focus */}
                <div
                  className={styles.habitCard}
                  onClick={() => setInspectingMetricId("deepFocus")}
                >
                  <div className={styles.habitIconBox} style={{ background: "#FAF5FF", color: "#9333EA" }}>🧠</div>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitTitle}>Deep Focus Session</div>
                    <div className={styles.habitValue}>{METRIC_DETAILS.deepFocus.currentValue[timeframe]}</div>
                    <div className={styles.habitMeta}>CAT 120m Stamina Ready</div>
                  </div>
                </div>

                {/* Habit 4: Streak */}
                <div
                  className={styles.habitCard}
                  onClick={() => setInspectingMetricId("streak")}
                >
                  <div className={styles.habitIconBox} style={{ background: "#FFF7ED", color: "#EA580C" }}>🔥</div>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitTitle}>Active Study Streak</div>
                    <div className={styles.habitValue}>{METRIC_DETAILS.streak.currentValue[timeframe]}</div>
                    <div className={styles.habitMeta}>Streak Shield Unlocked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className={styles.chartsGrid}>
              {/* Chart 1: Daily Activity Hours */}
              <div className={styles.chartCard}>
                <div className={styles.chartCardHeader}>
                  <div className={styles.chartTitleArea}>
                    <h3 className={styles.chartTitle}>Daily Study Activity (Hours)</h3>
                    <p className={styles.chartSubtitle}>Time invested across Video Lectures vs Timed Challenges</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563EB" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2563EB" }}></span>
                      Lectures
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#9333EA" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#9333EA" }}></span>
                      Challenges
                    </span>
                  </div>
                </div>

                <div className={styles.chartContainer}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={WEEKLY_ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} unit="h" />
                        <Tooltip
                          cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                          contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "12px" }}
                        />
                        <Bar dataKey="learning" name="Lecture Learning" fill="#2563EB" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="challenges" name="Mock Challenges" fill="#9333EA" radius={[4, 4, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Knowledge & Effort Distribution */}
              <div className={styles.chartCard}>
                <div className={styles.chartCardHeader}>
                  <div className={styles.chartTitleArea}>
                    <h3 className={styles.chartTitle}>Knowledge Distribution</h3>
                    <p className={styles.chartSubtitle}>Where your CAT prep time is invested</p>
                  </div>
                </div>

                <div className={styles.chartContainer} style={{ height: "200px" }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={KNOWLEDGE_DISTRIBUTION_DATA}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {KNOWLEDGE_DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                          formatter={(value: any) => [`${value}% of study time`, "Proportion"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Donut Legend */}
                <div className={styles.donutLegend}>
                  {KNOWLEDGE_DISTRIBUTION_DATA.map((item, idx) => (
                    <div key={idx} className={styles.donutLegendItem}>
                      <div className={styles.legendLeft}>
                        <span className={styles.legendColorDot} style={{ background: item.color }}></span>
                        <span className={styles.legendName}>{item.name}</span>
                      </div>
                      <div className={styles.legendRight}>
                        <span>{item.hours}</span>
                        <span className={styles.legendPercent}>{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown Horizontal Bars */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartTitleArea}>
                  <h3 className={styles.chartTitle}>Average Accuracy by Question Difficulty</h3>
                  <p className={styles.chartSubtitle}>How your performance scales from foundational to high-complexity CAT questions</p>
                </div>

                <div className={styles.difficultyLegends}>
                  <div className={styles.diffLegendTag}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10B981" }}></span>
                    Easy Questions (&gt;85%)
                  </div>
                  <div className={styles.diffLegendTag}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3B82F6" }}></span>
                    Moderate Questions (70-85%)
                  </div>
                  <div className={styles.diffLegendTag}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B" }}></span>
                    Difficult Questions (&lt;70%)
                  </div>
                </div>
              </div>

              <div className={styles.difficultyList}>
                {DIFFICULTY_BREAKDOWN_DATA.map((item) => (
                  <div key={item.section} className={styles.difficultyItem}>
                    <div className={styles.difficultyHeader}>
                      <span>Section: {item.section === "QA" ? "Quantitative Ability" : item.section === "DILR" ? "Data Interpretation & Logical Reasoning" : "Verbal Ability & Reading Comprehension"}</span>
                      <span style={{ color: "#64748B", fontSize: "12px" }}>
                        Easy: {item.easy}% | Med: {item.medium}% | Hard: {item.hard}%
                      </span>
                    </div>
                    <div className={styles.stackedBar}>
                      <div className={styles.barEasy} style={{ width: `${item.easy * 0.4}%` }} title={`Easy: ${item.easy}%`} />
                      <div className={styles.barMedium} style={{ width: `${item.medium * 0.35}%` }} title={`Medium: ${item.medium}%`} />
                      <div className={styles.barHard} style={{ width: `${item.hard * 0.25}%` }} title={`Hard: ${item.hard}%`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: TOPIC MASTERY & WEAK AREAS */}
        {activeTab === "topics" && (
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <div className={styles.chartTitleArea}>
                <h2 className={styles.chartTitle}>Topic Mastery & Diagnostic Weak Areas</h2>
                <p className={styles.chartSubtitle}>
                  Pinpointing specific modules where accuracy dips below 70% so you can drill them before mock exams.
                </p>
              </div>

              <div className={styles.sectionFilterPills}>
                {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`${styles.sectionFilterBtn} ${sectionFilter === sec ? styles.sectionFilterBtnActive : ""}`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.responsiveTableWrap}>
              <table className={styles.masteryTable}>
                <thead>
                  <tr>
                    <th>CAT Topic & Concept</th>
                    <th>Section</th>
                    <th>Mastery Tier</th>
                    <th>Accuracy</th>
                    <th>Attempts</th>
                    <th>Avg Pacing</th>
                    <th>Last Practiced</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMasteryList.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className={styles.topicNameCell}>
                          <span className={styles.topicTitle}>{t.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.topicSectionBadge}>{t.section}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.levelTag} ${
                            t.level === "Strong"
                              ? styles.levelStrong
                              : t.level === "Moderate"
                              ? styles.levelModerate
                              : styles.levelAttention
                          }`}
                        >
                          {t.level}
                        </span>
                      </td>
                      <td>
                        <div className={styles.accuracyBarWrap}>
                          <div className={styles.accuracyBarBg}>
                            <div
                              className={styles.accuracyBarFill}
                              style={{
                                width: `${t.accuracy}%`,
                                background: t.accuracy >= 80 ? "#10B981" : t.accuracy >= 70 ? "#F59E0B" : "#EF4444",
                              }}
                            />
                          </div>
                          <span className={styles.accuracyPercent}>{t.accuracy}%</span>
                        </div>
                      </td>
                      <td>{t.attempted} Qs</td>
                      <td>{t.avgTimePerQ}</td>
                      <td style={{ color: "#64748B", fontSize: "12.5px" }}>{t.lastPracticed}</td>
                      <td>
                        <button
                          className={styles.drillTableBtn}
                          onClick={() => handleDrill(t.id, t.name)}
                          title={`Generate diagnostic quiz for ${t.name}`}
                        >
                          <span>⚡ Drill Topic</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROCTORED MOCKS HISTORY */}
        {activeTab === "mocks" && (
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <div className={styles.chartTitleArea}>
                <h2 className={styles.chartTitle}>Full-Length Proctored CAT Mocks History</h2>
                <p className={styles.chartSubtitle}>Official slot simulations, percentile trends, and raw score conversions.</p>
              </div>
            </div>

            {/* Line chart of mock scores */}
            <div style={{ height: "240px", width: "100%", marginBottom: "16px" }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_TEST_HISTORY.filter(m => m.rawScore > 0)}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 105]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit=" pts" />
                    <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0" }} />
                    <Area type="monotone" dataKey="rawScore" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" name="Raw Score" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={styles.responsiveTableWrap}>
              <table className={styles.masteryTable}>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Date</th>
                    <th>Raw Score</th>
                    <th>Scaled Percentile</th>
                    <th>Accuracy</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TEST_HISTORY.map((m) => (
                    <tr key={m.id}>
                      <td><strong style={{ color: "#0F172A" }}>{m.name}</strong></td>
                      <td style={{ color: "#64748B" }}>{m.date}</td>
                      <td>
                        {m.rawScore > 0 ? (
                          <span style={{ fontWeight: 700, color: "#2563EB" }}>{m.rawScore} / {m.maxScore}</span>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>Not Attempted</span>
                        )}
                      </td>
                      <td>
                        {m.percentile > 0 ? (
                          <span style={{ fontWeight: 700, color: "#059669" }}>{m.percentile} %ile</span>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>—</span>
                        )}
                      </td>
                      <td>{m.accuracy > 0 ? `${m.accuracy}%` : "—"}</td>
                      <td>{m.timeTaken}</td>
                      <td>
                        <span className={`${styles.levelTag} ${m.status === "Completed" ? styles.levelStrong : styles.levelModerate}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BADGES & CERTIFICATES */}
        {activeTab === "achievements" && (
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <div className={styles.chartTitleArea}>
                <h2 className={styles.chartTitle}>My Earned Badges & Milestone Achievements</h2>
                <p className={styles.chartSubtitle}>Track milestones earned through rigorous CAT daily practice and module mastery.</p>
              </div>
            </div>

            <div className={styles.achievementsGrid}>
              {ACHIEVEMENTS_LIST.map((b) => (
                <div key={b.id} className={styles.badgeCard}>
                  <div className={styles.badgeIconBox} style={{ background: b.color }}>
                    {b.icon}
                  </div>
                  <div className={styles.badgeBody}>
                    <h3 className={styles.badgeTitle}>{b.title}</h3>
                    <p className={styles.badgeDesc}>{b.desc}</p>
                    <span className={styles.badgeDate}>{b.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Certificate of Excellence Banner */}
            <div className={styles.certificateBanner}>
              <div>
                <h3 className={styles.certTitle}>Official TechnoCAT Certificate of Excellence</h3>
                <p className={styles.certDesc}>
                  Master all 4 enrolled CAT syllabus modules with &gt;75% diagnostic accuracy to unlock your verified IIM mentorship recommendation certificate.
                </p>
              </div>
              <div className={styles.certScoreBox}>
                <div className={styles.certPercent}>38%</div>
                <div className={styles.certSub}>Curriculum Completed</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== CALCULATION & DIAGNOSTIC INSPECTOR MODAL ===== */}
      {inspectingMetricId && (
        <MetricInspectorModal
          metricId={inspectingMetricId}
          initialTimeframe={timeframe}
          onClose={() => setInspectingMetricId(null)}
          onDrillAction={(topicId, topicTitle) => {
            setInspectingMetricId(null);
            setActiveQuizModal({ topicId, topicTitle });
          }}
        />
      )}

      {/* ===== DIAGNOSTIC QUIZ GENERATOR MODAL ===== */}
      {activeQuizModal && (
        <TopicQuizModal
          topicId={activeQuizModal.topicId}
          topicTitle={activeQuizModal.topicTitle}
          onClose={() => setActiveQuizModal(null)}
        />
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#F4F6F9" }} />}>
      <AnalyticsPageContent />
    </React.Suspense>
  );
}

