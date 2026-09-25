"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ModuleQuestion, evaluateQuiz, evaluateCATQuiz, QuizAnalysis } from "@/data/moduleQuizData";
import { notifyQuizCompleted } from "@/services/notificationService";
import PYQMarkdownViewer from "./pyq/PYQMarkdownViewer";
import styles from "./ModuleQuizModal.module.css";

interface ModuleQuizModalProps {
  isOpen: boolean;
  title: string;
  isGrandQuiz?: boolean;
  questions: ModuleQuestion[];
  attemptNumber: number;
  maxAttempts?: number;
  initialReviewMode?: boolean;
  initialAnswers?: Record<number, number | string>;
  initialAnalysis?: QuizAnalysis | null;
  initialStrikes?: number;
  customDurationSeconds?: number;
  scoringScheme?: "standard" | "cat";
  onClose: () => void;
  onPass: (score: number, total: number, earnedPoints: number, analysis: QuizAnalysis) => void;
  onFail: (score: number, total: number, analysis: QuizAnalysis) => void;
  onSelectLessonToRewatch?: (lessonId: string) => void;
  onResetAttemptsAfterRewatch?: () => void;
  onRetake?: () => void;
  onBackToAttempts?: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export default function ModuleQuizModal({
  isOpen,
  title,
  isGrandQuiz = false,
  questions,
  attemptNumber,
  maxAttempts = 3,
  initialReviewMode = false,
  initialAnswers,
  initialAnalysis,
  initialStrikes = 0,
  customDurationSeconds,
  scoringScheme = "standard",
  onClose,
  onPass,
  onFail,
  onSelectLessonToRewatch,
  onResetAttemptsAfterRewatch,
  onRetake,
  onBackToAttempts,
}: ModuleQuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>(initialAnswers || {});
  // Timer: 12 minutes (720s) for module quiz (10 questions), 35 minutes (2100s) for grand quiz (30 questions)
  const initialDuration = customDurationSeconds ?? (isGrandQuiz ? 35 * 60 : 12 * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isSubmitted, setIsSubmitted] = useState(initialReviewMode);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(initialAnalysis || null);

  // Post-submission solutions filter: "all" | "wrong" | "correct"
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">("all");
  // Confirmation modal before finalizing manual submission
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  // Auto submission notification modal (timeout or cheat strikes)
  const [autoSubmitNotice, setAutoSubmitNotice] = useState<{
    type: "timeout" | "cheat";
    title: string;
    description: string;
    strikesCount?: number;
  } | null>(null);

  const handleSafeClose = useCallback(() => {
    if (!isSubmitted) {
      setProctorAlert("🔒 Exam in progress! The quiz interface can only be closed once it is ended.");
      return;
    }
    onClose();
  }, [isSubmitted, onClose]);

  // Proctoring Security State
  const [strikes, setStrikes] = useState<number>(initialStrikes);
  const [rawScore, setRawScore] = useState<number | null>(null);
  const strikesRef = useRef<number>(initialStrikes);
  const lastViolationTimeRef = useRef<number>(0);

  useEffect(() => {
    strikesRef.current = strikes;
  }, [strikes]);

  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const proctorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef({
    isOpen: false,
    attemptNumber: attemptNumber,
    initialReviewMode: initialReviewMode,
    questionsKey: "",
  });

  const handleSubmit = useCallback(() => {
    const isCat = scoringScheme === "cat";
    const rawResult = isCat
      ? evaluateCATQuiz(questions, selectedAnswers)
      : evaluateQuiz(questions, selectedAnswers as Record<number, number>);
    const penaltyMarks = strikesRef.current;
    const penalizedScore = Math.max(0, rawResult.score - penaltyMarks);
    const maxTotal = rawResult.total || (questions.length * (isCat ? 3 : 1));
    const penalizedPercentage = Math.max(0, Math.round((penalizedScore / maxTotal) * 100));
    const penalizedPassed = isCat ? penalizedPercentage >= 50 : penalizedPercentage >= 70;
    const timeTakenSeconds = Math.max(1, initialDuration - timeLeft);

    setRawScore(rawResult.score);

    const finalResult: QuizAnalysis = {
      ...rawResult,
      score: penalizedScore,
      percentage: penalizedPercentage,
      passed: penalizedPassed,
      rawScore: rawResult.score,
      strikes: penaltyMarks,
      penaltyMarks,
      timeTakenSeconds,
      selectedAnswers,
      questions,
    };

    setAnalysis(finalResult);
    setIsSubmitted(true);

    const points = isGrandQuiz ? 100 : 50;

    try {
      notifyQuizCompleted(title, finalResult.score, maxTotal);
      if (finalResult.passed) {
        onPass?.(finalResult.score, finalResult.total, points, finalResult);
      } else {
        onFail?.(finalResult.score, finalResult.total, finalResult);
      }
    } catch (err) {
      console.error("Quiz submission callback error:", err);
    }
  }, [title, questions, selectedAnswers, scoringScheme, isGrandQuiz, initialDuration, timeLeft, onPass, onFail]);


  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer effect
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    if (timeLeft <= 0) {
      setShowSubmitConfirm(false);
      setAutoSubmitNotice({
        type: "timeout",
        title: "Time's Up! Exam Auto-Submitted",
        description: "The allocated time for this assessment has expired. Your recorded answers have been automatically evaluated and submitted.",
      });
      handleSubmitRef.current();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, timeLeft]);

  // Reset when modal is OPENED, RETAKEN, or viewing a different session
  useEffect(() => {
    if (!isOpen) {
      sessionRef.current.isOpen = false;
      return;
    }

    const prev = sessionRef.current;
    const questionsKey = (questions || []).map((q) => q.id).join(",");
    const isNewSession =
      !prev.isOpen ||
      prev.attemptNumber !== attemptNumber ||
      prev.initialReviewMode !== initialReviewMode ||
      prev.questionsKey !== questionsKey;

    sessionRef.current = {
      isOpen: true,
      attemptNumber,
      initialReviewMode,
      questionsKey,
    };

    // If it's the exact same attempt of the same quiz while open, do not reset!
    // (This prevents the quiz from restarting when parent state updates on submission)
    if (!isNewSession) return;

    setCurrentIdx(0);
    setSelectedAnswers(initialAnswers || {});
    setIsSubmitted(initialReviewMode);

    if (initialReviewMode) {
      const computed =
        initialAnalysis ||
        (scoringScheme === "cat"
          ? evaluateCATQuiz(questions, initialAnswers || {})
          : evaluateQuiz(questions, (initialAnswers as Record<number, number>) || {}));
      setAnalysis(computed);

      const resolvedStrikes =
        computed.strikes !== undefined && computed.strikes > 0
          ? computed.strikes
          : (initialStrikes || 0);
      const resolvedRaw =
        computed.rawScore !== undefined
          ? computed.rawScore
          : computed.score + resolvedStrikes;
      setRawScore(resolvedRaw);
      setStrikes(resolvedStrikes);
      strikesRef.current = resolvedStrikes;
    } else {
      setAnalysis(null);
      setRawScore(null);
      setStrikes(0);
      strikesRef.current = 0;
      lastViolationTimeRef.current = 0;
      setTimeLeft(customDurationSeconds ?? (isGrandQuiz ? 35 * 60 : 12 * 60));
    }
    setProctorAlert(null);
    setReviewFilter("all");
    setShowSubmitConfirm(false);
    setAutoSubmitNotice(null);
  }, [
    isOpen,
    attemptNumber,
    isGrandQuiz,
    questions,
    initialReviewMode,
    initialAnswers,
    initialAnalysis,
    initialStrikes,
    customDurationSeconds,
  ]);

  // PROCTORING & ANTI-CHEATING SECURITY CONTROLS
  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    const handleViolation = (reason: string) => {
      if (isSubmitted) return;
      const now = Date.now();
      // Debounce: prevent duplicate strikes when blur & visibilitychange fire together
      if (now - lastViolationTimeRef.current < 1200) {
        return;
      }
      lastViolationTimeRef.current = now;

      const nextStrikes = strikesRef.current + 1;
      strikesRef.current = nextStrikes;
      setStrikes(nextStrikes);

      if (nextStrikes >= 3) {
        setShowSubmitConfirm(false);
        setAutoSubmitNotice({
          type: "cheat",
          title: "Exam Terminated: Security Violation",
          description: `The exam has been automatically submitted due to reaching 3 proctoring security strikes (${reason}). A penalty of -3 marks has been applied to your final score.`,
          strikesCount: 3,
        });
        setProctorAlert(
          "🚨 3 Proctoring Strikes Reached: Exam auto-submitted with penalties due to security policy violations."
        );
        handleSubmitRef.current();
      } else {
        setProctorAlert(
          `⚠️ Proctoring Warning ${nextStrikes} of 3: ${reason} (-1 mark deducted from final score! Auto-submits on Strike 3)`
        );
        if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
        proctorTimerRef.current = setTimeout(() => {
          setProctorAlert(null);
        }, 5000);
      }
    };

    // 1. Tab Switching & Window Focus Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Leaving the exam tab is prohibited!");
      }
    };

    const handleWindowBlur = () => {
      handleViolation("Switching away from exam window is prohibited!");
    };

    // 2. Keyboard Shortcut Interception (Screenshots, DevTools, Copy, Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Direct PrintScreen key intercept
      if (e.key === "PrintScreen") {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Taking screenshots is strictly prohibited! (-1 mark penalty)");
        return;
      }

      // 2. Windows Snipping Tool (Win+Shift+S) or Mac Screenshot (Cmd+Shift+3/4/5)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        ["s", "S", "3", "4", "5", "x", "X"].includes(e.key)
      ) {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Screen capture attempt detected! (-1 mark penalty)");
        return;
      }

      // 3. Block Ctrl/Cmd + C, U, S, P
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "C", "u", "U", "s", "S", "p", "P"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // 4. Block F12 and DevTools (Ctrl+Shift+I / J / C)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        return;
      }

      // 5. Block Escape key from closing modal during exam
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setProctorAlert("🔒 Exam in progress! The quiz interface can only be closed once it is ended.");
        return;
      }
    };

    // Handle keyup specifically for PrintScreen which triggers on release in many Windows browsers
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Taking screenshots is strictly prohibited! (-1 mark penalty)");
      }
    };

    // Prevent leaving tab / closing window during exam
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Exam in progress! Your progress will be lost if you leave.";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
    };
  }, [isOpen, isSubmitted]);

  if (!isOpen) return null;

  const currentQ = questions[currentIdx] || questions[0];
  const isLastQuestion = currentIdx === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));
  };

  const handleSetTITAAnswer = (val: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      if (val === "") {
        delete updated[currentIdx];
      } else {
        updated[currentIdx] = val;
      }
      return updated;
    });
  };

  const checkQuestionCorrect = (q: ModuleQuestion, idx: number): boolean => {
    const userChoice = selectedAnswers[idx];
    if (userChoice === undefined || userChoice === null || userChoice === "") return false;
    const isTITA = q.type === "TITA" || !q.options || q.options.length === 0;
    if (isTITA) {
      const cleanExpected = (q.titaAnswer || "").trim().toLowerCase();
      const cleanUser = String(userChoice).trim().toLowerCase();
      return cleanExpected !== "" && cleanExpected === cleanUser;
    }
    return userChoice === q.answer;
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filter questions for the solution review screen
  const filteredQuestions = questions.filter((q, idx) => {
    const isCorrect = checkQuestionCorrect(q, idx);
    if (reviewFilter === "wrong") return !isCorrect;
    if (reviewFilter === "correct") return isCorrect;
    return true;
  });


  return (
    <div
      className={styles.overlay}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={styles.modalBox}>
        {/* Real-time Proctoring Warning Banner */}
        {proctorAlert && (
          <div className={styles.proctorWarningBanner}>
            <div className={styles.proctorWarningLeft}>
              <span>{proctorAlert}</span>
            </div>
            <button
              type="button"
              className={styles.proctorDismissBtn}
              onClick={() => setProctorAlert(null)}
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <span className={isGrandQuiz ? styles.grandQuizBadge : styles.quizBadge}>
              {initialReviewMode
                ? `📊 Detailed Report Card (Attempt ${attemptNumber})`
                : isGrandQuiz
                ? "🏆 Grand Comprehensive Quiz"
                : "📝 Compulsory Module Quiz"}
            </span>
            <h2 className={styles.modalTitle}>{title}</h2>
          </div>

          <div className={styles.headerRight}>
            {onBackToAttempts && isSubmitted && (
              <button
                type="button"
                className={styles.backToAttemptsBtn}
                onClick={onBackToAttempts}
                title="Back to All Attempts List"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Attempts</span>
              </button>
            )}
            {!isSubmitted && (
              <div
                className={`${styles.timerBadge} ${timeLeft < 120 ? styles.timerDanger : ""}`}
                title="Time Remaining"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            {!isSubmitted ? (
              <div
                className={styles.examLockedBadge}
                title="Exam in progress. You must submit your quiz before closing."
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Active Exam • Locked</span>
              </div>
            ) : (
              <button
                className={styles.closeBtn}
                onClick={handleSafeClose}
                title="Close Quiz Report"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <>
            {/* Question Tracker & Rules Bar */}
            <div className={styles.questionTracker}>
              <div>
                Question <strong>{currentIdx + 1}</strong> of <strong>{questions.length}</strong> (
                {answeredCount} Answered)
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {strikes > 0 && (
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#dc2626",
                      background: "#fef2f2",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fecaca",
                      animation: "pulse 1.5s infinite",
                    }}
                  >
                    ⚠️ Strikes: {strikes} / 3
                  </span>
                )}
                {!isGrandQuiz && (
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Attempt <strong>{attemptNumber}</strong> of {maxAttempts}
                  </span>
                )}
                <div className={styles.cutoffNotice}>
                  <span>🎯 {scoringScheme === "cat" ? "CAT Scoring: +3 / -1 (TITA: +3/0)" : "70% Cutoff Required to Pass"}</span>
                </div>
              </div>
            </div>

            {/* Quick Question Pills Navigator */}
            <div className={styles.pillsRow}>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== "";
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`${styles.qPill} ${isCurrent ? styles.qPillActive : ""} ${
                      isAnswered && !isCurrent ? styles.qPillAnswered : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Body (NEVER shows right/wrong or explanation during active quiz) */}
            <div className={styles.bodyContent}>
              {currentQ.context && (
                <div className={styles.passageContainer}>
                  <div className={styles.passageHeader}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <span>Reading Passage / Caselet Context</span>
                  </div>
                  <div className={styles.passageText}>
                    <PYQMarkdownViewer content={currentQ.context} />
                  </div>
                </div>
              )}

              <div className={styles.questionMeta}>
                <span className={styles.conceptBadge}>Concept: {currentQ.concept}</span>
                {currentQ.type === "TITA" ? (
                  <span style={{ fontSize: "11px", fontWeight: 700, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "6px" }}>
                    ⌨️ TITA Question
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "6px" }}>
                    🔘 Multiple Choice
                  </span>
                )}
                {currentQ.isOutsideContext && (
                  <span className={styles.outsideTag}>CAT Applied Problem</span>
                )}
              </div>

              <div className={styles.questionTitle}>
                <PYQMarkdownViewer content={currentQ.q} />
              </div>

              {currentQ.type === "TITA" || !currentQ.options || currentQ.options.length === 0 ? (
                <div className={styles.titaContainer}>
                  <div className={styles.titaLabel}>
                    <span>⌨️ Type In The Answer (TITA)</span>
                    <span className={styles.titaSubtext}>
                      Key in your numerical value or exact text answer below. (No negative marks apply in CAT).
                    </span>
                  </div>
                  <div className={styles.titaInputWrapper}>
                    <input
                      type="text"
                      className={styles.titaInput}
                      placeholder="Enter numerical value or text answer..."
                      value={selectedAnswers[currentIdx] !== undefined ? String(selectedAnswers[currentIdx]) : ""}
                      onChange={(e) => handleSetTITAAnswer(e.target.value)}
                    />
                    {selectedAnswers[currentIdx] !== undefined && selectedAnswers[currentIdx] !== "" && (
                      <button
                        type="button"
                        onClick={() => handleSetTITAAnswer("")}
                        className={styles.titaClearBtn}
                        title="Clear Answer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.optionsGrid}>
                  {currentQ.options.map((optText, optIdx) => {
                    const isSelected = selectedAnswers[currentIdx] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                      >
                        <div className={styles.optionKey}>{OPTION_LETTERS[optIdx]}</div>
                        <div className={styles.optionText}>{optText}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


            {/* Modal Footer Controls */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.navActionBtn} ${styles.btnSecondary}`}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                ← Previous
              </button>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {!isLastQuestion ? (
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnPrimary}`}
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnSubmit}`}
                    onClick={() => setShowSubmitConfirm(true)}
                  >
                    Submit Quiz 🚀
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Result, Diagnostics & Comprehensive Solutions Review (ONLY AFTER SUBMISSION) */
          <div className={`${styles.bodyContent} ${styles.resultContainer}`}>
            <div
              className={`${styles.resultTrophy} ${
                analysis?.passed ? styles.trophyPass : styles.trophyFail
              }`}
            >
              {analysis?.passed ? "🏆" : "⚠️"}
            </div>

            <h3 className={styles.resultHeading}>
              {analysis?.passed
                ? isGrandQuiz
                  ? "Outstanding! Course Mastered!"
                  : "Congratulations! Module Passed!"
                : "Cutoff Not Met (70% Required)"}
            </h3>

            <p className={styles.resultSubheading}>
              {analysis?.passed
                ? isGrandQuiz
                  ? "You have completed the CAT Grand Comprehensive Assessment. Your topic readiness is benchmarked at 99+ percentile!"
                  : "Great work! You have successfully mastered this module. The next module is now unlocked for you."
                : `You scored ${analysis?.percentage}%. You need at least 70% to unlock the next module.`}
            </p>

            {/* Proctoring Penalty Notice Banner (If any strikes incurred) */}
            {strikes > 0 && (
              <div className={styles.penaltyNoticeBanner}>
                <div className={styles.penaltyNoticeTitle}>
                  <span>⚠️ Proctoring Strike Penalty Applied (-{strikes} Mark{strikes > 1 ? "s" : ""})</span>
                </div>
                <div className={styles.penaltyNoticeDesc}>
                  You incurred <strong>{strikes} proctoring warning{strikes > 1 ? "s" : ""}</strong> during this exam for security policy violations (screenshot or tab switching detected).
                  A penalty of <strong>-{strikes} mark{strikes > 1 ? "s" : ""}</strong> was deducted from your raw score ({rawScore !== null ? rawScore : analysis?.score} → {analysis?.score}).
                </div>
              </div>
            )}

            {/* Score & Points Banner */}
            <div className={styles.scoreBanner}>
              {strikes > 0 ? (
                <>
                  <div className={styles.scoreMetric}>
                    <span className={styles.scoreVal}>
                      {rawScore !== null ? rawScore : analysis?.score} / {analysis?.total}
                    </span>
                    <span className={styles.scoreLbl}>Raw Score</span>
                  </div>
                  <div style={{ width: "1px", height: "36px", background: "#cbd5e1" }} />
                  <div className={styles.scoreMetric}>
                    <span className={styles.scoreVal} style={{ color: "#dc2626" }}>
                      -{strikes}
                    </span>
                    <span className={styles.scoreLbl}>Penalty</span>
                  </div>
                  <div style={{ width: "1px", height: "36px", background: "#cbd5e1" }} />
                  <div className={styles.scoreMetric}>
                    <span className={styles.scoreVal}>
                      {analysis?.score} / {analysis?.total}
                    </span>
                    <span className={styles.scoreLbl}>Final Score</span>
                  </div>
                </>
              ) : (
                <div className={styles.scoreMetric}>
                  <span className={styles.scoreVal}>
                    {analysis?.score} / {analysis?.total}
                  </span>
                  <span className={styles.scoreLbl}>Correct Answers</span>
                </div>
              )}
              <div style={{ width: "1px", height: "36px", background: "#cbd5e1" }} />
              <div className={styles.scoreMetric}>
                <span className={styles.scoreVal}>{analysis?.percentage}%</span>
                <span className={styles.scoreLbl}>Accuracy</span>
              </div>
              {analysis?.passed && (
                <>
                  <div style={{ width: "1px", height: "36px", background: "#cbd5e1" }} />
                  <div className={styles.xpAwardBadge}>
                    +{isGrandQuiz ? 100 : 50} XP Points Earned!
                  </div>
                </>
              )}
            </div>

            {/* Time & Proctoring Analytics Bar */}
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <span className={styles.analyticsVal}>
                  {formatTimer(analysis?.timeTakenSeconds || Math.max(1, initialDuration - timeLeft))}
                </span>
                <span className={styles.analyticsLbl}>⏱️ Time Taken</span>
              </div>
              <div className={styles.analyticsCard}>
                <span className={styles.analyticsVal}>
                  {Math.max(
                    1,
                    Math.round(
                      (analysis?.timeTakenSeconds || Math.max(1, initialDuration - timeLeft)) /
                        (questions.length || 1)
                    )
                  )}s / Q
                </span>
                <span className={styles.analyticsLbl}>⚡ Avg Speed</span>
              </div>
              <div className={styles.analyticsCard}>
                <span
                  className={`${styles.analyticsVal} ${
                    strikes > 0 ? styles.analyticsStrike : styles.analyticsPass
                  }`}
                >
                  {strikes > 0 ? `-${strikes} Mark${strikes > 1 ? "s" : ""}` : "Clean (0)"}
                </span>
                <span className={styles.analyticsLbl}>🛡️ Proctoring</span>
              </div>
              <div className={styles.analyticsCard}>
                <span
                  className={`${styles.analyticsVal} ${
                    analysis?.passed ? styles.analyticsPass : styles.analyticsStrike
                  }`}
                >
                  {analysis?.passed ? "Passed ✓" : "Cutoff 70%"}
                </span>
                <span className={styles.analyticsLbl}>🎯 Benchmark</span>
              </div>
            </div>

            {/* AI Diagnosis & Prescribed Rewatches (If Failed) */}
            {!analysis?.passed && analysis && (
              <>
                {attemptNumber >= maxAttempts && (
                  <div className={styles.lockoutBanner}>
                    <div className={styles.lockoutTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Attempt Limit Reached ({maxAttempts} of {maxAttempts})</span>
                    </div>
                    <p className={styles.lockoutDesc}>
                      You have used all 3 attempts. To ensure mastery, please re-watch the recommended
                      lectures below. Once you review them, click below to refresh your attempts.
                    </p>
                    {onResetAttemptsAfterRewatch && (
                      <button
                        type="button"
                        className={styles.resetAttemptsBtn}
                        onClick={onResetAttemptsAfterRewatch}
                      >
                        ✓ I Have Re-watched the Lectures • Reset Attempts
                      </button>
                    )}
                  </div>
                )}

                <div className={styles.aiDiagnosisCard}>
                  <div className={styles.aiCardHeader}>
                    <div className={styles.aiIconBox}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                    <h4 className={styles.aiCardTitle}>
                      AI Concept Diagnosis: Topics Requiring Review
                    </h4>
                  </div>

                  {/* Missed Questions */}
                  <div className={styles.missedTopicsList}>
                    {analysis.missedConcepts.map((item, idx) => (
                      <div key={idx} className={styles.missedTopicItem}>
                        <div>
                          <strong>{item.concept}</strong>: {item.explanation}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Lectures to Rewatch */}
                  {analysis.recommendedLessons.length > 0 && (
                    <div className={styles.recommendedLecturesSection}>
                      <div className={styles.recHeading}>
                        Recommended Lectures to Rewatch:
                      </div>
                      <div className={styles.recLecturesList}>
                        {analysis.recommendedLessons.map((rec) => (
                          <div key={rec.lessonId} className={styles.recLectureRow}>
                            <div>
                              <div className={styles.recLectureTitle}>
                                📺 {rec.lessonTitle}
                              </div>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>
                                {rec.reason}
                              </span>
                            </div>
                            {onSelectLessonToRewatch && (
                              <button
                                type="button"
                                className={styles.watchRecBtn}
                                onClick={() => {
                                  onSelectLessonToRewatch(rec.lessonId);
                                  onClose();
                                }}
                              >
                                Watch Lecture →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* FULL POST-SUBMISSION SOLUTIONS & EXPLANATIONS SECTION */}
            <div className={styles.solutionsSection}>
              <div className={styles.solutionsHeader}>
                <div className={styles.solutionsTitle}>
                  <span>📋 Detailed Solutions & Explanations</span>
                </div>
                <div className={styles.filterTabs}>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${reviewFilter === "all" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setReviewFilter("all")}
                  >
                    All ({questions.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${reviewFilter === "wrong" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setReviewFilter("wrong")}
                  >
                    Incorrect ({questions.filter((q, idx) => selectedAnswers[idx] !== q.answer).length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${reviewFilter === "correct" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setReviewFilter("correct")}
                  >
                    Correct ({questions.filter((q, idx) => selectedAnswers[idx] === q.answer).length})
                  </button>
                </div>
              </div>

              <div className={styles.reviewList}>
                {filteredQuestions.map((q) => {
                  const originalIdx = questions.findIndex((orig) => orig.id === q.id);
                  const userChoice = selectedAnswers[originalIdx];
                  const isUserCorrect = checkQuestionCorrect(q, originalIdx);
                  const isTITA = q.type === "TITA" || !q.options || q.options.length === 0;

                  return (
                    <div
                      key={q.id}
                      className={`${styles.reviewCard} ${
                        isUserCorrect ? styles.reviewCardCorrect : styles.reviewCardWrong
                      }`}
                    >
                      <div className={styles.reviewCardHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={styles.conceptBadge}>
                            Q{originalIdx + 1} • {q.concept}
                          </span>
                          {isTITA && (
                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                              ⌨️ TITA
                            </span>
                          )}
                        </div>
                        {isUserCorrect ? (
                          <span className={styles.reviewStatusBadgeCorrect}>
                            ✓ Correct {scoringScheme === "cat" ? "(+3)" : ""}
                          </span>
                        ) : userChoice === undefined || userChoice === null || userChoice === "" ? (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>
                            ⚪ Unattempted (0)
                          </span>
                        ) : (
                          <span className={styles.reviewStatusBadgeWrong}>
                            ✗ Incorrect {scoringScheme === "cat" ? (isTITA ? "(0)" : "(-1)") : ""}
                          </span>
                        )}
                      </div>

                      {q.context && (
                        <div className={styles.passageContainer} style={{ maxHeight: "360px", marginBottom: "12px" }}>
                          <div className={styles.passageHeader}>
                            <span>Context / Passage:</span>
                          </div>
                          <div className={styles.passageText} style={{ fontSize: "12.5px" }}>
                            <PYQMarkdownViewer content={q.context} />
                          </div>
                        </div>
                      )}

                      <div className={styles.reviewQuestionText}>
                        <PYQMarkdownViewer content={q.q} />
                      </div>

                      {isTITA ? (
                        <div className={styles.titaReviewBlock}>
                          <div className={styles.titaReviewRow}>
                            <span className={styles.titaReviewLabel}>Your Answer:</span>
                            <span className={`${styles.titaUserVal} ${isUserCorrect ? styles.titaUserValCorrect : styles.titaUserValWrong}`}>
                              {userChoice !== undefined && userChoice !== "" ? String(userChoice) : "(Unattempted)"}
                            </span>
                          </div>
                          <div className={styles.titaReviewRow}>
                            <span className={styles.titaReviewLabel}>Correct Answer:</span>
                            <span className={styles.titaCorrectVal}>
                              {q.titaAnswer || q.explanation.slice(0, 80)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.reviewOptionsList}>
                          {q.options.map((opt, optIdx) => {
                            const isSelectedByUser = userChoice === optIdx;
                            const isActualCorrect = q.answer === optIdx;

                            let rowClass = styles.reviewOptionItem;
                            let tag = null;

                            if (isSelectedByUser && isActualCorrect) {
                              rowClass += ` ${styles.reviewOptSelectedCorrect}`;
                              tag = <span className={`${styles.reviewOptTag} ${styles.tagCorrect}`}>✓ Your Answer (Correct)</span>;
                            } else if (isSelectedByUser && !isActualCorrect) {
                              rowClass += ` ${styles.reviewOptSelectedWrong}`;
                              tag = <span className={`${styles.reviewOptTag} ${styles.tagUserWrong}`}>✗ Your Answer (Incorrect)</span>;
                            } else if (isActualCorrect) {
                              rowClass += ` ${styles.reviewOptCorrectAnswer}`;
                              tag = <span className={`${styles.reviewOptTag} ${styles.tagCorrect}`}>✓ Correct Answer</span>;
                            }

                            return (
                              <div key={optIdx} className={rowClass}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span style={{ fontWeight: 700, color: "#64748b" }}>
                                    {OPTION_LETTERS[optIdx]}.
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {tag}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Step-by-Step Explanation Callout */}
                      <div className={styles.explanationCallout}>
                        <div className={styles.explanationTitle}>
                          <span>💡 Step-by-Step Explanation & Shortcut:</span>
                        </div>
                        <div>
                          <PYQMarkdownViewer content={q.explanation} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
              {onBackToAttempts && (
                <button
                  type="button"
                  className={`${styles.navActionBtn} ${styles.btnBackToAttempts}`}
                  onClick={onBackToAttempts}
                  title="Return to the list of all past attempts"
                >
                  ← Back to All Attempts
                </button>
              )}
              {analysis?.passed ? (
                <>
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnRetakeScore}`}
                    onClick={() => {
                      if (onRetake) {
                        onRetake();
                      } else {
                        setIsSubmitted(false);
                        setSelectedAnswers({});
                        setTimeLeft(initialDuration);
                        setCurrentIdx(0);
                        setAnalysis(null);
                        setRawScore(null);
                        setStrikes(0);
                        strikesRef.current = 0;
                        setProctorAlert(null);
                        setShowSubmitConfirm(false);
                        setAutoSubmitNotice(null);
                      }
                    }}
                  >
                    🔄 Retake Quiz with Fresh Questions (Improve Score)
                  </button>
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnPrimary}`}
                    onClick={handleSafeClose}
                  >
                    Continue Learning 🚀
                  </button>
                </>
              ) : attemptNumber < maxAttempts ? (
                <button
                  type="button"
                  className={`${styles.navActionBtn} ${styles.btnPrimary}`}
                  onClick={() => {
                    if (onRetake) {
                      onRetake();
                    } else {
                      setIsSubmitted(false);
                      setSelectedAnswers({});
                      setTimeLeft(initialDuration);
                      setCurrentIdx(0);
                      setAnalysis(null);
                      setRawScore(null);
                      setStrikes(0);
                      strikesRef.current = 0;
                      setProctorAlert(null);
                      setShowSubmitConfirm(false);
                      setAutoSubmitNotice(null);
                    }
                  }}
                >
                  Retake Quiz with Fresh Questions (Attempt {attemptNumber + 1} of {maxAttempts}) 🔄
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.navActionBtn} ${styles.btnSecondary}`}
                  onClick={handleSafeClose}
                >
                  Close & Review Videos
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submission Re-verification Confirmation Dialog */}
        {showSubmitConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setShowSubmitConfirm(false)}>
            <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>📝</div>
              <h3 className={styles.confirmTitle}>Submit Your Exam?</h3>
              <p className={styles.confirmDesc}>
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                <br />
                Time remaining: <strong>{formatTimer(timeLeft)}</strong>.
                <br />
                Are you sure you want to finalize and submit your answers?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  ← Continue Exam
                </button>
                <button
                  type="button"
                  className={styles.confirmSubmitBtn}
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleSubmit();
                  }}
                >
                  Yes, Submit Exam ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto Submission Notification Modal (Timeout or Proctoring Violation) */}
        {autoSubmitNotice && (
          <div className={styles.confirmOverlay} onClick={() => setAutoSubmitNotice(null)}>
            <div
              className={styles.confirmBox}
              onClick={(e) => e.stopPropagation()}
              style={{
                borderTop:
                  autoSubmitNotice.type === "cheat"
                    ? "4px solid #dc2626"
                    : "4px solid #d97706",
              }}
            >
              <div className={styles.confirmIcon}>
                {autoSubmitNotice.type === "cheat" ? "🚨" : "⏱️"}
              </div>
              <h3
                className={styles.confirmTitle}
                style={{
                  color: autoSubmitNotice.type === "cheat" ? "#dc2626" : "#b45309",
                }}
              >
                {autoSubmitNotice.title}
              </h3>
              <p className={styles.confirmDesc}>
                {autoSubmitNotice.description}
              </p>
              {autoSubmitNotice.type === "cheat" && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    marginBottom: "18px",
                    textAlign: "left",
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ <strong>Security Advisory:</strong> Switching browser tabs, minimizing the exam window, taking screenshots, or developer tool access are strictly disallowed during testing.
                </div>
              )}
              {autoSubmitNotice.type === "timeout" && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#92400e",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    marginBottom: "18px",
                    textAlign: "left",
                    lineHeight: 1.5,
                  }}
                >
                  ⏳ <strong>Time Allocation Notice:</strong> All answered questions have been safely graded. Unanswered questions are marked as unattempted.
                </div>
              )}
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmSubmitBtn}
                  style={{
                    background:
                      autoSubmitNotice.type === "cheat"
                        ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                        : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  }}
                  onClick={() => setAutoSubmitNotice(null)}
                >
                  View Score &amp; Detailed Analysis 📊
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
