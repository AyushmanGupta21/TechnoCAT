"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChartLine,
  ScanSearch,
  Clock,
  FileText,
  GraduationCap,
  LayoutGrid,
  MessageSquareText,
  Minus,
  CirclePlay,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { EASE_OUT, GradientText, Reveal, SectionHead, useReplay } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./ComparisonTable.module.css";

type Feature = { name: string; desc: string; icon: LucideIcon; others: boolean };

// Icon accent colours cycle through the data palette
const ACCENTS = ["--data-blue", "--data-violet", "--data-teal", "--data-coral", "--data-amber", "--data-cyan"];

const features: Feature[] = [
  { name: "35 full mock tests", desc: "Comprehensive coverage of the actual exam pattern.", icon: FileText, others: true },
  { name: "Interactive AI mentor", desc: "Personalised feedback and doubt resolution.", icon: MessageSquareText, others: false },
  { name: "Goal tracker", desc: "Set and achieve your percentile milestones.", icon: Target, others: false },
  { name: "Error tracker", desc: "Automatically categorise and review your mistakes.", icon: ScanSearch, others: false },
  { name: "B-school predictor", desc: "Predict IIM calls based on your profile and mock scores.", icon: GraduationCap, others: false },
  { name: "Across-mock analysis", desc: "Track your performance trajectory over time.", icon: ChartLine, others: false },
  { name: "45 sectionals with video solutions", desc: "Detailed video explanations for every sectional.", icon: CirclePlay, others: false },
  { name: "PYQs as mocks", desc: "Attempt past year papers in an exam-like interface.", icon: Clock, others: true },
  { name: "Mentorship", desc: "1-on-1 guidance from 99+ percentilers.", icon: Users, others: false },
  { name: "Strategy builder", desc: "Customised study plans based on your weaknesses.", icon: LayoutGrid, others: false },
];

export default function ComparisonTable() {
  const rv = useReplay();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();

  const handleTry = () => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", "/dashboard");
      }
      openAuthModal("signin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <section className={`${ui.section} ${ui.sectionCanvas} ${styles.section}`}>
      <div className={`${ui.container} ${styles.layout}`}>
        <div className={styles.intro}>
          <SectionHead
            align="left"
            className={styles.head}
            eyebrow="Compare"
            title={<><GradientText>TechnoCAT</GradientText> vs other mocks</>}
            lede="What you get here that a standard mock series leaves out."
          />
          <Reveal className={styles.introCta} delay={0.15}>
            <p className={styles.footerText}>
              <strong>Everything you need for CAT,</strong> in one place.
            </p>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={handleTry}>
              Try TechnoCAT mocks
              <ArrowRight size={16} strokeWidth={1.75} data-arrow aria-hidden="true" />
            </button>
          </Reveal>
        </div>

        <Reveal className={styles.tableWrapper}>
          <div className={`${styles.table} glass-card`} data-tint="blue" role="table" aria-label="TechnoCAT compared with other mock series">
            <div className={styles.headerRow} role="row">
              <div role="columnheader" className={styles.featureHeader}>Feature</div>
              <div role="columnheader" className={styles.usHeader}>TechnoCAT</div>
              <div role="columnheader" className={styles.othersHeader}>Others</div>
            </div>

            <motion.div
              className={styles.rows}
              initial="hidden"
              animate={rv ? "show" : "hidden"}
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } }}
            >
              {features.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.name}
                    role="row"
                    className={styles.row}
                    style={{ "--c": `var(${ACCENTS[idx % ACCENTS.length]})` } as React.CSSProperties}
                    variants={{
                      hidden: { opacity: 0, y: reduce ? 0 : 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
                    }}
                  >
                    <div role="cell" className={styles.featureCell}>
                      <Icon size={16} strokeWidth={1.75} className={styles.featureIcon} aria-hidden="true" />
                      <span className={styles.featureText}>
                        <span className={styles.featureTitle}>{f.name}</span>
                        <span className={styles.featureDesc}>{f.desc}</span>
                      </span>
                    </div>
                    <div role="cell" className={styles.usCell}>
                      <span className={styles.yes} aria-label="Included">
                        <Check size={15} strokeWidth={2.25} aria-hidden="true" />
                      </span>
                    </div>
                    <div role="cell" className={styles.othersCell}>
                      {f.others ? (
                        <span className={styles.yesMuted} aria-label="Included">
                          <Check size={15} strokeWidth={2.25} aria-hidden="true" />
                        </span>
                      ) : (
                        <span className={styles.no} aria-label="Not included">
                          <Minus size={15} strokeWidth={2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
