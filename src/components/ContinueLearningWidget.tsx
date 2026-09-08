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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Continue where you left off
        </h2>
        <Link href="/topics" className={styles.viewAllBtn}>
          View all topics
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className={styles.courseCard}>
          <img 
            src="https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&auto=format&fit=crop&q=80" 
            alt="QA" 
            className={styles.courseThumbnail}
          />
          <div className={styles.courseInfo}>
            <h3 className={styles.courseTitle}>Quantitative Ability</h3>
            <p className={styles.courseMeta}>Module 1.1: Percentages & Ratios • Lesson 2</p>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: "35%" }} />
            </div>
            <span className={styles.progressText}>35% Complete</span>
          </div>
          <button 
            className={styles.resumeBtn}
            onClick={() => router.push("/topics/qa-quantitative-ability")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>

        <div className={styles.courseCard}>
          <img 
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=80" 
            alt="VARC" 
            className={styles.courseThumbnail}
          />
          <div className={styles.courseInfo}>
            <h3 className={styles.courseTitle}>Verbal Ability</h3>
            <p className={styles.courseMeta}>Module 2: Reading Comprehension • Practice 1</p>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: "62%" }} />
            </div>
            <span className={styles.progressText}>62% Complete</span>
          </div>
          <button 
            className={styles.resumeBtn}
            onClick={() => router.push("/topics/varc-verbal-ability")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}