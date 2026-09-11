"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
          <defs>
            <linearGradient id="aiGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA"/>
              <stop offset="1" stopColor="#1D4ED8"/>
            </linearGradient>
            <filter id="shadowAi" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.25"/>
            </filter>
          </defs>
          <rect x="12" y="12" width="40" height="40" rx="10" fill="url(#aiGrad)" filter="url(#shadowAi)" />
          <path d="M24 12V6M40 12V6M24 58V52M40 58V52M12 24H6M12 40H6M58 24H52M58 40H52" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round" filter="url(#shadowAi)"/>
          <text x="32" y="39" fill="white" fontSize="22" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">AI</text>
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
          <defs>
            <filter id="shadowDart" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
            </filter>
          </defs>
          <circle cx="32" cy="32" r="24" fill="#E0F2FE" filter="url(#shadowDart)"/>
          <circle cx="32" cy="32" r="16" fill="#BAE6FD" filter="url(#shadowDart)"/>
          <circle cx="32" cy="32" r="8" fill="#3B82F6" filter="url(#shadowDart)"/>
          <path d="M50 14L34 30" stroke="#1D4ED8" strokeWidth="6" strokeLinecap="round" filter="url(#shadowDart)"/>
          <path d="M50 14L50 24M50 14L40 14" stroke="#1D4ED8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadowDart)"/>
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
          <defs>
            <filter id="shadowSchool" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
            </filter>
          </defs>
          <path d="M32 10L10 24V54H54V24L32 10Z" fill="#CCFBF1" filter="url(#shadowSchool)"/>
          <rect x="24" y="38" width="16" height="16" fill="#0D9488" filter="url(#shadowSchool)"/>
          <circle cx="32" cy="24" r="5" fill="#0D9488"/>
          <path d="M24 24V28M40 24V28" stroke="#0D9488" strokeWidth="4" strokeLinecap="round"/>
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
          <defs>
            <filter id="shadowMock" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
            </filter>
          </defs>
          <rect x="14" y="6" width="36" height="52" rx="6" fill="#E0F2FE" filter="url(#shadowMock)"/>
          <path d="M24 20H40M24 32H40M24 44H30" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round"/>
          <circle cx="40" cy="44" r="5" fill="#F59E0B" filter="url(#shadowMock)"/>
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
          <defs>
            <filter id="shadowChart" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
            </filter>
          </defs>
          <rect x="12" y="36" width="10" height="22" rx="3" fill="#C7D2FE" filter="url(#shadowChart)"/>
          <rect x="27" y="24" width="10" height="34" rx="3" fill="#818CF8" filter="url(#shadowChart)"/>
          <rect x="42" y="10" width="10" height="48" rx="3" fill="#4F46E5" filter="url(#shadowChart)"/>
          <path d="M8 44L28 28L44 14L58 4" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadowChart)"/>
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
          <defs>
            <filter id="shadowCom" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
            </filter>
          </defs>
          <circle cx="32" cy="20" r="12" fill="#38BDF8" filter="url(#shadowCom)"/>
          <path d="M10 54C10 41.8497 19.8497 32 32 32C44.1503 32 54 41.8497 54 54" fill="#0EA5E9" filter="url(#shadowCom)"/>
          <circle cx="16" cy="30" r="7" fill="#7DD3FC" filter="url(#shadowCom)"/>
          <path d="M4 54C4 46.268 10.268 40 18 40C23.3619 40 27.9942 43.0125 30.2223 47.5583" stroke="#BAE6FD" strokeWidth="5" strokeLinecap="round" filter="url(#shadowCom)"/>
          <circle cx="48" cy="30" r="7" fill="#7DD3FC" filter="url(#shadowCom)"/>
          <path d="M60 54C60 46.268 53.732 40 46 40C40.6381 40 36.0058 43.0125 33.7777 47.5583" stroke="#BAE6FD" strokeWidth="5" strokeLinecap="round" filter="url(#shadowCom)"/>
        </svg>
      </div>
    )
  }
];

export default function FeaturesSection() {
  const { user, openAuthModal } = useAuth();

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user || user.isGuest) {
      e.preventDefault();
      openAuthModal("signin");
    }
  };

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
            <Link 
              href="/dashboard" 
              key={index} 
              onClick={handleCardClick}
              className={`${styles.featureCard} ${feature.colorClass} ${feature.isRow ? styles.cardRow : ''}`}
            >
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
