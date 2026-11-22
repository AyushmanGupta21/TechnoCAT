"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import ModuleQuizModal from "@/components/ModuleQuizModal";
import { ModuleQuestion, QuizAnalysis } from "@/data/moduleQuizData";
import {
  getPYQQuestions,
  parseMCQCorrectIndex,
  extractTITAAnswer,
  findRecommendedLessonForPYQ,
  generateWeakAreaChecklist,
  SECTION_METADATA,
} from "@/data/pyqData";
import { ArrowRight, Clock, FileText, Lock, ShieldAlert, Target, X } from "lucide-react";
import styles from "./PYQAttemptModal.module.css";

interface PYQAttemptModalProps {
  isOpen: boolean;
  year: number;
  slot: string;
  section: "VARC" | "DILR" | "QUANT";
  subjectAttemptsCount: number;
  isSubjectLocked: boolean;
  onClose: () => void;
  onExamFinished?: () => void;
}

export default function PYQAttemptModal({
  isOpen,
  year,
  slot,
  section,
  subjectAttemptsCount,
  isSubjectLocked,
  onClose,
  onExamFinished,
}: PYQAttemptModalProps) {
  const [inExam, setInExam] = useState(false);
  // Attempt number frozen at the moment the student clicks "Start Exam".
  // Saving an attempt refreshes subjectAttemptsCount in the parent; if that fed
  // straight into the exam it would look like a new attempt and auto-start it.
  const [examAttemptNumber, setExamAttemptNumber] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when attempt modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key if not in exam
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !inExam) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, inExam, onClose]);

  const startExam = () => {
    if (isSubjectLocked || rawQuestions.length === 0) return;
    setExamAttemptNumber(subjectAttemptsCount + 1);
    setInExam(true);
  };

  // Raw PYQ questions
  const rawQuestions = useMemo(() => {
    if (!isOpen) return [];
    return getPYQQuestions(year, slot, section);
  }, [isOpen, year, slot, section]);

  // Map to ModuleQuestion format with passages and TITA support
  const mappedQuestions: ModuleQuestion[] = useMemo(() => {
    return rawQuestions.map((q) => {
      const rec = findRecommendedLessonForPYQ(q);
      const isTITA = q.type === "TITA";
      return {
        id: q.id,
        q: q.question,
        options: q.options || [],
        answer: isTITA ? -1 : parseMCQCorrectIndex(q.correct_answer, q.options),
        explanation: q.explanation,
        concept: rec?.concept || `${section} - Q${q.question_number}`,
        recommendedLessonId: rec?.lessonId,
        recommendedLessonTitle: rec?.lessonTitle,
        type: q.type,
        context: q.context,
        titaAnswer: isTITA ? extractTITAAnswer(q.correct_answer) : undefined,
      };
    });
  }, [rawQuestions, section]);

  const mcqCount = rawQuestions.filter((q) => q.type === "MCQ").length;
  const titaCount = rawQuestions.filter((q) => q.type === "TITA").length;
  const sectionMeta = SECTION_METADATA[section];
  const maxPossibleMarks = rawQuestions.length * 3;

  // Save attempt to backend and localStorage
  const handleSaveAttempt = async (analysis: QuizAnalysis, isPassed: boolean) => {
    try {
      // Find missed questions to generate weak area checklist
      const missedIds = new Set((analysis.missedConcepts || []).map((m) => m.questionId));
      const missedPYQs = rawQuestions.filter((q) => missedIds.has(q.id));
      const weakAreas = generateWeakAreaChecklist(missedPYQs);

      const payload = {
        year,
        slot,
        section,
        score: analysis.score,
        total: analysis.total || maxPossibleMarks,
        percentage: analysis.percentage,
        mcqCorrect: analysis.mcqCorrect || 0,
        mcqWrong: analysis.mcqWrong || 0,
        titaCorrect: analysis.titaCorrect || 0,
        titaWrong: analysis.titaWrong || 0,
        unattempted: analysis.unattempted || 0,
        strikes: analysis.strikes || 0,
        timeTakenSeconds: analysis.timeTakenSeconds || 0,
        answers: analysis.selectedAnswers || {},
        analysis,
        weakAreas,
      };

      // The server grades the answers, builds the weak-area checklist and decides locking.
      await fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);

      onExamFinished?.();
    } catch (err) {
      console.error("[PYQ Attempt Save Error]", err);
    }
  };

  if (!isOpen) return null;

  // Render Active Quiz
  if (inExam) {
    return (
      <ModuleQuizModal
        isOpen={true}
        title={`CAT ${year} • ${slot} • ${sectionMeta?.title || section}`}
        questions={mappedQuestions}
        attemptNumber={examAttemptNumber ?? subjectAttemptsCount + 1}
        maxAttempts={3}
        customDurationSeconds={40 * 60} // 40 minutes strict official CAT regulations
        scoringScheme="cat"
        attemptContext={{
          kind: "pyq",
          topicId: sectionMeta?.topicId,
          section,
          sourceRef: `CAT-${year}-${slot}-${section}`,
        }}
        onClose={() => {
          setInExam(false);
          setExamAttemptNumber(null);
          onClose();
        }}
        onPass={(_score, _total, _points, analysis) => {
          handleSaveAttempt(analysis, true);
        }}
        onFail={(_score, _total, analysis) => {
          handleSaveAttempt(analysis, false);
        }}
      />
    );
  }

  // Pre-Exam Briefing Screen
  if (!mounted || !isOpen) return null;

  const attemptsLeft = Math.max(0, 3 - subjectAttemptsCount);

  return createPortal(
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.briefingBox} data-sec={section}>
        {/* Header */}
        <div className={styles.briefingHeader}>
          <div className={styles.headerTop}>
            <span className={styles.catBadge}>
              <span className={styles.secMarker} aria-hidden="true" />
              CAT exam simulation
            </span>
            <button
              type="button"
              className={styles.closeBriefingBtn}
              onClick={onClose}
              title="Close briefing"
              aria-label="Close briefing"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <h2 className={styles.briefingTitle}>
            CAT {year} · {slot} · <span className="text-gradient">{section}</span>
          </h2>
          <p className={styles.briefingSubtitle}>
            {sectionMeta?.title || section} · timed attempt
          </p>
        </div>

        {/* Body */}
        <div className={styles.briefingBody}>
          {/* Quick Metrics */}
          <div className={styles.statGrid}>
            <div className={`glass-card ${styles.statCard}`} data-tint="blue">
              <span className={styles.statIcon}><Clock size={15} aria-hidden="true" /> Duration</span>
              <span className={styles.statVal}>40<small>min</small></span>
              <span className={styles.statLbl}>One section, one sitting</span>
            </div>
            <div className={`glass-card ${styles.statCard}`} data-tint="teal">
              <span className={styles.statIcon}><FileText size={15} aria-hidden="true" /> Questions</span>
              <span className={styles.statVal}>{rawQuestions.length}</span>
              <span className={styles.statLbl}>{mcqCount} MCQ + {titaCount} TITA</span>
            </div>
            <div className={`glass-card ${styles.statCard}`} data-tint="violet">
              <span className={styles.statIcon}><Target size={15} aria-hidden="true" /> Max score</span>
              <span className={styles.statVal}>{maxPossibleMarks}</span>
              <span className={styles.statLbl}>Marks available</span>
            </div>
          </div>

          {/* Official Scoring Scheme */}
          <div className={styles.rulesSection}>
            <div className={styles.rulesHeading}>
              <span>Scoring &amp; negative marking</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>
                <span className={`${styles.markChip} ${styles.markPlus}`}>+3</span>
                <span className={`${styles.markChip} ${styles.markMinus}`}>−1</span>
              </span>
              <span><strong>Multiple choice (MCQ):</strong> +3 for a correct answer, −1 for a wrong one, 0 if left unattempted.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>
                <span className={`${styles.markChip} ${styles.markPlus}`}>+3</span>
                <span className={`${styles.markChip} ${styles.markZero}`}>0</span>
              </span>
              <span><strong>Type in the answer (TITA):</strong> +3 for a correct answer, no negative marking.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>
                <span className={styles.lockChip}><Lock size={13} aria-hidden="true" /></span>
              </span>
              <span><strong>Window lock:</strong> the exam can&rsquo;t be closed until you submit.</span>
            </div>
          </div>

          {/* Anti-cheat & Proctoring Security */}
          <div className={`glass-card ${styles.proctorNotice}`} data-tint="amber">
            <span className={styles.proctorNoticeIcon}>
              <ShieldAlert size={18} aria-hidden="true" />
            </span>
            <div>
              <h4 className={styles.proctorNoticeTitle}>Proctoring rules</h4>
              <p className={styles.proctorNoticeDesc}>
                Switching tabs, minimising the window or using shortcuts counts as a strike. Each strike deducts <strong>−1 mark</strong>; <strong>3 strikes</strong> end the exam and submit it automatically.
              </p>
            </div>
          </div>

          {/* Subject-Level Locking Notice */}
          <div className={`${styles.lockoutWarning} ${isSubjectLocked ? styles.lockoutWarningLocked : ""}`}>
            <div className={styles.lockoutWarningHead}>
              <span className={styles.lockoutWarningIcon}>
                <Lock size={16} aria-hidden="true" />
              </span>
              <h4 className={styles.lockoutWarningTitle}>Attempts for {section}</h4>
              <span className={styles.attemptMeter} aria-label={`${subjectAttemptsCount} of 3 attempts used`}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`${styles.attemptSeg} ${i < subjectAttemptsCount ? (isSubjectLocked ? styles.attemptSegLocked : styles.attemptSegOn) : ""}`}
                  />
                ))}
              </span>
              <span className={styles.attemptCount}>{Math.min(subjectAttemptsCount, 3)}/3 used</span>
            </div>
            <p className={styles.lockoutWarningDesc}>
              {isSubjectLocked ? (
                <strong className={styles.lockedText}>
                  This section is locked across all slots. Complete the weak-area checklist before attempting again.
                </strong>
              ) : (
                <>
                  You have <strong>{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left</strong> for {section}. When all 3 are used, <strong>every slot of {section} locks</strong> until you finish the prescribed weak-area lessons.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.briefingFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className={styles.startBtn}
            onClick={startExam}
            disabled={isSubjectLocked || rawQuestions.length === 0}
          >
            <span>I agree — start exam</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
