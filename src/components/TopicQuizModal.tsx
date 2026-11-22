"use client";

// Practice drill for a topic. Questions come from POST /api/quiz/generate (AI-written and/or
// the authored bank, focused on the student's weak concepts); answers are graded on the server
// via POST /api/quiz/attempts (kind "topic_drill") and reviewed with explanations.

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
import { ArrowLeft, ArrowRight, BookOpen, Check, Lightbulb, Sparkles, X } from "lucide-react";
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

  // Display-only breakdown of the server-graded result
  const wrongCount = results ? results.responses.filter((r) => r && !r.isCorrect && r.selectedOption !== null).length : 0;
  const skippedCount = results ? Math.max(0, results.total - results.correct - wrongCount) : 0;
  const pct = (n: number) => (results && results.total > 0 ? `${(n / results.total) * 100}%` : "0%");
  const accuracy = results && results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;

  const modal = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Practice drill: ${topicTitle}`}>
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
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Preparing questions for you…</p>
            </div>
          )}

          {!loading && error && !results && <p className={styles.errorText}>{error}</p>}

          {!loading && !results && q && (
            <>
              <div className={styles.questionHeader}>
                <span className={styles.qNumber}>
                  Question <span className={styles.mono}>{current + 1}</span> of <span className={styles.mono}>{questions.length}</span>
                </span>
                {q.concept && <span className={styles.conceptChip}>{q.concept}</span>}
              </div>
              <div className={styles.progress} aria-hidden="true">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.progressSeg} ${i === current ? styles.progressCurrent : answers[i] !== undefined ? styles.progressDone : ""}`}
                  />
                ))}
              </div>
              <div className={styles.questionText}><MathText text={q.question} /></div>
              <div className={styles.optionsGrid}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.optionBtn} ${answers[current] === i ? styles.optionSelected : ""}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current]: i }))}
                  >
                    <span className={styles.optionKey}>{LETTERS[i]}</span>
                    <span className={styles.optionText}><MathText text={opt} /></span>
                  </button>
                ))}
              </div>
            </>
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
                </div>
                <div className={styles.statStack}>
                  <div className={`glass-card ${styles.statCard}`} data-tint="teal">
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>Accuracy</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="coral">
                    <span className={styles.statValue}>{wrongCount}</span>
                    <span className={styles.statLabel}>Wrong</span>
                  </div>
                  <div className={`glass-card ${styles.statCard}`} data-tint="violet">
                    <span className={styles.statValue}>{skippedCount}</span>
                    <span className={styles.statLabel}>Not answered</span>
                  </div>
                </div>
              </div>
              <p className={styles.resultsText}>
                Review each question below. Practice drills count towards your study time and concept accuracy.
              </p>
              {questions.map((question, i) => {
                const r = results.responses[i];
                return (
                  <div key={question.id} className={`${styles.feedbackBox} ${r?.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                    <div className={styles.feedbackHead}>
                      <span className={styles.feedbackNum}>Q{i + 1}</span>
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

        <div className={styles.modalFooter}>
          {!results && !loading && questions.length > 0 && (
            <>
              <button type="button" className={styles.btnSecondary} disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                Previous
              </button>
              {current < questions.length - 1 ? (
                <button type="button" className={styles.btnPrimary} onClick={() => setCurrent((c) => c + 1)}>
                  Next
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={styles.btnPrimary} disabled={submitting} onClick={submit}>
                  {submitting ? "Grading…" : (
                    <>
                      Submit <span className={styles.mono}>({answeredCount}/{questions.length} answered)</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
          {(results || (!loading && questions.length === 0)) && (
            <button type="button" className={styles.btnPrimary} onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
