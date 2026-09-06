"use client";

import React, { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Navbar */}
      <header
        className={styles.header}
        style={{ transform: scrolled ? "translateY(0)" : "translateY(0)" }}
      >
        {/* Top utility bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>
            <div className={styles.topBarLeft}>
              <button className={styles.whatsappBtn}>
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  className={styles.whatsappIcon}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M260.062 32C138.605 32 40.134 129.701 40.134 250.232c0 41.23 11.532 79.79 31.559 112.687L32 480l121.764-38.682c31.508 17.285 67.745 27.146 106.298 27.146C381.535 468.464 480 370.749 480 250.232 480 129.701 381.535 32 260.062 32zm109.362 301.11c-5.174 12.827-28.574 24.533-38.899 25.072-10.314.547-10.608 7.994-66.84-16.434-56.225-24.434-90.052-83.844-92.719-87.67-2.669-3.812-21.78-31.047-20.749-58.455 1.038-27.413 16.047-40.346 21.404-45.725 5.351-5.387 11.486-6.352 15.232-6.413 4.428-.072 7.296-.132 10.573-.011 3.274.124 8.192-.685 12.45 10.639 4.256 11.323 14.443 39.153 15.746 41.989 1.302 2.839 2.108 6.126.102 9.771-2.012 3.653-3.042 5.935-5.961 9.083-2.935 3.148-6.174 7.042-8.792 9.449-2.92 2.665-5.97 5.572-2.9 11.269 3.068 5.693 13.653 24.356 29.779 39.736 20.725 19.771 38.598 26.329 44.098 29.317 5.515 3.004 8.806 2.67 12.226-.929 3.404-3.599 14.639-15.746 18.596-21.169 3.955-5.438 7.661-4.373 12.742-2.329 5.078 2.052 32.157 16.556 37.673 19.551 5.51 2.989 9.193 4.529 10.51 6.9 1.317 2.38.901 13.531-4.271 26.359z" />
                </svg>
                <div>
                  Join CAT Whatsapp Group
                  <div className={styles.whatsappSub}>200K members</div>
                </div>
              </button>
              <a href="/cat-prep-app" className={styles.downloadAppBtn}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15V3" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                <div>
                  <div className={styles.downloadAppTitle}>Download TechnoCAT App</div>
                </div>
              </a>
            </div>
            <ul className={styles.utilityLinks}>
              <li><a href="/iim-call-predictor">Predict your BSchool</a></li>
              <li><a href="/cat-daily-target">Free CAT Daily Target</a></li>
              <li><a href="/free-cat-study-material">Free CAT Study Material!</a></li>
              <li><a href="/mba-sop">SOP Generator</a></li>
              <li><a href="/cat-score-calculator">CAT Score Calculator</a></li>
            </ul>
          </div>
        </div>

        {/* Main nav */}
        <div className={styles.mainNav}>
          <div className={styles.mainNavInner}>
            <div className={styles.navLeft}>
              <a href="/" className={styles.logoLink}>
                <span className={styles.textLogo}>
                  <span className={styles.textLogoTechno}>Techno</span><span className={styles.textLogoCAT}>CAT</span>
                </span>
              </a>
              <div className={styles.startupBadge}>
                <span className={styles.recognisedBy}>RECOGNISED BY</span>
                <span className={styles.startupIndia}>#startupindia</span>
              </div>
              <button className={styles.allCoursesBtn}>
                All Courses
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <nav className={styles.navLinks}>
                {["Past Papers", "Mocks", "Know us"].map((item) => (
                  <div key={item} className={styles.navItem}>
                    <button className={styles.navLinkBtn}>
                      {item}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </nav>
            </div>

            <div className={styles.navActions}>
              <button className={styles.loginBtn}>Login</button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navbar */}
      <div className={styles.mobileNav}>
        <div className={styles.mobileTopBar}>
          <button className={styles.mobileWhatsappBtn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
            </svg>
            Join WhatsApp Group
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button className={styles.mobileGetPdfsBtn}>
            Get CAT PDFs
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15V3" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>
        </div>
        <div className={styles.mobileMainBar}>
          <div className={styles.mobileNavLeft}>
            <button className={styles.mobileMenuBtn} aria-label="Mobile Menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            </button>
            <a href="/" className={styles.mobileLogoLink}>
              <span className={styles.textLogo}>
                <span className={styles.textLogoTechno}>Techno</span><span className={styles.textLogoCAT}>CAT</span>
              </span>
            </a>
          </div>
          <div className={styles.mobileNavRight}>
            <button className={styles.mobileCoursesBtn}>Courses</button>
            <button className={styles.mobileJoinBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              Join for Free
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
