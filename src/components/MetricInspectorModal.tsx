"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { METRIC_DETAILS, Timeframe } from "@/data/analyticsData";
import styles from "./MetricInspectorModal.module.css";

interface MetricInspectorModalProps {
  metricId: string | null;
  initialTimeframe?: Timeframe;
  onClose: () => void;
  onDrillAction?: (topicId: string, topicTitle: string) => void;
}

export default function MetricInspectorModal({
  metricId,
  initialTimeframe = "30d",
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

  if (!mounted || !metricId) return null;

  const detail = METRIC_DETAILS[metricId];
  if (!detail) return null;

  const rows = detail.rawDataTable[timeframe] || [];
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
                  {detail.statusText}
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
              <div className={styles.displayValue}>{detail.currentValue[timeframe]}</div>
              <div className={styles.displaySubtitle}>
                Updated based on your {timeframe === "7d" ? "past week" : timeframe === "30d" ? "past 30 days" : "entire preparation history"}.
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
              {detail.stepByStepCalc[timeframe]}
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
              {detail.aiAdvice.map((tip, idx) => (
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
