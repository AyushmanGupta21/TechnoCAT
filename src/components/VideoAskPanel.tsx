"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, CircleHelp, Clock, Eraser, Expand, Lightbulb, Lock, RotateCcw, Send, Target, X } from "lucide-react";
import { QuizQuestion } from "@/data/videoPortions";
import { MathText } from "@/components/pyq/PYQMarkdownViewer";
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
  /**
   * Furthest point (seconds) the student has actually watched. Timestamps after it are shown
   * but locked, and unlock live as playback passes them (no skipping ahead via timestamps).
   * Omit to allow every timestamp.
   */
  unlockedUntilSeconds?: number;
  onLaunchFullQuiz?: (quiz: { title: string; questions: QuizQuestion[] }) => void;
  externalPrompt?: { id: string; prompt: string } | null;
}

// Same tolerance as the player's scrubber, so a timestamp unlocks as playback reaches it.
const SEEK_TOLERANCE_SECONDS = 1.2;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
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

// [⏱ mm:ss], [mm:ss], [h:mm:ss] or a range [mm:ss - mm:ss]
const TIME_SRC = String.raw`\d{1,3}:\d{2}(?::\d{2})?`;
const CLOCK_SRC = String.raw`(?:⏱️?\s*)?`;
const TIMESTAMP_SRC = String.raw`\[${CLOCK_SRC}${TIME_SRC}(?:\s*[-–—]\s*${CLOCK_SRC}${TIME_SRC})?\]`;
const TIMESTAMP_PARTS_RE = new RegExp(
  String.raw`\[${CLOCK_SRC}(${TIME_SRC})(?:\s*[-–—]\s*${CLOCK_SRC}(${TIME_SRC}))?\]`
);
// Emphasis markers wrapping only a timestamp, e.g. "**[08:30 - 18:45]**" -> "[08:30 - 18:45]"
const WRAPPED_TIMESTAMP_RE = new RegExp(String.raw`(\*{1,3}|_{1,2})\s*(${TIMESTAMP_SRC})\s*\1`, "g");
// Groups: 1 LaTeX, 2 inline code, 3 timestamp, 4/5 bold, 6/7 italic
const INLINE_RE = new RegExp(
  [
    String.raw`(\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$\$[\s\S]+?\$\$)`,
    String.raw`(\x60[^\x60\n]+\x60)`,
    `(${TIMESTAMP_SRC})`,
    String.raw`\*\*(?!\s)(.+?)(?<!\s)\*\*`,
    String.raw`__(?!\s)(.+?)(?<!\s)__`,
    String.raw`\*(?![\s*])(.+?)(?<![\s*])\*`,
    String.raw`(?<![A-Za-z0-9_])_(?![\s_])(.+?)(?<![\s_])_(?![A-Za-z0-9_])`,
  ].join("|")
);

// Markdown and clickable timestamp renderer
function FormattedText({
  text,
  onSeekTo,
  unlockedUntilSeconds,
}: {
  text: string;
  onSeekTo?: (seconds: number) => void;
  unlockedUntilSeconds?: number;
}) {
  if (!text) return null;

  // Process text line by line
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  const renderTimestamp = (raw: string, key: string) => {
    const match = raw.match(TIMESTAMP_PARTS_RE);
    if (!match) return raw;
        const firstTime = match[1];
        const seconds = parseTimestampToSeconds(firstTime);
        const locked =
          seconds !== null &&
          unlockedUntilSeconds !== undefined &&
          seconds > unlockedUntilSeconds + SEEK_TOLERANCE_SECONDS;

        return (
          <button
            key={key}
            type="button"
            className={locked ? `${styles.timestampBadge} ${styles.timestampBadgeLocked}` : styles.timestampBadge}
            disabled={locked}
            aria-disabled={locked}
            onClick={() => {
              if (!locked && seconds !== null && onSeekTo) {
                onSeekTo(seconds);
              }
            }}
            title={
              locked
                ? `Unlocks when the video reaches ${formatClock(seconds!)}. Keep watching to jump here.`
                : `Click to jump video to ${firstTime}`
            }
          >
            {locked ? <Lock size={11} strokeWidth={2.5} aria-hidden="true" /> : <Clock size={11} strokeWidth={2.5} aria-hidden="true" />}
            {match[0].replace(/[[\]⏱️]/g, "").trim()}
          </button>
        );
  };

  // Inline markdown: LaTeX, `code`, timestamps, **bold** / __bold__, *italic* / _italic_ (nested).
  const renderInline = (content: string, keyPrefix: string): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    const re = new RegExp(INLINE_RE.source, "g");
    let last = 0;
    let n = 0;
    let prevWasTs = false;
    let m: RegExpExecArray | null;

    const pushText = (s: string, beforeTs: boolean) => {
      // Unmatched "**" never carries meaning; stray * / _ hugging a timestamp badge are leftovers.
      let t = s.replace(/\*{2,}/g, "");
      if (beforeTs) t = t.replace(/[*_]+(\s*)$/, "$1");
      if (prevWasTs) t = t.replace(/^(\s*)[*_]+/, "$1");
      if (t) out.push(<React.Fragment key={`${keyPrefix}-t${n++}`}>{t}</React.Fragment>);
    };

    while ((m = re.exec(content)) !== null) {
      const [whole, math, code, ts, bold1, bold2, ital1, ital2] = m;
      pushText(content.slice(last, m.index), Boolean(ts));
      const key = `${keyPrefix}-${n++}`;
      if (math) out.push(<MathText key={key} text={math} />);
      else if (code) out.push(<code key={key} className={styles.inlineCode}>{code.slice(1, -1)}</code>);
      else if (ts) out.push(renderTimestamp(ts, key));
      else if (bold1 !== undefined || bold2 !== undefined)
        out.push(<strong key={key}>{renderInline(bold1 ?? bold2, key)}</strong>);
      else out.push(<em key={key}>{renderInline(ital1 ?? ital2 ?? "", key)}</em>);
      prevWasTs = Boolean(ts);
      last = m.index + whole.length;
    }
    pushText(content.slice(last), false);
    return out;
  };

  const renderLine = (content: string, key: string) =>
    renderInline(content.replace(WRAPPED_TIMESTAMP_RE, "$2"), key);

  const blocks: React.ReactNode[] = [];
  let inFence = false;

  lines.forEach((line, idx) => {
    const key = `l${idx}`;
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      blocks.push(
        <div key={key} className={styles.codeLine}>
          {line || " "}
        </div>
      );
      return;
    }

    if (!trimmed) {
      blocks.push(<div key={key} className={styles.spacer} />);
      return;
    }

    // Horizontal rule: ---, ***, ___
    if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) {
      blocks.push(<hr key={key} className={styles.rule} />);
      return;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = level <= 2 ? "h3" : level === 3 ? "h4" : "h5";
      blocks.push(
        <Tag key={key} className={level <= 2 ? styles.mdH2 : level === 3 ? styles.mdH3 : styles.mdH4}>
          {renderLine(heading[2], key)}
        </Tag>
      );
      return;
    }

    const body = trimmed.replace(/^>\s?/, "");
    const bullet = body.match(/^[-*+•]\s+(.*)$/);
    const numbered = body.match(/^(\d+)[.)]\s+(.*)$/);

    if (bullet || numbered) {
      const indentWidth = (line.match(/^\s*/)?.[0] ?? "").replace(/\t/g, "    ").length;
      const depth = Math.min(3, Math.floor(indentWidth / 2));
      blocks.push(
        <div key={key} className={styles.listRow} style={{ marginLeft: depth * 14 }}>
          <span className={numbered ? styles.listNum : styles.listBullet}>
            {numbered ? `${numbered[1]}.` : depth > 0 ? "◦" : "•"}
          </span>
          <span className={styles.listText}>
            {renderLine(numbered ? numbered[2] : bullet![1], key)}
          </span>
        </div>
      );
      return;
    }

    blocks.push(
      <p key={key} className={styles.para}>
        {renderLine(body, key)}
      </p>
    );
  });

  return <div className={styles.markdown}>{blocks}</div>;
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
          <CircleHelp size={15} aria-hidden="true" />
          <span>{quiz.title}</span>
        </div>
        <div className={styles.quizHeaderRight}>
          {onLaunchFullQuiz && (
            <button
              type="button"
              onClick={onLaunchFullQuiz}
              title="Open this quiz full screen"
              className={styles.fullScreenBtn}
            >
              <span>Full screen</span>
              <Expand size={12} aria-hidden="true" />
            </button>
          )}
          <span className={styles.quizQuestionCount}>
            {answeredCount}/{quiz.questions.length} answered
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
                          <Check size={11} strokeWidth={3} aria-hidden="true" />
                        ) : hasAnswered && isSelected && !isCorrect ? (
                          <X size={11} strokeWidth={3} aria-hidden="true" />
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
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className={styles.scoreBanner}>
          <div className={styles.scoreText}>
            Quiz complete. You scored <strong>{score}</strong>/{quiz.questions.length} (
            <strong>{Math.round((score / quiz.questions.length) * 100)}%</strong>)
          </div>
          <button
            type="button"
            className={styles.retakeBtn}
            onClick={handleReset}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Retake quiz</span>
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
  unlockedUntilSeconds,
  onLaunchFullQuiz,
  externalPrompt,
}: VideoAskPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your **TechnoCAT AI Tutor** for **${lessonTitle}**.\n\nYou can ask me:\n- **"What topics are covered at which timestamp?"** to get an exact portion breakdown.\n- **"Create an interactive quiz on this video"** to practice with instant grading.\n- Any concept, formula derivation, or CAT shortcut!`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const lastPromptIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (externalPrompt && externalPrompt.id !== lastPromptIdRef.current) {
      lastPromptIdRef.current = externalPrompt.id;
      handleSend(externalPrompt.prompt);
    }
  }, [externalPrompt]);

  return (
    <div className={styles.panelWrapper}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.aiIconBadge} aria-hidden="true" />
          <div className={styles.headerText}>
            <h3 className={styles.headerTitle}>Ask the AI tutor</h3>
            <p className={styles.headerSubtitle}>
              Answers grounded in{" "}
              {lessonCode && <span className={styles.headerCode}>{lessonCode}</span>} {lessonTitle}
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
          <Eraser size={14} aria-hidden="true" />
          Clear chat
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
            {chip.includes("quiz") ? (
              <Target size={14} aria-hidden="true" />
            ) : chip.includes("timestamp") ? (
              <Clock size={14} aria-hidden="true" />
            ) : (
              <Lightbulb size={14} aria-hidden="true" />
            )}
            <span>{chip}</span>
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
              <FormattedText text={msg.content} onSeekTo={onSeekTo} unlockedUntilSeconds={unlockedUntilSeconds} />

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
          placeholder={`Ask about ${lessonTitle}, request timestamps or a quiz...`}
          className={styles.chatInput}
          disabled={loading}
          aria-label="Ask the AI tutor"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className={styles.sendBtn}
          title="Send message"
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
