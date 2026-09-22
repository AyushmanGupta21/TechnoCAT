"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PYQQuestion,
  getPYQQuestions,
  parseMCQCorrectIndex,
  extractTITAAnswer,
  findRecommendedLessonForPYQ,
  SECTION_METADATA,
} from "@/data/pyqData";
import styles from "./PYQStudyModal.module.css";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

interface PYQStudyModalProps {
  isOpen: boolean;
  year: number;
  slot: string;
  section: "VARC" | "DILR" | "QUANT";
  onClose: () => void;
}

export default function PYQStudyModal({
  isOpen,
  year,
  slot,
  section,
  onClose,
}: PYQStudyModalProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filterType, setFilterType] = useState<"ALL" | "MCQ" | "TITA">("ALL");
  const [isBlurred, setIsBlurred] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load questions
  const questions: PYQQuestion[] = useMemo(() => {
    if (!isOpen) return [];
    return getPYQQuestions(year, slot, section);
  }, [isOpen, year, slot, section]);

  // Persistence key for study progress
  const storageKey = useMemo(() => {
    return `technocat_pyq_study_${year}_${slot.replace(/\s+/g, "_")}_${section}`;
  }, [year, slot, section]);

  // Load saved progress
  useEffect(() => {
    if (!isOpen || questions.length === 0) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lastIndex === "number" && parsed.lastIndex >= 0 && parsed.lastIndex < questions.length) {
          setCurrentIdx(parsed.lastIndex);
        }
      }
    } catch {}
  }, [isOpen, questions.length, storageKey]);

  // Save progress on index change
  useEffect(() => {
    if (!isOpen || questions.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ lastIndex: currentIdx }));
    } catch {}
  }, [currentIdx, isOpen, questions.length, storageKey]);

  // Scroll to top of content when question changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentIdx]);

  // Content Protection & Anti-Capture Deterrence
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ["c", "a", "s", "p", "u"];
      if ((e.ctrlKey || e.metaKey) && blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        setIsBlurred(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIdx] || questions[0];
  const isTITA = currentQ.type === "TITA";
  const correctOptionIdx = !isTITA ? parseMCQCorrectIndex(currentQ.correct_answer, currentQ.options) : -1;
  const titaCleanAnswer = isTITA ? extractTITAAnswer(currentQ.correct_answer) : "";
  const recommendation = findRecommendedLessonForPYQ(currentQ);
  const sectionMeta = SECTION_METADATA[section];

  // Filter questions for sidebar navigator
  const filteredQuestions = questions.filter((q) => {
    if (filterType === "MCQ") return q.type === "MCQ";
    if (filterType === "TITA") return q.type === "TITA";
    return true;
  });

  const handleGoToLesson = () => {
    if (!recommendation) return;
    onClose();
    router.push(`/topics/${recommendation.topicId}?lesson=${recommendation.lessonId}`);
  };

  return (
    <div
      className={styles.overlay}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      <div className={styles.modalBox}>
        {/* Anti-screenshot & Tab Switching Blur Overlay */}
        {isBlurred && (
          <div className={styles.blurredContainer}>
            <div className={styles.blurShieldIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className={styles.blurTitle}>Content Hidden for Security</h3>
            <p className={styles.blurSubtitle}>
              Official CAT exam materials are strictly protected. Content is masked during window focus loss or screen capture attempts.
            </p>
            <button
              type="button"
              className={styles.resumeBtn}
              onClick={() => setIsBlurred(false)}
            >
              Resume Reading 👁️
            </button>
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.studyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>Study Mode</span>
            </div>
            <h2 className={styles.headerTitle}>
              CAT {year} • {slot} • {sectionMeta?.title || section}
            </h2>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.progressInfo}>
              Question <strong>{currentIdx + 1}</strong> of <strong>{questions.length}</strong>
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Close Study Mode (Progress is automatically saved)"
            >
              <span>✕</span> Close Study
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className={styles.mainLayout}>
          {/* Left Sidebar Navigator */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitle}>Questions ({questions.length})</div>
              <div className={styles.filterChips}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterType === "ALL" ? styles.filterChipActive : ""}`}
                  onClick={() => setFilterType("ALL")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterType === "MCQ" ? styles.filterChipActive : ""}`}
                  onClick={() => setFilterType("MCQ")}
                >
                  MCQ
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterType === "TITA" ? styles.filterChipActive : ""}`}
                  onClick={() => setFilterType("TITA")}
                >
                  TITA
                </button>
              </div>
            </div>

            <div className={styles.questionList}>
              {filteredQuestions.map((q) => {
                const origIdx = questions.findIndex((item) => item.id === q.id);
                const isActive = origIdx === currentIdx;
                return (
                  <div
                    key={q.id}
                    className={`${styles.qListItem} ${isActive ? styles.qListItemActive : ""}`}
                    onClick={() => setCurrentIdx(origIdx)}
                  >
                    <div className={styles.qListLeft}>
                      <span className={styles.qListNumber}>Q{q.question_number}</span>
                    </div>
                    <span className={`${styles.qListType} ${q.type === "MCQ" ? styles.typeMCQ : styles.typeTITA}`}>
                      {q.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Question & Explanation Area */}
          <main className={styles.contentArea} ref={contentRef}>
            {/* Context / Reading Passage Block */}
            {currentQ.context && (
              <div className={styles.passageBlock}>
                <div className={styles.passageHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <span>Reading Passage / Data Context</span>
                </div>
                <div className={styles.passageBody}>{currentQ.context}</div>
              </div>
            )}

            {/* Question Meta */}
            <div className={styles.qMetaRow}>
              <div className={styles.qTagGroup}>
                <span className={styles.qNumBadge}>Question {currentQ.question_number}</span>
                <span className={`${styles.qListType} ${isTITA ? styles.typeTITA : styles.typeMCQ}`} style={{ fontSize: "12px", padding: "4px 8px" }}>
                  {isTITA ? "⌨️ TITA (Type In The Answer)" : "🔘 Multiple Choice (MCQ)"}
                </span>
                <span className={styles.qConceptBadge}>Concept: {recommendation?.concept}</span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className={styles.questionText}>{currentQ.question}</h3>

            {/* Options or TITA Answer */}
            {!isTITA ? (
              <div className={styles.optionsGrid}>
                {currentQ.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === correctOptionIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`${styles.optionCard} ${isCorrect ? styles.optionCardCorrect : ""}`}
                    >
                      <div className={styles.optionLeft}>
                        <div className={styles.optionKey}>{OPTION_LETTERS[optIdx]}</div>
                        <div className={styles.optionText}>{opt}</div>
                      </div>
                      {isCorrect && (
                        <span className={styles.correctTag}>✓ Correct Option</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.titaAnswerBox}>
                <div className={styles.titaAnswerLeft}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                    ✓ Official Correct Answer:
                  </span>
                  <span className={styles.titaAnswerVal}>{titaCleanAnswer || "Key-in Answer"}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
                  (No Negative Marks in CAT for TITA)
                </span>
              </div>
            )}

            {/* Curriculum Lesson Recommendation */}
            {recommendation && (
              <div className={styles.recBanner}>
                <div className={styles.recLeft}>
                  <span className={styles.recHeading}>📺 TechnoCAT Curriculum Alignment:</span>
                  <span className={styles.recTitle}>{recommendation.lessonTitle}</span>
                  <span className={styles.recSubtitle}>
                    Topic: {recommendation.topicTitle} • Master the core theory and shortcuts
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.recActionBtn}
                  onClick={handleGoToLesson}
                >
                  Watch Lesson Video →
                </button>
              </div>
            )}

            {/* Step-by-Step Explanation */}
            <div className={styles.explanationBox}>
              <div className={styles.explanationTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Comprehensive Step-by-Step Solution:</span>
              </div>
              <div className={styles.explanationText}>{currentQ.explanation}</div>
            </div>
          </main>
        </div>

        {/* Footer Navigation */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.btnPrev}`}
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            ← Previous Question
          </button>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.btnNext}`}
            onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIdx === questions.length - 1}
          >
            Next Question →
          </button>
        </div>
      </div>
    </div>
  );
}
