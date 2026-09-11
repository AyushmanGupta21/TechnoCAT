"use client";
import { useRef, useState, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = 350; // Approximate
        const newIndex = Math.round(scrollLeft / cardWidth);
        // Only update if it changes to avoid too many renders
        if (newIndex >= 0 && newIndex < feedbacks.length) {
           setActiveIndex(Math.min(newIndex, 2)); // 3 dots
        }
      }
    };
    
    const refCurrent = scrollRef.current;
    if (refCurrent) {
      refCurrent.addEventListener('scroll', handleScroll);
      return () => refCurrent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <section className={styles.feedbackSection}>
      {/* Background Decor */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>
      <div className={styles.bgWave}></div>
      <div className={styles.bgDots}>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <pattern id="dotsFb" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="#BAE6FD" />
          </pattern>
          <rect width="100" height="100" fill="url(#dotsFb)" />
        </svg>
      </div>

      <div className={styles.container}>
        <div className={styles.titleGroup}>
          <div className={styles.pillBadge}>★ Real Stories, Real Results</div>
          <h2 className={styles.heading}>
            What Our <span className={styles.headingGradient}>Students Say</span>
          </h2>
          <p className={styles.subHeading}>Join thousands of successful CAT aspirants who cracked their dream B-Schools with TechnoCAT.</p>
        </div>

        {/* Side Illustrations */}
        <div className={styles.illustLeft}>
          <div className={styles.illustLeftIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div className={styles.illustLeftText}>99+ Percentile</div>
        </div>

        <div className={styles.illustRight}>
          Real People<br/>Real Journeys<br/>Real Success
        </div>

        <div className={styles.carouselWrapper}>
          <div className={styles.grid} ref={scrollRef}>
            {feedbacks.map((fb, i) => (
              <div key={i} className={`${styles.feedbackCard} ${i === 0 ? styles.cardHighlighted : ''} ${fb.colorClass}`}>
                
                <div className={styles.cardCornerDecor}></div>
                
                <div className={styles.cardHeader}>
                  <div className={styles.quoteMark}>“</div>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                </div>

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

        {/* Carousel Controls */}
        <div className={styles.carouselControls}>
          <button className={styles.controlBtn} onClick={scrollLeft} aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <div className={styles.dots}>
            {[0, 1, 2].map(dot => (
              <div key={dot} className={`${styles.dot} ${activeIndex === dot ? styles.dotActive : ''}`} />
            ))}
          </div>

          <button className={styles.controlBtn} onClick={scrollRight} aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
