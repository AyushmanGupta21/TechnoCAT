"use client";

import React, { useMemo } from "react";
import { ArrowRight, CircleCheck, ListChecks, MessageSquare, Play, Trophy } from "lucide-react";
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
  selectedAnswers: Record<number, number | string>;
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
          heading: `Aim for 90%+ in ${shortName}`,
          text: `You passed ${shortName} with ${firstReview.quizScore}%. Review "${recTitle}" to solidify missed concepts and aim for 90%+ on your next retake!`,
          buttonLabel: `Watch "${recTitle}" now`,
          buttonClass: styles.btnRewatch,
          icon: <Play size={15} fill="currentColor" aria-hidden="true" />,
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
          heading: `Review complete: ${shortName}`,
          text: `Great work! You have re-watched "${recTitle}". Your conceptual gaps are resolved. You are now prepared to retake the module quiz with fresh questions.`,
          buttonLabel: `Retake ${shortName} quiz (attempt ${(firstReview.attemptsUsed || 0) + 1}/3)`,
          buttonClass: styles.btnQuiz,
          icon: <ListChecks size={15} aria-hidden="true" />,
          execute: () => {
            if (onStartModuleQuiz) {
              onStartModuleQuiz(firstReview.moduleTitle);
            }
          },
        };
      }

      // Not yet reviewed: prompt to watch the video
      const isWeakStreakLocked = (firstReview.consecutiveFailures || 0) >= 5;
      const isAttemptsExhausted = (firstReview.attemptsUsed || 0) >= 3;

      const heading = isWeakStreakLocked
        ? `Locked (5 weak scores): ${shortName}`
        : isAttemptsExhausted
        ? `Locked (3 attempts used): ${shortName}`
        : `Review needed: ${shortName}`;

      const text = isWeakStreakLocked
        ? `You have reached a streak of 5 weak scores below the 70% cutoff. The quiz is locked. Rewatch "${recTitle}" to unlock fresh attempts!`
        : isAttemptsExhausted
        ? `You have used all 3 attempts without meeting the 70% cutoff. The quiz is locked. Rewatch "${recTitle}" to unlock 3 fresh attempts!`
        : `We detected you need to review "${recTitle}" to solidify missed concepts before retrying the quiz.`;

      return {
        type: "rewatch" as const,
        heading,
        text,
        buttonLabel: `Watch "${recTitle}" now`,
        buttonClass: styles.btnRewatch,
        icon: <Play size={15} fill="currentColor" aria-hidden="true" />,
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
        heading: `Quiz ready: ${shortName}`,
        text: `All lectures completed in "${shortName}"! Take the 10-question module quiz (70% cutoff) to earn +50 XP and unlock the next module.`,
        buttonLabel: `Start ${shortName} quiz (+50 XP)`,
        buttonClass: styles.btnQuiz,
        icon: <ListChecks size={15} aria-hidden="true" />,
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
        heading: "Grand assessment unlocked",
        text: "All module quizzes passed! Take the 30-question CAT Comprehensive Exam to achieve full course certification and earn +100 XP.",
        buttonLabel: "Start the 30-question grand quiz (+100 XP)",
        buttonClass: styles.btnGrand,
        icon: <Trophy size={15} aria-hidden="true" />,
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
        heading: "Course mastered",
        text: "You have completed all lectures and assessments for this course with top accuracy!",
        buttonLabel: "Ask the AI tutor for an advanced mock strategy",
        buttonClass: styles.btnPrompt,
        icon: <MessageSquare size={15} aria-hidden="true" />,
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
      heading: "Recommended next step",
      text: `Focus on completing all lectures in "${shortActive}" to unlock its module quiz.`,
      buttonLabel: `Ask the AI tutor for a ${shortActive} study plan`,
      buttonClass: styles.btnPrompt,
      icon: <MessageSquare size={15} aria-hidden="true" />,
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
          <span className={styles.aiAvatar} aria-hidden="true" />
          <div>
            <h3 className={styles.advisorTitle}>Study advisor</h3>
            <p className={styles.advisorSubtitle}>Based on your quiz results in this course</p>
          </div>
        </div>
      </div>

      {/* Strong Modules */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionLabel}>
          <span className={`${styles.legendDot} ${styles.legendStrong}`} aria-hidden="true" />
          <span>Strong areas</span>
          <span className={styles.sectionHint}>80%+</span>
        </div>
        <div className={styles.chipsRow}>
          {strongModules.length > 0 ? (
            strongModules.map((m) => (
              <span key={m.moduleTitle} className={styles.strongChip}>
                <CircleCheck size={13} aria-hidden="true" />
                <span>{m.moduleTitle.split(":")[0]}</span>
                <b>{m.quizScore}%</b>
              </span>
            ))
          ) : (
            <span className={styles.emptyHint}>Complete module quizzes to see your strengths</span>
          )}
        </div>
      </div>

      {/* Review Recommended */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionLabel}>
          <span className={`${styles.legendDot} ${styles.legendReview}`} aria-hidden="true" />
          <span>Needs review</span>
        </div>
        <div className={styles.chipsRow}>
          {reviewModules.length > 0 ? (
            reviewModules.map((m) => (
              <span
                key={m.moduleTitle}
                className={m.recommendedLessonCompleted ? styles.reviewedChip : styles.reviewChip}
                title={m.recommendedLessonTitle ? `Recommended: ${m.recommendedLessonTitle}` : "Review status"}
              >
                <span>{m.moduleTitle.split(":")[0]}</span>
                <b>{m.quizScore ? `${m.quizScore}%` : "Incomplete"}</b>
                {m.recommendedLessonCompleted ? <span className={styles.chipNote}>reviewed</span> : null}
              </span>
            ))
          ) : (
            <span className={styles.emptyHint}>No weak areas so far</span>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className={styles.recommendationBox} data-type={agenticAction.type}>
        <div className={styles.recHeader}>
          <span>{agenticAction.heading}</span>
        </div>
        <p className={styles.recText}>{agenticAction.text}</p>
      </div>

      {/* Next action */}
      <button
        type="button"
        className={`${styles.agenticActionBtn} ${agenticAction.buttonClass}`}
        onClick={agenticAction.execute}
      >
        {agenticAction.icon}
        <span className={styles.btnLabel}>{agenticAction.buttonLabel}</span>
        <ArrowRight size={15} className={styles.btnArrow} aria-hidden="true" />
      </button>
    </div>
  );
}
