"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import styles from "./VideoReviewsSection.module.css";

const videoReviews = [
  {
    title: "TechnoCAT Mock Review by Vinayak Agarwal (99.99%ile)",
    thumb: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
    badge: "CAT 99.99%ILE TOPPER",
    quote: "TechnoCAT's DILR sets and AI mock analysis accurately predicted my strong topics and helped me shave 25 minutes off time management.",
    bullets: [
      "Converted: IIM Ahmedabad & IIM Calcutta",
      "Strategy: Solved 28 TechnoCAT full mocks in test-day conditions",
      "Key Tip: Used the Error Tracker to diagnose recurring algebra traps"
    ]
  },
  {
    title: "TechnoCAT Mock Analysis — How I cracked CAT in 3 months",
    thumb: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
    badge: "99.42%ILE IN 90 DAYS",
    quote: "Starting late in August, the automated error tracking and sectional drills were life savers. I focused 100% on high-ROI questions.",
    bullets: [
      "Converted: IIM Lucknow & FMS Delhi",
      "Sectionals attempted: 35 targeted topic tests",
      "Key Tip: Indra Sir's video solutions clarify nuances in 4-5 minutes"
    ]
  },
  {
    title: "TechnoCAT vs Other Mock Series — Honest Review",
    thumb: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    badge: "IN-DEPTH BENCHMARK",
    quote: "Other mocks inflate difficulties unnaturally; TechnoCAT replicates the actual IIM CAT calibration and real time-pressure UI.",
    bullets: [
      "Converted: SPJIMR & IIM Kozhikode",
      "Accuracy gain: +18% in Reading Comprehension",
      "Key Tip: Dual UI (Classic + Modern) eliminates surprises on exam day"
    ]
  },
  {
    title: "AI Mock Analysis Feature — Demo & Review",
    thumb: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80",
    badge: "AI MENTOR DEMO",
    quote: "Mock analysis used to take 3 hours on spreadsheets. TechnoCAT's AI breaks down question attempts and unforced errors instantly.",
    bullets: [
      "Converted: IIM Indore (99.2%ile)",
      "Time saved: 2.5 hours per mock analysis session",
      "Key Tip: Review the AI speed-accuracy quadrant right after submission"
    ]
  },
];

function PlayIcon() {
  return (
    <div className={styles.playBtn}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="var(--primary)"
      >
        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
      </svg>
    </div>
  );
}

export default function VideoReviewsSection() {
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

  const handleCardClick = (review: typeof videoReviews[0]) => {
    setModalData({
      badge: review.badge,
      title: review.title,
      description: `"${review.quote}"`,
      highlights: review.bullets,
      primaryBtnText: "Attempt Free TechnoCAT Mock",
      onPrimaryClick: () => handleAuthAction("/dashboard"),
    });
  };

  return (
    <>
      <section className={styles.section} id="reviews">
        <div className={styles.container}>
          <h2 className={styles.heading}>TechnoCAT Mock Video Reviews</h2>
          <p className={styles.subheading}>
            Hear directly from students who cracked CAT using TechnoCAT mock tests
          </p>

          <div className={styles.carousel}>
            {videoReviews.map((v, i) => (
              <div
                key={i}
                className={styles.videoCard}
                onClick={() => handleCardClick(v)}
                title={`Click to read review by ${v.title}`}
              >
                <div className={styles.thumbWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={v.thumb} 
                    alt={v.title}
                    className={styles.thumbImage}
                  />
                  <PlayIcon />
                </div>
                <p className={styles.videoTitle}>{v.title}</p>
              </div>
            ))}
          </div>

          <div className={styles.cta}>
            <button
              className={styles.ctaBtn}
              onClick={() => handleAuthAction("/intelligence/community")}
            >
              Watch All Reviews &amp; Join Community →
            </button>
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

