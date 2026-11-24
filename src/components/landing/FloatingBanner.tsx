"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { EASE_OUT } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./FloatingBanner.module.css";

const DISMISS_KEY = "technocat_banner_dismissed";

export default function FloatingBanner() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <AnimatePresence>
      {scrolled && !dismissed && (
        <motion.div
          className={styles.wrap}
          role="region"
          aria-label="Free mocks offer"
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : 24 }}
          transition={{ duration: reduce ? 0.6 : 0.5, ease: EASE_OUT }}
        >
          <div className={`${styles.bar} glass-card`} data-tint="blue">
            <span className={`${ui.liveDot} ${styles.dot}`} aria-hidden="true" />
            <p className={styles.text}>
              <strong>6 sectionals and 1 full mock, free.</strong>
              <span className={styles.sub}> No credit card required.</span>
            </p>
            <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss offer">
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm} ${styles.cta}`} onClick={handleClaim}>
              Claim free mocks
              <ArrowRight size={16} strokeWidth={1.75} data-arrow aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
