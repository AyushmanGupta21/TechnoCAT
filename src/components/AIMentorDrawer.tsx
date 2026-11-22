"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, CircleAlert, Maximize2, Minimize2, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";
import styles from "./AIMentorDrawer.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface AIMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userId?: string;
  readinessData?: {
    readiness: number;
    concepts: number;
    accuracy: number;
    speed: number;
    consistency: number;
    hasActivity: boolean;
  };
}

const SUGGESTED_QUESTIONS = [
  "How can I improve in QA?",
  "Tips for VARC",
  "Explain a DILR set",
  "Tell me about time management",
  "Create a 1-month study plan",
  "Give me difficult CAT questions",
  "Analyze my mock performance",
  "Suggest resources for CAT",
];

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AIMentorDrawer({
  isOpen,
  onClose,
  userName,
  userId,
  readinessData,
}: AIMentorDrawerProps) {
  const firstName = userName && userName.trim() ? userName.trim().split(" ")[0] : "there";

  const getInitialGreeting = (): ChatMessage => ({
    id: "welcome-greeting",
    role: "assistant",
    content: `Hi ${firstName}.\n\nI'm your AI mentor for CAT preparation. Ask me about concepts, strategy, doubts, study plans or mock analysis.\n\nWhat would you like to work on today?`,
    timestamp: formatTime(),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("technocat_ai_mentor_chat");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore storage error
      }
    }
    return [getInitialGreeting()];
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("technocat_ai_mentor_chat", JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Update greeting name when user logs in if only welcome message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome-greeting") {
        return [getInitialGreeting()];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  // Scroll to bottom when messages update or loading changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Lock background scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Prevent wheel/touch from scrolling background page
    const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const scrollable = target.closest(`.${styles.drawer}`);
      if (!scrollable && e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    // Focus input after opening
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", preventBackgroundScroll);
      window.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [isOpen, onClose]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: formatTime(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setLastFailedQuery(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Auth is carried by the httpOnly session cookie.
      const authHeaders: HeadersInit = { "Content-Type": "application/json" };

      // Send recent context (filter out errors)
      const contextToSend = newMessages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/intelligence/mentor", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          messages: contextToSend,
          question: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const aiReply = data?.answer || data?.reply;

      if (!aiReply) {
        throw new Error("Empty response from mentor");
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiReply,
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn("[Mentor Chat Submit Error]", err);
      setLastFailedQuery(textToSend);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that right now. Please try again.",
        timestamp: formatTime(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    const greeting = getInitialGreeting();
    setMessages([greeting]);
    setLastFailedQuery(null);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("technocat_ai_mentor_chat");
      } catch {
        // ignore
      }
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSend(lastFailedQuery);
    }
  };

  if (!isOpen) return null;

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* Background dimmer */}
      <div
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in right panel */}
      <aside
        className={`${styles.drawer} ${isMaximized ? styles.drawerMaximized : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="AI mentor chat"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarIcon} aria-hidden="true">
              <Sparkles size={18} strokeWidth={2} />
            </div>

            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>AI mentor</h2>
                <span className={styles.onlineBadge}>
                  <span className={styles.onlineDot} /> Online
                </span>
              </div>
              <p className={styles.subtitle}>Concepts, strategy, doubts and study plans</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={handleClearChat}
              title="New chat"
              aria-label="Start new conversation"
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnWide}`}
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? "Standard width" : "Expand drawer"}
              aria-label={isMaximized ? "Standard width" : "Expand drawer"}
            >
              {isMaximized ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}
            </button>

            <button
              type="button"
              className={styles.headerBtn}
              onClick={onClose}
              title="Close"
              aria-label="Close AI mentor"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Conversation */}
        <div ref={messagesContainerRef} className={styles.messagesContainer}>
          {messages.map((msg) => {
            const isAi = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${isAi ? styles.messageRowAi : styles.messageRowUser}`}
              >
                {isAi && (
                  <div className={styles.aiAvatarMini} aria-hidden="true">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </div>
                )}

                <div className={styles.messageCol}>
                  <div className={`${styles.bubble} ${isAi ? styles.bubbleAi : styles.bubbleUser} ${msg.isError ? styles.bubbleError : ""}`}>
                    {msg.isError ? (
                      <div className={styles.errorCard}>
                        <p className={styles.errorText}>
                          <CircleAlert size={16} aria-hidden="true" />
                          <span>{msg.content}</span>
                        </p>
                        <button
                          type="button"
                          className={styles.retryBtn}
                          onClick={handleRetry}
                        >
                          <RotateCcw size={14} aria-hidden="true" />
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className={styles.bubbleContent}>
                        {renderFormattedContent(msg.content)}
                      </div>
                    )}
                  </div>
                  <span className={`${styles.timestamp} ${isAi ? styles.timestampAi : styles.timestampUser}`}>
                    {isAi ? "Mentor · " : "You · "}
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator while waiting for the reply */}
          {isLoading && (
            <div className={`${styles.messageRow} ${styles.messageRowAi}`}>
              <div className={styles.aiAvatarMini} aria-hidden="true">
                <Sparkles size={13} strokeWidth={2.2} />
              </div>
              <div className={styles.typingIndicator} aria-label="Mentor is typing">
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          )}

          {/* Suggested questions (fresh conversation only) */}
          {showSuggestions && !isLoading && (
            <div className={styles.suggestedBox}>
              <div className={styles.suggestedHeader}>Try asking</div>
              <div className={styles.suggestedGrid}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={styles.suggestedChip}
                    onClick={() => handleSend(q)}
                  >
                    <span>{q}</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <footer className={styles.composer}>
          <div className={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Ask a question…"
              rows={1}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Type your message to the AI mentor"
            />

            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              title="Send message"
            >
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </div>

          <p className={styles.composerTip}>
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
          </p>
        </footer>
      </aside>
    </>
  );
}

/**
 * Lightweight, resilient markdown parser for assistant message text.
 * Renders bold headers, bullet lists, numbered lists, and paragraphs cleanly.
 */
function renderFormattedContent(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    const items = currentList.items.map((item, idx) => (
      <li key={`${keyPrefix}-item-${idx}`}>{renderInlineFormatting(item)}</li>
    ));
    if (currentList.type === "ul") {
      elements.push(<ul key={`${keyPrefix}-ul`}>{items}</ul>);
    } else {
      elements.push(<ol key={`${keyPrefix}-ol`}>{items}</ol>);
    }
    currentList = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`line-${idx}`);
      return;
    }

    // Headings: ### Header or #### Header
    if (trimmed.startsWith("### ")) {
      flushList(`h3-${idx}`);
      elements.push(
        <h3 key={`h3-${idx}`}>{renderInlineFormatting(trimmed.slice(4))}</h3>
      );
      return;
    }
    if (trimmed.startsWith("#### ")) {
      flushList(`h4-${idx}`);
      elements.push(
        <h4 key={`h4-${idx}`}>{renderInlineFormatting(trimmed.slice(5))}</h4>
      );
      return;
    }

    // Bullet points: - item or * item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.slice(2);
      if (!currentList || currentList.type !== "ul") {
        flushList(`switch-ul-${idx}`);
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Numbered lists: 1. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (!currentList || currentList.type !== "ol") {
        flushList(`switch-ol-${idx}`);
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Regular paragraph
    flushList(`p-${idx}`);
    elements.push(
      <p key={`p-${idx}`}>{renderInlineFormatting(trimmed)}</p>
    );
  });

  flushList("final");
  return elements;
}

/**
 * Handles inline bold (**text** or __text__) formatting.
 */
function renderInlineFormatting(str: string): React.ReactNode {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
