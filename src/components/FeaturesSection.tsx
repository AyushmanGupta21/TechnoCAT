import styles from "./FeaturesSection.module.css";

const features = [
  {
    title: "AI Performance Analysis",
    desc: "Get deep insights into your mock tests with our personalized AI mentor. Discover your strengths and weak areas instantly.",
    colorClass: styles.card1,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Error Tracking",
    desc: "Automatically categorize and track your mistakes. Stop repeating errors and improve your accuracy systematically.",
    colorClass: styles.card2,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "B-School Predictor",
    desc: "Know exactly where you stand. Predict your chances of converting top IIMs based on your mock percentile and profile.",
    colorClass: styles.card3,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    title: "Nationwide Ranking",
    desc: "Compete with thousands of serious CAT aspirants. Get accurate, realistic percentile predictions after every mock.",
    colorClass: styles.card4,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Improvement Tracker",
    desc: "Visualize your growth over time. Our analytics point out exactly what topics to study next to boost your score.",
    colorClass: styles.card5,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    title: "Calibrated Difficulty",
    desc: "Practice with mocks that precisely match the actual CAT difficulty level, ensuring you're neither under-prepared nor overwhelmed.",
    colorClass: styles.card6,
    icon: (
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
];

export default function FeaturesSection() {
  return (
    <>
      <section className={styles.keyFeaturesSection}>
        <div className={styles.container}>
          <div className={styles.inner}>
            <h2 className={styles.heading}>Key Features of TechnoCAT Mocks</h2>
            <p className={styles.subHeading}>
              Experience the most advanced testing platform designed specifically for serious CAT aspirants.
            </p>
            <div className={styles.grid}>
              {features.map((feature, index) => (
                <div key={index} className={`${styles.featureCard} ${feature.colorClass}`}>
                  <div className={styles.iconBox}>
                    {feature.icon}
                  </div>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <p className={styles.cardDesc}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
