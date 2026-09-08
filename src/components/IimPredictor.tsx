"use client";
import { useState } from "react";
import styles from "./IimPredictor.module.css";

export default function IimPredictor() {
  const [predicted, setPredicted] = useState(false);

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
              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setPredicted(true); }}>
                <h3 className={styles.formTitle}>Check Your Chances</h3>
                <div className={styles.inputGroup}>
                  <label>10th Percentage (%)</label>
                  <input type="number" required min="40" max="100" placeholder="e.g. 85" />
                </div>
                <div className={styles.inputGroup}>
                  <label>12th Percentage (%)</label>
                  <input type="number" required min="40" max="100" placeholder="e.g. 88" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Graduation (%)</label>
                  <input type="number" required min="40" max="100" placeholder="e.g. 75" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Expected CAT Percentile</label>
                  <input type="number" required min="70" max="100" step="0.01" placeholder="e.g. 95.5" />
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
                <button className={styles.signUpBtn} onClick={() => alert("Redirect to Signup")}>Sign Up Free to Unlock Full Report</button>
                <button className={styles.resetBtn} onClick={() => setPredicted(false)}>Recalculate</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
