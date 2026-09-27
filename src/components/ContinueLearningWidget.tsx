"use client";
import React from "react";
import styles from "./ContinueLearningWidget.module.css";
import { useRouter } from "next/navigation";

interface ContinueLearningProps {
  isDemo?: boolean;
  topicProgress?: Array<{
    topic_id: string;
    progress_percent: number;
    completed_lessons?: string[];
    watching_time_minutes?: number;
    points_earned?: number;
  }>;
}

const TOPIC_METADATA: Record<string, { category: string; title: string; meta: string; upNext: string; url: string; img: string }> = {
  "qa-quantitative-ability": {
    category: "Quantitative Ability • QA-CAT-01",
    title: "Module 1.1: Percentages, Profit & Loss",
    meta: "Foundations & PYQs • Faculty Masterclass",
    upNext: "Ratio & Proportions Drill",
    url: "/topics/qa-quantitative-ability",
    img: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&auto=format&fit=crop&q=80",
  },
  "dilr-data-interpretation": {
    category: "Data Interpretation • DILR-CAT-01",
    title: "Module 2.1: Tables, Caselets & Matrix Grids",
    meta: "Analytical Reasoning • Master Strategist",
    upNext: "Linear Arrangement Speed-Run",
    url: "/topics/dilr-data-interpretation",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80",
  },
  "varc-verbal-ability": {
    category: "Verbal Ability • VARC-CAT-01",
    title: "Module 3.1: Reading Comprehension Mastery",
    meta: "Editorial Inference & Vocab • Lead Mentor",
    upNext: "Social Science RC Passage",
    url: "/topics/varc-verbal-ability",
    img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80",
  },
};

export default function ContinueLearningWidget({ isDemo = true, topicProgress = [] }: ContinueLearningProps) {
  const router = useRouter();

  // If demo account: show standard rich mock session
  if (isDemo) {
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

  // Real user with active progress in at least 1 topic OR enrolled in a topic
  const activeTopic = topicProgress.find((t) => t.progress_percent > 0) || topicProgress[0];
  if (activeTopic) {
    const meta = TOPIC_METADATA[activeTopic.topic_id] || TOPIC_METADATA["qa-quantitative-ability"];
    const percent = Math.min(100, Math.max(0, activeTopic.progress_percent));

    return (
      <div className={styles.widgetBox}>
        <div className={styles.widgetHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h2 className={styles.title}>
              {percent > 0 ? "Continue Where You Left Off" : "Start Your Enrolled Course"}
            </h2>
          </div>
          <span className={styles.activeBadge}>
            {percent > 0 ? "Active Session" : "Enrolled"}
          </span>
        </div>

        <div className={styles.courseCard}>
          <div className={styles.leftSection}>
            <img
              src={meta.img}
              alt={meta.category}
              className={styles.courseThumbnail}
            />
            <div className={styles.courseInfo}>
              <p className={styles.courseCategory}>{meta.category}</p>
              <h3 className={styles.courseTitle}>{meta.title}</h3>
              <p className={styles.courseMeta}>{meta.meta}</p>
              <div className={styles.progressContainer}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.progressText}>{percent}%</span>
              </div>
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.nextUpBox}>
              <span className={styles.nextUpLabel}>Up Next</span>
              <span className={styles.nextUpTitle}>{meta.upNext}</span>
            </div>
            <button
              className={styles.resumeBtn}
              onClick={() => router.push(meta.url)}
            >
              <span>{percent > 0 ? "Resume Session" : "Start Course"}</span>
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

  // Real user with NO active or enrolled topics yet (clean onboarding state)
  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 16 12 12 8" />
            </svg>
          </div>
          <h2 className={styles.title}>Start Your CAT 2026 Preparation</h2>
        </div>
        <span className={styles.starterBadge}>Ready to Begin</span>
      </div>

      <div className={styles.courseCard}>
        <div className={styles.leftSection}>
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80"
            alt="CAT Preparation"
            className={styles.courseThumbnail}
          />
          <div className={styles.courseInfo}>
            <p className={styles.courseCategory}>CAT 2026 Syllabus &amp; Masterclasses</p>
            <h3 className={styles.courseTitle}>You haven&apos;t enrolled in any CAT topic yet</h3>
            <p className={styles.courseMeta}>
              Explore video modules across Quantitative Ability, DILR &amp; VARC to begin logging your progress.
            </p>
            <div className={styles.progressContainer}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: "0%" }} />
              </div>
              <span className={styles.starterProgressText}>0% Started</span>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.nextUpBox}>
            <span className={styles.nextUpLabel}>Step 1: Enrollment</span>
            <span className={styles.nextUpTitle}>Explore Courses &amp; Modules</span>
          </div>
          <button
            className={styles.resumeBtn}
            onClick={() => router.push("/browse")}
          >
            <span>Browse Courses</span>
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