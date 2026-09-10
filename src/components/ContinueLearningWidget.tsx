"use client";

import React from "react";
import Link from "next/link";
import styles from "./ContinueLearningWidget.module.css";
import { useRouter } from "next/navigation";

export default function ContinueLearningWidget() {
  const router = useRouter();

  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <h2 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Continue Learning
        </h2>
      </div>

      <div className={styles.courseCard}>
        <img 
          src="https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&auto=format&fit=crop&q=80" 
          alt="QA" 
          className={styles.courseThumbnail}
        />
        <div className={styles.courseInfo}>
          <h3 className={styles.courseTitle}>Quantitative Ability</h3>
          <p className={styles.courseMeta}>Module 1.1: Percentages & Ratios</p>
          <div className={styles.progressContainer}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: "74%" }} />
            </div>
            <span className={styles.progressText}>74%</span>
          </div>
        </div>
        <button className={styles.resumeBtn} onClick={() => router.push('/topics/qa-quantitative-ability')}>
          Jump Back In
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
}