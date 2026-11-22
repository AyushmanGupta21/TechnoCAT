"use client";

import React, { useState, useEffect } from "react";
import { QuizQuestion } from "@/data/videoPortions";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Lock, RotateCcw, Send, Timer, TriangleAlert, Trophy, X } from "lucide-react";
import styles from "./QuizViewer.module.css";

export interface TechnoEEEQuestion {
  question: string;
  options: { id: string; text: string }[];
  correct_answers: string[]; // e.g. ["A"]
  explanations?: Record<string, string> | string;
}

export type AnyQuizQuestion = QuizQuestion | TechnoEEEQuestion;

interface QuizViewerProps {
  title: string;
  questions: AnyQuizQuestion[];
  onClose: () => void;
  /** Called once on submit with the score and the raw answers (option letter per question index). */
  onSubmitQuiz?: (
    score: number,
    total: number,
    details: { answers: Record<number, string>; durationSeconds: number }
  ) => void;
}

// Normalized internal question format
interface NormalizedQuestion {
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanations: Record<string, string>;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function normalizeQuestions(rawList: AnyQuizQuestion[]): NormalizedQuestion[] {
  return rawList.map((q) => {
    if ("q" in q) {
      // It's a QuizQuestion from videoPortions.ts
      const correctLetter = OPTION_LETTERS[q.answer] || "A";
      const expDict: Record<string, string> = {
        [correctLetter]: q.explanation,
      };
      // Auto-populate context for other options
      OPTION_LETTERS.forEach((letter, idx) => {
        if (letter !== correctLetter) {
          expDict[letter] = `Option ${letter} (${q.options[idx] || ""}) is incorrect for this problem. Review the formula in the lecture.`;
        }
      });

      return {
        question: q.q,
        options: q.options.map((optText, idx) => ({
          id: OPTION_LETTERS[idx] || `${idx + 1}`,
          text: optText,
        })),
        correctAnswer: correctLetter,
        explanations: expDict,
      };
    } else {
      // It's a TechnoEEE format question
      const correctLetter = q.correct_answers?.[0] || "A";
      let expDict: Record<string, string> = {};
      if (typeof q.explanations === "string") {
        expDict[correctLetter] = q.explanations;
      } else if (q.explanations && typeof q.explanations === "object") {
        expDict = q.explanations as Record<string, string>;
      }

      return {
        question: q.question,
        options: q.options,
        correctAnswer: correctLetter,
        explanations: expDict,
      };
    }
  });
}

export default function QuizViewer({
  title,
  questions: rawQuestions,
  onClose,
  onSubmitQuiz,
}: QuizViewerProps) {
  const questions = React.useMemo(() => normalizeQuestions(rawQuestions), [rawQuestions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(Math.max(60, questions.length * 45));
  const initialTimeRef = React.useRef(Math.max(60, questions.length * 45));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) {
        handleSubmit();
      }
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  // Question switch animation
  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => setIsAnimating(false), 350);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  const handleOptionSelect = (optId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optId,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      if (userAns && userAns === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    if (onSubmitQuiz) {
      onSubmitQuiz(calculatedScore, questions.length, {
        answers: selectedAnswers,
        durationSeconds: Math.max(0, initialTimeRef.current - timeLeft),
      });
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setCurrentIdx(0);
    setTimeLeft(Math.max(60, questions.length * 45));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className={styles.emptyOverlay}>
        <div className={styles.emptyCard}>
          <h3 className={styles.emptyTitle}>No quiz questions for this lesson yet</h3>
          <p className={styles.emptyText}>Check back after the next content update.</p>
          <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnPrimary}`}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const userAns = selectedAnswers[currentIdx];
  const isCurrentQuestionCorrect = userAns === q.correctAnswer;

  // Display-only result breakdown (derived from the same answers used for scoring)
  const total = questions.length;
  const answeredTotal = Object.keys(selectedAnswers).length;
  const wrongCount = isSubmitted
    ? questions.filter((qq, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== qq.correctAnswer).length
    : 0;
  const skippedCount = isSubmitted ? Math.max(0, total - score - wrongCount) : 0;
  const ratio = score / total;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const timeLow = timeLeft < 60;

  return (
    <div className={styles.screen}>
      {/* Top header */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          {!isSubmitted ? (
            <div className={styles.lockChip} title="Practice in progress. You must submit your quiz to exit.">
              <Lock size={14} aria-hidden="true" />
              <span>Quiz in progress</span>
            </div>
          ) : (
            <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}>
              <X size={16} aria-hidden="true" />
              Close results
            </button>
          )}

          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>
              Lesson practice · <span className={styles.mono}>{total}</span> questions
            </p>
          </div>
        </div>

        <div className={styles.topRight}>
          {!isSubmitted && (
            <div className={`${styles.timerChip} ${timeLow ? styles.timerLow : ""}`} aria-label="Time remaining">
              <Timer size={16} aria-hidden="true" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {!isSubmitted && (
            <button type="button" onClick={handleSubmit} className={`${styles.btn} ${styles.btnPrimary}`}>
              Submit quiz
              <Send size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Main body */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sideHead}>
            <h3 className={styles.sideTitle}>Question palette</h3>
            <span className={styles.sideCount}>
              {answeredTotal}/{total}
            </span>
          </div>

          <div className={styles.palette}>
            {questions.map((_, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIdx === idx;
              let stateClass = styles.palNotVisited;
              if (isSubmitted) {
                const ans = selectedAnswers[idx];
                const isCorrect = ans === questions[idx].correctAnswer;
                stateClass = isCorrect ? styles.palCorrect : ans === undefined ? styles.palSkipped : styles.palWrong;
              } else if (isAnswered) {
                stateClass = styles.palAnswered;
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`${styles.palBtn} ${stateClass} ${isCurrent ? styles.palCurrent : ""}`}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <ul className={styles.legend}>
            {isSubmitted ? (
              <>
                <li><span className={`${styles.legendDot} ${styles.dotCorrect}`} />Correct</li>
                <li><span className={`${styles.legendDot} ${styles.dotWrong}`} />Wrong</li>
                <li><span className={`${styles.legendDot} ${styles.dotSkipped}`} />Skipped</li>
              </>
            ) : (
              <>
                <li><span className={`${styles.legendDot} ${styles.dotCorrect}`} />Answered</li>
                <li><span className={`${styles.legendDot} ${styles.dotSkipped}`} />Not answered</li>
                <li><span className={`${styles.legendDot} ${styles.dotCurrent}`} />Current</li>
              </>
            )}
          </ul>

          {isSubmitted && (
            <div className={styles.scoreCard}>
              <div className={styles.scoreLabel}>Your score</div>
              <div className={styles.scoreValue}>
                {score}
                <span className={styles.scoreTotal}>/ {total}</span>
              </div>

              <div className={styles.accBar} role="img" aria-label={`${score} correct, ${wrongCount} wrong, ${skippedCount} skipped`}>
                <span className={styles.accCorrect} style={{ width: pct(score) }} />
                <span className={styles.accWrong} style={{ width: pct(wrongCount) }} />
                <span className={styles.accSkipped} style={{ width: pct(skippedCount) }} />
              </div>
              <div className={styles.accKey}>
                <span><i className={styles.dotCorrect} />{score} correct</span>
                <span><i className={styles.dotWrong} />{wrongCount} wrong</span>
                <span><i className={styles.dotSkippedLight} />{skippedCount} skipped</span>
              </div>

              <div className={styles.verdict}>
                {ratio >= 0.8 ? (
                  <>
                    <Trophy size={15} aria-hidden="true" />
                    <span>Strong result — ready to move on</span>
                  </>
                ) : ratio >= 0.5 ? (
                  <>
                    <Check size={15} aria-hidden="true" />
                    <span>Good effort — revise the traps</span>
                  </>
                ) : (
                  <>
                    <TriangleAlert size={15} aria-hidden="true" />
                    <span>Needs revision</span>
                  </>
                )}
              </div>

              <button type="button" onClick={handleRetake} className={`${styles.btn} ${styles.btnLight}`}>
                <RotateCcw size={15} aria-hidden="true" />
                Retake quiz
              </button>
            </div>
          )}
        </aside>

        {/* Question area */}
        <main className={styles.questionArea}>
          <div className={`${styles.questionInner} ${isAnimating ? styles.animateQuestion : ""}`}>
            <div className={styles.qMeta}>
              <span className={styles.qNumber}>
                Question <span className={styles.mono}>{currentIdx + 1}</span> of <span className={styles.mono}>{total}</span>
              </span>
              <span className={styles.qKind}>Multiple choice</span>
            </div>

            <div className={styles.questionText}>
              <MathText text={q.question} />
            </div>

            {/* Options */}
            <div className={styles.options}>
              {q.options.map((opt) => {
                const isSelected = userAns === opt.id;
                let optClass = "";
                let icon: React.ReactNode = null;

                if (!isSubmitted && isSelected) optClass = styles.optSelected;

                if (isSubmitted) {
                  const isCorrect = opt.id === q.correctAnswer;
                  if (isCorrect) {
                    optClass = styles.optCorrect;
                    icon = <Check size={18} className={styles.optIcon} aria-label="Correct answer" />;
                  } else if (isSelected) {
                    optClass = styles.optWrong;
                    icon = <X size={18} className={styles.optIcon} aria-label="Your answer" />;
                  } else {
                    optClass = styles.optMuted;
                  }
                }

                return (
                  <div
                    key={opt.id}
                    className={`${styles.option} ${isSubmitted ? styles.optSubmitted : ""} ${optClass}`}
                    onClick={() => handleOptionSelect(opt.id)}
                  >
                    <div className={styles.optKey}>{opt.id}</div>
                    <div className={styles.optText}>
                      <MathText text={opt.text} />
                    </div>
                    {icon}
                  </div>
                );
              })}
            </div>

            {/* Review & explanations */}
            {isSubmitted && (
              <div className={`glass-card ${styles.explain}`} data-tint="amber">
                <h4 className={styles.explainTitle}>
                  <Lightbulb size={17} aria-hidden="true" />
                  <span>Explanation</span>
                </h4>

                <div className={styles.explainList}>
                  {!isCurrentQuestionCorrect && userAns && q.explanations[userAns] && (
                    <div className={styles.explainRow}>
                      <span className={`${styles.explainTag} ${styles.tagWrong}`}>Option {userAns}</span>
                      <div className={styles.explainBody}>
                        <strong>Why your answer was wrong: </strong>
                        {q.explanations[userAns]}
                      </div>
                    </div>
                  )}

                  {q.explanations[q.correctAnswer] && (
                    <div className={styles.explainRow}>
                      <span className={`${styles.explainTag} ${styles.tagCorrect}`}>Option {q.correctAnswer}</span>
                      <div className={styles.explainBody}>
                        <strong>Correct answer: </strong>
                        {q.explanations[q.correctAnswer]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation footer */}
            <div className={styles.navRow}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Previous
              </button>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
              >
                Next
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
