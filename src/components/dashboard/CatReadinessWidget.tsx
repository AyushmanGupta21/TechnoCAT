"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import type { StudentMetrics, SectionKey } from "@/lib/metrics/types";
import styles from "./CatReadinessWidget.module.css";

interface CatReadinessWidgetProps {
  metrics: StudentMetrics | null;
  isLoading?: boolean;
}

/** Short, deterministic status for a 0–100 readiness score. */
function readinessStatus(score: number): { label: string; tone: "good" | "mid" | "early" } {
  if (score >= 75) return { label: "On track", tone: "good" };
  if (score >= 50) return { label: "Building up", tone: "mid" };
  return { label: "Early stage", tone: "early" };
}

const SECTIONS: { key: SectionKey; name: string }[] = [
  { key: "QA", name: "Quant" },
  { key: "DILR", name: "DILR" },
  { key: "VARC", name: "VARC" },
];

// The readiness score itself is shown once, in the dashboard stat row. This card covers
// where the student stands against CAT: the estimated percentile and the readiness status.
export default function CatReadinessWidget({ metrics, isLoading = false }: CatReadinessWidgetProps) {
  const score = metrics?.readiness.score ?? null;
  const status = score !== null ? readinessStatus(score) : null;
  const percentile = metrics?.percentile ?? null;
  const hasEstimate = Boolean(percentile && percentile.overallEstimate !== null);

  return (
    <section className={`glass-card ${styles.readinessBox}`} data-tint="violet">
      <div className={styles.header}>
        <h2 className={styles.title}>Estimated percentile</h2>
        {status && (
          <span className={`${styles.statusPill} ${styles[`tone_${status.tone}`]}`} title="Based on your readiness score">
            {status.label}
          </span>
        )}
      </div>

      {isLoading || !metrics ? (
        <p className={styles.emptyText}>{isLoading ? "Loading your readiness…" : "Your readiness could not be loaded right now."}</p>
      ) : (
        <>
          <div className={styles.scoreRow}>
            <Crosshair size={18} strokeWidth={2} aria-hidden="true" className={styles.scoreIcon} />
            {hasEstimate && percentile ? (
              <span className={styles.scoreValue} title={percentile.disclaimer}>
                {percentile.overallEstimate}
                <span className={styles.scoreMax}>%ile</span>
              </span>
            ) : (
              <span className={styles.scoreEmpty}>Not yet</span>
            )}
          </div>

          {/* Per-section estimates from the latest PYQ attempt of each section */}
          <ul className={styles.sectionBars}>
            {SECTIONS.map(({ key, name }) => {
              const p = metrics.sections[key].estimatedPercentile;
              return (
                <li key={key} className={styles.sectionBar}>
                  <span className={styles.sectionName}>{name}</span>
                  <span className={styles.barTrack} aria-hidden="true">
                    <span className={`${styles.barFill} ${styles[`fill${key}`]}`} style={{ width: `${p ?? 0}%` }} />
                  </span>
                  <span className={styles.sectionValue}>{p !== null ? p : "—"}</span>
                </li>
              );
            })}
          </ul>

          <p className={styles.disclaimer}>{hasEstimate && percentile ? percentile.disclaimer : percentile?.basis}</p>
          {score === null && (
            <p className={styles.emptyText}>Take a timed test (a module quiz or a PYQ section) to unlock your readiness score.</p>
          )}
        </>
      )}

      {score === null && metrics && !isLoading ? (
        <div className={styles.actions}>
          <Link href="/browse?section=mocks&mock=latest#pyq-section" className={styles.drillBtn}>
            <span>Take a timed test</span>
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
          </Link>
          <Link href="/intelligence" className={styles.secondaryLink}>
            How readiness is calculated
          </Link>
        </div>
      ) : (
        <div className={styles.actions}>
          <Link href="/intelligence" className={styles.secondaryLink}>
            Readiness breakdown in the Intelligence Hub
            <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
