import React from "react";
import Link from "next/link";
import styles from "./intelligence.module.css";
import Image from "next/image";
import PostLoginNavActions from "@/components/PostLoginNavActions";

export default function IntelligenceHubPage() {
  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== HEADER SECTION (Mirrored from Dashboard) ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse", hasDropdown: true },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navLink} ${item.href === "/intelligence" ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg className={styles.dropdownChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile Dropdown */}
            <PostLoginNavActions />
          </nav>

          {/* Intelligence Hub Hero */}
          <div className={styles.heroRow}>
            <div className={styles.heroLeft}>
              <div className={styles.badgeLabel}>
                <span className={styles.sparkleIcon}>✨</span> AI-Powered Learning
              </div>
              <h1 className={styles.heroHeading}>
                Your CAT Preparation, <br />
                <span className={styles.heroHighlight}>Powered by Intelligence.</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Practice smarter, understand your mistakes, track your progress and get personalized insights — all in one place.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent}>
        
        {/* STUDENT SNAPSHOT */}
        <section className={styles.snapshotSection}>
          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotCard}>
              <span className={styles.snapLabel}>Current Percentile</span>
              <span className={styles.snapValue}>92.4</span>
            </div>
            <div className={styles.snapshotCard}>
              <span className={styles.snapLabel}>Mocks Completed</span>
              <span className={styles.snapValue}>18</span>
            </div>
            <div className={styles.snapshotCard}>
              <span className={styles.snapLabel}>Accuracy</span>
              <span className={styles.snapValue}>81%</span>
            </div>
            <div className={styles.snapshotCard}>
              <span className={styles.snapLabel}>Study Streak</span>
              <span className={styles.snapValue}>12 Days</span>
            </div>
          </div>
        </section>

        {/* AI QUICK INSIGHT */}
        <section className={styles.insightSection}>
          <div className={styles.aiInsightCard}>
            <div className={styles.aiIconBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className={styles.aiContent}>
              <h3 className={styles.aiTitle}>TechnoCAT AI Insight</h3>
              <p className={styles.aiText}>
                Your overall performance has improved over the last 5 mocks. Your strongest area is <strong>VARC</strong>, while <strong>DILR</strong> needs more practice.
              </p>
              <Link href="/intelligence/ai-analysis" className={styles.aiLink}>
                View Full AI Analysis &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* EXPLORE FEATURES */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Explore Your Intelligence Tools</h2>
            <p className={styles.sectionSubtitle}>Everything you need to understand your CAT preparation better.</p>
          </div>

          <div className={styles.featuresGrid}>
            {/* Card 1 */}
            <Link href="/intelligence/ai-analysis" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgBlue}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <h3 className={styles.featureTitle}>AI Performance Analysis</h3>
              <p className={styles.featureDesc}>Get personalized insights from your mock-test performance and discover exactly where you need to improve.</p>
              <div className={styles.featureCta}>View AI Analysis &rarr;</div>
            </Link>

            {/* Card 2 */}
            <Link href="/intelligence/error-tracking" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgTeal}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 className={styles.featureTitle}>Error Tracking</h3>
              <p className={styles.featureDesc}>Track repeated mistakes, identify error patterns and understand the concepts behind your wrong answers.</p>
              <div className={styles.featureCta}>Track My Errors &rarr;</div>
            </Link>

            {/* Card 3 */}
            <Link href="/intelligence/b-school-predictor" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgCyan}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              </div>
              <h3 className={styles.featureTitle}>B-School Predictor</h3>
              <p className={styles.featureDesc}>Explore profile and percentile-based B-school possibilities using your CAT performance.</p>
              <div className={styles.featureCta}>Check My Profile &rarr;</div>
            </Link>

            {/* Card 4 */}
            <Link href="/dashboard" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgLavender}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 className={styles.featureTitle}>Sectional & Full Mocks</h3>
              <p className={styles.featureDesc}>Practice with full-length CAT mocks and section-wise tests designed for realistic exam preparation.</p>
              <div className={styles.featureCta}>Explore Mocks &rarr;</div>
            </Link>

            {/* Card 5 */}
            <Link href="/analytics" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgBlue}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <h3 className={styles.featureTitle}>Detailed Analytics</h3>
              <p className={styles.featureDesc}>Track your score, percentile, accuracy, speed and topic-wise performance over time.</p>
              <div className={styles.featureCta}>View Analytics &rarr;</div>
            </Link>

            {/* Card 6 */}
            <Link href="/intelligence/community" className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.bgTeal}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3 className={styles.featureTitle}>Learning Community</h3>
              <p className={styles.featureDesc}>Connect with fellow CAT aspirants, discuss strategies, solve challenges and stay motivated.</p>
              <div className={styles.featureCta}>Join Community &rarr;</div>
            </Link>
          </div>
        </section>

        {/* INTELLIGENCE FLOW */}
        <section className={styles.flowSection}>
          <h2 className={styles.sectionTitle}>Your Complete CAT Improvement Loop</h2>
          <div className={styles.flowContainer}>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>1</div>
              <span className={styles.flowText}>TAKE A MOCK</span>
            </div>
            <div className={styles.flowArrow}>&rarr;</div>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>2</div>
              <span className={styles.flowText}>ANALYZE PERFORMANCE</span>
            </div>
            <div className={styles.flowArrow}>&rarr;</div>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>3</div>
              <span className={styles.flowText}>IDENTIFY MISTAKES</span>
            </div>
            <div className={styles.flowArrow}>&rarr;</div>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>4</div>
              <span className={styles.flowText}>GET AI INSIGHTS</span>
            </div>
            <div className={styles.flowArrow}>&rarr;</div>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>5</div>
              <span className={styles.flowText}>TARGET WEAK TOPICS</span>
            </div>
            <div className={styles.flowArrow}>&rarr;</div>
            <div className={styles.flowStep}>
              <div className={styles.flowNode}>6</div>
              <span className={styles.flowText}>IMPROVE YOUR SCORE</span>
            </div>
          </div>
        </section>

        <div className={styles.bottomGrid}>
          {/* RECOMMENDATIONS */}
          <section className={styles.recommendationSection}>
            <h2 className={styles.sectionTitleSmall}>Recommended For You</h2>
            <div className={styles.recList}>
              <Link href="/dashboard" className={styles.recItem}>
                <span className={styles.recNumber}>1</span>
                Practice 2 DILR sets
              </Link>
              <Link href="/intelligence/error-tracking" className={styles.recItem}>
                <span className={styles.recNumber}>2</span>
                Review your Algebra mistakes
              </Link>
              <Link href="/dashboard" className={styles.recItem}>
                <span className={styles.recNumber}>3</span>
                Attempt CAT Full Mock #19
              </Link>
              <Link href="/intelligence/ai-analysis" className={styles.recItem}>
                <span className={styles.recNumber}>4</span>
                Analyze your last mock
              </Link>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className={styles.quickActionsSection}>
            <h2 className={styles.sectionTitleSmall}>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <Link href="/dashboard" className={styles.actionBtn}>Start a Mock</Link>
              <Link href="/analytics" className={styles.actionBtnSecondary}>View My Analytics</Link>
              <Link href="/intelligence/ai-analysis" className={styles.actionBtnSecondary}>Ask AI Mentor</Link>
              <Link href="/intelligence/error-tracking" className={styles.actionBtnSecondary}>Review Mistakes</Link>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
