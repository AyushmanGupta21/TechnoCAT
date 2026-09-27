"use client";
import { useState } from "react";
import styles from "./FaqSection.module.css";

const faqs = [
  {
    q: "Can I get sectional CAT mock tests?",
    a: "Yes, candidates can access 45 sectional mock tests for CAT — including 15 sectional mocks each across VARC, DILR, and Quantitative Ability (QA) — designed to strengthen individual section timing and accuracy.",
  },
  {
    q: "Are the mock tests based on the latest CAT pattern?",
    a: "Yes! Every TechnoCAT full-length and sectional mock is strictly aligned with the latest CAT exam pattern, difficulty distribution, and interface (both Classic CAT view and Modern analytical view). Any official notification updates are reflected immediately.",
  },
  {
    q: "Do I get detailed performance analytics?",
    a: "Absolutely. TechnoCAT provides AI-powered performance analytics after every mock — including your Performance DNA (Accuracy, Speed, Consistency), section-wise percentiles, time-spent breakdown, Error Tracker, and B-School Admission Predictor.",
  },
  {
    q: "Is there a time limit for the mock tests?",
    a: "Yes. Full-length CAT mock tests have a total duration of 120 minutes (2 hours) with a strict 40-minute sectional time limit per section (VARC, DILR, and QA), mirroring the real proctored CAT exam environment.",
  },
  {
    q: "Can I access previous year CAT papers?",
    a: "Yes, TechnoCAT includes actual CAT Previous Year Question (PYQ) papers from 2017 to 2024 across all slots. You can either practice them in study mode with step-by-step solutions or attempt them as full time-bound mocks.",
  },
  {
    q: "Do I need a credit card to access free mocks?",
    a: "No credit card is required. You can sign up for free and immediately claim 6 free sectional tests, 1 full-length TechnoCAT mock, and full access to past year CAT papers.",
  },
  {
    q: "Which is the best CAT mock test series?",
    a: "When it comes to question relevance, real exam interface, and post-mock diagnostics, TechnoCAT's AI-powered mock test series stands out among aspirants with tools like the Goal Tracker, Error Tracker, B-School Predictor, and CAT Mock Comparison.",
  },
  {
    q: "How many CAT mocks should one take before appearing for the actual exam?",
    a: "While there is no rigid number, top 99+%ilers recommend attempting 25–30 full-length mocks along with targeted sectionals and thorough AI error analysis before exam day.",
  },
  {
    q: "How many CAT mocks does TechnoCAT provide?",
    a: "TechnoCAT provides 35 full-length CAT mocks, 45 sectional CAT mock tests across VARC, DILR, and QA, plus complete past year CAT papers with video and text solutions.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={styles.section} id="faq">
      {/* Subtle Ambient & Educational Decorative Elements */}
      <div className={styles.decorCircleTop} aria-hidden="true" />
      <div className={styles.decorCircleBottom} aria-hidden="true" />

      {/* Subtle Paper Plane + Dotted Trail (Top Left/Right Accent) */}
      <div className={styles.decorPaperPlane} aria-hidden="true">
        <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 76C36 72 64 52 98 28"
            stroke="#93C5FD"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
          <path
            d="M136 12L94 24L108 33L136 12Z"
            fill="#DBEAFE"
            stroke="#3B82F6"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M136 12L108 33L112 46L119 36L136 12Z"
            fill="#BFDBFE"
            stroke="#3B82F6"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M136 12L119 36L128 41L136 12Z"
            fill="#EFF6FF"
            stroke="#3B82F6"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Subtle Floating Question Mark (Left Margin Accent) */}
      <div className={styles.decorQuestionMark} aria-hidden="true">
        <svg width="68" height="84" viewBox="0 0 68 84" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="56" height="56" rx="18" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
          <path
            d="M27 26C27 22.134 30.134 19 34 19C37.866 19 41 22.134 41 26C41 29.2 38.8 31.4 36.2 32.7C34.7 33.5 34 34.7 34 36.5V38"
            stroke="#0EA5E9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="34" cy="45" r="2.2" fill="#2563EB" />
        </svg>
      </div>

      {/* Subtle Books Illustration (Bottom Left Margin Accent) */}
      <div className={styles.decorBooks} aria-hidden="true">
        <svg width="96" height="76" viewBox="0 0 96 76" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="48" width="68" height="14" rx="4" fill="#E0F2FE" stroke="#7DD3FC" strokeWidth="1.5" />
          <path d="M22 55H68" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="18" y="32" width="60" height="14" rx="4" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="1.5" />
          <path d="M28 39H66" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="15" y="16" width="54" height="14" rx="4" fill="#F0F9FF" stroke="#93C5FD" strokeWidth="1.5" />
          <path d="M56 16V26L52 23.5L48 26V16" fill="#38BDF8" />
        </svg>
      </div>

      <div className={styles.container}>
        {/* 1. FAQ HERO BANNER */}
        <div className={styles.heroCard}>
          <div className={styles.heroContent}>
            <h2 className={styles.heading}>
              Frequently <span className={styles.headingHighlight}>Asked Questions</span>
            </h2>

            <p className={styles.subHeading}>
              Find quick answers to common questions about TechnoCAT. Still have doubts? We’re here to help!
            </p>
          </div>

          {/* Right Educational FAQ Illustration (Question Mark + Speech Bubbles) */}
          <div className={styles.heroIllustration} aria-hidden="true">
            <svg
              viewBox="0 0 280 210"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.illustrationSvg}
            >
              <defs>
                <linearGradient id="faqCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EFF6FF" />
                  <stop offset="100%" stopColor="#DBEAFE" />
                </linearGradient>
                <linearGradient id="faqBubbleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
                <linearGradient id="faqBubbleCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <filter id="softDropShadow" x="-15%" y="-15%" width="130%" height="135%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0EA5E9" floodOpacity="0.14" />
                </filter>
              </defs>

              {/* Soft Background Halo */}
              <circle cx="145" cy="105" r="82" fill="url(#faqCardGrad)" opacity="0.85" />
              <circle cx="215" cy="42" r="10" fill="#BAE6FD" opacity="0.65" />
              <circle cx="62" cy="158" r="7" fill="#93C5FD" opacity="0.65" />

              {/* Back Speech Bubble (Answer / Guidance card) */}
              <g filter="url(#softDropShadow)">
                <rect x="38" y="34" width="124" height="84" rx="20" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.8" />
                <path d="M64 118L54 134L82 118H64Z" fill="#FFFFFF" />
                <path d="M54 134L64 118M54 134L82 118" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                {/* Mini answer lines inside bubble */}
                <circle cx="62" cy="60" r="8" fill="#E0F2FE" />
                <path d="M59 60L61.2 62.2L65.5 57.8" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="78" y="55" width="64" height="7" rx="3.5" fill="#93C5FD" />
                <rect x="54" y="74" width="88" height="6" rx="3" fill="#E2E8F0" />
                <rect x="54" y="88" width="66" height="6" rx="3" fill="#E2E8F0" />
              </g>

              {/* Main 3D-Style Blue Speech Bubble with Question Mark */}
              <g filter="url(#softDropShadow)">
                <rect x="118" y="62" width="122" height="106" rx="26" fill="url(#faqBubbleBlue)" />
                <path d="M206 168L222 186L184 168H206Z" fill="#0EA5E9" />
                {/* Subtle 3D highlight rim */}
                <rect x="124" y="68" width="110" height="94" rx="21" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.5" />

                {/* Large Clean Question Mark */}
                <path
                  d="M166 99C166 91.82 171.82 86 179 86C186.18 86 192 91.82 192 99C192 104.8 188.1 108.4 183.4 110.8C180.4 112.3 179 114.5 179 118V121"
                  stroke="#FFFFFF"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
                <circle cx="179" cy="135" r="4.2" fill="#FFFFFF" />
              </g>

              {/* Floating Mini Cyan Badge Bubble */}
              <g filter="url(#softDropShadow)">
                <rect x="186" y="22" width="54" height="36" rx="12" fill="url(#faqBubbleCyan)" />
                <text x="213" y="45" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="800" fontFamily="Poppins, sans-serif">
                  FAQ
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* 2. CENTERED FAQ ACCORDION */}
        <div className={styles.accordionWrapper}>
          <div className={styles.list}>
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.question}
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.questionLeft}>
                      <span className={styles.questionNumber}>{i + 1}.</span>
                      <span className={styles.questionText}>{faq.q}</span>
                    </div>
                    <span className={styles.chevron} aria-hidden="true">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={`${styles.answerCollapse} ${isOpen ? styles.answerCollapseOpen : ""}`}
                  >
                    <div className={styles.answerInner}>
                      <div className={styles.answer}>
                        <p>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
