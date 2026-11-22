"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT, GradientText, RevealGroup, RevealItem, SectionHead } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./FaqSection.module.css";

const faqs = [
  {
    q: "Can I get sectional CAT mock tests?",
    a: "Yes, candidates can access 45 sectional mock tests for CAT — including 15 sectional mocks each across VARC, DILR, and Quantitative Ability (QA) — designed to strengthen individual section timing and accuracy.",
  },
  {
    q: "Are the mock tests based on the latest CAT pattern?",
    a: "Yes. Every TechnoCAT full-length and sectional mock is strictly aligned with the latest CAT exam pattern, difficulty distribution, and interface (both Classic CAT view and Modern analytical view). Any official notification updates are reflected immediately.",
  },
  {
    q: "Do I get detailed performance analytics?",
    a: "Yes. TechnoCAT provides AI performance analytics after every mock — including your Performance DNA (accuracy, speed, consistency), section-wise percentiles, time-spent breakdown, Error Tracker, and B-School Admission Predictor.",
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
    a: "When it comes to question relevance, real exam interface, and post-mock diagnostics, TechnoCAT's mock test series stands out among aspirants with tools like the Goal Tracker, Error Tracker, B-School Predictor, and CAT Mock Comparison.",
  },
  {
    q: "How many CAT mocks should one take before appearing for the actual exam?",
    a: "While there is no rigid number, top 99+%ilers recommend attempting 25–30 full-length mocks along with targeted sectionals and thorough error analysis before exam day.",
  },
  {
    q: "How many CAT mocks does TechnoCAT provide?",
    a: "TechnoCAT provides 35 full-length CAT mocks, 45 sectional CAT mock tests across VARC, DILR, and QA, plus complete past year CAT papers with video and text solutions.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduce = useReducedMotion();

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={`${ui.section} ${ui.sectionCanvas} ${styles.section}`} id="faq">
      <div className={ui.container}>
        <SectionHead
          align="left"
          eyebrow="FAQ"
          title={<>Frequently asked <GradientText>questions</GradientText></>}
          lede="Quick answers about mocks, analysis and access."
          className={styles.head}
        />

        <div className={styles.columns}>
        {[faqs.slice(0, 5), faqs.slice(5)].map((col, c) => (
        <RevealGroup key={c} className={styles.list} stagger={0.05}>
          {col.map((faq, j) => {
            const i = c * 5 + j;
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${i}`;
            return (
              <RevealItem key={faq.q} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
                <h3 className={styles.qWrap}>
                  <button
                    type="button"
                    className={styles.question}
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className={`${styles.num} ${ui.figure}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.qText}>{faq.q}</span>
                    <motion.span
                      className={styles.icon}
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.35, ease: EASE_OUT }}
                      aria-hidden="true"
                    >
                      <Plus size={18} strokeWidth={1.75} />
                    </motion.span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      key="panel"
                      className={styles.panel}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: reduce ? 0 : 0.42, ease: EASE_OUT },
                        opacity: { duration: reduce ? 0 : 0.25 },
                      }}
                    >
                      <p className={styles.answer}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </RevealItem>
            );
          })}
        </RevealGroup>
        ))}
        </div>
      </div>
    </section>
  );
}
