"use client";

import React, { useState } from "react";
import TopicQuizModal from "@/components/TopicQuizModal";
import styles from "./CatReadinessWidget.module.css";

export default function CatReadinessWidget() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

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
          <h3 className={styles.title}>CAT 2026 Readiness</h3>
        </div>
        <span className={styles.countdownPill}>78 Days Left</span>
      </div>

      <div className={styles.percentileBanner}>
        <span className={styles.percentileLabel}>Projected Percentile</span>
        <span className={styles.percentileValue}>98.6 %ile</span>
      </div>

      <div className={styles.sectionalList}>
        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>QA (Quantitative Ability)</span>
            <span className={styles.sectionPercent}>68%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillQA} style={{ width: "68%" }} />
          </div>
        </div>

        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>DILR (Data Interpretation)</span>
            <span className={styles.sectionPercent}>52%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillDILR} style={{ width: "52%" }} />
          </div>
        </div>

        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>VARC (Verbal Ability)</span>
            <span className={styles.sectionPercent}>76%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillVARC} style={{ width: "76%" }} />
          </div>
        </div>
      </div>

      <div className={styles.weakAreaCard}>
        <div className={styles.weakAreaHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className={styles.weakAreaTag}>Weak Area Detected</span>
        </div>
        <h4 className={styles.weakAreaTopic}>Geometry: Circles & Tangents</h4>
        <p className={styles.weakAreaStat}>Accuracy: 42% in last 3 mocks • 18 questions missed</p>
      </div>

      <button
        type="button"
        className={styles.drillBtn}
        onClick={() => setIsQuizOpen(true)}
      >
        <span>Drill Weak Area (10 Qs)</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {isQuizOpen && (
        <TopicQuizModal
          topicId="qa-quantitative-ability"
          topicTitle="Geometry: Circles & Tangents Drill"
          onClose={() => setIsQuizOpen(false)}
        />
      )}
    </div>
  );
}
