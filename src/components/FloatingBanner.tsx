"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./FloatingBanner.module.css";

export default function FloatingBanner() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleClaim = () => {
    const dest = "/browse?section=mocks&mock=latest#pyq-section";
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", dest);
      }
      openAuthModal("signin");
    } else {
      router.push(dest);
    }
  };

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.bannerContainer}>
        <div className={styles.textWrap}>
          <span className={styles.badge}>FREE</span>
          <span className={styles.text}>Get 6 Free Sectionals &amp; 1 Full Mock — No Credit Card Required</span>
        </div>
        <button className={styles.ctaBtn} onClick={handleClaim}>Claim Free Mocks &rarr;</button>
      </div>
    </div>
  );
}

