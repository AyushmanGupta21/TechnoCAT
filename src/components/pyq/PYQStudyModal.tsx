"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  PYQQuestion,
  getPYQQuestions,
  parseMCQCorrectIndex,
  extractTITAAnswer,
  findRecommendedLessonForPYQ,
  SECTION_METADATA,
} from "@/data/pyqData";
import PYQMarkdownViewer, { MathText } from "./PYQMarkdownViewer";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileX,
  Lightbulb,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when study modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

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

  if (!mounted || !isOpen) return null;

  if (questions.length === 0) {
    return createPortal(
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={`${styles.modalBox} ${styles.emptyBox}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={styles.emptyIcon} aria-hidden="true">
            <FileX size={22} />
          </span>
          <h3 className={styles.emptyTitle}>No questions available</h3>
          <p className={styles.emptyText}>
            CAT {year} ({slot} · {section}) has no archived questions. CAT exams before 2020 ran in 2 slots only.
          </p>
          <button type="button" onClick={onClose} className={styles.emptyBtn}>
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

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

  return createPortal(
    <div
      className={styles.overlay}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      <div className={styles.modalBox} data-sec={section}>
        {/* Anti-screenshot & Tab Switching Blur Overlay */}
        {isBlurred && (
          <div className={styles.blurredContainer}>
            <div className={styles.blurShieldIcon}>
              <ShieldCheck size={28} aria-hidden="true" />
            </div>
            <h3 className={styles.blurTitle}>Content hidden</h3>
            <p className={styles.blurSubtitle}>
              Official CAT material is protected. It&rsquo;s masked whenever the window loses focus or a screen capture is attempted.
            </p>
            <button
              type="button"
              className={styles.resumeBtn}
              onClick={() => setIsBlurred(false)}
            >
              <Eye size={16} aria-hidden="true" />
              <span>Resume reading</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onClose}
              title="Back to papers"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back</span>
            </button>
            <div className={styles.headerText}>
              <div className={styles.studyBadge}>
                <span className={styles.secMarker} aria-hidden="true" />
                <span>Study mode</span>
              </div>
              <h2 className={styles.headerTitle}>
                CAT {year} · {slot} · {sectionMeta?.title || section}
              </h2>
            </div>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.progressInfo}>
              <strong>{String(currentIdx + 1).padStart(2, "0")}</strong>
              <span>/ {questions.length}</span>
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Close study mode (progress is saved automatically)"
              aria-label="Close study mode"
            >
              <X size={16} aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Progress hairline */}
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Main Split Layout */}
        <div className={styles.mainLayout}>
          {/* Left Sidebar Navigator */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitle}>
                Questions <span>{questions.length}</span>
              </div>
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
                  <button
                    type="button"
                    key={q.id}
                    className={`${styles.qListItem} ${isActive ? styles.qListItemActive : ""}`}
                    onClick={() => setCurrentIdx(origIdx)}
                    aria-current={isActive ? "true" : undefined}
                    title={`Question ${q.question_number} · ${q.type}`}
                  >
                    <span className={styles.qListNumber}>{q.question_number}</span>
                    <span className={`${styles.qListType} ${q.type === "MCQ" ? styles.typeMCQ : styles.typeTITA}`}>
                      {q.type}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.legend}>
              <span><i className={styles.legendMcq} /> MCQ</span>
              <span><i className={styles.legendTita} /> TITA</span>
            </div>
          </aside>

          {/* Right Question & Explanation Area */}
          <main className={styles.contentArea} ref={contentRef}>
            {/* Context / Reading Passage Block */}
            {currentQ.context && (
              <div className={styles.passageBlock}>
                <div className={styles.passageHeader}>
                  <BookOpen size={15} aria-hidden="true" />
                  <span>Passage / data set</span>
                </div>
                <div className={styles.passageBody}>
                  <PYQMarkdownViewer content={currentQ.context} />
                </div>
              </div>
            )}

            {/* Question Meta */}
            <div className={styles.qMetaRow}>
              <div className={styles.qTagGroup}>
                <span className={styles.qNumBadge}>Q{currentQ.question_number}</span>
                <span className={`${styles.qTypeTag} ${isTITA ? styles.typeTITA : styles.typeMCQ}`}>
                  {isTITA ? "TITA · type in the answer" : "MCQ · multiple choice"}
                </span>
                {recommendation?.concept && (
                  <span className={styles.qConceptBadge}>{recommendation.concept}</span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className={styles.questionText}>
              <PYQMarkdownViewer content={currentQ.question} />
            </div>

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
                        <div className={styles.optionText}><MathText text={opt} /></div>
                      </div>
                      {isCorrect && (
                        <span className={styles.correctTag}>
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                          <span>Correct</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.titaAnswerBox}>
                <div className={styles.titaAnswerLeft}>
                  <span className={styles.titaAnswerLabel}>
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                    <span>Official answer</span>
                  </span>
                  <span className={styles.titaAnswerVal}><MathText text={titaCleanAnswer || "Key-in answer"} /></span>
                </div>
                <span className={styles.titaAnswerNote}>
                  No negative marking for TITA
                </span>
              </div>
            )}

            {/* Curriculum Lesson Recommendation */}
            {recommendation && (
              <div className={`glass-card ${styles.recBanner}`} data-tint="teal">
                <div className={styles.recLeft}>
                  <span className={styles.recHeading}>
                    <Play size={13} aria-hidden="true" />
                    <span>Related lesson</span>
                  </span>
                  <span className={styles.recTitle}>{recommendation.lessonTitle}</span>
                  <span className={styles.recSubtitle}>
                    {recommendation.topicTitle} · core theory and shortcuts
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.recActionBtn}
                  onClick={handleGoToLesson}
                >
                  Watch lesson
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Step-by-Step Explanation */}
            <div className={styles.explanationBox}>
              <div className={styles.explanationTitle}>
                <Lightbulb size={16} aria-hidden="true" />
                <span>Step-by-step solution</span>
              </div>
              <div className={styles.explanationText}>
                <PYQMarkdownViewer content={currentQ.explanation} />
              </div>
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
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.btnNext}`}
            onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIdx === questions.length - 1}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
