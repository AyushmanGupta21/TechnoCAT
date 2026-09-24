"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";

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

export default function PricingSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!user || user.isGuest) {
      openAuthModal("signup");
      return;
    }

    if (plan.isFree) {
      router.push("/dashboard");
    } else {
      setModalData({
        badge: plan.name.toUpperCase(),
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
      <section
        id="courses"
        style={{
          background: "transparent",
          padding: "64px 0",
          scrollMarginTop: "90px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "30px",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 2.6rem)",
                fontWeight: 700,
                color: "var(--text-main)",
                textAlign: "center",
              }}
            >
              TechnoCAT Mocks Packages
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {plans.map((plan, i) => {
              const cardBg =
                i === 0
                  ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                  : i === 1
                  ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                  : "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)";
              const borderColor =
                i === 0 ? "#bae6fd" : i === 1 ? "#ddd6fe" : "#99f6e4";

              return (
                <div
                  key={i}
                  id={i === 1 ? "pro-full-mocks" : i === 2 ? "omet-mocks" : undefined}
                  className={`pricingCard ${i === 1 ? "pro" : ""}`}
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    boxShadow: i === 1 ? "var(--shadow-lg)" : "var(--shadow-sm)",
                    cursor: "pointer",
                    scrollMarginTop: "90px",
                  }}
                  onClick={() => handlePlanClick(plan)}
                  title={`Click to view ${plan.name}`}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      marginBottom: "8px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "14px",
                      marginBottom: "24px",
                    }}
                  >
                    {plan.desc}
                  </p>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "var(--primary-dark)",
                      marginBottom: "24px",
                    }}
                  >
                    {plan.price}
                  </div>
                  <button
                    className={`pricingBtn ${i === 1 ? "pro" : ""}`}
                    style={{
                      background: i === 1 ? "var(--primary)" : "var(--white)",
                      color: i === 1 ? "#fff" : "var(--primary-dark)",
                      border: i === 1 ? "none" : "1px solid var(--primary-light)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanClick(plan);
                    }}
                  >
                    {i === 0 ? "Start Free" : "Enroll Now"}
                  </button>
                </div>
              );
            })}
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
