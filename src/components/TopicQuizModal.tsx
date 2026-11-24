"use client";

// Practice drill for a topic. Questions come from POST /api/quiz/generate (AI-written and/or
// the authored bank, focused on the student's weak concepts); answers are graded on the server
// via POST /api/quiz/attempts (kind "topic_drill") and reviewed with explanations.
// Presentation follows the shared exam interface: Classic (CBT-like) or Modern (TechnoCAT), switchable
// at any time without touching answers or progress. The results screen uses one (Modern) design.

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
import ExamModeToggle from "@/components/exam/ExamModeToggle";
import { useExamMode } from "@/lib/examMode";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eraser, Flag, Lightbulb, Send, Sparkles, X } from "lucide-react";
import styles from "./TopicQuizModal.module.css";

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  concept: string | null;
}

interface GradedResponse {
  questionId: string;
  selectedOption: number | null;
  correctOption: number | null;
  isCorrect: boolean;
  explanation: string | null;
}

interface TopicQuizModalProps {
  topicId: string;
  topicTitle: string;
  onClose: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

type PaletteState = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";
type ReviewFilter = "all" | "correct" | "wrong" | "skipped" | "marked";

const PALETTE_LABEL: Record<PaletteState, string> = {
  notVisited: "Not visited",
  notAnswered: "Not answered",
  answered: "Answered",
  marked: "Marked for review",
  answeredMarked: "Answered & marked for review",
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function TopicQuizModal({ topicId, topicTitle, onClose }: TopicQuizModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [source, setSource] = useState<"ai" | "bank" | "mixed">("bank");
  const [focus, setFocus] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number; responses: GradedResponse[] } | null>(null);

  // Presentation-only state: interface mode, palette (visited / marked) and the review filter.
  const [mode] = useExamMode();
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, count: 5 }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Could not create a practice quiz.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.questions || []);
        setSource(data.source || "bank");
        setFocus(data.focus || []);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [topicId]);

  useEffect(() => {
    setVisited((prev) => (prev.has(current) ? prev : new Set(prev).add(current)));
  }, [current]);

  useEffect(() => {
    if (results && finishedAt === null) setFinishedAt(Date.now());
  }, [results, finishedAt]);

  if (!mounted) return null;

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "topic_drill",
          topicId,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          responses: questions.map((question, i) => ({ questionId: question.id, selectedOption: answers[i] ?? null })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Your answers could not be graded.");
      setResults({ correct: data.attempt.correctCount, total: data.attempt.questionCount, responses: data.attempt.responses });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const sourceLabel =
    source === "ai" ? "AI-generated practice" : source === "mixed" ? "AI-generated + question bank" : "From the TechnoCAT question bank";

  // ---- Palette (display only) ----
  const paletteState = (i: number): PaletteState => {
    const isAnswered = answers[i] !== undefined;
    const isMarked = marked.has(i);
    if (isAnswered && isMarked) return "answeredMarked";
    if (isMarked) return "marked";
    if (isAnswered) return "answered";
    if (visited.has(i)) return "notAnswered";
    return "notVisited";
  };
  const paletteCounts = questions.reduce<Record<PaletteState, number>>(
    (acc, _q, i) => {
      acc[paletteState(i)] += 1;
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

  const isLast = current === questions.length - 1;
  const isCurrentMarked = marked.has(current);
  const clearResponse = () =>
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
  const markAndNext = () => {
    const wasMarked = marked.has(current);
    setMarked((prev) => {
      const next = new Set(prev);
      if (wasMarked) next.delete(current);
      else next.add(current);
      return next;
    });
    if (!wasMarked && !isLast) setCurrent((c) => c + 1);
  };

  // Display-only breakdown of the server-graded result
  const wrongCount = results ? results.responses.filter((r) => r && !r.isCorrect && r.selectedOption !== null).length : 0;
  const skippedCount = results ? Math.max(0, results.total - results.correct - wrongCount) : 0;
  const attemptedCount = results ? results.correct + wrongCount : 0;
  const pct = (n: number) => (results && results.total > 0 ? `${(n / results.total) * 100}%` : "0%");
  const accuracy = results && results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
  const timeTaken = finishedAt !== null ? Math.max(0, Math.round((finishedAt - startedAt) / 1000)) : null;

  const reviewStatus = (i: number): "correct" | "wrong" | "skipped" => {
    const r = results?.responses[i];
    if (r?.isCorrect) return "correct";
    if (!r || r.selectedOption === null) return "skipped";
    return "wrong";
  };
  const filterCounts: Record<ReviewFilter, number> = {
    all: questions.length,
    correct: questions.filter((_q, i) => reviewStatus(i) === "correct").length,
    wrong: questions.filter((_q, i) => reviewStatus(i) === "wrong").length,
    skipped: questions.filter((_q, i) => reviewStatus(i) === "skipped").length,
    marked: questions.filter((_q, i) => marked.has(i)).length,
  };
  const FILTERS: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "wrong", label: "Wrong" },
    { key: "skipped", label: "Not answered" },
    { key: "correct", label: "Correct" },
    ...(filterCounts.marked > 0 ? [{ key: "marked" as const, label: "Marked" }] : []),
  ];
  const reviewItems = questions
    .map((question, i) => ({ question, i }))
    .filter(({ i }) => {
      if (reviewFilter === "all") return true;
      if (reviewFilter === "marked") return marked.has(i);
      return reviewStatus(i) === reviewFilter;
    });

  const inQuiz = !loading && !results && questions.length > 0;
  const classic = mode === "classic" && !results;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const modal = (
    <div className={`${styles.modalOverlay} ${classic ? styles.classic : styles.modern}`} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Practice drill: ${topicTitle}`}>
        {/* ---------- Header ---------- */}
        <div className={styles.modalHeader}>
          <div className={styles.headerText}>
            <span className={styles.kicker}>
              {source === "bank" ? <BookOpen size={14} aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
              {sourceLabel}
            </span>
            <h2 className={styles.modalTitle}>Practice drill · {topicTitle}</h2>
            {focus.length > 0 && (
              <p className={styles.modalSubtitle}>Focused on {focus.slice(0, 2).join(", ")}</p>
            )}
          </div>
          <div className={styles.headerActions}>
            {!results && <ExamModeToggle tone={classic ? "dark" : "light"} className={styles.modeToggle} />}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ---------- Status + palette strip ---------- */}
        {inQuiz && (
          <div className={styles.statusBar}>
            {!classic && (
              <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
            )}
            <div className={styles.statusRow}>
              <span className={styles.qCount}>
                Question <span className={styles.mono}>{current + 1}</span> of <span className={styles.mono}>{questions.length}</span>
              </span>
              <div className={styles.palette} role="group" aria-label="Question palette">
                {questions.map((_, i) => {
                  const state = paletteState(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.palBtn} ${PAL_CLASS[state]} ${i === current ? styles.palCurrent : ""}`}
                      onClick={() => setCurrent(i)}
                      aria-current={i === current ? "true" : undefined}
                      aria-label={`Question ${i + 1}: ${PALETTE_LABEL[state]}`}
                    >
                      <span className={styles.mono}>{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <ul className={styles.legend} aria-label="Palette legend">
              {(Object.keys(PALETTE_LABEL) as PaletteState[]).map((s) => (
                <li key={s}>
                  <span className={`${styles.legendSwatch} ${PAL_CLASS[s]}`} aria-hidden="true" />
                  {s === "answeredMarked" ? "Answered & marked" : s === "marked" ? "Marked" : PALETTE_LABEL[s]}
                  <b className={styles.mono}>{paletteCounts[s]}</b>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---------- Body ---------- */}
        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Preparing questions for you…</p>
            </div>
          )}

          {!loading && error && !results && <p className={styles.errorText}>{error}</p>}

          {!loading && !error && !results && questions.length === 0 && (
            <p className={styles.emptyText}>No practice questions are available for this topic yet.</p>
          )}

          {inQuiz && q && (
            <section className={styles.questionPanel} aria-label={`Question ${current + 1}`}>
              <div className={styles.questionHeader}>
                <span className={styles.qNumber}>
                  Question No. <span className={styles.mono}>{current + 1}</span>
                </span>
                {q.concept && <span className={styles.conceptChip}>{q.concept}</span>}
                {isCurrentMarked && (
                  <span className={styles.markedChip}>
                    <Flag size={12} aria-hidden="true" />
                    Marked for review
                  </span>
                )}
              </div>
              <div className={styles.questionText}><MathText text={q.question} /></div>
              <div className={styles.optionsGrid}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.optionBtn} ${answers[current] === i ? styles.optionSelected : ""}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current]: i }))}
                    aria-pressed={answers[current] === i}
                  >
                    <span className={styles.optionKey}>{LETTERS[i]}</span>
                    <span className={styles.optionText}><MathText text={opt} /></span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {results && (
            <div className={styles.resultsState}>
              <div className={styles.resultsTop}>
                <div className={styles.scoreCard}>
                  <span className={styles.scoreLabel}>Score</span>
                  <div className={styles.resultsScore}>
                    {results.correct}
                    <span className={styles.scoreTotal}>/ {results.total}</span>
                  </div>
                  <div className={styles.accBar} role="img" aria-label={`${results.correct} correct, ${wrongCount} wrong, ${skippedCount} not answered`}>
                    <span className={styles.accCorrect} style={{ width: pct(results.correct) }} />
                    <span className={styles.accWrong} style={{ width: pct(wrongCount) }} />
                    <span className={styles.accSkipped} style={{ width: pct(skippedCount) }} />
                  </div>
                  <div className={styles.accKey}>
                    <span><i className={styles.keyCorrect} />{results.correct} correct</span>
                    <span><i className={styles.keyWrong} />{wrongCount} wrong</span>
                    <span><i className={styles.keySkipped} />{skippedCount} not answered</span>
                  </div>
                </div>
                <div className={styles.statGrid}>
                  <div className={`glass-card ${styles.statCard}`} data-tint="teal">
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>Accuracy</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="blue">
                    <span className={styles.statValue}>{attemptedCount}/{results.total}</span>
                    <span className={styles.statLabel}>Attempted</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="coral">
                    <span className={styles.statValue}>{wrongCount}</span>
                    <span className={styles.statLabel}>Wrong</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="violet">
                    <span className={styles.statValue}>{timeTaken !== null ? formatDuration(timeTaken) : "–"}</span>
                    <span className={styles.statLabel}>Time</span>
                  </div>
                </div>
              </div>

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
              <p className={styles.resultsText}>
                Practice drills count towards your study time and concept accuracy.
              </p>

              {reviewItems.length === 0 && <p className={styles.emptyText}>No questions in this view.</p>}

              {reviewItems.map(({ question, i }) => {
                const r = results.responses[i];
                return (
                  <div key={question.id} className={`${styles.feedbackBox} ${r?.isCorrect ? styles.feedbackCorrect : r?.selectedOption === null ? styles.feedbackSkipped : styles.feedbackWrong}`}>
                    <div className={styles.feedbackHead}>
                      <span className={styles.feedbackNum}>
                        Q{i + 1}
                        {question.concept && <span className={styles.feedbackConcept}>{question.concept}</span>}
                      </span>
                      {r?.isCorrect ? (
                        <span className={`${styles.mark} ${styles.markCorrect}`}><Check size={13} aria-hidden="true" />Correct</span>
                      ) : r?.selectedOption === null ? (
                        <span className={`${styles.mark} ${styles.markSkipped}`}>Not answered</span>
                      ) : (
                        <span className={`${styles.mark} ${styles.markWrong}`}><X size={13} aria-hidden="true" />Wrong</span>
                      )}
                    </div>
                    <div className={styles.reviewQuestion}>
                      <MathText text={question.question} />
                    </div>
                    {question.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`${styles.optionBtn} ${styles.optionStatic} ${oi === r?.correctOption ? styles.optionCorrect : oi === r?.selectedOption ? styles.optionIncorrect : ""}`}
                      >
                        <span className={styles.optionKey}>{LETTERS[oi]}</span>
                        <span className={styles.optionText}><MathText text={opt} /></span>
                        {oi === r?.correctOption && <Check size={16} className={styles.optionMark} aria-label="Correct answer" />}
                        {oi === r?.selectedOption && oi !== r?.correctOption && (
                          <span className={styles.yourAnswer}><X size={14} aria-hidden="true" />Your answer</span>
                        )}
                      </div>
                    ))}
                    {r?.explanation && (
                      <div className={styles.explanation}>
                        <Lightbulb size={15} aria-hidden="true" />
                        <div>
                          <strong>Explanation: </strong><MathText text={r.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- Bottom action bar ---------- */}
        <div className={styles.modalFooter}>
          {inQuiz && (
            <div className={styles.actionBar}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost} ${styles.actPrev}`}
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary} ${styles.actClear}`}
                disabled={answers[current] === undefined}
                onClick={clearResponse}
              >
                <Eraser size={15} aria-hidden="true" />
                <span>Clear response</span>
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnMark} ${styles.actMark} ${isCurrentMarked ? styles.btnMarkOn : ""}`}
                onClick={markAndNext}
                aria-pressed={isCurrentMarked}
              >
                <Flag size={15} aria-hidden="true" />
                <span>{isCurrentMarked ? "Unmark" : isLast ? "Mark for review" : "Mark for review & next"}</span>
              </button>
              {!isLast ? (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.actNext}`} onClick={() => setCurrent((c) => c + 1)}>
                  <span>Save &amp; next</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.actNext}`} disabled={submitting} onClick={submit}>
                  {submitting ? "Grading…" : (
                    <>
                      <Send size={15} aria-hidden="true" />
                      <span>Submit</span>
                      <span className={styles.mono}>({answeredCount}/{questions.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {(results || (!loading && questions.length === 0)) && (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.closeAction}`} onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
