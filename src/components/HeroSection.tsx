"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Check, FileText, MessageCircle, Play, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import { CountUp, Doodle, EASE_OUT, TiltFrame, useReplay } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./HeroSection.module.css";

const LATEST_MOCK = "/browse?section=mocks&mock=latest#pyq-section";
const PYQ = "/browse?section=pyqs#pyq-section";

const HEADLINE: { text: string; accent?: boolean }[] = [
  { text: "The best CAT mock test," },
  { text: "with 35 full mocks and AI analysis", accent: true },
];

const CHIPS = ["35 full CAT mocks", "45 sectional tests", "Detailed video solutions", "All-India percentiles"];

export default function HeroSection() {
  const rv = useReplay();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);
  const reduce = useReducedMotion();

  const handleAuthAction = (destination: string) => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", destination);
      }
      openAuthModal("signin");
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
      badge: "All-India benchmark",
      title: "20,000+ serious CAT aspirants",
      description:
        "Compete against India's most focused CAT candidates. Every mock test gives you an instant All-India percentile ranking and section-wise standing.",
      highlights: [
        "Live All-India percentile calculated with every submission",
        "Compare question-wise accuracy and time spent against the top 1%",
        "Sectional pacing analysis: VARC, DILR and QA benchmarked live",
      ],
      primaryBtnText: "Attempt a free mock",
      onPrimaryClick: () => handleAuthAction(LATEST_MOCK),
    });
  };

  const openToppersModal = () => {
    setModalData({
      badge: "Hall of fame",
      title: "580+ 99%ilers in CAT 2025",
      description:
        "TechnoCAT learners consistently reach the 99th percentile, converting calls at IIM Ahmedabad, Bangalore, Calcutta, Lucknow and FMS Delhi.",
      highlights: [
        "Average percentile jump of +14.2% within the first 6 mocks",
        "Over 82 students scored 99.8+ percentile in QA and DILR",
        "Includes 1-on-1 interview and GD-PI mentorship from IIM alumni",
      ],
      primaryBtnText: "Start preparing for free",
      onPrimaryClick: () => handleAuthAction("/dashboard"),
    });
  };

  /* ---------- entrance choreography ---------- */
  const d = reduce ? 0 : 1;
  const col: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 * d, delayChildren: 0.05 * d } },
  };
  const rise: Variants = {
    hidden: { opacity: 0, y: 16 * d },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.8, ease: EASE_OUT } },
  };
  const line: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045 * d } },
  };
  const accentLine: Variants = {
    hidden: { y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        y: { duration: reduce ? 0.2 : 0.9, ease: EASE_OUT, delay: reduce ? 0 : 0.2 },
        opacity: { duration: 0.2 },
      },
    },
  };
  const word: Variants = {
    hidden: { y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 },
    show: { y: 0, opacity: 1, transition: { duration: reduce ? 0.2 : 0.85, ease: EASE_OUT } },
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* ---------------- Left ---------------- */}
            <motion.div className={styles.leftCol} variants={col} initial="hidden" animate={rv ? "show" : "hidden"} >
              <motion.p className={styles.eyebrow} variants={rise}>
                <span className={ui.liveDot} aria-hidden="true" />
                <span>TechnoCAT 6.0 mock is open</span>
                <span className={styles.eyebrowSep} aria-hidden="true" />
                <span className={styles.eyebrowMuted}>CAT 2026 mock series</span>
              </motion.p>

              <h1 className={styles.heading}>
                <span className={styles.srOnly}>TechnoCAT: </span>
                {HEADLINE.map((l) => (
                  <motion.span
                    key={l.text}
                    className={`${styles.headLine} ${l.accent ? styles.headingAccent : ""}`}
                    variants={line}
                  >
                    {l.accent ? (
                      // Accent line: one gradient run (per-word clipping would repeat the gradient)
                      <span className={styles.lineMask}>
                        <motion.span className={`text-gradient ${styles.accentRun}`} variants={accentLine}>
                          {l.text}
                        </motion.span>
                      </span>
                    ) : (
                      l.text.split(" ").map((w, i, arr) => (
                        <span key={i} className={styles.wordMask}>
                          <motion.span className={styles.word} variants={word}>
                            {w}
                          </motion.span>
                          {i === arr.length - 1 ? null : " "}
                        </span>
                      )).concat(
                        <span key="sparkle" className={styles.sparkleWrap}>
                          <Doodle kind="sparkle" className={styles.sparkle} delay={1.1} />
                        </span>
                      )
                    )}
                  </motion.span>
                ))}
              </h1>

              <motion.p className={styles.description} variants={rise}>
                A personal AI mentor that reads your performance, plus Indra&apos;s mock analysis, takes your
                post-mock review from 3 hours to zero.
              </motion.p>

              <motion.ul className={styles.featureChips} variants={rise}>
                {CHIPS.map((c, i) => (
                  <li key={c} className={styles.chipItem}>
                    <span className={styles.chipCheck} data-c={i}>
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    {c}
                  </li>
                ))}
              </motion.ul>

              <motion.div className={styles.ctaGroup} variants={rise}>
                <div className={styles.primaryCtaRow}>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnPrimary} ${styles.ctaMain}`}
                    onClick={() => handleAuthAction(LATEST_MOCK)}
                  >
                    <span>Attempt TechnoCAT 6.0 mock</span>
                    <span className={styles.ctaNote}>Free</span>
                    <ArrowRight size={17} strokeWidth={2} data-arrow />
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={handleEnroll}>
                    Enroll for 2026 mock series
                  </button>
                </div>

                <div className={styles.secondaryCtaRow}>
                  <button type="button" className={styles.textLink} onClick={() => handleAuthAction(PYQ)}>
                    <FileText size={16} strokeWidth={1.75} />
                    <span>Attempt a past year paper as mock</span>
                  </button>
                  <span className={styles.linkSep} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.textLink}
                    onClick={() => window.open("https://chat.whatsapp.com/sample-technocat-cat2026", "_blank")}
                  >
                    <MessageCircle size={16} strokeWidth={1.75} />
                    <span>Join the community (20k+)</span>
                  </button>
                </div>
              </motion.div>

            </motion.div>

            {/* ---------------- Right ---------------- */}
            <div className={styles.rightCol}>
              <Doodle kind="swirl" className={styles.swirl} color="var(--blue-300)" strokeWidth={1.6} delay={1.5} />
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
                 animate={rv ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
                transition={{ duration: reduce ? 0.2 : 1.1, delay: reduce ? 0 : 0.25, ease: EASE_OUT }}
              >
                <TiltFrame className={styles.tilt} max={5}>
                  <div
                    className={styles.browser}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleAuthAction(LATEST_MOCK)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAuthAction(LATEST_MOCK);
                    }}
                    title="Attempt TechnoCAT 6.0 mock"
                  >
                    <div className={styles.browserBar}>
                      <span className={styles.dots} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className={styles.url}>technocat · mock dashboard</span>
                    </div>
                    <div className={styles.screen}>
                      <img
                        src="/dashboard.jpg"
                        alt="TechnoCAT mock test dashboard"
                        className={styles.videoImg}
                        width={680}
                        height={380}
                      />
                      <span className={styles.playBtn} aria-label="Watch the TechnoCAT walkthrough">
                        <Play size={22} strokeWidth={1.75} fill="currentColor" />
                      </span>
                    </div>
                    <div className={styles.browserFoot}>
                      <span className={styles.footLabel}>
                        <span className={ui.liveDot} aria-hidden="true" /> TechnoCAT 6.0 full mock
                      </span>
                      <span className={styles.footCta}>
                        Attempt now <ArrowRight size={15} strokeWidth={2} />
                      </span>
                    </div>
                  </div>

                  {/* Floating detail cards (depth via translateZ) */}
                  <div className={styles.floatTimer} aria-hidden="true">
                  <motion.div
                    className={`${styles.float} glass-card`}
                    data-tint="blue"
                    initial={{ opacity: 0, x: reduce ? 0 : -16 }}
                     animate={rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : -16 }}
                    transition={{ duration: 0.55, delay: reduce ? 0 : 0.9, ease: EASE_OUT }}
                  >
                    <span className={styles.floatLabel}>Section timer</span>
                    <span className={`${ui.figure} ${styles.floatValue}`}>40:00</span>
                    <span className={styles.floatSub}>VARC · DILR · QA</span>
                  </motion.div>
                  </div>

                  <div className={styles.floatPct} aria-hidden="true">
                  <motion.div
                    className={`${styles.float} glass-card`}
                    data-tint="violet"
                    initial={{ opacity: 0, x: reduce ? 0 : 16 }}
                     animate={rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : 16 }}
                    transition={{ duration: 0.55, delay: reduce ? 0 : 1.05, ease: EASE_OUT }}
                  >
                    <span className={styles.floatLabel}>All-India percentile</span>
                    <svg className={styles.spark} viewBox="0 0 120 36" fill="none">
                      <motion.path
                        d="M2 30 C 18 28, 24 22, 36 23 S 56 14, 68 16 S 92 6, 118 4"
                        stroke="var(--blue-500)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: reduce ? 1 : 0 }}
                        animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
                        transition={{ duration: 0.55, delay: reduce ? 0 : 1.2, ease: EASE_OUT }}
                      />
                    </svg>
                    <span className={styles.floatSub}>Updated with every submission</span>
                  </motion.div>
                  </div>
                </TiltFrame>
              </motion.div>

              {/* Stats */}
              <motion.div
                className={styles.statsRow}
                initial="hidden"
                animate={rv ? "show" : "hidden"} 
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 * d, delayChildren: 0.6 * d } } }}
              >
                <motion.button
                  type="button"
                  variants={rise}
                  className={`${styles.statCard} glass-card`}
                  data-tint="teal"
                  onClick={openTestTakersModal}
                >
                  <span className={styles.statTop}>
                    <Trophy size={18} strokeWidth={1.75} className={styles.statIcon} />
                    <CountUp to={20000} suffix="+" className={styles.statNumber} />
                  </span>
                  <span className={styles.statLabel}>Active test takers</span>
                </motion.button>

                <motion.button
                  type="button"
                  variants={rise}
                  className={`${styles.statCard} ${styles.statCardBlue}`}
                  onClick={openToppersModal}
                >
                  <span className={styles.statTop}>
                    <CountUp to={580} suffix="+" className={styles.statNumber} />
                    <span className={styles.avatarStack}>
                      {[11, 12, 13, 14, 15].map((id, i) => (
                        <img
                          key={i}
                          src={`https://i.pravatar.cc/40?img=${id}`}
                          alt=""
                          className={styles.avatar}
                          style={{ zIndex: 5 - i }}
                          width={28}
                          height={28}
                        />
                      ))}
                    </span>
                  </span>
                  <span className={styles.statLabel}>99%ilers in CAT 2025</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Free sectionals strip: sits just below the first screen */}
      <div className={styles.strip}>
        <div className={styles.stripInner}>
          <button type="button" className={styles.stripCard} onClick={() => handleAuthAction(PYQ)}>
            <span className={styles.stripTags} aria-hidden="true">
              {["QA", "DILR", "VARC"].map((t) => (
                <span key={t} className={styles.stripTag}>
                  {t}
                  <i />
                  <i />
                </span>
              ))}
            </span>
            <span className={styles.stripText}>
              <strong>6 CAT sectionals, free for everyone.</strong> Two each for QA, DILR and VARC, with detailed
              analysis and video solutions.
            </span>
            <span className={styles.attemptNow}>
              Attempt now <ArrowRight size={15} strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>

      <CardInfoModal isOpen={!!modalData} onClose={() => setModalData(null)} data={modalData} />
    </>
  );
}
