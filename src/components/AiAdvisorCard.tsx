"use client";

import React, { useMemo } from "react";
import styles from "./AiAdvisorCard.module.css";

export interface QuizReportCardData {
  attemptNumber: number;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  rawScore?: number;
  strikes?: number;
  penaltyMarks?: number;
  timeTakenSeconds?: number;
  date: string;
  selectedAnswers: Record<number, number>;
  questions: any[];
  missedConcepts: string[];
  recommendedLessonId?: string;
  recommendedLessonTitle?: string;
}

export interface ModuleProgressItem {
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  quizScore: number | null;
  highestScore?: number;
  quizPassed: boolean;
  attemptsUsed: number;
  consecutiveFailures?: number;
  missedConcepts?: string[];
  recommendedLessonId?: string;
  recommendedLessonTitle?: string;
  recommendedLessonCompleted?: boolean;
  lastReportCard?: QuizReportCardData;
  attemptsHistory?: QuizReportCardData[];
}

interface AiAdvisorCardProps {
  topicTitle: string;
  activeModuleTitle: string;
  modulesProgress: Record<string, ModuleProgressItem>;
  modulesList?: Array<{ title: string; lessons: Array<{ id: string; title: string }> }>;
  isAllModLessonsWatched?: boolean;
  isAllModulesPassed?: boolean;
  grandQuizPassed?: boolean;
  onSelectRewatch?: (lessonId: string) => void;
  onStartModuleQuiz?: (moduleTitle: string) => void;
  onStartGrandQuiz?: () => void;
  onAskAiPrompt?: (promptText: string) => void;
}

export default function AiAdvisorCard({
  topicTitle,
  activeModuleTitle,
  modulesProgress,
  modulesList,
  isAllModLessonsWatched = false,
  isAllModulesPassed = false,
  grandQuizPassed = false,
  onSelectRewatch,
  onStartModuleQuiz,
  onStartGrandQuiz,
  onAskAiPrompt,
}: AiAdvisorCardProps) {
  const items = Object.values(modulesProgress);

  // Strong modules: passed with >= 80%
  const strongModules = items.filter(
    (m) => m.quizPassed && m.quizScore !== null && m.quizScore >= 80
  );

  // Review recommended: passed with 70-79% or failed attempts or missed concepts
  const reviewModules = items.filter(
    (m) =>
      (!m.quizPassed && m.attemptsUsed > 0) ||
      (m.quizPassed && m.quizScore !== null && m.quizScore < 80)
  );

  // AGENTIC ACTION CALCULATION
  const agenticAction = useMemo(() => {
    // Priority 1: User failed a quiz or needs conceptual review
    if (reviewModules.length > 0) {
      const firstReview = reviewModules[0];
      const shortName = firstReview.moduleTitle.split(":")[0];

      // Robust fallback for lesson ID and Title
      const modObj = modulesList?.find((m) => m.title === firstReview.moduleTitle);
      const fallbackLesson = modObj?.lessons?.[0];

      const recId = firstReview.recommendedLessonId || fallbackLesson?.id;
      const recTitle =
        firstReview.recommendedLessonTitle &&
        firstReview.recommendedLessonTitle !== "recommended lecture"
          ? firstReview.recommendedLessonTitle
          : fallbackLesson?.title || `${shortName} Foundation Lecture`;

      // If already passed with 70-79%: give score improvement recommendation
      if (firstReview.quizPassed) {
        return {
          type: "rewatch" as const,
          heading: `Target 90%+ Mastery: ${shortName}`,
          text: `You passed ${shortName} with ${firstReview.quizScore}%. Review "${recTitle}" to solidify missed concepts and aim for 90%+ on your next retake!`,
          buttonLabel: `📺 Watch "${recTitle}" Now →`,
          buttonClass: styles.btnRewatch,
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ),
          execute: () => {
            if (recId && onSelectRewatch) {
              onSelectRewatch(recId);
            }
          },
        };
      }

      // If user has already reviewed the recommended lecture:
      if (firstReview.recommendedLessonCompleted) {
        return {
          type: "quiz" as const,
          heading: `Review Completed: ${shortName}`,
          text: `Great work! You have re-watched "${recTitle}". Your conceptual gaps are resolved. You are now prepared to retake the Compulsory Quiz with fresh questions!`,
          buttonLabel: `📝 Retake ${shortName} Compulsory Quiz (Attempt ${(firstReview.attemptsUsed || 0) + 1}/3) →`,
          buttonClass: styles.btnQuiz,
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          ),
          execute: () => {
            if (onStartModuleQuiz) {
              onStartModuleQuiz(firstReview.moduleTitle);
            }
          },
        };
      }

      // Not yet reviewed: prompt to watch the video
      return {
        type: "rewatch" as const,
        heading: `Review Required: ${shortName}`,
        text: `We detected you need to review "${recTitle}" to solidify missed concepts before retrying the quiz.`,
        buttonLabel: `📺 Watch "${recTitle}" Now →`,
        buttonClass: styles.btnRewatch,
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ),
        execute: () => {
          if (recId && onSelectRewatch) {
            onSelectRewatch(recId);
          }
        },
      };
    }

    // Priority 2: All lessons in active module are completed, quiz is ready to take!
    const activeModProgress = modulesProgress[activeModuleTitle];
    if (isAllModLessonsWatched && !activeModProgress?.quizPassed) {
      const shortName = activeModuleTitle.split(":")[0];
      return {
        type: "quiz" as const,
        heading: `Quiz Ready: ${shortName}`,
        text: `All lectures completed in "${shortName}"! Take your 10-question compulsory quiz (70% cutoff) to earn +50 XP and unlock the next module.`,
        buttonLabel: `📝 Start ${shortName} Compulsory Quiz (+50 XP) →`,
        buttonClass: styles.btnQuiz,
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
        execute: () => {
          if (onStartModuleQuiz) {
            onStartModuleQuiz(activeModuleTitle);
          }
        },
      };
    }

    // Priority 3: All modules passed, Grand Assessment is ready!
    if (isAllModulesPassed && !grandQuizPassed) {
      return {
        type: "grand" as const,
        heading: "Grand Assessment Unlocked!",
        text: "All module quizzes passed! Take the 30-question CAT Comprehensive Exam to achieve full course certification and earn +100 XP.",
        buttonLabel: "🏆 Start 30-Question Grand Quiz (+100 XP) →",
        buttonClass: styles.btnGrand,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2h12v3H6zM18 5v4c0 3.31-2.69 6-6 6s-6-2.69-6-6V5H3v3c0 4.42 3.58 8 8 8v3H8v2h8v-2h-3v-3c4.42 0 8-3.58 8-8V5h-3z" />
          </svg>
        ),
        execute: () => {
          if (onStartGrandQuiz) {
            onStartGrandQuiz();
          }
        },
      };
    }

    // Priority 4: Grand Quiz already passed (Course Mastered)
    if (grandQuizPassed) {
      return {
        type: "prompt" as const,
        heading: "Course Mastered!",
        text: "You have completed all lectures and assessments for this course with top accuracy!",
        buttonLabel: "💬 Ask AI Tutor for Advanced Mock Strategy →",
        buttonClass: styles.btnPrompt,
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
        execute: () => {
          if (onAskAiPrompt) {
            onAskAiPrompt(
              `I have mastered all modules in ${topicTitle}! What advanced CAT questions, speed drills, and mock exam test-taking strategies should I practice next?`
            );
          }
        },
      };
    }

    // Priority 5: Active module in progress (Lectures still remaining)
    const shortActive = activeModuleTitle.split(":")[0];
    return {
      type: "prompt" as const,
      heading: "Recommended Next Action",
      text: `Focus on completing all lectures in "${shortActive}" to unlock your first Compulsory Module Quiz!`,
      buttonLabel: `💬 Ask AI Tutor: Breakthrough Study Plan for ${shortActive} →`,
      buttonClass: styles.btnPrompt,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      execute: () => {
        if (onAskAiPrompt) {
          onAskAiPrompt(
            `Give me a breakthrough study strategy for ${activeModuleTitle}. What are the highest-weightage CAT concepts and shortcut techniques in this module?`
          );
        }
      },
    };
  }, [
    reviewModules,
    activeModuleTitle,
    modulesProgress,
    isAllModLessonsWatched,
    isAllModulesPassed,
    grandQuizPassed,
    topicTitle,
    onSelectRewatch,
    onStartModuleQuiz,
    onStartGrandQuiz,
    onAskAiPrompt,
  ]);

  return (
    <div className={styles.advisorCard}>
      <div className={styles.advisorHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.aiAvatar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h3 className={styles.advisorTitle}>AI Study Advisor</h3>
            <p className={styles.advisorSubtitle}>Personalized CAT Readiness Diagnostics</p>
          </div>
        </div>

        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          <span>Active</span>
        </div>
      </div>

      {/* Strong Modules */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionLabel}>
          <span>🌟 Strong Areas (Score ≥ 80%)</span>
        </div>
        <div className={styles.chipsRow}>
          {strongModules.length > 0 ? (
            strongModules.map((m) => (
              <span key={m.moduleTitle} className={styles.strongChip}>
                ✓ {m.moduleTitle.split(":")[0]} ({m.quizScore}%)
              </span>
            ))
          ) : (
            <span className={styles.emptyHint}>Complete module quizzes to discover strengths</span>
          )}
        </div>
      </div>

      {/* Review Recommended */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionLabel}>
          <span>⚠️ Needs Review / Rewatch</span>
        </div>
        <div className={styles.chipsRow}>
          {reviewModules.length > 0 ? (
            reviewModules.map((m) => (
              <span
                key={m.moduleTitle}
                className={m.recommendedLessonCompleted ? styles.reviewedChip : styles.reviewChip}
                title={m.recommendedLessonTitle ? `Recommended: ${m.recommendedLessonTitle}` : "Review status"}
              >
                📺 {m.moduleTitle.split(":")[0]} ({m.quizScore ? `${m.quizScore}%` : "Incomplete"}
                {m.recommendedLessonCompleted ? " • Reviewed ✓" : ""})
              </span>
            ))
          ) : (
            <span className={styles.emptyHint}>No critical weak areas identified!</span>
          )}
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className={styles.recommendationBox}>
        <div className={styles.recHeader}>
          <span>👉 {agenticAction.heading}</span>
        </div>
        <p className={styles.recText}>{agenticAction.text}</p>
      </div>

      {/* DYNAMIC AGENTIC ACTION BUTTON */}
      <button
        type="button"
        className={`${styles.agenticActionBtn} ${agenticAction.buttonClass}`}
        onClick={agenticAction.execute}
      >
        {agenticAction.icon}
        <span>{agenticAction.buttonLabel}</span>
      </button>
    </div>
  );
}
