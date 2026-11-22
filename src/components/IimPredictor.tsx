"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TOP_B_SCHOOLS } from "@/data/bSchoolEngine";
import { EASE_OUT, GradientText, Reveal, RevealGroup, RevealItem } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./IimPredictor.module.css";

// Honest teaser: which listed schools' past GENERAL-category overall cutoffs the entered
// percentile clears. The full predictor (after sign-in) also weighs academics, work-ex etc.
function cutoffTeaser(percentileInput: string) {
  const p = Number(percentileInput);
  if (!Number.isFinite(p)) return { cleared: [] as typeof TOP_B_SCHOOLS, total: TOP_B_SCHOOLS.length };
  const cleared = TOP_B_SCHOOLS.filter((s) => p >= s.overallCutoff.GENERAL).sort(
    (a, b) => b.overallCutoff.GENERAL - a.overallCutoff.GENERAL
  );
  return { cleared, total: TOP_B_SCHOOLS.length };
}

const CHECK_TINTS = ["var(--tint-teal)", "var(--tint-blue)", "var(--tint-violet)", "var(--tint-amber)"];

const POINTS = [
  "Based on real selection criteria",
  "Considers academic diversity",
  "Highly accurate percentile mapping",
];

export default function IimPredictor() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();
  const [predicted, setPredicted] = useState(false);

  const [tenth, setTenth] = useState("");
  const [twelfth, setTwelfth] = useState("");
  const [grad, setGrad] = useState("");
  const [percentile, setPercentile] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store in sessionStorage so values persist across sessions
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "technocat_predictor_data",
        JSON.stringify({ tenth, twelfth, grad, percentile })
      );
    }

    const isLoggedIn = !!(user && !user.isGuest);

    if (isLoggedIn) {
      // Directly reroute to the B-School Predictor page with the entered values
      const params = new URLSearchParams();
      if (tenth) params.set("tenth", tenth);
      if (twelfth) params.set("twelfth", twelfth);
      if (grad) params.set("grad", grad);
      if (percentile) params.set("percentile", percentile);
      router.push(`/intelligence/b-school-predictor?${params.toString()}`);
    } else {
      // Not logged in -> show preview / blurred result with Sign Up prompt
      setPredicted(true);
    }
  };

  const handleUnlockReport = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "technocat_predictor_data",
        JSON.stringify({ tenth, twelfth, grad, percentile })
      );
      sessionStorage.setItem("technocat_predictor_pending_redirect", "true");
    }

    if (!user || user.isGuest) {
      openAuthModal("signin");
    } else {
      const params = new URLSearchParams();
      if (tenth) params.set("tenth", tenth);
      if (twelfth) params.set("twelfth", twelfth);
      if (grad) params.set("grad", grad);
      if (percentile) params.set("percentile", percentile);
      router.push(`/intelligence/b-school-predictor?${params.toString()}`);
    }
  };

  const fields = [
    { id: "tenth", label: "10th percentage", value: tenth, set: setTenth, min: "30", ph: "85", unit: "%" },
    { id: "twelfth", label: "12th percentage", value: twelfth, set: setTwelfth, min: "30", ph: "88", unit: "%" },
    { id: "grad", label: "Graduation", value: grad, set: setGrad, min: "30", ph: "75", unit: "%" },
    { id: "pct", label: "Expected CAT percentile", value: percentile, set: setPercentile, min: "50", ph: "95.5", unit: "%ile" },
  ];

  const swap = {
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduce ? 0 : -8 },
    transition: { duration: reduce ? 0.15 : 0.4, ease: EASE_OUT },
  };

  const teaser = cutoffTeaser(percentile);
  const ratio = teaser.total ? teaser.cleared.length / teaser.total : 0;

  return (
    <section className={`${styles.section} ${ui.sectionCanvas}`} id="iim-predictor">
      <div className={ui.container}>
        <div className={styles.grid}>
          <RevealGroup className={styles.text} stagger={0.05}>
            <RevealItem>
              <span className={styles.eyebrow}>Free tool</span>
            </RevealItem>
            <RevealItem>
              <h2 className={styles.heading}>
                IIM <GradientText>call predictor</GradientText>
              </h2>
            </RevealItem>
            <RevealItem>
              <p className={styles.desc}>
                Don&apos;t guess your chances. Compare your profile with past cutoffs and the published selection
                criteria of top B-schools.
              </p>
            </RevealItem>
            <RevealItem>
              <ul className={styles.points}>
                {POINTS.map((p, i) => (
                  <li key={p}>
                    <span className={styles.check} style={{ "--c": CHECK_TINTS[i % CHECK_TINTS.length] } as React.CSSProperties}>
                      <Check size={13} strokeWidth={2.5} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </RevealItem>
          </RevealGroup>

          <Reveal delay={0.1} className={`${styles.card} glass-card`} data-tint="violet">
            <AnimatePresence mode="wait" initial={false}>
              {!predicted ? (
                <motion.form key="form" className={styles.form} onSubmit={handleSubmit} {...swap}>
                  <div className={styles.formHead}>
                    <h3 className={styles.formTitle}>Check your chances</h3>
                    <span className={styles.formHint}>Takes 20 seconds</span>
                  </div>
                  <div className={styles.fields}>
                    {fields.map((f) => (
                      <label key={f.id} className={styles.field} htmlFor={`iim-${f.id}`}>
                        <span className={styles.label}>{f.label}</span>
                        <span className={styles.inputWrap}>
                          <input
                            id={`iim-${f.id}`}
                            type="number"
                            inputMode="decimal"
                            required
                            min={f.min}
                            max="100"
                            step="any"
                            placeholder={`e.g. ${f.ph}`}
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                          />
                          <span className={styles.unit}>{f.unit}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className={`${ui.btn} ${ui.btnPrimary} ${styles.submit}`}>
                    Predict my IIM calls
                    <ArrowRight size={18} strokeWidth={1.75} data-arrow />
                  </button>
                </motion.form>
              ) : (
                <motion.div key="result" className={styles.result} {...swap}>
                  <div className={styles.formHead}>
                    <h3 className={styles.formTitle}>Your quick check</h3>
                    <span className={`${ui.figure} ${styles.resultPct}`}>{percentile}%ile</span>
                  </div>

                  <div className={styles.meter}>
                    <div className={styles.meterTop}>
                      <span className={`${ui.figure} ${styles.meterBig}`}>
                        {teaser.cleared.length}
                        <span className={styles.meterOf}> / {teaser.total}</span>
                      </span>
                      <span className={styles.meterLabel}>past cutoffs cleared</span>
                    </div>
                    <div className={styles.meterTrack}>
                      <motion.span
                        className={styles.meterFill}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: ratio }}
                        transition={{ duration: reduce ? 0 : 1.1, ease: EASE_OUT, delay: 0.15 }}
                      />
                    </div>
                  </div>

                  <p className={styles.resultDesc}>
                    Past general-category overall cutoffs only. Shortlists also weigh academics, work experience
                    and category; the full report covers all of them.
                  </p>

                  <div className={styles.blurredList}>
                    {teaser.cleared.slice(0, 3).map((school, i) => (
                      <motion.div
                        key={school.id}
                        className={styles.blurRow}
                        initial={{ opacity: 0, x: reduce ? 0 : -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: reduce ? 0 : 0.3 + i * 0.08, duration: 0.4, ease: EASE_OUT }}
                      >
                        <span className={styles.blurName}>
                          <i className={styles.okDot} />
                          {school.shortName}
                        </span>
                        <span className={ui.figure}>cutoff {school.overallCutoff.GENERAL}</span>
                      </motion.div>
                    ))}
                    {teaser.cleared.length === 0 && (
                      <div className={styles.blurRow}>No listed school&apos;s past cutoff yet</div>
                    )}
                  </div>

                  <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${styles.submit}`} onClick={handleUnlockReport}>
                    {user && !user.isGuest ? "View full report" : "Sign up free to unlock the full report"}
                    <ArrowRight size={18} strokeWidth={1.75} data-arrow />
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} ${styles.reset}`} onClick={() => setPredicted(false)}>
                    <RotateCcw size={15} strokeWidth={1.75} />
                    Recalculate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
