"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Share2 } from "lucide-react";
import styles from "./CommunitySection.module.css";
import ui from "@/components/landing/ui.module.css";
import { CountUp, EASE_OUT, GradientText, Marquee, Reveal, RevealGroup, RevealItem, useReplay } from "@/components/landing/motion";

const STATS: Array<{ value?: number; text?: string; suffix?: string; label: string; acc: string }> = [
  { value: 10000, suffix: "+", label: "Doubts solved monthly", acc: "#5eead4" },
  { value: 100000, suffix: "+", label: "Active members", acc: "#93c5fd" },
  { text: "24/7", label: "Peer and mentor support", acc: "#fcd34d" },
  { value: 500, suffix: "+", label: "Daily discussions", acc: "#fda4af" },
];

const SCHOOLS = [
  "IIM Ahmedabad",
  "IIM Bangalore",
  "IIM Calcutta",
  "IIM Lucknow",
  "IIM Kozhikode",
  "IIM Indore",
  "FMS Delhi",
  "SPJIMR",
];

const MESSAGES = [
  { from: "A", name: "Aditi", text: "How do I approach this circle-and-tangent geometry question?", me: false, tint: "coral" },
  { from: "M", name: "Megha", text: "Use the tangent-secant theorem. PT² = PA × PB gets you there in two lines.", me: true, tint: "blue" },
  { from: "R", name: "Rahul", text: "Shared my mock 14 analysis. DILR set 3 cost me 12 minutes.", me: false, card: true, tint: "teal" },
];

export default function CommunitySection() {
  const rv = useReplay();
  const reduce = useReducedMotion();

  return (
    <section className={`${ui.section} ${styles.sec}`} id="community">
      <div className={ui.container}>
        <Reveal className={styles.panel}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Community</span>
            <h2 className={styles.title}>
              Prepare alongside people who <GradientText dark>take CAT as seriously</GradientText> as you do
            </h2>
            <p className={styles.lede}>
              Post a doubt, share your mock analysis, and get answers from peers and mentors at any hour.
            </p>

            <RevealGroup className={styles.stats} stagger={0.05}>
              {STATS.map((s) => (
                <RevealItem key={s.label} className={styles.stat} style={{ "--acc": s.acc } as React.CSSProperties}>
                  <span className={styles.statNum}>
                    {s.text ?? <CountUp to={s.value ?? 0} suffix={s.suffix} />}
                  </span>
                  <span className={styles.statLabel}>{s.label}</span>
                </RevealItem>
              ))}
            </RevealGroup>

            <Link href="/intelligence/community" className={`${ui.btn} ${ui.btnLight} ${styles.shareBtn}`}>
              <Share2 size={18} strokeWidth={1.75} />
              Share your analysis in the CAT group
              <ArrowRight size={16} strokeWidth={1.75} data-arrow />
            </Link>
          </div>

          <Link
            href="/intelligence/community"
            className={styles.phoneLink}
            aria-label="Open the TechnoCAT prep group community"
          >
            <div className={styles.phone}>
              <div className={styles.phoneHead}>
                <span className={styles.groupAvatar}>T</span>
                <span className={styles.groupMeta}>
                  <span className={styles.groupName}>TechnoCAT prep group</span>
                  <span className={styles.groupSub}>
                    <span className={ui.liveDot} /> Active now
                  </span>
                </span>
              </div>
              <div className={styles.thread}>
                {MESSAGES.map((m, i) => (
                  <motion.div
                    key={i}
                    className={`${styles.msg} ${m.me ? styles.msgMe : ""}`}
                    initial={{ opacity: 0, y: reduce ? 0 : 14, scale: reduce ? 1 : 0.97 }}
                    animate={rv ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: reduce ? 0 : 14, scale: reduce ? 1 : 0.97 }}
                    transition={{ duration: 0.55, delay: reduce ? 0 : 0.3 + i * 0.45, ease: EASE_OUT }}
                  >
                    <span className={styles.msgAvatar} data-tint={m.tint}>
                      {m.from}
                    </span>
                    <div className={styles.bubble}>
                      {!m.me && <span className={styles.msgName}>{m.name}</span>}
                      {m.text}
                      {m.card && (
                        <span className={styles.attach}>
                          <span className={styles.miniChart} aria-hidden="true">
                            {[38, 22, 31].map((v, k) => (
                              <motion.i
                                key={k}
                                style={{
                                  height: `${(v / 40) * 100}%`,
                                  originY: 1,
                                  background: ["var(--data-blue)", "var(--data-teal)", "var(--data-amber)"][k],
                                }}
                                initial={{ scaleY: reduce ? 1 : 0 }}
                                animate={rv ? { scaleY: 1 } : { scaleY: reduce ? 1 : 0 }}
                                transition={{ duration: 0.6, delay: reduce ? 0 : 1.4 + k * 0.1, ease: EASE_OUT }}
                              />
                            ))}
                          </span>
                          <span>
                            <strong>Mock 14 · analysis</strong>
                            <span className={ui.figure}>VARC 38 · DILR 22 · QA 31</span>
                          </span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Link>
        </Reveal>

        <div className={styles.schools}>
          <p className={styles.schoolsLabel}>Calls converted by TechnoCAT students</p>
          <Marquee speed={45}>
            {SCHOOLS.map((s) => (
              <span key={s} className={styles.school}>
                {s}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
