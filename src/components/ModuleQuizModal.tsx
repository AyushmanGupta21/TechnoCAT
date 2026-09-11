"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ModuleQuestion, evaluateQuiz, QuizAnalysis } from "@/data/moduleQuizData";
import styles from "./ModuleQuizModal.module.css";

interface ModuleQuizModalProps {
  isOpen: boolean;
  title: string;
  isGrandQuiz?: boolean;
  questions: ModuleQuestion[];
  attemptNumber: number;
  maxAttempts?: number;
  initialReviewMode?: boolean;
  initialAnswers?: Record<number, number>;
  initialAnalysis?: QuizAnalysis | null;
  initialStrikes?: number;
  onClose: () => void;
  onPass: (score: number, total: number, earnedPoints: number) => void;
  onFail: (score: number, total: number, analysis: QuizAnalysis) => void;
  onSelectLessonToRewatch?: (lessonId: string) => void;
  onResetAttemptsAfterRewatch?: () => void;
  onRetake?: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

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
  onClose,
  onPass,
  onFail,
  onSelectLessonToRewatch,
  onResetAttemptsAfterRewatch,
  onRetake,
}: ModuleQuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(initialAnswers || {});
  // Timer: 12 minutes (720s) for module quiz (10 questions), 35 minutes (2100s) for grand quiz (30 questions)
  const initialDuration = isGrandQuiz ? 35 * 60 : 12 * 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isSubmitted, setIsSubmitted] = useState(initialReviewMode);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(initialAnalysis || null);

  // Post-submission solutions filter: "all" | "wrong" | "correct"
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">("all");

  // Proctoring Security State
  const [strikes, setStrikes] = useState<number>(initialStrikes);
  const [rawScore, setRawScore] = useState<number | null>(null);
  const strikesRef = useRef(strikes);
  useEffect(() => {
    strikesRef.current = strikes;
  }, [strikes]);

  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const proctorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = useCallback(() => {
    const rawResult = evaluateQuiz(questions, selectedAnswers);
    const penaltyMarks = strikesRef.current;
    const penalizedScore = Math.max(0, rawResult.score - penaltyMarks);
    const penalizedPercentage = Math.round((penalizedScore / rawResult.total) * 100);
    const penalizedPassed = penalizedPercentage >= 70;

    setRawScore(rawResult.score);

    const finalResult: QuizAnalysis = {
      ...rawResult,
      score: penalizedScore,
      percentage: penalizedPercentage,
      passed: penalizedPassed,
      rawScore: rawResult.score,
      strikes: penaltyMarks,
      penaltyMarks,
      selectedAnswers,
      questions,
    };

    setAnalysis(finalResult);
    setIsSubmitted(true);

    const points = isGrandQuiz ? 100 : 50;

    if (finalResult.passed) {
      onPass(finalResult.score, finalResult.total, points);
    } else {
      onFail(finalResult.score, finalResult.total, finalResult);
    }
  }, [questions, selectedAnswers, isGrandQuiz, onPass, onFail]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer effect
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmitRef.current();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, timeLeft]);

  // Reset when re-opened or when questions change
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setSelectedAnswers(initialAnswers || {});
      setIsSubmitted(initialReviewMode);

      if (initialReviewMode) {
        const computed =
          initialAnalysis || evaluateQuiz(questions, initialAnswers || {});
        setAnalysis(computed);
        setRawScore(
          computed.rawScore !== undefined
            ? computed.rawScore
            : computed.score + (initialStrikes || 0)
        );
        setStrikes(initialStrikes || 0);
        strikesRef.current = initialStrikes || 0;
      } else {
        setAnalysis(null);
        setRawScore(null);
        setStrikes(0);
        strikesRef.current = 0;
        setTimeLeft(isGrandQuiz ? 35 * 60 : 12 * 60);
      }
      setProctorAlert(null);
      setReviewFilter("all");
    }
  }, [isOpen, isGrandQuiz, questions, initialReviewMode, initialAnswers, initialAnalysis, initialStrikes]);

  // PROCTORING & ANTI-CHEATING SECURITY CONTROLS
  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    // 1. Tab Switching & Window Focus Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Leaving the exam tab is prohibited!");
      }
    };

    const handleWindowBlur = () => {
      handleViolation("Switching away from exam window is prohibited!");
    };

    const handleViolation = (reason: string) => {
      setStrikes((prev) => {
        const next = prev + 1;
        strikesRef.current = next;
        if (next >= 3) {
          setProctorAlert(
            "🚨 3 Proctoring Strikes Reached: Exam auto-submitted with penalties due to security policy violations."
          );
          setTimeout(() => {
            handleSubmitRef.current();
          }, 1000);
        } else {
          setProctorAlert(
            `⚠️ Proctoring Warning ${next} of 3: ${reason} (-1 mark deducted from final score! Auto-submits on Strike 3)`
          );
          if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
          proctorTimerRef.current = setTimeout(() => {
            setProctorAlert(null);
          }, 6000);
        }
        return next;
      });
    };

    // 2. Keyboard Shortcut Interception (Screenshots, DevTools, Copy, Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key intercept
      if (e.key === "PrintScreen") {
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        setProctorAlert("⚠️ Screenshots are strictly prohibited during CAT examinations!");
        if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
        proctorTimerRef.current = setTimeout(() => setProctorAlert(null), 4000);
        e.preventDefault();
        return;
      }

      // Block Ctrl/Cmd + C, U, S, P
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "C", "u", "U", "s", "S", "p", "P"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Block F12 and DevTools (Ctrl+Shift+I / J / C)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filter questions for the solution review screen
  const filteredQuestions = questions.filter((q, idx) => {
    const isCorrect = selectedAnswers[idx] === q.answer;
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
            <button className={styles.closeBtn} onClick={onClose} title="Close Quiz">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
                {!isGrandQuiz && (
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Attempt <strong>{attemptNumber}</strong> of {maxAttempts}
                  </span>
                )}
                <div className={styles.cutoffNotice}>
                  <span>🎯 70% Cutoff Required to Pass</span>
                </div>
              </div>
            </div>

            {/* Quick Question Pills Navigator */}
            <div className={styles.pillsRow}>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = selectedAnswers[idx] !== undefined;
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
              <div className={styles.questionMeta}>
                <span className={styles.conceptBadge}>Concept: {currentQ.concept}</span>
                {currentQ.isOutsideContext && (
                  <span className={styles.outsideTag}>CAT Applied Problem</span>
                )}
              </div>

              <h3 className={styles.questionTitle}>{currentQ.q}</h3>

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

              <div style={{ display: "flex", gap: "10px" }}>
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
                    onClick={handleSubmit}
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
                  You incurred <strong>{strikes} proctoring warning{strikes > 1 ? "s" : ""}</strong> during this exam for tab switching or security violations.
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
                    Incorrect ({(analysis?.total || questions.length) - (analysis?.score || 0)})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${reviewFilter === "correct" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setReviewFilter("correct")}
                  >
                    Correct ({analysis?.score || 0})
                  </button>
                </div>
              </div>

              <div className={styles.reviewList}>
                {filteredQuestions.map((q) => {
                  const originalIdx = questions.findIndex((orig) => orig.id === q.id);
                  const userChoice = selectedAnswers[originalIdx];
                  const isUserCorrect = userChoice === q.answer;

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
                        </div>
                        {isUserCorrect ? (
                          <span className={styles.reviewStatusBadgeCorrect}>✓ Correct</span>
                        ) : (
                          <span className={styles.reviewStatusBadgeWrong}>✗ Incorrect</span>
                        )}
                      </div>

                      <div className={styles.reviewQuestionText}>{q.q}</div>

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
                            tag = <span className={`${styles.reviewOptTag} ${styles.tagUserWrong}`}>✗ Your Answer</span>;
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

                      {/* Step-by-Step Explanation Callout */}
                      <div className={styles.explanationCallout}>
                        <div className={styles.explanationTitle}>
                          <span>💡 Step-by-Step Explanation & Shortcut:</span>
                        </div>
                        <div>{q.explanation}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {analysis?.passed ? (
                <button
                  type="button"
                  className={`${styles.navActionBtn} ${styles.btnPrimary}`}
                  onClick={onClose}
                >
                  Continue Learning 🚀
                </button>
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
                    }
                  }}
                >
                  Retake Quiz with Fresh Questions (Attempt {attemptNumber + 1} of {maxAttempts}) 🔄
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.navActionBtn} ${styles.btnSecondary}`}
                  onClick={onClose}
                >
                  Close & Review Videos
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
