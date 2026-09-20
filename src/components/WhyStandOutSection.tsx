"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./WhyStandOutSection.module.css";

const features = [
  {
    id: "ai",
    badge: "AI",
    badgeColor: "#2563EB",
    href: "/topics",
    title: "Detailed CAT Mock Video Solutions",
    body: "TechnoCAT provides detailed video solutions for both full length and sectional CAT mock tests.",
    extra: (
      <div className="wsf-extra-box">
        <div className="wsf-extra-label">Weak Topic</div>
        <div className="wsf-extra-value">Geometry</div>
        <div className="wsf-extra-row">
          <span className="wsf-extra-key">Accuracy</span>
          <span className="wsf-extra-pct">68%</span>
        </div>
      </div>
    ),
  },
  {
    id: "error",
    badge: "▶",
    badgeColor: "#111827",
    href: "/intelligence/error-tracking",
    title: "Error Tracker (AI-Based CAT Mock Analysis)",
    body: "This feature tracks all your errors after completing the CAT mock test and provides analysis. Manually analyzing any mock requires a lot of time.",
  },
  {
    id: "analysis",
    badge: "▶",
    badgeColor: "#111827",
    href: "/intelligence/ai-analysis",
    title: "Analysis Across All CAT Mocks",
    body: "Keep a track of your skill level across all CAT mocks: Attempted, Time Taken, Correct, and Incorrect across all the CAT mock.",
  },
  {
    id: "best",
    badge: "★",
    badgeColor: "#2563EB",
    href: "/dashboard",
    title: "Best CAT Mock Test",
    body: "TechnoCAT's CAT mock test interface is really flexible to use. Even if power input gets cut, your mock will automatically get resumed.",
    tag: "BEST CAT MOCK TEST.",
  },
];

export default function WhyStandOutSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleCardClick = (href: string) => {
    if (!user || user.isGuest) {
      openAuthModal("signup");
    } else {
      router.push(href);
    }
  };

  return (
    <section className={styles.section} id="why-stand-out">
      <div className={styles.container}>
        <div className={styles.conceptTag}>CONCEPTUALISED BY INDRAJEET SINGH</div>
        <h2 className={styles.heading}>
          Why do TechnoCAT CAT Mocks Stand Out?
        </h2>

        <div className={styles.grid}>
          {features.map((f) => (
            <div
              key={f.id}
              className={styles.card}
              onClick={() => handleCardClick(f.href)}
              title={`Click to explore ${f.title}`}
            >
              {f.tag && <div className={styles.cardTopTag}>{f.tag}</div>}
              <div className={styles.cardHeader}>
                <span
                  className={styles.badge}
                  style={{ background: f.badgeColor }}
                >
                  {f.badge}
                </span>
                <h3 className={styles.cardTitle}>{f.title}</h3>
              </div>
              <p className={styles.cardBody}>{f.body}</p>
              {f.id === "ai" && (
                <div className={styles.weakTopicBox}>
                  <div className={styles.weakTopicLabel}>Weak Topic</div>
                  <div className={styles.weakTopicValue}>Geometry</div>
                  <div className={styles.accuracyRow}>
                    <span className={styles.accuracyKey}>Accuracy</span>
                    <span className={styles.accuracyPct}>68%</span>
                  </div>
                </div>
              )}
              <button
                className={styles.viewMoreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(f.href);
                }}
              >
                View More
                <span className={styles.viewMoreIcon}>+</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

