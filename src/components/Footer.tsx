import styles from "./Footer.module.css";

const footerLinks = [
  {
    heading: "CAT COURSES",
    links: [
      { label: "CAT Online Course", href: "#" },
      { label: "CAT 2026 Course", href: "#" },
      { label: "CAT 2027 Course", href: "#" },
      { label: "CAT Mock Test", href: "#" },
      { label: "Best CAT Books", href: "#" },
      { label: "Free CAT Study Material", href: "#" },
      { label: "IIM ABC", href: "#" },
      { label: "CAT Previous Paper", href: "#" },
    ],
  },
  {
    heading: "OTHER MBA COURSES",
    links: [
      { label: "XAI Course", href: "#" },
      { label: "SNAP Course", href: "#" },
      { label: "NMAT Course", href: "#" },
      { label: "XAI Previous Paper", href: "#" },
      { label: "SNAP Previous Paper", href: "#" },
      { label: "GMAT Online Course", href: "#" },
    ],
  },
  {
    heading: "AFTER 12TH COURSES",
    links: [
      { label: "IPMAT Online Course", href: "#" },
      { label: "IPMAT Mock Test", href: "#" },
      { label: "Best IPMAT Books", href: "#" },
      { label: "IPMAT Previous Paper", href: "#" },
      { label: "IPMAT Study Material", href: "#" },
    ],
  },
  {
    heading: "POPULAR TOOLS",
    links: [
      { label: "IIM Call Predictor", href: "#" },
      { label: "CAT Score Calculator", href: "#" },
      { label: "XAT Score Calculator", href: "#" },
    ],
  },
  {
    heading: "KNOW US",
    links: [
      { label: "About Us", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Terms and Conditions", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Refund Policy", href: "#" },
      { label: "Results", href: "#" },
      { label: "Sitemap", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Link columns */}
        <div className={styles.grid}>
          {footerLinks.map((col) => (
            <div key={col.heading} className={styles.col}>
              <h4 className={styles.colHeading}>{col.heading}</h4>
              <ul className={styles.linkList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={styles.link}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>CONTACT</h4>
            <div className={styles.contactBlock}>
              <p>Call: <a href="tel:8130900243" className={styles.contactLink}>8130900243</a></p>
              <p>Franchise: <a href="tel:9717125983" className={styles.contactLink}>9717125983</a></p>
              <p>For any Partnership: <a href="tel:9717125983" className={styles.contactLink}>9717125983</a></p>
              <p><a href="mailto:info@technocat.in" className={styles.contactLink}>info@technocat.in</a></p>
              <p className={styles.address}>Plot No 126, Udyog Vihar Phase 4, Gurugram, Haryana 122015</p>
            </div>

            {/* Social icons */}
            <div className={styles.socialRow}>
              {["facebook", "instagram", "youtube", "linkedin"].map((s) => (
                <a key={s} href="#" className={styles.socialIcon} aria-label={s}>
                  {s === "facebook" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  )}
                  {s === "instagram" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  )}
                  {s === "youtube" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#111"/></svg>
                  )}
                  {s === "linkedin" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  )}
                </a>
              ))}
            </div>

            {/* App store buttons */}
            <p className={styles.downloadLabel}>Download TechnoCAT App</p>
            <div className={styles.storeRow}>
              <a href="#" className={styles.storeBtn}>
                {/* Apple icon */}
                <svg viewBox="0 0 24 24" className={styles.storeBtnIcon} fill="white">
                  <path d="M16.365 1.43c0 1.14-.415 2.05-1.244 2.73-.842.686-1.822 1.05-2.89.99-.058-1.09.42-2.06 1.24-2.75.83-.69 1.9-1.06 2.894-.97zM20.5 17.2c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.96-3.87-.95-2.01.01-2.43.97-3.91.95-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.16-2.94-9.04-1.3-11.64 1.16-1.85 2.99-2.93 4.71-2.93 1.75 0 2.85.96 4.3.96 1.4 0 2.26-.96 4.3-.96 1.53 0 3.15.84 4.31 2.28-3.79 2.08-3.18 7.5.7 9.28z"/>
                </svg>
                <span className={styles.storeBtnText}>
                  <span className={styles.storeBtnSub}>Download on the</span>
                  <span className={styles.storeBtnMain}>App Store</span>
                </span>
              </a>
              <a href="#" className={styles.storeBtn}>
                {/* Play store icon */}
                <svg viewBox="0 0 24 24" className={styles.storeBtnIcon}>
                  <path d="M3 2.5c0-.4.2-.7.5-.9L14 12 3.5 22.4c-.3-.2-.5-.5-.5-.9V2.5z" fill="#00C2FF"/>
                  <path d="M14 12 17.6 8.4 4.9 1.4c-.6-.3-1.2-.2-1.7.1L14 12z" fill="#00E676"/>
                  <path d="M14 12l3.6 3.6 2.7-1.5c.6-.3 1-1 1-1.6s-.4-1.3-1-1.6L17.6 8.4 14 12z" fill="#FFC400"/>
                  <path d="M14 12 3.2 22.6c.5.3 1.1.4 1.7.1l12.7-7L14 12z" fill="#FF3D00"/>
                </svg>
                <span className={styles.storeBtnText}>
                  <span className={styles.storeBtnSub}>ANDROID APP ON</span>
                  <span className={styles.storeBtnMain}>Google Play</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © 2026 TechnoCAT EDU SERVICES PRIVATE LIMITED. All Rights Reserved. | Proudly Made in India ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
