"use client";
import styles from "./TwoModesSection.module.css";

export default function TwoModesSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.everythingTag}>EVERYTHING INCLUDED</div>
        <h2 className={styles.heading}>Two Exam Modes To Attempt CAT Mock Test</h2>

        <div className={styles.modesGrid}>
          {/* Classic Mode */}
          <div className={styles.classicCard}>
            <div className={styles.modeHeader}>
              <div>
                <h3 className={styles.modeTitle}>Classic Mode</h3>
                <p className={styles.modeSubtitle}>Real CAT Experience</p>
              </div>
              <button className={styles.tryBtn}>Try Now</button>
            </div>
            <div className={styles.featureList}>
              <div className={styles.featureCol}>
                <div className={styles.featureItem}>
                  <span className={styles.check}>✓</span> Actual CAT Interface
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.check}>✓</span> Sectional Timing
                </div>
              </div>
              <div className={styles.featureCol}>
                <div className={styles.featureItem}>
                  <span className={styles.check}>✓</span> Smart Navigation
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.check}>✓</span> Real Exam Simulation
                </div>
              </div>
            </div>
            <div className={styles.modeImgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://media.iquanta.in/ui_images/classic-mode-mock.webp"
                alt="Classic CAT Mock Mode Interface"
                className={styles.modeImg}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.modePlaceholder}>
                <div className={styles.mockInterface}>
                  <div className={styles.mockHeader}>CAT Mock — Classic Mode</div>
                  <div className={styles.mockBody}>
                    <div className={styles.mockQuestion}>
                      Q.1 If the ratio of work done by (x+2) workers in (x-3) days to the work done by (x+4) workers in (x-2) days is...
                    </div>
                    <div className={styles.mockOptions}>
                      {["(A) Previous", "(B) Chat Tutor", "(C) Switch to Next ▶"].map((opt, i) => (
                        <div key={i} className={styles.mockOption}>{opt}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VS divider */}
          <div className={styles.vsDivider}>
            <span className={styles.vsText}>VS</span>
          </div>

          {/* Modern Mode */}
          <div className={styles.modernCard}>
            <div className={styles.modeHeader}>
              <div>
                <h3 className={styles.modeTitle}>Modern Mode</h3>
                <p className={styles.modeSubtitle}>TechnoCAT Mock UI</p>
              </div>
              <button className={styles.tryBtnOrange}>Try Now</button>
            </div>
            <div className={styles.featureList}>
              <div className={styles.featureCol}>
                <div className={styles.featureItemLight}>
                  <span className={styles.checkOrange}>✓</span> Smooth and Interactive UI
                </div>
                <div className={styles.featureItemLight}>
                  <span className={styles.checkOrange}>✓</span> Enhanced Analytics
                </div>
              </div>
              <div className={styles.featureCol}>
                <div className={styles.featureItemLight}>
                  <span className={styles.checkOrange}>✓</span> Smart Navigation To Tabs
                </div>
                <div className={styles.featureItemLight}>
                  <span className={styles.checkOrange}>✓</span> Distraction-Free Experience
                </div>
              </div>
            </div>
            <div className={styles.modeImgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://media.iquanta.in/ui_images/modern-mode-mock.webp"
                alt="Modern CAT Mock Mode Interface"
                className={styles.modeImg}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.modePlaceholderModern}>
                <div className={styles.mockInterface}>
                  <div className={styles.mockHeaderModern}>CAT Mock — Modern Mode</div>
                  <div className={styles.mockBody}>
                    <div className={styles.mockQuestionModern}>
                      The passage mentions several examples of corporations that claimed their actions were necessary for...
                    </div>
                    <div className={styles.mockOptionsModern}>
                      {["Option A", "Option B", "Option C", "Option D"].map((opt, i) => (
                        <div key={i} className={styles.mockOptionModern}>{opt}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
