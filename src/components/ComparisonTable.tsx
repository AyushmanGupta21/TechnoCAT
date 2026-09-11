import styles from "./ComparisonTable.module.css";

const features = [
  { 
    name: "35 Full Mock Tests", 
    desc: "Comprehensive coverage of the actual exam pattern.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    icat: true, 
    others: true 
  },
  { 
    name: "Interactive AI Mentor", 
    desc: "Personalized feedback and doubt resolution.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "Goal Tracker", 
    desc: "Set and achieve your percentile milestones.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "Error Tracker", 
    desc: "Automatically categorize and review your mistakes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "B-School Predictor", 
    desc: "Predict IIM calls based on your profile & mock scores.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "Across Mock Analysis", 
    desc: "Track your performance trajectory over time.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "45 Sectionals + Video Solutions", 
    desc: "Detailed video explanations for every sectional.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "PYQs as Mocks", 
    desc: "Attempt past year papers in an exam-like interface.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    icat: true, 
    others: true 
  },
  { 
    name: "Mentorship", 
    desc: "1-on-1 guidance from 99+ percentilers.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
  { 
    name: "Strategy Builder", 
    desc: "Customized study plans based on your weaknesses.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    icat: true, 
    others: false 
  },
];

function CheckIcon() {
  return (
    <span className={styles.checkGreen}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
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
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
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
      {/* Decorative Backgrounds */}
      <div className={styles.bgBlobLeft}></div>
      <div className={styles.bgBlobRight}></div>
      <div className={styles.bgDots}>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="#3B82F6" />
          </pattern>
          <rect width="100" height="100" fill="url(#dots)" />
        </svg>
      </div>

      <div className={styles.container}>
        
        {/* Illustrations */}
        <div className={styles.illustLeft}>
          <div className={styles.illustLeftIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <span className={styles.illustLeftText}>99+ Percentile<br/>Target</span>
        </div>

        <div className={styles.illustRight}>
          <div className={styles.illustRightIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className={styles.illustRightText}>Smart Preparation</span>
          <span className={styles.illustRightSub}>→ Better Results</span>
        </div>

        <div className={styles.titleSection}>
          <h2 className={styles.heading}>
            TechnoCAT <span className={styles.vs}>vs</span> Other Mocks
          </h2>
          <p className={styles.subtitle}>See why top aspirants choose our AI-powered platform</p>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableInner}>
            {/* Header */}
            <div className={styles.headerRow}>
              <div className={styles.featureHeader}>Feature Breakdown</div>
              <div className={styles.icatHeader}>TechnoCAT Mocks</div>
              <div className={styles.othersHeader}>Others</div>
            </div>

            {/* Rows */}
            <div className={styles.rows}>
              {features.map((feature, i) => (
                <div key={i} className={styles.row}>
                  <div className={styles.featureCell}>
                    <div className={styles.featureIconBox}>
                      {feature.icon}
                    </div>
                    <div className={styles.featureTextWrap}>
                      <span className={styles.featureTitle}>{feature.name}</span>
                      <span className={styles.featureDesc}>{feature.desc}</span>
                    </div>
                  </div>
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
                <span className={styles.footerBold}>TechnoCAT Mocks give you everything you need</span> to crack the CAT exam.
              </p>
              <button className={styles.tryBtn}>Try TechnoCAT Mocks →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
