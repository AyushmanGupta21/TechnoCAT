"use client";

import React, { useState, useMemo } from "react";
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

      // Save to Supabase API
      await fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);

      // Save to localStorage fallback
      const localKey = `technocat_pyq_attempts_${section}`;
      const savedHistory = JSON.parse(localStorage.getItem(localKey) || "[]");
      savedHistory.unshift({
        ...payload,
        completedAt: new Date().toISOString(),
      });
      localStorage.setItem(localKey, JSON.stringify(savedHistory));

      // Check locking in localStorage
      if (subjectAttemptsCount + 1 >= 3) {
        localStorage.setItem(`technocat_pyq_lock_${section}`, JSON.stringify({ isLocked: true, weakAreas }));
      }

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
        attemptNumber={subjectAttemptsCount + 1}
        maxAttempts={3}
        customDurationSeconds={40 * 60} // 40 minutes strict official CAT regulations
        scoringScheme="cat"
        onClose={() => {
          setInExam(false);
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
  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.briefingBox}>
        {/* Header */}
        <div className={styles.briefingHeader}>
          <div className={styles.headerTop}>
            <span className={styles.catBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Official CAT Examination Simulation
            </span>
            <button
              type="button"
              className={styles.closeBriefingBtn}
              onClick={onClose}
              title="Close briefing"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <h2 className={styles.briefingTitle}>
            CAT {year} • {slot} • {section}
          </h2>
          <p className={styles.briefingSubtitle}>
            {sectionMeta?.title || section} • Timed Assessment Mode
          </p>
        </div>

        {/* Body */}
        <div className={styles.briefingBody}>
          {/* Quick Metrics */}
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
              <span className={styles.statVal}>40 Mins</span>
              <span className={styles.statLbl}>Section Duration</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
              <span className={styles.statVal}>{rawQuestions.length} Questions</span>
              <span className={styles.statLbl}>{mcqCount} MCQ + {titaCount} TITA</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
              <span className={styles.statVal}>+{maxPossibleMarks} Marks</span>
              <span className={styles.statLbl}>Maximum Score</span>
            </div>
          </div>

          {/* Official Scoring Scheme */}
          <div className={styles.rulesSection}>
            <div className={styles.rulesHeading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
              <span>Official CAT Scoring & Negative Marking Scheme</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="#16a34a"/></svg></span>
              <span><strong>Multiple Choice (MCQ):</strong> +3 marks for correct answer, <strong>-1 mark</strong> for incorrect answer, 0 for unattempted.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg></span>
              <span><strong>Type In The Answer (TITA):</strong> +3 marks for correct answer, <strong>0 marks</strong> for incorrect answer (No Negative Marking).</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <span><strong>Exam Window Lock:</strong> Interface cannot be closed until your quiz is finalized and submitted.</span>
            </div>
          </div>

          {/* Anti-cheat & Proctoring Security */}
          <div className={styles.proctorNotice}>
            <span className={styles.proctorNoticeIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <div>
              <h4 className={styles.proctorNoticeTitle}>Anti-Cheating & Proctoring Regulations</h4>
              <p className={styles.proctorNoticeDesc}>
                Tab switching, window minimization, or shortcut usage will trigger a security violation strike. Each strike deducts <strong>-1 mark</strong> from your final score. Incurring <strong>3 strikes</strong> terminates the exam and triggers automatic submission.
              </p>
            </div>
          </div>

          {/* Subject-Level Locking Notice */}
          <div className={styles.lockoutWarning}>
            <span className={styles.lockoutWarningIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <div>
              <h4 className={styles.lockoutWarningTitle}>
                Subject Attempts Policy ({subjectAttemptsCount} of 3 Used for {section})
              </h4>
              <p className={styles.lockoutWarningDesc}>
                {isSubjectLocked ? (
                  <strong style={{ color: "#b91c1c" }}>
                    This subject is currently LOCKED across all slots. Please complete the prescribed weak-area study checklist before attempting again.
                  </strong>
                ) : (
                  <>
                    You have <strong>{3 - subjectAttemptsCount} attempt{3 - subjectAttemptsCount !== 1 ? "s" : ""} remaining</strong> for {section}. If all 3 attempts are exhausted, <strong>all slots of {section} will be locked</strong> until the AI-prescribed weak area lessons are completed.
                  </>
                )}
              </p>
            </div>
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
            onClick={() => setInExam(true)}
            disabled={isSubjectLocked}
          >
            <span>I Understand & Agree — Start Exam</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
