"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TopicQuizModal from "@/components/TopicQuizModal";
import styles from "./CatReadinessWidget.module.css";

interface CatReadinessWidgetProps {
  isDemo?: boolean;
  topicProgress?: any[];
}

export default function CatReadinessWidget({ isDemo = true, topicProgress = [] }: CatReadinessWidgetProps) {
  const router = useRouter();
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const qaPercent = isDemo ? 68 : (topicProgress.find(t => t.topic_id === "qa-quantitative-ability")?.progress_percent || 0);
  const dilrPercent = isDemo ? 52 : (topicProgress.find(t => t.topic_id === "dilr-data-interpretation")?.progress_percent || 0);
  const varcPercent = isDemo ? 76 : (topicProgress.find(t => t.topic_id === "varc-verbal-ability")?.progress_percent || 0);

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
        <span className={styles.percentileValue}>{isDemo ? "98.6 %ile" : "-- %ile (Diagnostic Pending)"}</span>
      </div>

      <div className={styles.sectionalList}>
        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>QA (Quantitative Ability)</span>
            <span className={styles.sectionPercent}>{qaPercent}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillQA} style={{ width: `${qaPercent}%` }} />
          </div>
        </div>

        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>DILR (Data Interpretation)</span>
            <span className={styles.sectionPercent}>{dilrPercent}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillDILR} style={{ width: `${dilrPercent}%` }} />
          </div>
        </div>

        <div className={styles.sectionalItem}>
          <div className={styles.sectionalHeader}>
            <span className={styles.sectionName}>VARC (Verbal Ability)</span>
            <span className={styles.sectionPercent}>{varcPercent}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillVARC} style={{ width: `${varcPercent}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.weakAreaCard}>
        <div className={styles.weakAreaHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDemo ? "#C2410C" : "#2563EB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isDemo ? (
              <>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          <span className={styles.weakAreaTag}>{isDemo ? "Weak Area Detected" : "Diagnostic Benchmark"}</span>
        </div>
        <h4 className={styles.weakAreaTopic}>{isDemo ? "Geometry: Circles & Tangents" : "CAT Diagnostic Full Mock 01"}</h4>
        <p className={styles.weakAreaStat}>
          {isDemo ? "Accuracy: 42% in last 3 mocks • 18 questions missed" : "Attempt your first full-length proctored mock to unlock accuracy breakdown"}
        </p>
      </div>

      <button
        type="button"
        className={styles.drillBtn}
        onClick={() => {
          if (isDemo) {
            setIsQuizOpen(true);
          } else {
            router.push("/browse?section=mocks#mock-section");
          }
        }}
      >
        <span>{isDemo ? "Drill Weak Area (10 Qs)" : "Take Diagnostic Mock"}</span>
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
