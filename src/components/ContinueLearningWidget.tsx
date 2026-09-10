"use client";
import React from "react";
import styles from "./ContinueLearningWidget.module.css";
import { useRouter } from "next/navigation";

export default function ContinueLearningWidget() {
  const router = useRouter();
  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h2 className={styles.title}>Continue Where You Left Off</h2>
        </div>
        <span className={styles.activeBadge}>Active Session</span>
      </div>

      <div className={styles.courseCard}>
        <div className={styles.leftSection}>
          <img
            src="https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&auto=format&fit=crop&q=80"
            alt="Quantitative Ability"
            className={styles.courseThumbnail}
          />
          <div className={styles.courseInfo}>
            <p className={styles.courseCategory}>Quantitative Ability • QA-CAT-01</p>
            <h3 className={styles.courseTitle}>Module 1.1: Percentages, Profit & Loss</h3>
            <p className={styles.courseMeta}>Video Lesson 3 of 8 • Faculty Masterclass</p>
            <div className={styles.progressContainer}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: "74%" }} />
              </div>
              <span className={styles.progressText}>74%</span>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.nextUpBox}>
            <span className={styles.nextUpLabel}>Up Next</span>
            <span className={styles.nextUpTitle}>Ratio & Proportions Drill (15m)</span>
          </div>
          <button
            className={styles.resumeBtn}
            onClick={() => router.push("/topics/qa-quantitative-ability")}
          >
            <span>Resume Session</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}