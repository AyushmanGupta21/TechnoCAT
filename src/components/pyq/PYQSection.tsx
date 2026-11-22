"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PYQ_YEARS } from "@/data/pyqData";
import { useAuth } from "@/context/AuthContext";
import PYQYearModal from "./PYQYearModal";
import styles from "./PYQSection.module.css";

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
            <div className={styles.pillBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Official CAT Full Mocks &amp; Archives
            </div>
            {unvisitedNewCount > 0 && (
              <span className={styles.headerNewPill}>
                <span className={styles.newDot} aria-hidden="true" />
                {unvisitedNewCount} New {unvisitedNewCount === 1 ? "Paper" : "Papers"} Added (2017–2023)
              </span>
            )}
          </div>
          <h2 className={styles.sectionTitle}>TechnoCAT Full Mocks &amp; Previous Year Papers</h2>
          <p className={styles.sectionSubtitle}>
            Practice with authentic CAT question papers from 2017 to 2024. Read step-by-step solutions or test your percentile in timed exam simulations.
          </p>
        </div>
      </div>

      <div className={styles.pyqGrid}>
        {PYQ_YEARS.map((y) => {
          const isAvailable = y.available;
          const showNewBanner = hydrated && isAvailable && Boolean(y.isNew) && !visitedYearSet.has(y.year);
          const totalSections = y.slots.length * y.sections.length;

          return (
            <div
              key={y.year}
              className={`${styles.pyqCard} ${!isAvailable ? styles.pyqCardDisabled : ""} ${showNewBanner ? styles.pyqCardNew : ""}`}
              onClick={() => {
                if (isAvailable) openYearModal(y.year);
              }}
            >
              {/* Card Banner */}
              <div
                className={styles.cardBanner}
                style={{
                  background: isAvailable
                    ? "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)"
                    : "linear-gradient(135deg, #334155 0%, #475569 100%)",
                }}
              >
                <div className={styles.cardBannerOverlay} />
                <div className={styles.yearWatermark}>{y.year}</div>

                <div className={styles.bannerTopRow}>
                  <div className={styles.bannerTopLeft}>
                    <span className={`${styles.statusPill} ${isAvailable ? styles.pillActive : styles.pillDisabled}`}>
                      {y.badge}
                    </span>
                    {showNewBanner && (
                      <span className={styles.newBanner}>
                        <span className={styles.newDot} aria-hidden="true" />
                        NEW
                      </span>
                    )}
                  </div>
                  {isAvailable && (
                    <span className={styles.slotsPill}>
                      {y.slots.length} Slots • {totalSections} Sections
                    </span>
                  )}
                </div>

                <div className={styles.bannerBottom}>
                  <h3 className={styles.pyqCardYearTitle}>{y.label}</h3>
                  <span className={styles.questionCountText}>
                    {isAvailable ? `${y.totalQuestions} Questions Available` : "Archival Pool"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <p className={styles.cardDesc}>
                  {y.tagline}. Includes VARC, DILR, and Quantitative Ability with step-by-step video aligned explanations.
                </p>

                <div className={styles.sectionPillsRow}>
                  <span className={styles.subPill}>VARC</span>
                  <span className={styles.subPill}>DILR</span>
                  <span className={styles.subPill}>QUANT</span>
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
                      <span>Explore {y.year} PYQs</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  ) : (
                    <button type="button" className={styles.comingSoonBtn} disabled>
                      <span>Coming Soon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
