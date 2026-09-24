"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./IimPredictor.module.css";

export default function IimPredictor() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
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
      openAuthModal("signup");
    } else {
      const params = new URLSearchParams();
      if (tenth) params.set("tenth", tenth);
      if (twelfth) params.set("twelfth", twelfth);
      if (grad) params.set("grad", grad);
      if (percentile) params.set("percentile", percentile);
      router.push(`/intelligence/b-school-predictor?${params.toString()}`);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.widgetGrid}>
          <div className={styles.textContent}>
            <div className={styles.tag}>FREE TOOL</div>
            <h2 className={styles.heading}>IIM Call Predictor</h2>
            <p className={styles.desc}>
              Don't guess your chances. Use our AI-driven algorithm based on historical IIM admission data to check which top B-Schools you can convert.
            </p>
            <ul className={styles.features}>
              <li>✓ Based on real selection criteria</li>
              <li>✓ Considers academic diversity</li>
              <li>✓ Highly accurate percentile mapping</li>
            </ul>
          </div>

          <div className={styles.widgetCard}>
            {!predicted ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h3 className={styles.formTitle}>Check Your Chances</h3>
                <div className={styles.inputGroup}>
                  <label>10th Percentage (%)</label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="100"
                    step="any"
                    placeholder="e.g. 85"
                    value={tenth}
                    onChange={(e) => setTenth(e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>12th Percentage (%)</label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="100"
                    step="any"
                    placeholder="e.g. 88"
                    value={twelfth}
                    onChange={(e) => setTwelfth(e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Graduation (%)</label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="100"
                    step="any"
                    placeholder="e.g. 75"
                    value={grad}
                    onChange={(e) => setGrad(e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Expected CAT Percentile</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="100"
                    step="any"
                    placeholder="e.g. 95.5"
                    value={percentile}
                    onChange={(e) => setPercentile(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn}>Predict My IIM Calls</button>
              </form>
            ) : (
              <div className={styles.resultView}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.formTitle}>Prediction Ready!</h3>
                <p className={styles.resultDesc}>Based on your profile, you have a strong chance of converting <strong>4 Top IIMs</strong> and <strong>6 Non-IIM Tier-1 Colleges</strong>.</p>
                <div className={styles.blurredList}>
                  <div className={styles.blurRow}>IIM Ahmedabad - <span>Borderline</span></div>
                  <div className={styles.blurRow}>IIM Bangalore - <span>High Chance</span></div>
                  <div className={styles.blurRow}>FMS Delhi - <span>High Chance</span></div>
                </div>
                <button className={styles.signUpBtn} onClick={handleUnlockReport}>
                  {user && !user.isGuest ? "View Full Report →" : "Sign Up Free to Unlock Full Report"}
                </button>
                <button className={styles.resetBtn} onClick={() => setPredicted(false)}>Recalculate</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
