"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import { GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, type Tint } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./PricingSection.module.css";

const plans = [
  {
    name: "TechnoCAT Basic",
    desc: "5 Full Mocks + Analysis",
    price: "FREE",
    features: [
      "1 Full Proctored CAT Mock with Live Percentile",
      "6 Free Sectional Tests (2 QA, 2 DILR, 2 VARC)",
      "Instant Score Card & Basic Accuracy Analysis",
      "Access to Previous Year CAT Papers as Mocks"
    ],
    isFree: true,
  },
  {
    name: "TechnoCAT Pro",
    desc: "35 Full Mocks + 45 Sectionals",
    price: "₹2,499",
    popular: true,
    features: [
      "35 Full-Length CAT Mocks (20 Proctored + 15 Unproctored)",
      "45 Sectional Tests with In-Depth Video Solutions",
      "AI-Powered Error Tracking & Weakness Diagnosis",
      "All-India Live Percentile Rank Benchmarking"
    ],
    isFree: false,
  },
  {
    name: "TechnoCAT Premium",
    desc: "All Mocks + Mentorship + PYQs",
    price: "₹4,999",
    features: [
      "Everything in Pro + 15 OMET Mocks (XAT, SNAP, NMAT)",
      "1-on-1 Strategy & Mentorship Session with IIM Alumni",
      "24x7 Priority AI Doubt Solver & Chat Tutor",
      "GD-PI & SOP Generator for Top B-Schools"
    ],
    isFree: false,
  },
];

// Display copy in sentence case; the original strings above still feed the modal.
const DISPLAY: Record<string, { desc: string; features: string[] }> = {
  "TechnoCAT Basic": {
    desc: "Try the full exam experience before you commit.",
    features: [
      "1 full proctored CAT mock with live percentile",
      "6 sectional tests (2 QA, 2 DILR, 2 VARC)",
      "Instant scorecard and accuracy analysis",
      "Previous year CAT papers as mocks",
    ],
  },
  "TechnoCAT Pro": {
    desc: "35 full mocks and 45 sectionals for the whole season.",
    features: [
      "35 full-length CAT mocks (20 proctored, 15 unproctored)",
      "45 sectional tests with video solutions",
      "AI error tracking and weakness diagnosis",
      "Live all-India percentile benchmarking",
    ],
  },
  "TechnoCAT Premium": {
    desc: "Everything, plus mentorship and OMET mocks.",
    features: [
      "Everything in Pro, plus 15 OMET mocks (XAT, SNAP, NMAT)",
      "1-on-1 strategy session with IIM alumni",
      "24x7 priority AI doubt solver and chat tutor",
      "GD-PI and SOP generator for top B-schools",
    ],
  },
};

export default function PricingSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", "/dashboard");
      }
      openAuthModal("signin");
      return;
    }

    if (plan.isFree) {
      router.push("/dashboard");
    } else {
      setModalData({
        badge: plan.name,
        title: `Enroll in ${plan.name} (${plan.price})`,
        description: `Get full access to ${plan.desc}. Complete syllabus coverage with real CAT-standard simulations, detailed video solutions, and Indra's AI feedback loop.`,
        highlights: plan.features,
        primaryBtnText: "Go to Test Dashboard",
        onPrimaryClick: () => router.push("/dashboard"),
      });
    }
  };

  return (
    <>
      <section id="courses" className={`${ui.section} ${styles.section}`}>
        <div className={ui.container}>
          <SectionHead
            className={styles.head}
            eyebrow="Packages"
            title={<>TechnoCAT mock <GradientText>packages</GradientText></>}
            lede="Start free. Upgrade for the full series, sectionals and mentorship."
          />

          <RevealGroup className={styles.grid} stagger={0.05}>
            {plans.map((plan, i) => {
              const d = DISPLAY[plan.name];
              const featured = !!plan.popular;
              const tint: Tint | undefined = featured ? undefined : i === 0 ? "teal" : "violet";
              return (
                <RevealItem
                  key={plan.name}
                  id={i === 1 ? "pro-full-mocks" : i === 2 ? "omet-mocks" : undefined}
                  className={styles.cell}
                >
                  <SpotlightCard
                    tone={featured ? "dark" : "light"}
                    tint={tint}
                    className={`${styles.card} ${featured ? styles.featured : ""} ${tint ? styles[`t_${tint}`] : ""}`}
                    onClick={() => handlePlanClick(plan)}
                    title={`View ${plan.name}`}
                  >
                    <div className={styles.cardTop}>
                      <h3 className={styles.name}>{plan.name.replace("TechnoCAT ", "")}</h3>
                      {featured && (
                        <span className={styles.tag}>
                          <span className={ui.liveDot} aria-hidden="true" />
                          Most chosen
                        </span>
                      )}
                    </div>
                    <p className={styles.desc}>{d.desc}</p>

                    <div className={styles.priceRow}>
                      <span className={styles.price}>
                        {plan.isFree ? "₹0" : plan.price}
                      </span>
                      {plan.isFree && <span className={styles.per}>no credit card required</span>}
                    </div>

                    <ul className={styles.features}>
                      {d.features.map((f) => (
                        <li key={f}>
                          <Check size={16} strokeWidth={2} className={styles.check} aria-hidden="true" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`${ui.btn} ${featured ? ui.btnLight : i === 0 ? ui.btnPrimary : ui.btnSecondary} ${styles.cta}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanClick(plan);
                      }}
                    >
                      {i === 0 ? "Start free" : "Enroll now"}
                      <ArrowRight size={16} strokeWidth={1.75} data-arrow aria-hidden="true" />
                    </button>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
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
