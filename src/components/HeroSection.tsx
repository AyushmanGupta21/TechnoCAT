"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);

  const handleAuthAction = (destination: string) => {
    if (!user || user.isGuest) {
      openAuthModal("signup");
    } else {
      router.push(destination);
    }
  };

  const handleEnroll = () => {
    const el = document.getElementById("courses");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      handleAuthAction("/dashboard");
    }
  };

  const openTestTakersModal = () => {
    setModalData({
      badge: "ALL-INDIA BENCHMARK",
      title: "20,000+ Serious CAT Aspirants",
      description:
        "Compete against India's most focused CAT candidates. Every mock test gives you an instant All-India Percentile ranking and section-wise standing.",
      highlights: [
        "Live All-India percentile calculated with every submission",
        "Compare question-wise accuracy and time spent against the top 1%",
        "Sectional pacing analysis: VARC, DILR, and QA benchmarked live"
      ],
      primaryBtnText: "Attempt Free Mock Now",
      onPrimaryClick: () => handleAuthAction("/dashboard")
    });
  };

  const openToppersModal = () => {
    setModalData({
      badge: "HALL OF FAME",
      title: "580+ 99%ilers in CAT 2025",
      description:
        "TechnoCAT learners consistently dominate the 99th percentile, converting dream calls at IIM Ahmedabad, Bangalore, Calcutta, Lucknow, and FMS Delhi.",
      highlights: [
        "Average percentile jump of +14.2% within first 6 mocks",
        "Over 82 students scored 99.8+ percentile in QA & DILR",
        "Includes 1-on-1 interview and GD-PI mentorship from IIM alumni"
      ],
      primaryBtnText: "Start Preparation Free",
      onPrimaryClick: () => handleAuthAction("/dashboard")
    });
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Left: Text content */}
            <div className={styles.leftCol}>
              {/* Badge */}
              <div className={styles.heroBadge}>
                <span className={styles.badgePulse} />
                <span>AI-Powered CAT Mock Series 2026</span>
              </div>

              {/* Heading */}
              <h1 className={styles.heading}>
                TechnoCAT: Best CAT Mock Test
                <span className={styles.headingAccent}> – 35 Full Mocks &amp; AI Analysis</span>
              </h1>

              {/* Subtitle / Description */}
              <p className={styles.description}>
                Personalized AI Mentor based on Your Performance &amp; Indra&apos;s Mock Analysis
                which reduces your Mock Analysis time from 3 hrs to 0 hrs.
              </p>

              {/* Feature Chips / Pills */}
              <div className={styles.featureChips}>
                <span className={styles.chipItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  35 Full CAT Mocks
                </span>
                <span className={styles.chipItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  45 Sectional Tests
                </span>
                <span className={styles.chipItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Detailed Video Solutions
                </span>
                <span className={styles.chipItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All-India Percentiles
                </span>
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className={styles.ctaGroup}>
                <div className={styles.primaryCtaRow}>
                  <button
                    className={styles.freeAttemptBtn}
                    onClick={() => handleAuthAction("/dashboard")}
                  >
                    <span className={styles.freeBadge}>FREE</span>
                    <span>Attempt TechnoCAT 6.0 Mock</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className={styles.enrollBtn} onClick={handleEnroll}>
                    Enroll for 2026 Mock Series
                  </button>
                </div>

                <div className={styles.secondaryCtaRow}>
                  <button
                    className={styles.pyqBtn}
                    onClick={() => handleAuthAction("/browse?section=pyqs#pyq-section")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>Attempt Past Year Paper as Mock</span>
                  </button>
                  <button
                    className={styles.whatsappBtn}
                    onClick={() =>
                      window.open("https://chat.whatsapp.com/sample-technocat-cat2026", "_blank")
                    }
                  >
                    <svg
                      className={styles.whatsappIcon}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M21.98 11.41c-.34-5.8-5.61-10.27-11.68-9.27-4.18.69-7.53 4.08-8.18 8.26-.38 2.42.12 4.71 1.21 6.6l-.89 3.31c-.2.75.49 1.43 1.23 1.22l3.26-.9c1.48.87 3.21 1.37 5.06 1.37 5.64 0 10.32-4.97 9.99-10.59z" />
                    </svg>
                    <span>Join Community (20k+)</span>
                  </button>
                </div>
              </div>

              {/* Free sectionals card */}
              <div
                className={styles.sectionalsCard}
                onClick={() => handleAuthAction("/browse?section=pyqs#pyq-section")}
              >
                <div className={styles.sectionalsInner}>
                  <div className={styles.sectionalsLeft}>
                    <div className={styles.giftBox}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="8" width="18" height="4" rx="1" />
                        <path d="M12 8v13" />
                        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.sectionalsTitle}>6 CAT Sectionals Free For Everyone</div>
                      <p className={styles.sectionalsDesc}>
                        Attempt <span className={styles.bold}>2 Sectionals</span> each for QA, DILR
                        and VARC with detailed AI analysis and video solutions.
                      </p>
                    </div>
                  </div>
                  <button
                    className={styles.attemptNowBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuthAction("/browse?section=pyqs#pyq-section");
                    }}
                  >
                    <span>Attempt Now</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Mockup frame + Attempt Bar + Stats */}
            <div className={styles.rightCol}>
              <div className={styles.rightContentWrapper}>
                {/* Mockup Frame */}
                <div
                  className={styles.videoWrapper}
                  onClick={() => handleAuthAction("/dashboard")}
                  title="Click to attempt mock in dashboard"
                >
                  <div className={styles.videoThumb}>
                    <img
                      src="/dashboard.jpg"
                      alt="CAT mock test interface"
                      className={styles.videoImg}
                      width={680}
                      height={380}
                    />
                    <div className={styles.playOverlay}>
                      <button className={styles.playBtn} aria-label="CAT Online Coaching Video">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.playIcon}
                        >
                          <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attempt Mock Link Bar */}
                <div
                  className={styles.attemptBar}
                  onClick={() => handleAuthAction("/dashboard")}
                  title="Click to attempt mock in dashboard"
                >
                  <p className={styles.attemptBarText}>
                    <span>Attempt TechnoCAT 6.0 Mock Now</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>

                {/* Stats cards */}
                <div className={styles.statsRow}>
                  <div
                    className={styles.statCard}
                    onClick={openTestTakersModal}
                    title="Click to view All-India benchmark info"
                  >
                    <div className={styles.statCardInner}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                        <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                        <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                        <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
                      </svg>
                      <span className={styles.statNumber}>20,000+</span>
                    </div>
                    <span className={styles.statLabel}>Active Test Takers</span>
                  </div>

                  <div
                    className={styles.statCardOrange}
                    onClick={openToppersModal}
                    title="Click to view 99%ilers Hall of Fame"
                  >
                    <div className={styles.statOrangeTop}>
                      <span className={styles.statNumberWhite}>580+</span>
                      <div className={styles.avatarStack}>
                        {[11, 12, 13, 14, 12].map((id, i) => (
                          <img
                            key={i}
                            src={`https://i.pravatar.cc/40?img=${id}`}
                            alt="IIM Call Winner"
                            className={styles.avatar}
                            style={{ zIndex: 5 - i, borderColor: "#2563EB" }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className={styles.statLabelWhite}>99%ilers in CAT 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CardInfoModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        data={modalData}
      />
    </>
  );
}

