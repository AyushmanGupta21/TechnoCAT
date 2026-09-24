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
              <h1 className={styles.heading}>
                TechnoCAT: Best CAT Mock Test
                <br className={styles.lgBreak} />
                &nbsp;- 35 Full Mocks &amp; AI Analysis
              </h1>
              <div className={styles.subtext}>
                <p className={styles.description}>
                  Personalized AI Mentor based on Your Performance &amp; Indra&apos;s Mock Analysis
                  which reduces your Mock Analysis time from 3 hrs to 0 hrs.
                </p>
              </div>
              <p className={styles.highlight}>
                Get 35 Full CAT Mock Tests &amp; 45 Sectional Tests with Detailed Video Solutions.
              </p>

              <div className={styles.ctaButtons}>
                <button className={styles.enrollBtn} onClick={handleEnroll}>
                  Enroll Now for TechnoCAT 2026 Mock Tests
                </button>
                <button
                  className={styles.freeAttemptBtn}
                  onClick={() => handleAuthAction("/dashboard")}
                >
                  <span className={styles.freeBadge}>FREE</span>
                  <span className={styles.freeBtnText}>Attempt TechnoCAT 6.0 Mock Now</span>
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
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M21.98 11.41c-.34-5.8-5.61-10.27-11.68-9.27-4.18.69-7.53 4.08-8.18 8.26-.38 2.42.12 4.71 1.21 6.6l-.89 3.31c-.2.75.49 1.43 1.23 1.22l3.26-.9c1.48.87 3.21 1.37 5.06 1.37 5.64 0 10.32-4.97 9.99-10.59z" />
                  </svg>
                  Join Group For Updates
                </button>
                <button
                  className={styles.pyqBtn}
                  onClick={() => handleAuthAction("/browse?section=pyqs#pyq-section")}
                >
                  Attempt Past Year Paper as Mock
                </button>
              </div>

              {/* Free sectionals card */}
              <div
                className={styles.sectionalsCard}
                onClick={() => handleAuthAction("/browse?section=pyqs#pyq-section")}
                style={{ cursor: "pointer" }}
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
                        Attempt <span className={styles.bold}>2 Sectionals</span> each for QA, LRDI
                        and VARC and get detailed analysis and video Solutions.
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
                    Attempt Now
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Video + stats */}
            <div className={styles.rightCol}>
              <section className={styles.videoSection}>
                <div
                  className={styles.videoWrapper}
                  onClick={() => handleAuthAction("/dashboard")}
                  title="Click to attempt mock in dashboard"
                >
                  <div className={styles.videoThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/dashboard.jpg"
                      alt="CAT mock test"
                      className={styles.videoImg}
                      width={430}
                      height={350}
                    />
                    <div className={styles.playOverlay}>
                      <button className={styles.playBtn} aria-label="CAT Online Coaching Video">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
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

                  <div className={styles.attemptBar}>
                    <p className={styles.attemptBarText}>Attempt TechnoCAT 6.0 Mock Now</p>
                  </div>
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
                    <span className={styles.statLabel}>Test Takers</span>
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={`https://i.pravatar.cc/40?img=${id}`}
                            alt="winner"
                            className={styles.avatar}
                            style={{ zIndex: 5 - i, borderColor: "#FB8D00" }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className={styles.statLabelWhite}>99%ilers in CAT 2025</span>
                  </div>
                </div>
              </section>
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

