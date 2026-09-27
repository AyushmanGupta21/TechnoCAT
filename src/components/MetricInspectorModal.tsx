"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { METRIC_DETAILS, Timeframe } from "@/data/analyticsData";
import styles from "./MetricInspectorModal.module.css";

interface MetricInspectorModalProps {
  metricId: string | null;
  initialTimeframe?: Timeframe;
  isDemo?: boolean;
  userDashboard?: any;
  userAttempts?: any[];
  onClose: () => void;
  onDrillAction?: (topicId: string, topicTitle: string) => void;
}

export default function MetricInspectorModal({
  metricId,
  initialTimeframe = "30d",
  isDemo = true,
  userDashboard,
  userAttempts = [],
  onClose,
  onDrillAction,
}: MetricInspectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTimeframe(initialTimeframe);
  }, [initialTimeframe]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hasRealAttempts = userAttempts && userAttempts.length > 0;

  // Real user calculated values per metric
  const computedValue = useMemo(() => {
    if (!metricId) return "--";
    if (isDemo) return METRIC_DETAILS[metricId]?.currentValue[timeframe] || "--";

    switch (metricId) {
      case "percentile":
        return hasRealAttempts
          ? `${Math.round(userAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / userAttempts.length)} %ile`
          : "-- %ile";
      case "accuracy":
        if (!hasRealAttempts) return "0%";
        const correct = userAttempts.reduce((acc, a) => acc + (a.mcq_correct || 0) + (a.tita_correct || 0), 0);
        const attempted = userAttempts.reduce(
          (acc, a) => acc + (a.mcq_correct || 0) + (a.mcq_wrong || 0) + (a.tita_correct || 0) + (a.tita_wrong || 0),
          0
        );
        return `${Math.round((correct / Math.max(1, attempted)) * 100)}%`;
      case "speed":
        return hasRealAttempts
          ? `${Math.round((userAttempts[0]?.time_taken_seconds || 120) / 60)}m / Q`
          : "--";
      case "negativeMarking":
        return hasRealAttempts
          ? `-${userAttempts.reduce((acc, a) => acc + (a.mcq_wrong || 0), 0)} pts`
          : "0 pts";
      case "dailyConsistency":
        return `${userDashboard?.summary?.avgHoursDay || 0}h / day`;
      case "weeklyVolume":
        return `${userDashboard?.summary?.totalHoursWeek || 0}h / wk`;
      case "deepFocus":
        return `${userDashboard?.metrics?.watchingTimeMinutes ? Math.min(120, userDashboard.metrics.watchingTimeMinutes) : 0} min`;
      case "streak":
        const activeDays = userDashboard?.weeklyStats?.filter(
          (s: any) => (s.rawLearning || 0) > 0 || (s.rawChallenge || 0) > 0
        ).length || 0;
        return `${activeDays} Days`;
      default:
        return "--";
    }
  }, [metricId, isDemo, timeframe, hasRealAttempts, userAttempts, userDashboard]);

  // Real user calculated step-by-step arithmetic
  const stepByStepText = useMemo(() => {
    if (!metricId) return "";
    if (isDemo) return METRIC_DETAILS[metricId]?.stepByStepCalc[timeframe] || "";

    switch (metricId) {
      case "percentile":
        return hasRealAttempts
          ? `Computed across ${userAttempts.length} mock tests with aggregate average score of ${Math.round(userAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / userAttempts.length)} pts.`
          : "Diagnostic Mock Pending. Complete a full-length proctored CAT mock test to calculate your Gaussian scaled percentile.";
      case "accuracy":
        if (!hasRealAttempts) {
          return "0 questions attempted in this timeframe. Solve practice questions to calibrate your accuracy rate.";
        }
        const c = userAttempts.reduce((acc, a) => acc + (a.mcq_correct || 0), 0);
        const t = userAttempts.reduce((acc, a) => acc + (a.mcq_correct || 0) + (a.mcq_wrong || 0), 0);
        return `Correct: ${c} | Attempted: ${t} → (${c} / ${t}) × 100 = ${Math.round((c / Math.max(1, t)) * 100)}% accuracy.`;
      case "speed":
        return hasRealAttempts
          ? `Average pacing clocked at ${Math.round((userAttempts[0]?.time_taken_seconds || 120) / 60)} minutes per question in recent tests.`
          : "Pacing index pending. Complete a timed test or mock exam to measure your seconds per question.";
      case "negativeMarking":
        return hasRealAttempts
          ? `Total deduction of ${userAttempts.reduce((acc, a) => acc + (a.mcq_wrong || 0), 0)} marks from incorrect multiple-choice questions.`
          : "0 marks lost. No negative marking deductions recorded for this window.";
      case "dailyConsistency":
        return `${userDashboard?.summary?.avgHoursDay || 0} hours per day average study pace based on your verified learning sessions.`;
      case "weeklyVolume":
        return `${userDashboard?.summary?.totalHoursWeek || 0} cumulative hours logged over the active study week.`;
      case "deepFocus":
        return `Longest recorded uninterrupted study sprint is ${userDashboard?.metrics?.watchingTimeMinutes || 0} minutes.`;
      case "streak":
        const s = userDashboard?.weeklyStats?.filter((s: any) => (s.rawLearning || 0) > 0 || (s.rawChallenge || 0) > 0).length || 0;
        return `${s} active learning days recorded in the current schedule window.`;
      default:
        return "";
    }
  }, [metricId, isDemo, timeframe, hasRealAttempts, userAttempts, userDashboard]);

  // Real constituent table rows
  const rows = useMemo(() => {
    if (!metricId) return [];
    if (isDemo) return METRIC_DETAILS[metricId]?.rawDataTable[timeframe] || [];

    if (hasRealAttempts) {
      return userAttempts.map((a: any, idx: number) => ({
        label: a.paper_title || `CAT Practice Mock ${idx + 1}`,
        attempted: (a.mcq_correct || 0) + (a.mcq_wrong || 0) + (a.tita_correct || 0) + (a.tita_wrong || 0),
        correct: (a.mcq_correct || 0) + (a.tita_correct || 0),
        incorrect: (a.mcq_wrong || 0) + (a.tita_wrong || 0),
        timeMinutes: Math.round((a.time_taken_seconds || 0) / 60),
        score: a.score || 0,
      }));
    }
    return [];
  }, [metricId, isDemo, timeframe, hasRealAttempts, userAttempts]);

  // AI Advice
  const aiTips = useMemo(() => {
    if (!metricId) return [];
    if (isDemo) return METRIC_DETAILS[metricId]?.aiAdvice || [];

    if (!hasRealAttempts) {
      return [
        "Take your first CAT diagnostic test in Quantitative Ability or VARC to identify starting strengths.",
        "Aim for consistent 45-minute daily focus slots rather than weekend cramming.",
        "Maintain 100% attempt rate on TITA (Type-In-The-Answer) questions as they carry zero negative penalty.",
      ];
    }
    return METRIC_DETAILS[metricId]?.aiAdvice || [];
  }, [metricId, isDemo, hasRealAttempts]);

  if (!mounted || !metricId) return null;

  const detail = METRIC_DETAILS[metricId];
  if (!detail) return null;

  const totalAttempted = rows.reduce((acc, r) => acc + r.attempted, 0);
  const totalCorrect = rows.reduce((acc, r) => acc + r.correct, 0);
  const totalIncorrect = rows.reduce((acc, r) => acc + r.incorrect, 0);
  const totalTime = rows.reduce((acc, r) => acc + r.timeMinutes, 0);
  const totalScore = rows.reduce((acc, r) => acc + r.score, 0);

  const statusBadgeClass =
    detail.statusType === "success"
      ? styles.statusBadgeSuccess
      : detail.statusType === "warning"
      ? styles.statusBadgeWarning
      : detail.statusType === "danger"
      ? styles.statusBadgeDanger
      : styles.statusBadgeInfo;

  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.metricIconBadge}>{detail.icon}</div>
            <div className={styles.titleArea}>
              <h2 className={styles.modalTitle}>{detail.name}</h2>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${statusBadgeClass}`}>
                  {isDemo ? detail.statusText : (hasRealAttempts ? "Calibrated" : "Diagnostic Pending")}
                </span>
                <span className={styles.benchmarkText}>• {detail.benchmark}</span>
              </div>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close calculation inspector"
          >
            ✕
          </button>
        </div>

        {/* ===== BODY ===== */}
        <div className={styles.modalBody}>
          {/* Timeframe Bar */}
          <div className={styles.timeframeControlBar}>
            <span className={styles.timeframeLabel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Calculation Window:
            </span>
            <div className={styles.timeframeButtons}>
              {(["7d", "30d", "all"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`${styles.timeframeBtn} ${
                    timeframe === tf ? styles.timeframeBtnActive : ""
                  }`}
                >
                  {tf === "7d" ? "Last 7 Days" : tf === "30d" ? "Last 30 Days" : "All Time"}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Value Display */}
          <div className={styles.metricDisplayCard}>
            <div>
              <div className={styles.displayLabel}>Current Computed Value</div>
              <div className={styles.displayValue}>{computedValue}</div>
              <div className={styles.displaySubtitle}>
                {isDemo
                  ? `Updated based on your ${timeframe === "7d" ? "past week" : timeframe === "30d" ? "past 30 days" : "entire preparation history"}.`
                  : (hasRealAttempts ? "Calculated from your verified mock test attempts and learning sessions." : "Pending your first diagnostic mock exam or study session.")}
              </div>
            </div>
          </div>

          {/* How It Was Calculated (Formula) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <span>📐</span> How It Was Calculated (Formula & Method)
              </h3>
            </div>
            <div className={styles.formulaBox}>{detail.formulaLatex}</div>
            <p className={styles.sectionExplanation}>{detail.formulaExplanation}</p>
            <div className={styles.calcStepBox}>
              <span className={styles.calcStepHighlight}>Step-by-step Arithmetic: </span>
              {stepByStepText}
            </div>
          </div>

          {/* On Which Data It Was Calculated (Raw Data Table) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <span>📊</span> Underlying Constituent Data ({timeframe.toUpperCase()})
              </h3>
            </div>
            <p className={styles.sectionExplanation}>
              This calculation was derived directly from the following test sessions, questions, and practice logs:
            </p>
            <div className={styles.tableContainer}>
              {rows.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 16px", background: "#F8FAFC", borderRadius: "12px", border: "1px dashed #CBD5E1", color: "#64748B", fontSize: "13.5px" }}>
                  No sessions recorded for this period yet. Take a proctored mock or practice quiz to populate constituent data.
                </div>
              ) : (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Component / Topic</th>
                      <th>Attempts</th>
                      <th>Correct</th>
                      <th>Incorrect</th>
                      <th>Active Time</th>
                      <th>Raw Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>{r.label}</strong></td>
                        <td>{r.attempted}</td>
                        <td><span className={styles.correctTag}>+{r.correct}</span></td>
                        <td><span className={styles.incorrectTag}>-{r.incorrect}</span></td>
                        <td>{r.timeMinutes} mins</td>
                        <td><strong>{r.score} pts</strong></td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr className={styles.totalRow}>
                        <td><strong>Aggregate Totals</strong></td>
                        <td><strong>{totalAttempted}</strong></td>
                        <td><span className={styles.correctTag}>+{totalCorrect}</span></td>
                        <td><span className={styles.incorrectTag}>-{totalIncorrect}</span></td>
                        <td><strong>{totalTime} mins</strong></td>
                        <td><strong>{totalScore} pts</strong></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* AI Mentor Advice */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <span>💡</span> AI CAT Mentor Recommendations
              </h3>
            </div>
            <ul className={styles.aiTipsList}>
              {aiTips.map((tip, idx) => (
                <li key={idx} className={styles.aiTipItem}>
                  <span className={styles.aiTipIcon}>⚡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Done
          </button>
          {detail.actionLabel && detail.targetTopicId && onDrillAction && (
            <button
              className={styles.actionBtn}
              onClick={() => {
                onClose();
                onDrillAction(detail.targetTopicId!, detail.targetTopicTitle || detail.name);
              }}
            >
              <span>{detail.actionLabel}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
