import styles from "./FeedbackSection.module.css";

const feedbacks = [
  {
    name: "Vinayak Agarwal",
    percentile: "99.99",
    quote: "Grateful to TechnoCAT mentors. Their advanced mock analytics helped me identify my weak zones instantly and master my timing strategy.",
    colorClass: styles.cardOrange
  },
  {
    name: "Parav Goyal",
    percentile: "99.98",
    quote: "The personalized AI tutor is incredible. It's like having a top-tier mentor available 24/7 to clear doubts and provide structured practice.",
    colorClass: styles.cardGreen
  },
  {
    name: "Soumyadip Mukherjee",
    percentile: "99.97",
    quote: "TechnoCAT's mocks are identical to the real CAT exam. The difficulty curve and question patterns gave me immense confidence on the D-Day.",
    colorClass: styles.cardBlue
  },
  {
    name: "Anmol Gupta",
    percentile: "99.96",
    quote: "The error tracking feature saved me hours. Instead of manually finding what went wrong, the platform gave me actionable improvement plans.",
    colorClass: styles.cardPurple
  },
  {
    name: "Swastik Mukherjee",
    percentile: "99.96",
    quote: "A perfectly designed UI that doesn't distract you. The sheer quality of the video solutions sets TechnoCAT apart from other mock series.",
    colorClass: styles.cardOrange
  },
];

export default function FeedbackSection() {
  return (
    <section className={styles.feedbackSection}>
      <div className={styles.container}>
        <div className={styles.titleGroup}>
          <h2 className={styles.heading}>What Our Students Say</h2>
          <p className={styles.subHeading}>Join thousands of successful CAT aspirants who cracked their dream B-Schools with TechnoCAT.</p>
        </div>
        <div className={styles.grid}>
          {feedbacks.map((fb, i) => (
            <div key={i} className={`${styles.feedbackCard} ${fb.colorClass}`}>
              <div className={styles.quoteMark}>"</div>
              <p className={styles.quoteText}>{fb.quote}</p>
              <div className={styles.studentInfo}>
                <div className={styles.avatar}>{fb.name.charAt(0)}</div>
                <div>
                  <div className={styles.studentName}>{fb.name}</div>
                  <div className={styles.percentileBadge}>{fb.percentile} %iler</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
