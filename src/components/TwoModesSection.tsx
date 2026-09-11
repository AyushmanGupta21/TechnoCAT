"use client";
import React from "react";
import Link from "next/link";
import styles from "./TwoModesSection.module.css";
import { useAuth } from "@/context/AuthContext";

export default function TwoModesSection() {
  const { user, openAuthModal } = useAuth();

  const handleModeClick = (e: React.MouseEvent) => {
    if (!user || user.isGuest) {
      e.preventDefault();
      openAuthModal("signin");
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>

        <div className={styles.modesGrid}>
          
          {/* CLASSIC MODE CARD */}
          <div className={`${styles.modeCard} ${styles.classicCard}`}>
            {/* Decorations */}
            <div className={styles.decorClassicShape1}></div>
            <div className={styles.decorClassicPattern}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="10" cy="10" r="2" fill="#BAE6FD"/>
                <circle cx="30" cy="10" r="2" fill="#BAE6FD"/>
                <circle cx="50" cy="10" r="2" fill="#BAE6FD"/>
                <circle cx="10" cy="30" r="2" fill="#BAE6FD"/>
                <circle cx="30" cy="30" r="2" fill="#BAE6FD"/>
                <circle cx="50" cy="30" r="2" fill="#BAE6FD"/>
                <circle cx="10" cy="50" r="2" fill="#BAE6FD"/>
                <circle cx="30" cy="50" r="2" fill="#BAE6FD"/>
                <circle cx="50" cy="50" r="2" fill="#BAE6FD"/>
              </svg>
            </div>

            <div className={styles.classicHeader}>
              <div className={styles.classicHeaderLeft}>
                <div className={styles.classicIconBox}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div>
                  <h3 className={styles.classicTitle}>Classic Mode</h3>
                  <p className={styles.classicSubtitle}>Real CAT Experience</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={handleModeClick} className={styles.classicBtn}>
                Try Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            <div className={styles.classicFeatures}>
              <div className={styles.classicFeature}>
                <span className={styles.classicCheck}>✓</span> Actual CAT Interface
              </div>
              <div className={styles.classicFeature}>
                <span className={styles.classicCheck}>✓</span> Smart Navigation
              </div>
              <div className={styles.classicFeature}>
                <span className={styles.classicCheck}>✓</span> Sectional Timing
              </div>
              <div className={styles.classicFeature}>
                <span className={styles.classicCheck}>✓</span> Real Exam Simulation
              </div>
            </div>

            <div className={styles.classicMockupOuter}>
              <div className={styles.classicMockupInner}>
                <div className={styles.classicMockHeader}>
                  <div className={styles.classicMockHeaderLeft}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    </svg>
                    CAT Mock — Classic Mode
                  </div>
                  <span className={styles.classicMockQNum}>Q. 12/34</span>
                </div>
                <div className={styles.classicMockBody}>
                  <div className={styles.classicMockQ}>
                    Q.1 If the ratio of work done by (x+2) workers in (x-3) days to the work done by (x+4) workers in (x-2) days is...
                  </div>
                  <div className={styles.classicMockOptions}>
                    <div className={styles.classicMockOption}>
                      <span className={styles.classicMockOptionLabel}>A</span> Previous
                    </div>
                    <div className={styles.classicMockOption}>
                      <span className={styles.classicMockOptionLabel}>B</span> Chat Tutor
                    </div>
                    <div className={styles.classicMockOption}>
                      <span className={styles.classicMockOptionLabel}>C</span> Switch to Next ▶
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Right Decoration */}
              <div className={styles.decorClassicDoc}>
                <div className={styles.decorClassicDocLine}></div>
                <div className={styles.decorClassicDocLine}></div>
                <div className={styles.decorClassicDocLine}></div>
                <div className={styles.decorClassicClock}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* VS BADGE */}
          <div className={styles.vsBadge}>VS</div>

          {/* MODERN MODE CARD */}
          <div className={`${styles.modeCard} ${styles.modernCard}`}>
            {/* Decorations */}
            <div className={styles.decorModernShape1}></div>
            <div className={styles.decorModernPattern}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="10" cy="10" r="2" fill="#ffffff"/>
                <circle cx="30" cy="10" r="2" fill="#ffffff"/>
                <circle cx="50" cy="10" r="2" fill="#ffffff"/>
                <circle cx="10" cy="30" r="2" fill="#ffffff"/>
                <circle cx="30" cy="30" r="2" fill="#ffffff"/>
                <circle cx="50" cy="30" r="2" fill="#ffffff"/>
                <circle cx="10" cy="50" r="2" fill="#ffffff"/>
                <circle cx="30" cy="50" r="2" fill="#ffffff"/>
                <circle cx="50" cy="50" r="2" fill="#ffffff"/>
              </svg>
            </div>

            <div className={styles.modernHeader}>
              <div className={styles.modernHeaderLeft}>
                <div className={styles.modernIconBox}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3 className={styles.modernTitle}>Modern Mode</h3>
                  <p className={styles.modernSubtitle}>TechnoCAT Mock UI</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={handleModeClick} className={styles.modernBtn}>
                Try Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            <div className={styles.modernFeatures}>
              <div className={styles.modernFeature}>
                <span className={styles.modernCheck}>✓</span> Smooth and Interactive UI
              </div>
              <div className={styles.modernFeature}>
                <span className={styles.modernCheck}>✓</span> Smart Navigation To Tabs
              </div>
              <div className={styles.modernFeature}>
                <span className={styles.modernCheck}>✓</span> Enhanced Analytics
              </div>
              <div className={styles.modernFeature}>
                <span className={styles.modernCheck}>✓</span> Distraction-Free Experience
              </div>
            </div>

            <div className={styles.modernMockupOuter}>
              <div className={styles.modernMockupInner}>
                <div className={styles.modernMockHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  CAT Mock — Modern Mode
                </div>
                <div className={styles.modernMockBody}>
                  <div className={styles.modernMockQ}>
                    The passage mentions several examples of corporations that claimed their actions were necessary for...
                  </div>
                  <div className={styles.modernMockOptions}>
                    <div className={styles.modernMockOption}>Option A</div>
                    <div className={styles.modernMockOption}>Option B</div>
                    <div className={styles.modernMockOption}>Option C</div>
                    <div className={styles.modernMockOption}>Option D</div>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Right Decoration */}
              <div className={styles.decorModernAiBox}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
                <div className={styles.decorModernAiText}>AI</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
