import styles from "./ComparisonTable.module.css";

const features = [
  { name: "35 Full Mock Tests", icat: true, others: true },
  { name: "Interactive AI Mentor", icat: true, others: false },
  { name: "Goal Tracker", icat: true, others: false },
  { name: "Error Tracker", icat: true, others: false },
  { name: "B-School Predictor", icat: true, others: false },
  { name: "Across Mock Analysis", icat: true, others: false },
  { name: "45 Sectionals + Video Solutions", icat: true, others: false },
  { name: "PYQs as Mocks", icat: true, others: true },
  { name: "Mentorship", icat: true, others: false },
  { name: "Strategy Builder", icat: true, others: false },
];

function CheckIcon() {
  return (
    <span className={styles.checkGreen}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.checkSvg}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function CrossIcon() {
  return (
    <span className={styles.crossRed}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.crossSvg}
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </span>
  );
}

export default function ComparisonTable() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <h2 className={styles.heading}>
            TechnoCAT <span className={styles.vs}>vs</span> Other Mocks
          </h2>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableInner}>
            {/* Header */}
            <div className={styles.headerRow}>
              <div className={styles.featureHeader}>Feature</div>
              <div className={styles.icatHeader}>TechnoCAT Mocks</div>
              <div className={styles.othersHeader}>Others</div>
            </div>

            {/* Rows */}
            <div className={styles.rows}>
              {features.map((feature, i) => (
                <div key={i} className={styles.row}>
                  <div className={styles.featureCell}>{feature.name}</div>
                  <div className={styles.icatCell}>
                    <CheckIcon />
                  </div>
                  <div className={styles.othersCell}>
                    {feature.others ? <CheckIcon /> : <CrossIcon />}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer CTA */}
            <div className={styles.tableFooter}>
              <p className={styles.footerText}>
                <span className={styles.footerBold}>TechnoCAT Mocks give more features</span>
              </p>
              <button className={styles.tryBtn}>Try TechnoCAT Mocks →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
