"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PYQ_YEARS,
  getPYQSectionInfo,
  SECTION_METADATA,
  PYQWeakAreaItem,
} from "@/data/pyqData";
import PYQStudyModal from "./PYQStudyModal";
import PYQAttemptModal from "./PYQAttemptModal";
import styles from "./PYQYearModal.module.css";

interface PYQYearModalProps {
  isOpen: boolean;
  year: number;
  onClose: () => void;
}

const ALL_SLOTS = ["Slot 1", "Slot 2", "Slot 3"];
const ALL_SECTIONS: Array<"VARC" | "DILR" | "QUANT"> = ["VARC", "DILR", "QUANT"];

export default function PYQYearModal({
  isOpen,
  year,
  onClose,
}: PYQYearModalProps) {
  const router = useRouter();

  // Filters
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Sub-modals state
  const [studyModalTarget, setStudyModalTarget] = useState<{
    slot: string;
    section: "VARC" | "DILR" | "QUANT";
  } | null>(null);

  const [attemptModalTarget, setAttemptModalTarget] = useState<{
    slot: string;
    section: "VARC" | "DILR" | "QUANT";
  } | null>(null);

  const [analyticsTarget, setAnalyticsTarget] = useState<{
    slot: string;
    section: "VARC" | "DILR" | "QUANT";
  } | null>(null);

  // Attempt statistics & Lockout state per section
  const [attemptsData, setAttemptsData] = useState<any[]>([]);
  const [sectionStats, setSectionStats] = useState<
    Record<
      string,
      {
        attemptsCount: number;
        isLocked: boolean;
        weakAreas: PYQWeakAreaItem[];
        bestScore: number;
        bestPercentage: number;
      }
    >
  >({
    VARC: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
    DILR: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
    QUANT: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
  });

  // Fetch attempts from server & localStorage
  const loadAttempts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pyq/attempts?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        if (json.attempts) setAttemptsData(json.attempts);
        if (json.sectionStats) {
          setSectionStats(json.sectionStats);
          return;
        }
      }
    } catch {}

    // LocalStorage fallback
    const fallbackStats: Record<string, any> = {
      VARC: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
      DILR: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
      QUANT: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
    };

    ALL_SECTIONS.forEach((sec) => {
      try {
        const localAttempts = JSON.parse(localStorage.getItem(`technocat_pyq_attempts_${sec}`) || "[]");
        const lockInfo = JSON.parse(localStorage.getItem(`technocat_pyq_lock_${sec}`) || "null");

        fallbackStats[sec].attemptsCount = localAttempts.length;
        if (localAttempts.length > 0) {
          fallbackStats[sec].bestScore = Math.max(...localAttempts.map((a: any) => a.score || 0));
          fallbackStats[sec].bestPercentage = Math.max(...localAttempts.map((a: any) => a.percentage || 0));
        }
        if (lockInfo?.isLocked) {
          fallbackStats[sec].isLocked = true;
          fallbackStats[sec].weakAreas = lockInfo.weakAreas || [];
        }
      } catch {}
    });

    setSectionStats(fallbackStats);
  }, [year]);

  useEffect(() => {
    if (isOpen) {
      loadAttempts();
    }
  }, [isOpen, loadAttempts]);

  // Generate 9 section-slot cards
  const allCards = useMemo(() => {
    const list: Array<{
      slot: string;
      section: "VARC" | "DILR" | "QUANT";
      info: ReturnType<typeof getPYQSectionInfo>;
    }> = [];

    ALL_SLOTS.forEach((slot) => {
      ALL_SECTIONS.forEach((section) => {
        list.push({
          slot,
          section,
          info: getPYQSectionInfo(year, slot, section),
        });
      });
    });

    return list;
  }, [year]);

  // Filter cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchSub =
        selectedSubjects.length === 0 || selectedSubjects.includes(card.section);
      const matchSlot =
        selectedSlots.length === 0 || selectedSlots.includes(card.slot);
      return matchSub && matchSlot;
    });
  }, [allCards, selectedSubjects, selectedSlots]);

  // Check if any subject is locked to display weak area checklist
  const lockedSubject = useMemo(() => {
    return ALL_SECTIONS.find((sec) => sectionStats[sec]?.isLocked);
  }, [sectionStats]);

  const activeWeakAreas = lockedSubject ? sectionStats[lockedSubject]?.weakAreas || [] : [];
  const completedCount = activeWeakAreas.filter((w) => w.completed).length;

  const handleStudyLesson = (topicId: string, lessonId: string) => {
    onClose();
    router.push(`/topics/${topicId}?lesson=${lessonId}`);
  };

  const toggleSubjectFilter = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const toggleSlotFilter = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalBox}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.badgeRow}>
              <span className={styles.yearBadge}>
                {year === 2024 ? "TechnoCAT 6.0 Full Mock & Official Archive" : `CAT ${year} Archive`}
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                {year === 2024 ? "Free All-India Live Simulation • 3 Slots" : "Official Question Papers"}
              </span>
            </div>
            <h2 className={styles.headerTitle}>
              {year === 2024 ? `TechnoCAT 6.0 Full Mock (Official CAT ${year})` : `CAT ${year} Previous Year Question Papers`}
            </h2>
            <p className={styles.headerSubtitle}>
              Access all 3 Slots &amp; 3 Sections. Review detailed solutions in Study Mode or simulate official exam conditions in Timed Attempt Mode.
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className={styles.filterBar}>
          {/* Subject Filter Chips */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Subject:</span>
            <button
              type="button"
              className={`${styles.filterChip} ${
                selectedSubjects.length === 0 ? styles.filterChipActive : ""
              }`}
              onClick={() => setSelectedSubjects([])}
            >
              All Subjects
            </button>
            {ALL_SECTIONS.map((sec) => {
              const isActive = selectedSubjects.includes(sec);
              const isLocked = sectionStats[sec]?.isLocked;
              return (
                <button
                  key={sec}
                  type="button"
                  className={`${styles.filterChip} ${
                    isActive ? styles.filterChipActive : ""
                  }`}
                  onClick={() => toggleSubjectFilter(sec)}
                >
                  <span>{sec}</span>
                  {isLocked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slot Filter Chips */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Slot:</span>
            <button
              type="button"
              className={`${styles.filterChip} ${
                selectedSlots.length === 0 ? styles.filterChipActive : ""
              }`}
              onClick={() => setSelectedSlots([])}
            >
              All Slots
            </button>
            {ALL_SLOTS.map((slot) => {
              const isActive = selectedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  className={`${styles.filterChip} ${
                    isActive ? styles.filterChipActive : ""
                  }`}
                  onClick={() => toggleSlotFilter(slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.bodyContent}>
          {/* Smart Lockout & Weak Area Checklist Banner */}
          {lockedSubject && (
            <div className={styles.lockoutBanner}>
              <div className={styles.lockoutBannerHeader}>
                <div className={styles.lockoutLeft}>
                  <div className={styles.lockoutIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div>
                    <h3 className={styles.lockoutTitle}>
                      {lockedSubject} Is Locked Across All Slots
                    </h3>
                    <p className={styles.lockoutSubtitle}>
                      You have utilized all 3 attempts for {lockedSubject}. Complete the AI-prescribed weak-area checklist below ({completedCount} of {activeWeakAreas.length} completed). When all lessons are marked watched, attempts will automatically unlock!
                    </p>
                  </div>
                </div>
              </div>

              {activeWeakAreas.length > 0 && (
                <div className={styles.checklistGrid}>
                  {activeWeakAreas.map((item) => (
                    <div
                      key={item.lessonId}
                      className={`${styles.checklistItem} ${
                        item.completed ? styles.checklistItemDone : ""
                      }`}
                    >
                      <div className={styles.checklistInfo}>
                        <div
                          className={`${styles.checkCircle} ${
                            item.completed ? styles.circleDone : styles.circlePending
                          }`}
                        >
                          {item.completed ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                          )}
                        </div>
                        <div>
                          <div className={styles.checklistLessonTitle}>
                            {item.lessonTitle}
                          </div>
                          <div className={styles.checklistConcept}>
                            {item.concept}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.studyLessonBtn}
                        onClick={() => handleStudyLesson(item.topicId, item.lessonId)}
                      >
                        {item.completed ? "Review Again" : "Watch Lecture →"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cards Grid */}
          <div className={styles.cardsGrid}>
            {filteredCards.map(({ slot, section, info }) => {
              const meta = SECTION_METADATA[section];
              const stat = sectionStats[section];
              const isLocked = stat?.isLocked;
              const attemptsCount = stat?.attemptsCount || 0;

              return (
                <div key={`${slot}-${section}`} className={styles.sectionCard}>
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <span className={styles.slotBadge}>{slot}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: meta.color,
                        background: `${meta.color}15`,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      CAT {year}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <div className={styles.cardSubjectRow}>
                    <div
                      className={styles.subjectIcon}
                      style={{ background: `${meta.color}15`, color: meta.color }}
                    >
                      {section === "VARC" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      ) : section === "DILR" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/></svg>
                      )}
                    </div>
                    <div>
                      <h3 className={styles.subjectTitle}>{section}</h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {meta.title}
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className={styles.cardSpecs}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>{info.durationMinutes} Mins</span>
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      <span>{info.totalCount} Questions</span>
                    </span>
                    <span>•</span>
                    <span>{info.mcqCount} MCQ + {info.titaCount} TITA</span>
                  </div>

                  {/* Status Badge */}
                  <div className={styles.statusBadgeRow}>
                    {isLocked ? (
                      <span className={`${styles.statusBadge} ${styles.statusLocked}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span>Subject Locked (3/3 Attempts)</span>
                      </span>
                    ) : attemptsCount > 0 ? (
                      <span className={`${styles.statusBadge} ${styles.statusAttempted}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }}><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{attemptsCount}/3 Attempts Used • Best: {stat.bestScore} Marks ({stat.bestPercentage}%)</span>
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusNotAttempted}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }}><circle cx="12" cy="12" r="10"/></svg>
                        <span>Not Attempted (0/3 Used)</span>
                      </span>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.btnStudy}
                      onClick={() => setStudyModalTarget({ slot, section })}
                      title="Read and study questions, options, and comprehensive solutions"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      <span>Study PYQ</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnAttempt}
                      onClick={() => setAttemptModalTarget({ slot, section })}
                      disabled={isLocked}
                      title={
                        isLocked
                          ? "Subject is locked. Complete the weak-area checklist to unlock."
                          : "Take timed proctored exam under CAT exam conditions"
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      <span>Attempt</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnAnalytics}
                      onClick={() => setAnalyticsTarget({ slot, section })}
                      title="View Previous Attempts Analytics"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Previous Attempts Analytics Drawer */}
        {analyticsTarget && (
          <div
            className={styles.analyticsDrawer}
            onClick={(e) => {
              if (e.target === e.currentTarget) setAnalyticsTarget(null);
            }}
          >
            <div className={styles.analyticsPanel}>
              <div className={styles.analyticsHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    {analyticsTarget.section} Past Attempts Analytics
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {analyticsTarget.slot} • CAT {year}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setAnalyticsTarget(null)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className={styles.analyticsList}>
                {(() => {
                  const sectionAttempts = attemptsData.filter(
                    (a) => a.section?.toUpperCase() === analyticsTarget.section.toUpperCase()
                  );

                  if (sectionAttempts.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "#94a3b8" }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>No Attempts Recorded Yet</h4>
                        <p style={{ margin: 0, fontSize: "13px" }}>
                          Take your first timed CAT attempt to unlock detailed analytics and AI diagnosis.
                        </p>
                      </div>
                    );
                  }

                  return sectionAttempts.map((att, idx) => (
                    <div key={att.id || idx} className={styles.attemptItem}>
                      <div className={styles.attemptItemHeader}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px" }}>
                          Attempt #{sectionAttempts.length - idx} • {att.slot}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {att.completed_at ? new Date(att.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                        </span>
                      </div>

                      <div className={styles.attemptScoreRow}>
                        <span className={styles.attemptBigScore}>{att.score}</span>
                        <span className={styles.attemptTotal}>/ {att.total} Marks</span>
                        <span className={styles.attemptAccuracy}>{att.percentage}% Score</span>
                      </div>

                      <div className={styles.attemptMetricsGrid}>
                        <div className={styles.attemptMetricItem}>
                          <span>{att.mcq_correct || 0} / {att.mcq_wrong || 0}</span>
                          <span>MCQ (R / W)</span>
                        </div>
                        <div className={styles.attemptMetricItem}>
                          <span>{att.tita_correct || 0} / {att.tita_wrong || 0}</span>
                          <span>TITA (R / W)</span>
                        </div>
                        <div className={styles.attemptMetricItem}>
                          <span>{att.strikes || 0}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span>Strikes</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Study Modal */}
        {studyModalTarget && (
          <PYQStudyModal
            isOpen={true}
            year={year}
            slot={studyModalTarget.slot}
            section={studyModalTarget.section}
            onClose={() => setStudyModalTarget(null)}
          />
        )}

        {/* Attempt Modal */}
        {attemptModalTarget && (
          <PYQAttemptModal
            isOpen={true}
            year={year}
            slot={attemptModalTarget.slot}
            section={attemptModalTarget.section}
            subjectAttemptsCount={sectionStats[attemptModalTarget.section]?.attemptsCount || 0}
            isSubjectLocked={Boolean(sectionStats[attemptModalTarget.section]?.isLocked)}
            onClose={() => setAttemptModalTarget(null)}
            onExamFinished={() => {
              loadAttempts();
            }}
          />
        )}
      </div>
    </div>
  );
}
