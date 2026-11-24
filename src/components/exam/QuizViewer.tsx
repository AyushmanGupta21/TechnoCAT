"use client";

// Lesson practice quiz (full screen). Presentation follows the shared exam interface: Classic (CBT-like)
// or Modern (TechnoCAT), switchable at any time without touching answers, timer or palette state.
// After submit, one (Modern) results + review screen is shown regardless of mode.

import React, { useState, useEffect } from "react";
import { QuizQuestion } from "@/data/videoPortions";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
import ExamModeToggle from "@/components/exam/ExamModeToggle";
import { useExamMode } from "@/lib/examMode";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eraser,
  Flag,
  LayoutGrid,
  Lightbulb,
  Lock,
  RotateCcw,
  Send,
  Timer,
  TriangleAlert,
  Trophy,
  X,
} from "lucide-react";
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

type PaletteState = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";
type ReviewFilter = "all" | "correct" | "wrong" | "skipped" | "marked";

const PALETTE_LABEL: Record<PaletteState, string> = {
  notVisited: "Not visited",
  notAnswered: "Not answered",
  answered: "Answered",
  marked: "Marked for review",
  answeredMarked: "Answered & marked for review",
};
const PALETTE_SHORT: Record<PaletteState, string> = {
  notVisited: "Not visited",
  notAnswered: "Not answered",
  answered: "Answered",
  marked: "Marked",
  answeredMarked: "Answered & marked",
};

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

  // Presentation-only state: interface mode, palette (visited / marked), palette drawer, review filter.
  const [mode] = useExamMode();
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

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

  // Palette: remember which questions were opened
  useEffect(() => {
    setVisited((prev) => (prev.has(currentIdx) ? prev : new Set(prev).add(currentIdx)));
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

  // ---- Display-only helpers (palette, actions, results) ----
  const total = questions.length;
  const answeredTotal = Object.keys(selectedAnswers).length;
  const isLast = currentIdx === total - 1;
  const isCurrentMarked = marked.has(currentIdx);

  const paletteState = (idx: number): PaletteState => {
    const isAnswered = selectedAnswers[idx] !== undefined;
    const isMarked = marked.has(idx);
    if (isAnswered && isMarked) return "answeredMarked";
    if (isMarked) return "marked";
    if (isAnswered) return "answered";
    if (visited.has(idx)) return "notAnswered";
    return "notVisited";
  };
  const paletteCounts = questions.reduce<Record<PaletteState, number>>(
    (acc, _q, idx) => {
      acc[paletteState(idx)] += 1;
      return acc;
    },
    { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 }
  );
  const PAL_CLASS: Record<PaletteState, string> = {
    notVisited: styles.palNotVisited,
    notAnswered: styles.palNotAnswered,
    answered: styles.palAnswered,
    marked: styles.palMarked,
    answeredMarked: styles.palAnsweredMarked,
  };

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    setPaletteOpen(false);
  };
  const clearResponse = () =>
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  const markAndNext = () => {
    const wasMarked = marked.has(currentIdx);
    setMarked((prev) => {
      const next = new Set(prev);
      if (wasMarked) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
    if (!wasMarked && !isLast) setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
  };
  const retake = () => {
    handleRetake();
    setVisited(new Set([0]));
    setMarked(new Set());
    setReviewFilter("all");
  };

  // Result breakdown (derived from the same answers used for scoring)
  const statusOf = (idx: number): "correct" | "wrong" | "skipped" => {
    const ans = selectedAnswers[idx];
    if (ans === undefined) return "skipped";
    return ans === questions[idx].correctAnswer ? "correct" : "wrong";
  };
  const wrongCount = isSubmitted
    ? questions.filter((qq, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== qq.correctAnswer).length
    : 0;
  const skippedCount = isSubmitted ? Math.max(0, total - score - wrongCount) : 0;
  const ratio = score / total;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const accuracy = Math.round(ratio * 100);
  const timeTaken = Math.max(0, initialTimeRef.current - timeLeft);
  const timeLow = timeLeft < 60;

  const filterCounts: Record<ReviewFilter, number> = {
    all: total,
    correct: questions.filter((_q, idx) => statusOf(idx) === "correct").length,
    wrong: questions.filter((_q, idx) => statusOf(idx) === "wrong").length,
    skipped: questions.filter((_q, idx) => statusOf(idx) === "skipped").length,
    marked: questions.filter((_q, idx) => marked.has(idx)).length,
  };
  const FILTERS: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "wrong", label: "Wrong" },
    { key: "skipped", label: "Skipped" },
    { key: "correct", label: "Correct" },
    ...(filterCounts.marked > 0 ? [{ key: "marked" as const, label: "Marked" }] : []),
  ];
  const reviewItems = questions
    .map((question, idx) => ({ question, idx }))
    .filter(({ idx }) => {
      if (reviewFilter === "all") return true;
      if (reviewFilter === "marked") return marked.has(idx);
      return statusOf(idx) === reviewFilter;
    });

  const classic = mode === "classic" && !isSubmitted;

  return (
    <div className={`${styles.screen} ${classic ? styles.classic : styles.modern}`}>
      {/* ---------- Top bar ---------- */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          {!isSubmitted ? (
            !classic && (
              <div className={styles.lockChip} title="Practice in progress. You must submit your quiz to exit.">
                <Lock size={14} aria-hidden="true" />
                <span>Quiz in progress</span>
              </div>
            )
          ) : (
            <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}>
              <X size={16} aria-hidden="true" />
              Close results
            </button>
          )}

          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>
              {isSubmitted ? (
                <>Lesson practice · <span className={styles.mono}>{total}</span> questions · Results</>
              ) : (
                <>
                  Lesson practice · Question <span className={styles.mono}>{currentIdx + 1}</span> of{" "}
                  <span className={styles.mono}>{total}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {!isSubmitted && (
          <div className={styles.topRight}>
            <ExamModeToggle tone={classic ? "dark" : "light"} className={styles.modeToggle} />
            <div
              className={`${styles.timerChip} ${timeLow ? styles.timerLow : ""}`}
              role="timer"
              aria-live="off"
              aria-label={`Time left ${formatTime(timeLeft)}`}
            >
              {classic ? <span className={styles.timerLabel}>Time left</span> : <Timer size={16} aria-hidden="true" />}
              <span className={styles.mono}>{formatTime(timeLeft)}</span>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.paletteToggle}`}
              onClick={() => setPaletteOpen(true)}
              aria-expanded={paletteOpen}
              aria-controls="quizviewer-palette"
            >
              <LayoutGrid size={16} aria-hidden="true" />
              <span>Questions</span>
            </button>
            <button type="button" onClick={handleSubmit} className={`${styles.btn} ${styles.btnPrimary} ${styles.submitTop}`}>
              <span>Submit</span>
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      {!isSubmitted && !classic && (
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: pct(answeredTotal) }} />
        </div>
      )}

      {!isSubmitted ? (
        /* ---------- Exam layout ---------- */
        <div className={styles.layout}>
          <main className={styles.questionArea}>
            <div className={styles.questionScroll}>
              <div className={`${styles.questionInner} ${isAnimating ? styles.animateQuestion : ""}`}>
                <div className={styles.qMeta}>
                  <span className={styles.qNumber}>
                    Question No. <span className={styles.mono}>{currentIdx + 1}</span>
                  </span>
                  <span className={styles.qKind}>Multiple choice</span>
                  {isCurrentMarked && (
                    <span className={styles.markedChip}>
                      <Flag size={12} aria-hidden="true" />
                      Marked for review
                    </span>
                  )}
                </div>

                <div className={styles.questionBody}>
                  <div className={styles.questionText}>
                    <MathText text={q.question} />
                  </div>

                  <div className={styles.options} role="group" aria-label="Options">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          className={`${styles.option} ${isSelected ? styles.optSelected : ""}`}
                          onClick={() => handleOptionSelect(opt.id)}
                          aria-pressed={isSelected}
                        >
                          <span className={styles.optKey}>{opt.id}</span>
                          <span className={styles.optText}>
                            <MathText text={opt.text} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className={styles.actionBar}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost} ${styles.actPrev}`}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary} ${styles.actClear}`}
                onClick={clearResponse}
                disabled={userAns === undefined}
              >
                <Eraser size={15} aria-hidden="true" />
                <span>Clear response</span>
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary} ${styles.actMark} ${isCurrentMarked ? styles.btnMarkOn : ""}`}
                onClick={markAndNext}
                aria-pressed={isCurrentMarked}
              >
                <Flag size={15} aria-hidden="true" />
                <span>{isCurrentMarked ? "Unmark" : isLast ? "Mark for review" : "Mark for review & next"}</span>
              </button>
              {!isLast ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.actNext}`}
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  <span>Save &amp; next</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.actNext}`} onClick={handleSubmit}>
                  <Send size={15} aria-hidden="true" />
                  <span>Submit quiz</span>
                </button>
              )}
            </div>
          </main>

          {/* Palette: right column on desktop, slide-in drawer on tablet/phone */}
          {paletteOpen && <div className={styles.drawerBackdrop} onClick={() => setPaletteOpen(false)} aria-hidden="true" />}
          <aside
            id="quizviewer-palette"
            className={`${styles.sidebar} ${paletteOpen ? styles.sidebarOpen : ""}`}
            aria-label="Question palette"
          >
            <div className={styles.sideHead}>
              <h3 className={styles.sideTitle}>Question palette</h3>
              <span className={styles.sideCount}>
                {answeredTotal}/{total} answered
              </span>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setPaletteOpen(false)}
                aria-label="Close question palette"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.palette}>
              {questions.map((_, idx) => {
                const state = paletteState(idx);
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goTo(idx)}
                    className={`${styles.palBtn} ${PAL_CLASS[state]} ${isCurrent ? styles.palCurrent : ""}`}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-label={`Question ${idx + 1}: ${PALETTE_LABEL[state]}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <ul className={styles.legend}>
              {(Object.keys(PALETTE_LABEL) as PaletteState[]).map((s) => (
                <li key={s}>
                  <span className={`${styles.legendSwatch} ${PAL_CLASS[s]}`} aria-hidden="true" />
                  <span className={styles.legendLabel}>{PALETTE_SHORT[s]}</span>
                  <b className={styles.mono}>{paletteCounts[s]}</b>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        /* ---------- Results + review (always Modern) ---------- */
        <div className={styles.resultsScroll}>
          <div className={styles.resultsInner}>
            <section className={styles.summary} aria-label="Score summary">
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
                  <span><i className={styles.keyCorrect} />{score} correct</span>
                  <span><i className={styles.keyWrong} />{wrongCount} wrong</span>
                  <span><i className={styles.keySkipped} />{skippedCount} skipped</span>
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
              </div>

              <div className={styles.statSide}>
                <div className={styles.statGrid}>
                  <div className={`glass-card ${styles.statCard}`} data-tint="teal">
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>Accuracy</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="blue">
                    <span className={styles.statValue}>{score + wrongCount}/{total}</span>
                    <span className={styles.statLabel}>Attempted</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="coral">
                    <span className={styles.statValue}>{wrongCount}</span>
                    <span className={styles.statLabel}>Wrong</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="violet">
                    <span className={styles.statValue}>{formatTime(timeTaken)}</span>
                    <span className={styles.statLabel}>Time taken</span>
                  </div>
                </div>
                <div className={styles.resultActions}>
                  <button type="button" onClick={retake} className={`${styles.btn} ${styles.btnSecondary}`}>
                    <RotateCcw size={15} aria-hidden="true" />
                    Retake quiz
                  </button>
                  <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnPrimary}`}>
                    Done
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.review} aria-label="Question review">
              <div className={styles.reviewHead}>
                <h3 className={styles.reviewTitle}>Question review</h3>
                <div className={styles.filters} role="group" aria-label="Filter questions">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`${styles.filterChip} ${reviewFilter === f.key ? styles.filterActive : ""}`}
                      aria-pressed={reviewFilter === f.key}
                      onClick={() => setReviewFilter(f.key)}
                    >
                      {f.label}
                      <span className={styles.mono}>{filterCounts[f.key]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {reviewItems.length === 0 && <p className={styles.reviewEmpty}>No questions in this view.</p>}

              <div className={styles.reviewList}>
                {reviewItems.map(({ question: rq, idx }) => {
                  const ans = selectedAnswers[idx];
                  const status = statusOf(idx);
                  return (
                    <article
                      key={idx}
                      className={`${styles.reviewCard} ${status === "correct" ? styles.reviewCorrect : status === "wrong" ? styles.reviewWrong : styles.reviewSkipped}`}
                    >
                      <div className={styles.reviewCardHead}>
                        <span className={styles.reviewNum}>Q{idx + 1}</span>
                        <div className={styles.reviewBadges}>
                          {marked.has(idx) && (
                            <span className={`${styles.badge} ${styles.badgeMarked}`}>
                              <Flag size={12} aria-hidden="true" />
                              Marked
                            </span>
                          )}
                          {status === "correct" ? (
                            <span className={`${styles.badge} ${styles.badgeCorrect}`}><Check size={13} aria-hidden="true" />Correct</span>
                          ) : status === "wrong" ? (
                            <span className={`${styles.badge} ${styles.badgeWrong}`}><X size={13} aria-hidden="true" />Wrong</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSkipped}`}>Skipped</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.reviewQuestion}>
                        <MathText text={rq.question} />
                      </div>

                      <div className={styles.reviewOptions}>
                        {rq.options.map((opt) => {
                          const isCorrect = opt.id === rq.correctAnswer;
                          const isMine = ans === opt.id;
                          const optClass = isCorrect ? styles.optCorrect : isMine ? styles.optWrong : styles.optMuted;
                          return (
                            <div key={opt.id} className={`${styles.option} ${styles.optSubmitted} ${optClass}`}>
                              <span className={styles.optKey}>{opt.id}</span>
                              <span className={styles.optText}>
                                <MathText text={opt.text} />
                              </span>
                              {isCorrect && (
                                <span className={styles.optTag}>
                                  <Check size={14} aria-hidden="true" />
                                  {isMine ? "Your answer · Correct" : "Correct answer"}
                                </span>
                              )}
                              {isMine && !isCorrect && (
                                <span className={styles.optTag}>
                                  <X size={14} aria-hidden="true" />
                                  Your answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {(rq.explanations[rq.correctAnswer] || (ans && ans !== rq.correctAnswer && rq.explanations[ans])) && (
                        <div className={styles.explain}>
                          <h4 className={styles.explainTitle}>
                            <Lightbulb size={16} aria-hidden="true" />
                            <span>Explanation</span>
                          </h4>
                          <div className={styles.explainList}>
                            {ans && ans !== rq.correctAnswer && rq.explanations[ans] && (
                              <div className={styles.explainRow}>
                                <span className={`${styles.explainTag} ${styles.tagWrong}`}>Option {ans}</span>
                                <div className={styles.explainBody}>
                                  <strong>Why your answer was wrong: </strong>
                                  {rq.explanations[ans]}
                                </div>
                              </div>
                            )}
                            {rq.explanations[rq.correctAnswer] && (
                              <div className={styles.explainRow}>
                                <span className={`${styles.explainTag} ${styles.tagCorrect}`}>Option {rq.correctAnswer}</span>
                                <div className={styles.explainBody}>
                                  <strong>Correct answer: </strong>
                                  {rq.explanations[rq.correctAnswer]}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
