"use client";

import React from "react";
import Link from "next/link";
import type { StudentMetrics } from "@/lib/metrics/types";
import styles from "./CatReadinessWidget.module.css";

interface CatReadinessWidgetProps {
  metrics: StudentMetrics | null;
  isLoading?: boolean;
}

/** Short, deterministic status for a 0–100 readiness score. */
function readinessStatus(score: number): { label: string; color: string; bg: string } {
  if (score >= 75) return { label: "On track", color: "#047857", bg: "#ECFDF5" };
  if (score >= 50) return { label: "Building up", color: "#1D4ED8", bg: "#EFF6FF" };
  return { label: "Early stage", color: "#C2410C", bg: "#FFF7ED" };
}

export default function CatReadinessWidget({ metrics, isLoading = false }: CatReadinessWidgetProps) {
  const score = metrics?.readiness.score ?? null;
  const status = score !== null ? readinessStatus(score) : null;
  const percentile = metrics?.percentile ?? null;

  return (
    <div className={styles.readinessBox}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className={styles.title}>CAT Readiness</h3>
        </div>
        {status && (
          <span className={styles.statusPill} style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
        )}
      </div>

      {isLoading || !metrics ? (
        <p className={styles.emptyText}>{isLoading ? "Loading your readiness…" : "Your readiness could not be loaded right now."}</p>
      ) : (
        <>
          {/* Single readiness score — the component breakdown lives in the Intelligence Hub */}
          {score !== null ? (
            <div className={styles.scoreRow}>
              <span className={styles.scoreValue}>{score}</span>
              <span className={styles.scoreMax}>/ 100</span>
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <h4 className={styles.emptyTitle}>Readiness score not available yet</h4>
              <p className={styles.emptyText}>
                Take a timed test (a module quiz or a PYQ section) to unlock your readiness score.
              </p>
            </div>
          )}
          {score !== null && (
            <p className={styles.statusText}>
              Blends syllabus coverage, accuracy, pace and study consistency.
            </p>
          )}

          {/* Estimated percentile (only when all three sections have a full PYQ attempt) */}
          <div className={styles.percentileBanner}>
            <span className={styles.percentileLabel}>Estimated Percentile</span>
            {percentile && percentile.overallEstimate !== null ? (
              <span className={styles.percentileValue} title={percentile.disclaimer}>
                {percentile.overallEstimate} %ile
              </span>
            ) : (
              <span className={styles.percentileEmpty}>Not yet</span>
            )}
          </div>
          <p className={styles.disclaimer}>
            {percentile && percentile.overallEstimate !== null ? percentile.disclaimer : percentile?.basis}
          </p>
        </>
      )}

      {score === null && metrics && !isLoading ? (
        <>
          <Link href="/browse?section=mocks&mock=latest#pyq-section" className={styles.drillBtn}>
            <span>Take a Timed Test</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link href="/intelligence" className={styles.secondaryLink}>
            How readiness is calculated →
          </Link>
        </>
      ) : (
        <Link href="/intelligence" className={styles.drillBtn}>
          <span>View Breakdown in Intelligence Hub</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      )}
    </div>
  );
}
