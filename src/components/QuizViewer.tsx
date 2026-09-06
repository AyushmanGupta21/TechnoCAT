"use client";

import React, { useState, useEffect } from "react";
import { QuizQuestion } from "@/data/videoPortions";

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
  onSubmitQuiz?: (score: number, total: number) => void;
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
    if (onSubmitQuiz) onSubmitQuiz(calculatedScore, questions.length);
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
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15, 23, 42, 0.8)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ background: "#fff", padding: "30px", borderRadius: "16px", textAlign: "center" }}>
          <h3>No quiz questions available for this lesson.</h3>
          <button onClick={onClose} style={{ marginTop: "15px", padding: "10px 20px", background: "#ED1C24", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const userAns = selectedAnswers[currentIdx];
  const isCurrentQuestionCorrect = userAns === q.correctAnswer;

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseAlert {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .quiz-animate-question {
          animation: slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .quiz-opt-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .quiz-opt-card:hover:not(.submitted) {
          border-color: #ED1C24 !important;
          background-color: #fff9f9 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(237, 28, 36, 0.08);
        }
        .quiz-nav-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }
        .quiz-nav-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        @media (max-width: 820px) {
          .quiz-top-header {
            padding: 12px 16px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .quiz-main-layout {
            flex-direction: column !important;
          }
          .quiz-sidebar {
            width: 100% !important;
            max-height: 180px !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 14px 16px !important;
          }
          .quiz-question-area {
            padding: 20px 16px !important;
          }
        }
      `}</style>

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(248, 250, 252, 0.98)",
        zIndex: 99999, display: "flex", flexDirection: "column",
        backdropFilter: "blur(12px)",
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      }}>
        {/* Top Header */}
        <div className="quiz-top-header" style={{
          padding: "16px 36px", backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                backgroundColor: isSubmitted ? "#1e293b" : "#fff",
                color: isSubmitted ? "#fff" : "#ef4444",
                border: isSubmitted ? "none" : "1.5px solid #ef4444",
                borderRadius: "10px", cursor: "pointer",
                fontWeight: "700", fontSize: "14px",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {isSubmitted ? "Close Results" : "Exit Quiz"}
            </button>

            <div>
              <h2 style={{ color: "#0f172a", fontSize: "1.2rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🎯 {title}</span>
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "2px 0 0 0", fontWeight: "500" }}>
                Interactive TechnoEEE Practice • {questions.length} High-Yield CAT Questions
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {!isSubmitted && (
              <div style={{
                color: timeLeft < 60 ? "#ef4444" : "#0f172a",
                fontSize: "1.15rem", fontWeight: "700",
                backgroundColor: timeLeft < 60 ? "#fef2f2" : "#f1f5f9",
                padding: "8px 18px", borderRadius: "10px",
                display: "flex", alignItems: "center", gap: "8px",
                animation: timeLeft < 60 ? "pulseAlert 1.5s infinite" : "none",
                border: timeLeft < 60 ? "1px solid #fca5a5" : "1px solid #e2e8f0"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={timeLeft < 60 ? "#ef4444" : "#64748b"} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(timeLeft)}
              </div>
            )}

            {!isSubmitted && (
              <button
                onClick={handleSubmit}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white", border: "none", borderRadius: "10px",
                  cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                  transition: "transform 0.15s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Submit Quiz ✓
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="quiz-main-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <div className="quiz-sidebar" style={{
            width: "310px", backgroundColor: "#ffffff",
            borderRight: "1px solid #e2e8f0", overflowY: "auto", padding: "26px",
            boxShadow: "4px 0 20px rgba(0,0,0,0.02)",
            display: "flex", flexDirection: "column"
          }}>
            <h3 style={{
              color: "#475569", fontSize: "0.8rem", fontWeight: "800",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: "18px",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <span>Question Palette ({Object.keys(selectedAnswers).length}/{questions.length})</span>
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;

                let bg = "#ffffff";
                let border = "1px solid #cbd5e1";
                let color = "#64748b";

                if (isSubmitted) {
                  const ans = selectedAnswers[idx];
                  const isCorrect = ans === questions[idx].correctAnswer;
                  bg = isCorrect ? "#ecfdf5" : "#fef2f2";
                  border = isCorrect ? "2px solid #10b981" : "2px solid #ef4444";
                  color = isCorrect ? "#059669" : "#dc2626";
                } else if (isCurrent) {
                  bg = "#ED1C24"; color = "white"; border = "2px solid #ED1C24";
                } else if (isAnswered) {
                  bg = "#fee2e2"; color = "#b91c1c"; border = "2px solid #fca5a5";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      aspectRatio: "1", borderRadius: "10px", border, backgroundColor: bg, color,
                      fontWeight: "800", cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem",
                      boxShadow: isCurrent ? "0 4px 12px rgba(237, 28, 36, 0.3)" : "none"
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div style={{
                marginTop: "30px", padding: "24px", backgroundColor: "#f8fafc",
                borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.03)"
              }}>
                <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Your CAT Score
                </div>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: "#0f172a", margin: "10px 0" }}>
                  {score} <span style={{ fontSize: "1.3rem", color: "#94a3b8" }}>/ {questions.length}</span>
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "20px",
                  backgroundColor: score / questions.length >= 0.8 ? "#ecfdf5" : score / questions.length >= 0.5 ? "#eff6ff" : "#fef2f2",
                  color: score / questions.length >= 0.8 ? "#059669" : score / questions.length >= 0.5 ? "#2563eb" : "#dc2626",
                  fontWeight: "700", fontSize: "0.85rem", marginBottom: "16px"
                }}>
                  {score / questions.length >= 0.8 ? "🎉 99+ Percentile Ready!" : score / questions.length >= 0.5 ? "👍 Good Effort! Revise Traps" : "⚠️ Needs Revision"}
                </div>

                <button
                  type="button"
                  onClick={handleRetake}
                  style={{
                    width: "100%", padding: "10px",
                    backgroundColor: "#1e293b", color: "#fff",
                    border: "none", borderRadius: "10px",
                    fontWeight: "700", fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  ↺ Retake Quiz
                </button>
              </div>
            )}
          </div>

          {/* Question Area */}
          <div className="quiz-question-area" style={{ flex: 1, overflowY: "auto", padding: "36px 50px", position: "relative" }}>
            <div className={isAnimating ? "quiz-animate-question" : ""} style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{
                  backgroundColor: "#fee2e2", color: "#b91c1c", padding: "5px 12px",
                  borderRadius: "16px", fontWeight: "800", fontSize: "0.85rem"
                }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
                  CAT Quantitative Practice
                </span>
              </div>

              <h1 style={{ color: "#0f172a", fontSize: "1.6rem", fontWeight: "800", lineHeight: "1.4", marginBottom: "32px" }}>
                {q.question}
              </h1>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {q.options.map((opt) => {
                  const isSelected = userAns === opt.id;
                  let bg = "#ffffff";
                  let border = "2px solid #e2e8f0";
                  let textColor = "#334155";
                  let shadow = "0 2px 6px rgba(0,0,0,0.02)";
                  let icon: React.ReactNode = null;

                  if (!isSubmitted && isSelected) {
                    bg = "#fff1f2";
                    border = "2px solid #ED1C24";
                    textColor = "#991b1b";
                    shadow = "0 4px 14px rgba(237, 28, 36, 0.12)";
                  }

                  if (isSubmitted) {
                    const isCorrect = opt.id === q.correctAnswer;
                    if (isCorrect) {
                      bg = "#ecfdf5";
                      border = "2px solid #10b981";
                      textColor = "#064e3b";
                      icon = (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ marginLeft: "auto" }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      );
                    } else if (isSelected && !isCorrect) {
                      bg = "#fef2f2";
                      border = "2px solid #ef4444";
                      textColor = "#7f1d1d";
                      icon = (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" style={{ marginLeft: "auto" }}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      );
                    } else {
                      bg = "#f8fafc";
                      border = "2px solid #e2e8f0";
                      textColor = "#94a3b8";
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`quiz-opt-card ${isSubmitted ? "submitted" : ""}`}
                      onClick={() => handleOptionSelect(opt.id)}
                      style={{
                        padding: "20px 24px", borderRadius: "14px", border, backgroundColor: bg,
                        cursor: isSubmitted ? "default" : "pointer",
                        display: "flex", gap: "18px", alignItems: "center",
                        boxShadow: shadow
                      }}
                    >
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "8px",
                        backgroundColor: isSelected
                          ? isSubmitted && opt.id !== q.correctAnswer
                            ? "#ef4444"
                            : "#ED1C24"
                          : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        fontWeight: "800", color: isSelected ? "white" : "#64748b", fontSize: "0.95rem",
                        transition: "all 0.15s"
                      }}>
                        {opt.id}
                      </div>

                      <div style={{ color: textColor, fontSize: "1.1rem", lineHeight: "1.5", fontWeight: "500" }}>
                        {opt.text}
                      </div>

                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Review & Explanations */}
              {isSubmitted && (
                <div style={{
                  marginTop: "40px", padding: "28px", backgroundColor: "#fffbeb",
                  borderRadius: "16px", border: "1px solid #fde68a",
                  boxShadow: "0 6px 20px rgba(245, 158, 11, 0.06)",
                  animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                  <h4 style={{
                    color: "#b45309", margin: "0 0 18px 0", fontSize: "1.05rem",
                    fontWeight: "800", display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <span>💡 Concept Review & Explanations</span>
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {!isCurrentQuestionCorrect && userAns && q.explanations[userAns] && (
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{
                          backgroundColor: "#fef2f2", color: "#dc2626", padding: "4px 10px",
                          borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700",
                          flexShrink: 0, border: "1px solid #fca5a5"
                        }}>
                          Option {userAns}
                        </div>
                        <div style={{ color: "#7f1d1d", lineHeight: "1.6", fontSize: "0.95rem" }}>
                          <strong style={{ color: "#991b1b" }}>Why your answer was incorrect: </strong>
                          {q.explanations[userAns]}
                        </div>
                      </div>
                    )}

                    {q.explanations[q.correctAnswer] && (
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{
                          backgroundColor: "#ecfdf5", color: "#059669", padding: "4px 10px",
                          borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700",
                          flexShrink: 0, border: "1px solid #6ee7b7"
                        }}>
                          Option {q.correctAnswer}
                        </div>
                        <div style={{ color: "#064e3b", lineHeight: "1.6", fontSize: "0.95rem" }}>
                          <strong style={{ color: "#065f46" }}>Correct Answer Explanation: </strong>
                          {q.explanations[q.correctAnswer]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px", paddingBottom: "30px" }}>
                <button
                  className="quiz-nav-btn"
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px", backgroundColor: "#e2e8f0", color: "#475569",
                    border: "none", borderRadius: "12px",
                    cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                    opacity: currentIdx === 0 ? 0.4 : 1, fontWeight: "700", fontSize: "0.95rem",
                    transition: "all 0.15s"
                  }}
                >
                  ← Previous
                </button>

                <button
                  className="quiz-nav-btn"
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIdx === questions.length - 1}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px", backgroundColor: "#ED1C24", color: "white",
                    border: "none", borderRadius: "12px",
                    cursor: currentIdx === questions.length - 1 ? "not-allowed" : "pointer",
                    opacity: currentIdx === questions.length - 1 ? 0.4 : 1, fontWeight: "700", fontSize: "0.95rem",
                    boxShadow: currentIdx === questions.length - 1 ? "none" : "0 6px 18px rgba(237, 28, 36, 0.3)",
                    transition: "all 0.15s"
                  }}
                >
                  Next →
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
