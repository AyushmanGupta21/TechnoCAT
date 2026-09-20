"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import styles from "./WhatYouGetSection.module.css";

const stats = [
  {
    id: "full_mocks",
    number: "35",
    title: "Full-length CAT Mocks",
    details: ["20 Proctored Full Mocks", "15 Unproctored Full Mocks"],
    route: "/dashboard",
  },
  {
    id: "sectionals",
    number: "45",
    title: "Sectional CAT Mock Tests",
    details: ["15 CAT Mocks Each for VARC, LRDI & QA"],
    route: "/topics",
  },
  {
    id: "pyqs",
    number: "24",
    title: "PYQs as Mocks",
    details: ["Attempt Actual exam-level Papers as CAT Mocks"],
    route: "/browse",
  },
  {
    id: "omet",
    number: "15",
    title: "OMET Mocks",
    details: ["XAT, NMAT, SNAP, MAHCET, & Other MBA Exams"],
    isModal: true,
  },
  {
    id: "solutions",
    number: "100%",
    title: "Detailed Solutions",
    details: ["Textual + Video Solutions of CAT Mocks"],
    route: "/topics",
  },
  {
    id: "ai_analysis",
    number: "AI",
    title: "AI-Powered Mock Analysis",
    details: ["Save 3x Time in CAT Mocks Analysis"],
    route: "/intelligence/ai-analysis",
  },
];

const featureIcons = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    label: "Personalized Study Plan",
    route: "/dashboard",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    label: "Strategy Builder",
    route: "/intelligence",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    label: "Weak Topic Recommendations",
    route: "/intelligence/ai-analysis",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
    label: "Progress Reports",
    route: "/analytics",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="12" x="2" y="6" rx="1" />
        <rect width="7" height="16" x="15" y="2" rx="1" />
        <path d="M9 13H15" />
      </svg>
    ),
    label: "Mobile Friendly Platform",
    route: "/dashboard",
  },
];

export default function WhatYouGetSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);

  const handleRouteClick = (route: string) => {
    if (!user || user.isGuest) {
      openAuthModal("signup");
    } else {
      router.push(route);
    }
  };

  const handleStatClick = (stat: typeof stats[0]) => {
    if (stat.isModal) {
      setModalData({
        badge: "OMET PREPARATION",
        title: "15 Other Management Entrance Tests (OMETs)",
        description:
          "Targeting XLRI, NMIMS, SIBM, or SNAP/MICAT colleges? Practice with dedicated mock tests matching the exact question pattern, speed requirements, and scoring algorithms of each OMET.",
        highlights: [
          "XAT Decision Making & Verbal Ability sectional mock drills",
          "SNAP 60-minute speed tests with negative marking analytics",
          "NMAT adaptive mock simulator & score range forecaster",
          "CMAT & MICAT full-length papers with video explanations"
        ],
        primaryBtnText: "Explore OMET Test Series",
        onPrimaryClick: () => {
          if (!user || user.isGuest) {
            openAuthModal("signup");
          } else {
            router.push("/dashboard");
          }
        }
      });
      return;
    }

    if (stat.route) {
      handleRouteClick(stat.route);
    }
  };

  return (
    <>
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.heading}>
            What You Get in TechnoCAT Mocks
          </h2>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            {stats.map((s, i) => (
              <div
                key={i}
                className={styles.statCard}
                onClick={() => handleStatClick(s)}
                title={`Click to view ${s.title}`}
              >
                <div className={styles.statNumber}>{s.number}</div>
                <div className={styles.statTitle}>{s.title}</div>
                <div className={styles.statDetails}>
                  {s.details.map((d, j) => (
                    <p key={j} className={styles.statDetail}>{d}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feature icon row */}
          <div className={styles.featureRow}>
            {featureIcons.map((f, i) => (
              <div
                key={i}
                className={styles.featureItem}
                onClick={() => handleRouteClick(f.route)}
                title={`Click to explore ${f.label}`}
              >
                <span className={styles.featureIcon}>{f.icon}</span>
                <span className={styles.featureLabel}>{f.label}</span>
              </div>
            ))}
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

