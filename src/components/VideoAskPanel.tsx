"use client";

import React, { useState, useRef, useEffect } from "react";
import { QuizQuestion } from "@/data/videoPortions";
import styles from "./VideoAskPanel.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quiz?: {
    title: string;
    questions: QuizQuestion[];
  };
}

interface VideoAskPanelProps {
  topicId: string;
  topicTitle: string;
  lessonCode?: string;
  lessonTitle: string;
  lessonCoverage?: string;
  onSeekTo?: (seconds: number) => void;
  onLaunchFullQuiz?: (quiz: { title: string; questions: QuizQuestion[] }) => void;
}

const QUICK_CHIPS = [
  "What topics are covered & at which timestamp?",
  "Create an interactive quiz on this video",
  "Summarize this lecture",
  "Explain key formulas & shortcuts",
];

// Helper to convert mm:ss to seconds
function parseTimestampToSeconds(timeStr: string): number | null {
  const clean = timeStr.replace(/[^\d:]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

// Markdown and clickable timestamp renderer
function FormattedText({
  text,
  onSeekTo,
}: {
  text: string;
  onSeekTo?: (seconds: number) => void;
}) {
  if (!text) return null;

  // Process text line by line
  const lines = text.split("\n");

  const renderWithTimestamps = (content: string) => {
    // Regex for [⏱ mm:ss] or [⏱ mm:ss - mm:ss] or standalone [⏱ mm:ss]
    const parts = content.split(/(\[⏱\s*[\d:]+(?:\s*-\s*[\d:]+)?\])/g);

    return parts.map((part, i) => {
      const match = part.match(/\[⏱\s*([\d:]+)(?:\s*-\s*([\d:]+))?\]/);
      if (match) {
        const firstTime = match[1];
        const seconds = parseTimestampToSeconds(firstTime);

        return (
          <button
            key={i}
            type="button"
            className={styles.timestampBadge}
            onClick={() => {
              if (seconds !== null && onSeekTo) {
                onSeekTo(seconds);
              }
            }}
            title={`Click to jump video to ${firstTime}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {match[0].replace("[", "").replace("]", "")}
          </button>
        );
      }

      // Render bold spans
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      return boldParts.map((bp, j) =>
        j % 2 === 1 ? <strong key={j}>{bp}</strong> : bp
      );
    });
  };

  return (
    <div style={{ lineHeight: "1.6", fontSize: "13.5px" }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: "6px" }} />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={idx}
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#111827",
                margin: "10px 0 4px",
              }}
            >
              {renderWithTimestamps(trimmed.replace("### ", ""))}
            </h4>
          );
        }

        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const isNum = /^\d+\.\s/.test(trimmed);
        const content = isBullet
          ? trimmed.slice(2)
          : isNum
          ? trimmed.replace(/^\d+\.\s/, "")
          : trimmed;

        if (isBullet || isNum) {
          return (
            <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
              <span style={{ color: "#ED1C24", fontWeight: "700", flexShrink: 0 }}>
                {isNum ? trimmed.match(/^\d+/)?.[0] + "." : "•"}
              </span>
              <span>{renderWithTimestamps(content)}</span>
            </div>
          );
        }

        return (
          <p key={idx} style={{ margin: "0 0 6px 0" }}>
            {renderWithTimestamps(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Interactive Multiple-Choice Quiz Block (TechnoEEE pattern)
function InteractiveQuizBlock({
  quiz,
  onLaunchFullQuiz,
}: {
  quiz: { title: string; questions: QuizQuestion[] };
  onLaunchFullQuiz?: () => void;
}) {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const optionLetters = ["A", "B", "C", "D"];

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (userAnswers[questionIndex] !== undefined) return; // already answered
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const isComplete = answeredCount === quiz.questions.length;
  const score = quiz.questions.filter(
    (q, idx) => userAnswers[idx] === q.answer
  ).length;

  const handleReset = () => {
    setUserAnswers({});
  };

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizHeader}>
        <div className={styles.quizTitle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ED1C24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{quiz.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onLaunchFullQuiz && (
            <button
              type="button"
              onClick={onLaunchFullQuiz}
              title="Launch full-screen TechnoEEE Quiz Viewer"
              style={{
                padding: "3px 8px",
                background: "linear-gradient(135deg, #0D9488, #059669)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>Full Screen ⛶</span>
            </button>
          )}
          <span className={styles.quizQuestionCount}>
            {answeredCount}/{quiz.questions.length} Answered
          </span>
        </div>
      </div>

      <div className={styles.quizBody}>
        {quiz.questions.map((question, qIdx) => {
          const chosenOpt = userAnswers[qIdx];
          const hasAnswered = chosenOpt !== undefined;

          return (
            <div key={qIdx} className={styles.questionItem}>
              <p className={styles.questionText}>
                <span className={styles.questionNumberBadge}>{qIdx + 1}</span>
                <span>{question.q}</span>
              </p>

              <div className={styles.optionsList}>
                {question.options.map((optText, oIdx) => {
                  const isSelected = chosenOpt === oIdx;
                  const isCorrect = question.answer === oIdx;

                  let optClass = styles.optionBtn;
                  let badgeClass = styles.optionLetter;

                  if (hasAnswered) {
                    if (isCorrect) {
                      optClass += ` ${styles.optionCorrect}`;
                      badgeClass += ` ${styles.optionLetterCorrect}`;
                    } else if (isSelected && !isCorrect) {
                      optClass += ` ${styles.optionIncorrect}`;
                      badgeClass += ` ${styles.optionLetterIncorrect}`;
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      className={optClass}
                      onClick={() => handleSelectOption(qIdx, oIdx)}
                      disabled={hasAnswered}
                    >
                      <span className={badgeClass}>
                        {hasAnswered && isCorrect ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : hasAnswered && isSelected && !isCorrect ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        ) : (
                          optionLetters[oIdx]
                        )}
                      </span>
                      <span>{optText}</span>
                    </button>
                  );
                })}
              </div>

              {hasAnswered && question.explanation && (
                <div className={styles.explanationBox}>
                  <strong>💡 Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className={styles.scoreBanner}>
          <div className={styles.scoreText}>
            🎉 Quiz Completed! You scored <strong>{score}</strong> / {quiz.questions.length} ({Math.round((score / quiz.questions.length) * 100)}%)
          </div>
          <button
            type="button"
            className={styles.retakeBtn}
            onClick={handleReset}
          >
            Retake Quiz ↺
          </button>
        </div>
      )}
    </div>
  );
}

export default function VideoAskPanel({
  topicId,
  topicTitle,
  lessonCode,
  lessonTitle,
  lessonCoverage,
  onSeekTo,
  onLaunchFullQuiz,
}: VideoAskPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! 👋 I am your **TechnoCAT AI Tutor** for **${lessonTitle}**.\n\nYou can ask me:\n- ⏱️ **"What topics are covered at which timestamp?"** to get an exact portion breakdown.\n- 🎯 **"Create an interactive quiz on this video"** to practice with instant grading.\n- 💡 Any concept, formula derivation, or CAT shortcut!`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1 && chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: queryText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText,
          topicId,
          topicTitle,
          lessonCode,
          lessonTitle,
          lessonCoverage,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const aiContent =
        data.answer || data.reply || "I am analyzing your question. Please try asking again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiContent,
          quiz: data.quiz || undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered a temporary connection issue. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panelWrapper}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.aiIconBadge}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <line x1="2" y1="14" x2="4" y2="14" />
              <line x1="20" y1="14" x2="22" y2="14" />
              <line x1="15" y1="13" x2="15" y2="13" />
              <line x1="9" y1="13" x2="9" y2="13" />
            </svg>
          </div>
          <div>
            <h3 className={styles.headerTitle}>Ask AI Tutor (Video RAG & Quiz)</h3>
            <p className={styles.headerSubtitle}>
              Grounded in {lessonCode ? `${lessonCode}: ` : ""}{lessonTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Chat cleared. Ask anything about **${lessonTitle}**, request timestamps, or test yourself with an interactive quiz!`,
              },
            ])
          }
          className={styles.clearChatBtn}
        >
          Clear Chat
        </button>
      </div>

      {/* Quick Action Chips */}
      <div className={styles.chipsRow}>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className={styles.chipBtn}
            onClick={() => handleSend(chip)}
            disabled={loading}
          >
            {chip.includes("quiz") ? "🎯 " : chip.includes("timestamp") ? "⏱️ " : "💡 "}
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div ref={chatStreamRef} className={styles.messagesStream}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${
              msg.role === "user" ? styles.messageRowUser : ""
            }`}
          >
            <div
              className={`${styles.avatarCircle} ${
                msg.role === "user" ? styles.avatarCircleUser : ""
              }`}
            >
              {msg.role === "user" ? "You" : "AI"}
            </div>

            <div
              className={`${styles.bubble} ${
                msg.role === "user" ? styles.bubbleUser : styles.bubbleAi
              }`}
            >
              <FormattedText text={msg.content} onSeekTo={onSeekTo} />

              {/* Render Interactive Quiz Block if present */}
              {msg.quiz && (
                <InteractiveQuizBlock
                  quiz={msg.quiz}
                  onLaunchFullQuiz={
                    onLaunchFullQuiz
                      ? () => onLaunchFullQuiz(msg.quiz!)
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.messageRow}>
            <div className={styles.avatarCircle}>AI</div>
            <div className={styles.loadingBubble}>
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className={styles.inputForm}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask AI about ${lessonTitle}, request timestamps, or ask for a quiz...`}
          className={styles.chatInput}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className={styles.sendBtn}
          title="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
