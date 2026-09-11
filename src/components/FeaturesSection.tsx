import Link from "next/link";
import styles from "./FeaturesSection.module.css";

const features = [
  {
    title: "AI Performance\nAnalysis",
    desc: "Get deep insights into your mock tests with our personalized AI mentor. Discover your strengths and weak areas instantly.",
    pillText: "Smarter Analysis, Better Scores",
    colorClass: styles.cardPrimary,
    isRow: true,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconAi}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="12" width="40" height="40" rx="8" fill="url(#paint0_linear)" />
          <path d="M24 12V8M40 12V8M24 56V52M40 56V52M12 24H8M12 40H8M56 24H52M56 40H52" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round"/>
          <text x="32" y="38" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AI</text>
          <defs>
            <linearGradient id="paint0_linear" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6"/>
              <stop offset="1" stopColor="#1D4ED8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  },
  {
    title: "Error Tracking",
    desc: "Automatically categorize and track your mistakes. Stop repeating errors and improve your accuracy systematically.",
    pillText: "Learn from Mistakes",
    colorClass: styles.cardBlue,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconDart}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="24" fill="#E0F2FE"/>
          <circle cx="32" cy="32" r="16" fill="#BAE6FD"/>
          <circle cx="32" cy="32" r="8" fill="#3B82F6"/>
          <path d="M48 16L34 30" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round"/>
          <path d="M48 16L48 24M48 16L40 16" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    )
  },
  {
    title: "B-School Predictor",
    desc: "Know exactly where you stand. Predict your chances of converting top IIMs based on your mock percentile and profile.",
    pillText: "Plan Your Dream",
    colorClass: styles.cardTeal,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconSchool}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 12L12 24V52H52V24L32 12Z" fill="#CCFBF1"/>
          <rect x="24" y="36" width="16" height="16" fill="#0D9488"/>
          <circle cx="32" cy="24" r="4" fill="#0D9488"/>
          <path d="M24 24V28M40 24V28" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    )
  },
  {
    title: "Sectional & Full Mocks",
    desc: "Practice with 6 free sectionals and 1 full mock — no credit card required.",
    pillText: "Real Exam Experience",
    colorClass: styles.cardSky,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconMock}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="8" width="32" height="48" rx="4" fill="#E0F2FE"/>
          <path d="M24 20H40M24 32H40M24 44H32" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="40" cy="44" r="4" fill="#F59E0B"/>
        </svg>
      </div>
    )
  },
  {
    title: "Detailed Analytics",
    desc: "Get comprehensive reports on your performance, accuracy, speed and improvement areas.",
    pillText: "Track Your Progress",
    colorClass: styles.cardPurple,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconChart}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="36" width="8" height="20" rx="2" fill="#C7D2FE"/>
          <rect x="28" y="24" width="8" height="32" rx="2" fill="#818CF8"/>
          <rect x="44" y="12" width="8" height="44" rx="2" fill="#4F46E5"/>
          <path d="M8 44L28 28L44 16L56 8" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    )
  },
  {
    title: "Learning Community",
    desc: "Connect with fellow aspirants, share strategies and stay motivated throughout your CAT journey.",
    pillText: "Together We Grow",
    colorClass: styles.cardCyan,
    pillIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
    icon: (
      <div className={styles.iconCommunity}>
        <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="20" r="10" fill="#38BDF8"/>
          <path d="M12 52C12 40.9543 20.9543 32 32 32C43.0457 32 52 40.9543 52 52" fill="#0EA5E9"/>
          <circle cx="16" cy="28" r="6" fill="#7DD3FC"/>
          <path d="M4 52C4 45.3726 9.37258 40 16 40C20.6122 40 24.6166 42.6041 26.5401 46.5401" stroke="#BAE6FD" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="48" cy="28" r="6" fill="#7DD3FC"/>
          <path d="M60 52C60 45.3726 54.6274 40 48 40C43.3878 40 39.3834 42.6041 37.4599 46.5401" stroke="#BAE6FD" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>
    )
  }
];

export default function FeaturesSection() {
  return (
    <section className={styles.keyFeaturesSection} id="features">
      <div className={styles.container}>
        
        {/* Top Header Area */}
        <div className={styles.headerArea}>
          <div className={styles.topBadge}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
            </svg>
            Why Choose TechnoCAT Mocks?
          </div>

          <div className={styles.headingWrapper}>
            <div className={styles.headingLine}></div>
            <h2 className={styles.heading}>
              Key Features of <span className={styles.headingBlue}>TechnoCAT</span> <span className={styles.headingTeal}>Mocks</span>
            </h2>
            <div className={styles.headingLine}></div>
            
            <div className={styles.handwrittenNote}>
              Practice<br/>Smarter<br/>Score Higher
              <svg className={styles.curvedArrow} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5 Q 30 20 45 40 M 35 40 L 45 40 L 40 30" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          </div>

          <p className={styles.subHeading}>
            Experience the most advanced testing platform designed<br/>specifically for serious CAT aspirants.
          </p>
        </div>

        {/* Grid Area */}
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <Link href="/dashboard" key={index} className={`${styles.featureCard} ${feature.colorClass} ${feature.isRow ? styles.cardRow : ''}`}>
              <div className={styles.cardBgShape}></div>
              <div className={styles.dotGrid}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className={styles.dot}></div>
                ))}
              </div>
              
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  {feature.icon}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{feature.title.split('\n').map((line, i) => <span key={i} style={{display:'block'}}>{line}</span>)}</h3>
                  <p className={styles.cardDesc}>{feature.desc}</p>
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <div className={styles.pill}>
                  {feature.pillIcon}
                  <span>{feature.pillText}</span>
                </div>
                <div className={styles.arrowBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
