"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  PYQ_YEARS,
  getPYQSectionInfo,
  SECTION_METADATA,
  PYQWeakAreaItem,
} from "@/data/pyqData";
import PYQStudyModal from "./PYQStudyModal";
import PYQAttemptModal from "./PYQAttemptModal";
import {
  BookOpen,
  Check,
  Circle,
  CircleCheck,
  Clock,
  FileText,
  FileX,
  History,
  Lock,
  Play,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import styles from "./PYQYearModal.module.css";

interface PYQYearModalProps {
  isOpen: boolean;
  year: number;
  onClose: () => void;
}

const ALL_SECTIONS: Array<"VARC" | "DILR" | "QUANT"> = ["VARC", "DILR", "QUANT"];

export default function PYQYearModal({
  isOpen,
  year,
  onClose,
}: PYQYearModalProps) {
  const router = useRouter();

  // Slot tab (one slot shown at a time)
  const [activeSlot, setActiveSlot] = useState<string>("");

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when year modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key if no sub-modal is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !studyModalTarget && !attemptModalTarget && !analyticsTarget) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, studyModalTarget, attemptModalTarget, analyticsTarget, onClose]);


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

  // Attempts and lock state come from the server only (locks are enforced there).
  const loadAttempts = useCallback(async () => {
    try {
      // Old builds kept lock copies in the browser; remove them so they can never override the server.
      ALL_SECTIONS.forEach((sec) => {
        localStorage.removeItem(`technocat_pyq_attempts_${sec}`);
        localStorage.removeItem(`technocat_pyq_lock_${sec}`);
      });
      const res = await fetch(`/api/pyq/attempts?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        if (json.attempts) setAttemptsData(json.attempts);
        if (json.sectionStats) setSectionStats(json.sectionStats);
      }
    } catch (err) {
      console.error("[PYQ] Could not load attempts", err);
    }
  }, [year]);

  useEffect(() => {
    if (isOpen) {
      loadAttempts();
    }
  }, [isOpen, loadAttempts]);

  const yearInfo = useMemo(() => PYQ_YEARS.find((y) => y.year === year), [year]);
  const availableSlots = useMemo(() => yearInfo?.slots || ["Slot 1", "Slot 2", "Slot 3"], [yearInfo]);

  // Keep the active slot tab valid for this year's available slots
  useEffect(() => {
    setActiveSlot((prev) => (availableSlots.includes(prev) ? prev : availableSlots[0] || ""));
  }, [availableSlots]);

  // Generate valid section-slot cards for available slots only
  const allCards = useMemo(() => {
    const list: Array<{
      slot: string;
      section: "VARC" | "DILR" | "QUANT";
      info: ReturnType<typeof getPYQSectionInfo>;
    }> = [];

    availableSlots.forEach((slot) => {
      ALL_SECTIONS.forEach((section) => {
        const info = getPYQSectionInfo(year, slot, section);
        if (info.totalCount > 0) {
          list.push({
            slot,
            section,
            info,
          });
        }
      });
    });

    return list;
  }, [year, availableSlots]);

  // Sections of the active slot
  const slotCards = useMemo(
    () => allCards.filter((card) => card.slot === activeSlot),
    [allCards, activeSlot]
  );

  const slotQuestionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    availableSlots.forEach((slot) => {
      totals[slot] = allCards
        .filter((c) => c.slot === slot)
        .reduce((sum, c) => sum + c.info.totalCount, 0);
    });
    return totals;
  }, [allCards, availableSlots]);

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

  const handleTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % availableSlots.length
        : (idx - 1 + availableSlots.length) % availableSlots.length;
    setActiveSlot(availableSlots[next]);
    const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs?.[next]?.focus();
  };

  if (!mounted || !isOpen) return null;

  const isMockYear = year === 2024;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modalBox} ${attemptModalTarget || studyModalTarget ? styles.modalBoxBehind : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pyq-year-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>
              {isMockYear ? "TechnoCAT 6.0 full mock" : `CAT ${year} archive`}
              <span className={styles.eyebrowMeta}>
                {isMockYear ? "Free all-India live simulation" : "Official question papers"}
              </span>
            </span>
            <h2 id="pyq-year-title" className={styles.headerTitle}>
              {isMockYear ? (
                <>TechnoCAT 6.0 full mock <span className="text-gradient">(CAT {year})</span></>
              ) : (
                <>CAT <span className="text-gradient">{year}</span> question papers</>
              )}
            </h2>
            <p className={styles.headerSubtitle}>
              {availableSlots.length} slots × 3 sections. Pick a slot, then read a section with solutions or sit it as a timed, proctored attempt.
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Slot tabs */}
        <div className={styles.tabBar}>
          <div className={styles.tabs} role="tablist" aria-label="Exam slot">
            {availableSlots.map((slot, idx) => {
              const isActive = slot === activeSlot;
              const total = slotQuestionTotals[slot] || 0;
              return (
                <button
                  key={slot}
                  type="button"
                  role="tab"
                  id={`pyq-slot-tab-${idx}`}
                  aria-selected={isActive}
                  aria-controls="pyq-slot-panel"
                  tabIndex={isActive ? 0 : -1}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                  onClick={() => setActiveSlot(slot)}
                  onKeyDown={(e) => handleTabKey(e, idx)}
                >
                  <span className={styles.tabLabel}>{slot}</span>
                  <span className={styles.tabMeta}>{total > 0 ? `${total} Qs` : "No paper"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.bodyContent}>
          {/* Lockout & weak-area checklist */}
          {lockedSubject && (
            <div className={`glass-card ${styles.lockoutBanner}`} data-tint="coral">
              <div className={styles.lockoutBannerHeader}>
                <div className={styles.lockoutLeft}>
                  <span className={styles.lockoutIcon} aria-hidden="true">
                    <Lock size={18} />
                  </span>
                  <div>
                    <h3 className={styles.lockoutTitle}>
                      {lockedSubject} is locked across all slots
                    </h3>
                    <p className={styles.lockoutSubtitle}>
                      You have used all 3 attempts for {lockedSubject} in this cycle. Finish the weak-area lessons below,
                      picked from the questions you missed. The section unlocks automatically once every lesson is done.
                    </p>
                  </div>
                </div>
                <div className={styles.lockoutProgress}>
                  <span className={styles.lockoutProgressVal}>
                    {completedCount}<span>/{activeWeakAreas.length}</span>
                  </span>
                  <span className={styles.lockoutProgressLbl}>lessons done</span>
                  <span className={styles.progressTrack} aria-hidden="true">
                    <span
                      className={styles.progressFill}
                      style={{ width: `${activeWeakAreas.length ? Math.round((completedCount / activeWeakAreas.length) * 100) : 0}%` }}
                    />
                  </span>
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
                        <span
                          className={`${styles.checkCircle} ${
                            item.completed ? styles.circleDone : styles.circlePending
                          }`}
                          aria-hidden="true"
                        >
                          {item.completed ? <CircleCheck size={18} /> : <Circle size={18} />}
                        </span>
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
                        {item.completed ? (
                          "Review again"
                        ) : (
                          <>
                            <Play size={13} aria-hidden="true" /> Watch lesson
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sections of the active slot */}
          <div
            id="pyq-slot-panel"
            role="tabpanel"
            aria-labelledby={`pyq-slot-tab-${Math.max(0, availableSlots.indexOf(activeSlot))}`}
            className={styles.sectionList}
          >
            {slotCards.length === 0 ? (
              <div className={styles.slotEmpty}>
                <span className={styles.slotEmptyIcon} aria-hidden="true">
                  <FileX size={20} />
                </span>
                <h3>No questions archived for {activeSlot}</h3>
                <p>This slot&rsquo;s paper isn&rsquo;t in the archive yet. Try another slot.</p>
              </div>
            ) : (
              slotCards.map(({ slot, section, info }) => {
                const meta = SECTION_METADATA[section];
                const stat = sectionStats[section];
                const isLocked = stat?.isLocked;
                const attemptsCount = stat?.attemptsCount || 0;
                const slotAttempts = attemptsData.filter(
                  (a) => a.section?.toUpperCase() === section && a.slot === slot
                );
                const lastSlotAttempt = slotAttempts[0];

                return (
                  <article
                    key={`${slot}-${section}`}
                    className={`${styles.sectionRow} ${isLocked ? styles.sectionRowLocked : ""}`}
                    data-sec={section}
                  >
                    {/* Identity */}
                    <div className={styles.rowIdentity}>
                      <span className={styles.secBar} aria-hidden="true" />
                      <div className={styles.rowTitleWrap}>
                        <h3 className={styles.rowTitle}>{section}</h3>
                        <span className={styles.rowSubtitle}>{meta.title}</span>
                      </div>
                    </div>

                    {/* Specs */}
                    <dl className={styles.rowSpecs}>
                      <div className={styles.spec}>
                        <dt><FileText size={13} aria-hidden="true" /><span>Questions</span></dt>
                        <dd>{info.totalCount}</dd>
                      </div>
                      <div className={styles.spec}>
                        <dt><Clock size={13} aria-hidden="true" /><span>Time</span></dt>
                        <dd>{info.durationMinutes}<small> min</small></dd>
                      </div>
                      <div className={styles.spec}>
                        <dt><span>MCQ · TITA</span></dt>
                        <dd>{info.mcqCount}<small> · </small>{info.titaCount}</dd>
                      </div>
                    </dl>

                    {/* Status */}
                    <div className={styles.rowStatus}>
                      <div className={styles.meterRow}>
                        <span className={styles.meterLabel}>Attempts</span>
                        <span className={styles.meter} aria-label={`${attemptsCount} of 3 ${section} attempts used`}>
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className={`${styles.meterSeg} ${i < attemptsCount ? (isLocked ? styles.meterSegLocked : styles.meterSegOn) : ""}`}
                            />
                          ))}
                        </span>
                        <span className={styles.meterVal}>{Math.min(attemptsCount, 3)}/3</span>
                      </div>
                      {isLocked ? (
                        <span className={`${styles.statusBadge} ${styles.statusLocked}`}>
                          <Lock size={13} aria-hidden="true" />
                          <span>Locked · finish the checklist</span>
                        </span>
                      ) : lastSlotAttempt ? (
                        <span className={`${styles.statusBadge} ${styles.statusAttempted}`}>
                          <Check size={13} aria-hidden="true" />
                          <span>
                            Last here <strong>{lastSlotAttempt.score}</strong>/{lastSlotAttempt.total} · <strong>{lastSlotAttempt.percentage}%</strong>
                          </span>
                        </span>
                      ) : attemptsCount > 0 ? (
                        <span className={`${styles.statusBadge} ${styles.statusAttempted}`}>
                          <Check size={13} aria-hidden="true" />
                          <span>
                            Best <strong>{stat.bestScore}</strong> marks · <strong>{stat.bestPercentage}%</strong>
                          </span>
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.statusNotAttempted}`}>
                          <Circle size={12} aria-hidden="true" />
                          <span>Not attempted yet</span>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.btnStudy}
                        onClick={() => info.totalCount > 0 && setStudyModalTarget({ slot, section })}
                        disabled={info.totalCount === 0}
                        title={info.totalCount === 0 ? "No questions available for this slot" : "Read questions, options and full solutions"}
                      >
                        <BookOpen size={16} aria-hidden="true" />
                        <span>Read with solutions</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnAttempt}
                        onClick={() => setAttemptModalTarget({ slot, section })}
                        disabled={isLocked}
                        title={
                          isLocked
                            ? "Section is locked. Complete the weak-area checklist to unlock."
                            : "Take a timed, proctored attempt under CAT conditions"
                        }
                      >
                        {isLocked ? <Lock size={16} aria-hidden="true" /> : <Target size={16} aria-hidden="true" />}
                        <span>Timed attempt</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnAnalytics}
                        onClick={() => setAnalyticsTarget({ slot, section })}
                        title="View past attempts"
                        aria-label={`View past ${section} attempts`}
                      >
                        <History size={17} aria-hidden="true" />
                        <span className={styles.btnAnalyticsText}>Past attempts</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
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
                  <h3 className={styles.analyticsTitle}>
                    <span className={styles.secDot} data-sec={analyticsTarget.section} aria-hidden="true" />
                    {analyticsTarget.section} past attempts
                  </h3>
                  <span className={styles.analyticsSub}>
                    {analyticsTarget.slot} · CAT {year}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setAnalyticsTarget(null)}
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.analyticsList}>
                {(() => {
                  const sectionAttempts = attemptsData.filter(
                    (a) => a.section?.toUpperCase() === analyticsTarget.section.toUpperCase()
                  );

                  if (sectionAttempts.length === 0) {
                    return (
                      <div className={styles.emptyState}>
                        <span className={styles.emptyBars} aria-hidden="true">
                          <span style={{ height: "40%" }} />
                          <span style={{ height: "70%" }} />
                          <span style={{ height: "55%" }} />
                        </span>
                        <h4>No attempts recorded yet</h4>
                        <p>Take your first timed attempt to see scores, accuracy and strikes here.</p>
                      </div>
                    );
                  }

                  return sectionAttempts.map((att, idx) => {
                    const mcqR = att.mcq_correct || 0;
                    const mcqW = att.mcq_wrong || 0;
                    const titaR = att.tita_correct || 0;
                    const titaW = att.tita_wrong || 0;
                    const mcqT = Math.max(1, mcqR + mcqW);
                    const titaT = Math.max(1, titaR + titaW);
                    return (
                      <div
                        key={att.id || idx}
                        className={`glass-card ${styles.attemptItem}`}
                        data-tint={idx === 0 ? "blue" : "teal"}
                      >
                        <div className={styles.attemptItemHeader}>
                          <span className={styles.attemptTag}>
                            Attempt #{sectionAttempts.length - idx} · {att.slot}
                          </span>
                          <span className={styles.attemptDate}>
                            {att.completed_at ? new Date(att.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                          </span>
                        </div>

                        <div className={styles.attemptScoreRow}>
                          <span className={styles.attemptBigScore}>{att.score}</span>
                          <span className={styles.attemptTotal}>/ {att.total} marks</span>
                          <span className={styles.attemptAccuracy}>{att.percentage}%</span>
                        </div>

                        <div className={styles.attemptMetricsGrid}>
                          <div className={styles.attemptMetricItem}>
                            <span>{mcqR} / {mcqW}</span>
                            <span>MCQ right / wrong</span>
                            <span className={styles.rwBar} aria-hidden="true">
                              <span className={styles.rwRight} style={{ width: `${(mcqR / mcqT) * 100}%` }} />
                              <span className={styles.rwWrong} style={{ width: `${(mcqW / mcqT) * 100}%` }} />
                            </span>
                          </div>
                          <div className={styles.attemptMetricItem}>
                            <span>{titaR} / {titaW}</span>
                            <span>TITA right / wrong</span>
                            <span className={styles.rwBar} aria-hidden="true">
                              <span className={styles.rwRight} style={{ width: `${(titaR / titaT) * 100}%` }} />
                              <span className={styles.rwWrong} style={{ width: `${(titaW / titaT) * 100}%` }} />
                            </span>
                          </div>
                          <div className={styles.attemptMetricItem}>
                            <span className={(att.strikes || 0) > 0 ? styles.strikeVal : ""}>{att.strikes || 0}</span>
                            <span className={styles.strikeLbl}>
                              <ShieldCheck size={12} aria-hidden="true" />
                              Strikes
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
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
    </div>,
    document.body
  );
}
