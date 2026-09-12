import styles from "./Footer.module.css";
import Link from "next/link";

const footerLinks = [
  {
    heading: "Platform",
    links: [
      { label: "Mock Tests", href: "#" },
      { label: "Sectional Tests", href: "#" },
      { label: "AI Analysis", href: "#" },
      { label: "Performance", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Courses", href: "#" },
      { label: "Video Solutions", href: "#" },
      { label: "Preparation Guide", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logoLink}>
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>
            <p className={styles.brandTagline}>Practice | Analyze | Improve</p>
            <p className={styles.brandDesc}>
              An intelligent CAT preparation platform designed to help you practice smarter, analyze better, and improve continuously.
            </p>
            
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="var(--white)"/></svg>
                  )}
                  {s === "linkedin" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className={styles.linksGrid}>
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
