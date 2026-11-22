"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PYQ_YEARS } from "@/data/pyqData";
import { useAuth } from "@/context/AuthContext";
import PYQYearModal from "./PYQYearModal";
import { ArrowRight, Lock } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/landing/motion";
import styles from "./PYQSection.module.css";

const YEAR_TINTS = ["blue", "teal", "violet", "amber", "coral"] as const;

interface PYQSectionProps {
  onSelectTopicCategory?: (cat: string) => void;
}

export default function PYQSection({ onSelectTopicCategory }: PYQSectionProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [visitedYears, setVisitedYears] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const storageKey = useMemo(() => {
    const scope = user?.id || (user?.email === "student@technocat.edu" ? "demo" : "anon");
    return `technocat_visited_pyq_years_${scope}`;
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setVisitedYears(Array.isArray(parsed) ? parsed.filter((y): y is number => typeof y === "number") : []);
    } catch {
      setVisitedYears([]);
    } finally {
      setHydrated(true);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setVisitedYears(Array.isArray(parsed) ? parsed.filter((y): y is number => typeof y === "number") : []);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const markYearVisited = useCallback(
    (year: number) => {
      setVisitedYears((prev) => {
        if (prev.includes(year)) return prev;
        const next = [...prev, year];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  const openYearModal = useCallback(
    (year: number) => {
      markYearVisited(year);
      setSelectedYear(year);
    },
    [markYearVisited]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const mockParam = params.get("mock") || params.get("year");
      if (mockParam === "latest" || mockParam === "2024" || mockParam === "free") {
        openYearModal(2024);
      } else if (mockParam && !isNaN(Number(mockParam))) {
        openYearModal(Number(mockParam));
      }
    };

    checkParams();
    window.addEventListener("popstate", checkParams);
    window.addEventListener("hashchange", checkParams);
    return () => {
      window.removeEventListener("popstate", checkParams);
      window.removeEventListener("hashchange", checkParams);
    };
  }, [openYearModal]);

  const handleCloseModal = () => {
    setSelectedYear(null);
    if (typeof window !== "undefined" && window.location.search.includes("mock=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("mock");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const visitedYearSet = useMemo(() => new Set(visitedYears), [visitedYears]);
  const unvisitedNewCount = useMemo(
    () => (hydrated ? PYQ_YEARS.filter((y) => y.available && y.isNew && !visitedYearSet.has(y.year)).length : 0),
    [hydrated, visitedYearSet]
  );

  return (
    <section className={styles.pyqSection} id="pyq-section">
      <div className={styles.sectionHeaderRow}>
        <div>
          <div className={styles.headerBadgesRow}>
            <span className={styles.pillBadge}>Full mocks &amp; past papers</span>
            {unvisitedNewCount > 0 && (
              <span className={styles.headerNewPill}>
                <span className={styles.newDot} aria-hidden="true" />
                <span className={styles.mono}>{unvisitedNewCount}</span> new {unvisitedNewCount === 1 ? "paper" : "papers"} added (2017–2023)
              </span>
            )}
          </div>
          <h2 className={styles.sectionTitle}>
            TechnoCAT full mocks &amp; <span className="text-gradient">previous year papers</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Authentic CAT papers from 2017 to 2024 — read step-by-step solutions or sit a timed, proctored attempt.
          </p>
        </div>
      </div>

      <RevealGroup className={styles.pyqGrid}>
        {PYQ_YEARS.map((y, idx) => {
          const isAvailable = y.available;
          const showNewBanner = hydrated && isAvailable && Boolean(y.isNew) && !visitedYearSet.has(y.year);
          const totalSections = y.slots.length * y.sections.length;
          const tint = isAvailable ? YEAR_TINTS[idx % YEAR_TINTS.length] : "blue";
          const taglineLead = y.tagline.split("•")[0].trim();

          return (
            <RevealItem key={y.year} className={styles.gridItem}>
              <article
                className={`${styles.pyqCard} ${!isAvailable ? styles.pyqCardDisabled : ""} ${showNewBanner ? styles.pyqCardNew : ""}`}
                data-tint={tint}
                onClick={() => {
                  if (isAvailable) openYearModal(y.year);
                }}
              >
                <div className={styles.cardBanner}>
                  <span className={styles.yearWatermark} aria-hidden="true">{y.year}</span>
                  <div className={styles.bannerTopRow}>
                    <span className={`${styles.statusPill} ${isAvailable ? styles.pillActive : styles.pillDisabled}`}>
                      {y.badge}
                    </span>
                    {showNewBanner && (
                      <span className={styles.newBanner}>
                        <span className={styles.newDot} aria-hidden="true" />
                        New
                      </span>
                    )}
                    {isAvailable && (
                      <span className={styles.slotsPill}>
                        <strong>{y.slots.length}</strong> slots
                        <span className={styles.sep} aria-hidden="true" />
                        <strong>{totalSections}</strong> sections
                      </span>
                    )}
                  </div>

                  <div className={styles.bannerBottom}>
                    <h3 className={styles.pyqCardYearTitle}>{y.label}</h3>
                    <span className={styles.questionCountText}>
                      {isAvailable ? (
                        <>
                          <strong>{y.totalQuestions}</strong> questions available
                        </>
                      ) : (
                        "Archival pool"
                      )}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.cardDesc}>
                    {taglineLead}. VARC, DILR and QA with step-by-step solutions.
                  </p>

                  <div className={styles.sectionPillsRow}>
                    <span className={styles.subPill} data-sec="VARC">VARC</span>
                    <span className={styles.subPill} data-sec="DILR">DILR</span>
                    <span className={styles.subPill} data-sec="QUANT">QA</span>
                  </div>

                  <div className={styles.cardFooter}>
                    {isAvailable ? (
                      <button
                        type="button"
                        className={styles.exploreBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          openYearModal(y.year);
                        }}
                      >
                        <span>Explore {y.year} papers</span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" className={styles.comingSoonBtn} disabled>
                        <Lock size={14} aria-hidden="true" />
                        <span>Coming soon</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>

      {/* Year Modal */}
      {selectedYear && (
        <PYQYearModal
          isOpen={true}
          year={selectedYear}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
}
