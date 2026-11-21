"use client";

// Practice drill for a topic. Questions come from POST /api/quiz/generate (AI-written and/or
// the authored bank, focused on the student's weak concepts); answers are graded on the server
// via POST /api/quiz/attempts (kind "topic_drill") and reviewed with explanations.

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
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

  const modal = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Practice drill: ${topicTitle}`}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Practice Drill · {topicTitle}</h2>
            <p className={styles.modalSubtitle}>
              {sourceLabel}
              {focus.length > 0 && ` · focused on ${focus.slice(0, 2).join(", ")}`}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Preparing questions for you…</p>
            </div>
          )}

          {!loading && error && !results && <p className={styles.resultsText}>{error}</p>}

          {!loading && !results && q && (
            <>
              <div className={styles.questionHeader}>
                Question {current + 1} of {questions.length}
                {q.concept ? ` · ${q.concept}` : ""}
              </div>
              <p className={styles.questionText}><MathText text={q.question} /></p>
              <div className={styles.optionsGrid}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.optionBtn} ${answers[current] === i ? styles.optionSelected : ""}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current]: i }))}
                  >
                    <strong>{LETTERS[i]}.</strong> <MathText text={opt} />
                  </button>
                ))}
              </div>
            </>
          )}

          {results && (
            <div className={styles.resultsState}>
              <div className={styles.resultsScore}>{results.correct} / {results.total}</div>
              <p className={styles.resultsText}>
                Review each question below. Practice drills count towards your study time and concept accuracy.
              </p>
              {questions.map((question, i) => {
                const r = results.responses[i];
                return (
                  <div key={question.id} className={styles.feedbackBox} style={{ textAlign: "left", marginTop: 12 }}>
                    <p className={styles.questionText} style={{ fontSize: 14 }}>
                      {i + 1}. <MathText text={question.question} />
                    </p>
                    {question.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`${styles.optionBtn} ${oi === r?.correctOption ? styles.optionCorrect : oi === r?.selectedOption ? styles.optionIncorrect : ""}`}
                        style={{ cursor: "default", marginTop: 6 }}
                      >
                        <strong>{LETTERS[oi]}.</strong> <MathText text={opt} />
                        {oi === r?.correctOption && " ✓"}
                        {oi === r?.selectedOption && oi !== r?.correctOption && " (your answer)"}
                      </div>
                    ))}
                    {r?.selectedOption === null && <p style={{ fontSize: 13, color: "#64748B" }}>Not answered.</p>}
                    {r?.explanation && (
                      <p style={{ fontSize: 13, color: "#334155", marginTop: 8 }}>
                        <strong>Explanation:</strong> <MathText text={r.explanation} />
                      </p>
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
              <button type="button" className={styles.btnPrimary} disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
                Previous
              </button>
              {current < questions.length - 1 ? (
                <button type="button" className={styles.btnPrimary} onClick={() => setCurrent((c) => c + 1)}>Next</button>
              ) : (
                <button type="button" className={styles.btnPrimary} disabled={submitting} onClick={submit}>
                  {submitting ? "Grading…" : `Submit (${answeredCount}/${questions.length} answered)`}
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
