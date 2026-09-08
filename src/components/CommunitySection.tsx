"use client";
import styles from "./CommunitySection.module.css";

export default function CommunitySection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Left: Stats */}
          <div className={styles.statsCol}>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statNum}>10,000+</div>
                <div className={styles.statLabel}>Doubts Solved Monthly</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>100,000+</div>
                <div className={styles.statLabel}>Active Members</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>24/7</div>
                <div className={styles.statLabel}>Peer &amp; Mentor Support</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>500+</div>
                <div className={styles.statLabel}>Daily Discussions</div>
              </div>
            </div>

            <button className={styles.shareBtn}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
              Share Your Analysis in CAT Group
            </button>
          </div>

          {/* Right: Phone mockups */}
          <div className={styles.phonesCol}>
            <div className={styles.phoneFallback}>
              <div className={styles.phoneCard}>
                <div className={styles.phoneHeader}>TechnoCAT Prep Group</div>
                <div className={styles.phoneMessage}>
                  <div className={styles.phoneAvatar}>A</div>
                  <div className={styles.phoneBubble}>Hey, how do I solve this geometry problem?</div>
                </div>
                <div className={styles.phoneMessage} style={{ alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                  <div className={styles.phoneAvatar} style={{ background: 'var(--secondary)'}}>M</div>
                  <div className={styles.phoneBubble} style={{ background: 'var(--primary)', color: 'white' }}>Use the tangent-secant theorem!</div>
                </div>
              </div>
              <div className={styles.phoneCard} style={{ transform: "translateX(40px) scale(0.9)", opacity: 0.8, position: 'absolute', top: '20px', zIndex: -1 }}>
                <div className={styles.phoneHeader}>CAT Mock Analysis</div>
                <div className={styles.phoneLine} />
                <div className={styles.phoneLine} style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
