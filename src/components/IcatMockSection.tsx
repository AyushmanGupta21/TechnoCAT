import styles from "./IcatMockSection.module.css";

export default function IcatMockSection() {
  return (
    <section id="register" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* "NEW" corner badge */}
          <div className={styles.cornerBadge}>
            <div className={styles.cornerTriangle} />
            <span className={styles.newLabel}>NEW</span>
          </div>

          <div className={styles.grid}>
            {/* Left content */}
            <div className={styles.leftCol}>
              <h2 className={styles.heading}>
                Attempt All India <br className={styles.smBreak} />
                TechnoCAT Mock 6.0
              </h2>
              <div className={styles.livePill}>
                <span className={styles.liveDot} />
                <span className={styles.liveText}>Live Now</span>
              </div>
              <p className={styles.description}>
                Take the free All India Mock, compare your national rank, and{" "}
                <span className={styles.prizeHighlight}>compete for prizes worth ₹3.5 Lakhs.</span>
              </p>
              <div className={styles.rankInfo}>
                <p>
                  <span className={styles.rankBold}>Rank 4 to 10</span> will get IIM ABC Practice Batch
                </p>
                <p>
                  <span className={styles.rankBold}>Rank 11 to 20</span> will get TechnoCAT Mock Test Series
                </p>
                <p>
                  <span className={styles.rankBold}>Rank 21 to 50</span> will get Flat 50% Off on all CAT 2026 Crash Course
                </p>
              </div>
              <div className={styles.ctaRow}>
                <button className={styles.attemptBtn}>Attempt Now</button>
              </div>
            </div>

            {/* Right: Prizes image */}
            <div className={styles.rightCol}>
              <div className={styles.prizesImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://media.iquanta.in/ui_images/icat-ock-6-prizes-new.webp"
                  alt="TechnoCAT Prizes"
                  className={styles.prizesImg}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
