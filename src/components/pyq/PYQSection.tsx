"use client";

import React, { useState } from "react";
import { PYQ_YEARS } from "@/data/pyqData";
import PYQYearModal from "./PYQYearModal";
import styles from "./PYQSection.module.css";

interface PYQSectionProps {
  onSelectTopicCategory?: (cat: string) => void;
}

export default function PYQSection({ onSelectTopicCategory }: PYQSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  return (
    <section className={styles.pyqSection}>
      <div className={styles.sectionHeaderRow}>
        <div>
          <div className={styles.pillBadge}>★ Official CAT Archives</div>
          <h2 className={styles.sectionTitle}>Previous Year Questions (PYQs)</h2>
          <p className={styles.sectionSubtitle}>
            Practice with authentic CAT question papers from 2017 to 2024. Read step-by-step solutions or test your percentile in timed exam simulations.
          </p>
        </div>
      </div>

      <div className={styles.pyqGrid}>
        {PYQ_YEARS.map((y) => {
          const isAvailable = y.available;

          return (
            <div
              key={y.year}
              className={`${styles.pyqCard} ${!isAvailable ? styles.pyqCardDisabled : ""}`}
              onClick={() => {
                if (isAvailable) setSelectedYear(y.year);
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
                  <span className={`${styles.statusPill} ${isAvailable ? styles.pillActive : styles.pillDisabled}`}>
                    {y.badge}
                  </span>
                  {isAvailable && (
                    <span className={styles.slotsPill}>3 Slots • 9 Sections</span>
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
                        setSelectedYear(y.year);
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
          onClose={() => setSelectedYear(null)}
        />
      )}
    </section>
  );
}
