import styles from "./WhatYouGetSection.module.css";

const stats = [
  {
    number: "35",
    title: "Full-length CAT Mocks",
    details: ["20 Proctored Full Mocks", "15 Unproctored Full Mocks"],
  },
  {
    number: "45",
    title: "Sectional CAT Mock Tests",
    details: ["15 CAT Mocks Each for VARC, LRDI & QA"],
  },
  {
    number: "24",
    title: "PYQs as Mocks",
    details: ["Attempt Actual exam-level Papers as CAT Mocks"],
  },
  {
    number: "15",
    title: "OMET Mocks",
    details: ["XAT, NMAT, SNAP, MAHCET, & Other MBA Exams"],
  },
  {
    number: "100%",
    title: "Detailed Solutions",
    details: ["Textual + Video Solutions of CAT Mocks"],
  },
  {
    number: "AI",
    title: "AI-Powered Mock Analysis",
    details: ["Save 3x Time in CAT Mocks Analysis"],
  },
];

const featureIcons = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    label: "Personalized Study Plan",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    label: "Strategy Builder",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    label: "Weak Topic Recommendations",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
    label: "Progress Reports",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="12" x="2" y="6" rx="1" />
        <rect width="7" height="16" x="15" y="2" rx="1" />
        <path d="M9 13H15" />
      </svg>
    ),
    label: "Mobile Friendly Platform",
  },
];

export default function WhatYouGetSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          What You Get in TechnoCAT Mocks
        </h2>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statNumber}>{s.number}</div>
              <div className={styles.statTitle}>{s.title}</div>
              <div className={styles.statDetails}>
                {s.details.map((d, j) => (
                  <p key={j} className={styles.statDetail}>{d}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feature icon row */}
        <div className={styles.featureRow}>
          {featureIcons.map((f, i) => (
            <div key={i} className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span className={styles.featureLabel}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
