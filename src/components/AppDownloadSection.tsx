import styles from "./AppDownloadSection.module.css";

export default function AppDownloadSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left content */}
          <div className={styles.leftCol}>
            {/* Store rating badges */}
            <div className={styles.ratingBadge}>
              <span className={styles.ratingItem}>
                {/* Google Play icon */}
                <svg viewBox="0 0 24 24" className={styles.storeIcon}>
                  <path d="M3 2.5c0-.4.2-.7.5-.9L14 12 3.5 22.4c-.3-.2-.5-.5-.5-.9V2.5z" fill="#00C2FF" />
                  <path d="M14 12 17.6 8.4 4.9 1.4c-.6-.3-1.2-.2-1.7.1L14 12z" fill="#00E676" />
                  <path d="M14 12l3.6 3.6 12.7-7c.6-.3 1-1 1-1.6s-.4-1.3-1-1.6l-2.7-1.5L14 12z" fill="#FFC400" />
                  <path d="M14 12 3.2 22.6c.5.3 1.1.4 1.7.1l12.7-7L14 12z" fill="#FF3D00" />
                </svg>
                4.6 <span className={styles.star}>★</span> 166 reviews
              </span>
              <span className={styles.divider} />
              <span className={styles.ratingItem}>
                {/* Apple icon */}
                <svg viewBox="0 0 24 24" className={styles.storeIcon}>
                  <path d="M16.365 1.43c0 1.14-.415 2.05-1.244 2.73-.842.686-1.822 1.05-2.89.99-.058-1.09.42-2.06 1.24-2.75.83-.69 1.9-1.06 2.894-.97zM20.5 17.2c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.96-3.87-.95-2.01.01-2.43 .97-3.91.95-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.16-2.94-9.04-1.3-11.64 1.16-1.85 2.99-2.93 4.71-2.93 1.75 0 2.85 .96 4.3 .96 1.4 0 2.26-.96 4.3-.96 1.53 0 3.15.84 4.31 2.28-3.79 2.08-3.18 7.5.7 9.28z" fill="white"/>
                </svg>
                4.6 <span className={styles.star}>★</span> 166 reviews
              </span>
            </div>

            <h2 className={styles.heading}>
              TechnoCAT <span className={styles.inverted}>Mock Analysis</span> is also
              available on the <span className={styles.inverted}>TechnoCAT</span> app.
            </h2>

            <p className={styles.description}>
              Analyse your TechnoCAT Mocks anytime, anywhere, right from your phone. No need to open your
              laptop again. Get easy access to all the powerful AI Mock Analysis features of TechnoCAT,
              directly on the TechnoCAT App.
            </p>

            {/* Store buttons */}
            <div className={styles.storeButtons}>
              <a
                href="https://apps.apple.com/in/app/iquanta/id6754868864"
                target="_blank"
                rel="noreferrer"
                className={styles.storeBtn}
              >
                <svg viewBox="0 0 24 24" className={styles.storeBtnIcon} fill="white">
                  <path d="M16.365 1.43c0 1.14-.415 2.05-1.244 2.73-.842.686-1.822 1.05-2.89.99-.058-1.09.42-2.06 1.24-2.75.83-.69 1.9-1.06 2.894-.97zM20.5 17.2c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.96-3.87-.95-2.01.01-2.43 .97-3.91.95-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.16-2.94-9.04-1.3-11.64 1.16-1.85 2.99-2.93 4.71-2.93 1.75 0 2.85 .96 4.3 .96 1.4 0 2.26-.96 4.3-.96 1.53 0 3.15.84 4.31 2.28-3.79 2.08-3.18 7.5.7 9.28z" />
                </svg>
                <span className={styles.storeBtnText}>
                  <span className={styles.storeSubLabel}>Download on the</span>
                  <span className={styles.storeMainLabel}>App Store</span>
                </span>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.iquanta.app&hl=en&pli=1"
                target="_blank"
                rel="noreferrer"
                className={styles.storeBtn}
              >
                <svg viewBox="0 0 24 24" className={styles.storeBtnIcon}>
                  <path d="M3 2.5c0-.4.2-.7.5-.9L14 12 3.5 22.4c-.3-.2-.5-.5-.5-.9V2.5z" fill="#00C2FF" />
                  <path d="M14 12 17.6 8.4 4.9 1.4c-.6-.3-1.2-.2-1.7.1L14 12z" fill="#00E676" />
                  <path d="M14 12l3.6 3.6 12.7-7c.6-.3 1-1 1-1.6s-.4-1.3-1-1.6l-2.7-1.5L14 12z" fill="#FFC400" />
                  <path d="M14 12 3.2 22.6c.5.3 1.1.4 1.7.1l12.7-7L14 12z" fill="#FF3D00" />
                </svg>
                <span className={styles.storeBtnText}>
                  <span className={styles.storeSubLabel}>ANDROID APP ON</span>
                  <span className={styles.storeMainLabel}>Google Play</span>
                </span>
              </a>
            </div>
          </div>

          {/* Right: App screens */}
          <div className={styles.rightCol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://media.iquanta.in/ui_images/app-download-mock.webp"
              alt="TechnoCAT Mock Analysis shown across three phone screens"
              className={styles.appImg}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
