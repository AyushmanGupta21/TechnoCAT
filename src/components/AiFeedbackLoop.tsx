import styles from "./AiFeedbackLoop.module.css";

export default function AiFeedbackLoop() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.heading}>The Ultimate <span className={styles.highlight}>Mock-to-Mastery</span> Loop</h2>
          <p className={styles.subheading}>
            TechnoCAT is not just a mock series—it's a complete ecosystem that adapts to your weaknesses and guarantees improvement.
          </p>
        </div>

        <div className={styles.loopGrid}>
          {/* Step 1 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Take a Mock</h3>
            <p className={styles.stepDesc}>Attempt CAT-level questions in a highly accurate simulation environment.</p>
          </div>
          
          {/* Arrow */}
          <div className={styles.arrowWrap}>
            <svg className={styles.arrow} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>AI Analysis</h3>
            <p className={styles.stepDesc}>Our engine detects your weakest topics and tracks time-wasting patterns.</p>
          </div>

          {/* Arrow */}
          <div className={styles.arrowWrap}>
            <svg className={styles.arrow} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>

          {/* Step 3 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Targeted Improvement</h3>
            <p className={styles.stepDesc}>Get customized sectional drills focused purely on your weak areas.</p>
          </div>
        </div>

        {/* AI Doubt Solver Banner */}
        <div className={styles.aiTutorBanner}>
          <div className={styles.aiTutorContent}>
            <h3 className={styles.aiTutorTitle}>24x7 Instant AI Doubt Solver</h3>
            <p className={styles.aiTutorDesc}>
              Stuck on a tricky DILR set or a tough Quant question? Our Chat Tutor breaks down any problem step-by-step, anytime.
            </p>
            <button className={styles.demoBtn}>Try Chat Tutor Demo</button>
          </div>
          <div className={styles.aiTutorMockup}>
            <div className={styles.chatBubbleUser}>How to solve Q.4 efficiently?</div>
            <div className={styles.chatBubbleAi}>
              <strong>Chat Tutor:</strong> Notice that (x+2) and (x-3) are inversely proportional...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
