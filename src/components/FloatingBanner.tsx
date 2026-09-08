import styles from "./FloatingBanner.module.css";

export default function FloatingBanner() {
  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.bannerContainer}>
        <div className={styles.textWrap}>
          <span className={styles.badge}>FREE</span>
          <span className={styles.text}>Get 6 Free Sectionals & 1 Full Mock — No Credit Card Required</span>
        </div>
        <button className={styles.ctaBtn}>Claim Free Mocks</button>
      </div>
    </div>
  );
}
