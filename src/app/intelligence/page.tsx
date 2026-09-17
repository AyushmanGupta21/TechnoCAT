"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./intelligence.module.css";
import Image from "next/image";
import PostLoginNavActions from "@/components/PostLoginNavActions";

interface DashboardData {
  metrics: {
    inProgressCourses: number;
    completedCourses: number;
    watchingTime: string;
    pointsEarned: number;
  };
  summary: {
    totalHoursWeek: number;
    avgHoursDay: number;
    courseHoursWeek: number;
    challengeHoursWeek: number;
  };
}

export default function IntelligenceHubPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 0) {
            setDashboardData(JSON.parse(text));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);


  const calcConcepts = () => {
    if (!dashboardData) return 85;
    const completed = dashboardData.metrics.completedCourses || 0;
    const inProgress = dashboardData.metrics.inProgressCourses || 0;
    return Math.min(100, Math.max(10, Math.floor(((completed * 2 + inProgress) / 10) * 100)));
  };

  const calcSpeed = () => {
    if (!dashboardData) return 64;
    const challenge = dashboardData.summary.challengeHoursWeek || 0;
    return Math.min(100, Math.max(10, Math.floor((challenge / 30) * 100)));
  };

  const calcConsistency = () => {
    if (!dashboardData) return 90;
    const avg = dashboardData.summary.avgHoursDay || 0;
    return Math.min(100, Math.max(10, Math.floor((avg / 6) * 100)));
  };

  const calcAccuracy = () => {
    if (!dashboardData) return 72;
    const points = dashboardData.metrics.pointsEarned || 0;
    return Math.min(100, Math.max(10, Math.floor((points / 1200) * 100)));
  };

  const concepts = isLoading ? 0 : calcConcepts();
  const speed = isLoading ? 0 : calcSpeed();
  const consistency = isLoading ? 0 : calcConsistency();
  const accuracy = isLoading ? 0 : calcAccuracy();
  const readiness = isLoading ? 0 : Math.floor((concepts + speed + consistency + accuracy) / 4);
  
  const strokeOffset = 264 - (264 * readiness) / 100;

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
        {/* STUDENT SNAPSHOT (Original Dashboard Style) */}
        <section className={styles.snapshotSection}>
          <div className={styles.metricCardsRow}>
            {/* Card 1: In Progress */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderLeft: '4px solid #8b5cf6' }}>
              <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : dashboardData?.metrics?.inProgressCourses || 0} Topics</span>
                <span className={styles.metricLabel}>In Progress</span>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', borderLeft: '4px solid #0D9488' }}>
              <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : dashboardData?.metrics?.completedCourses || 0} Topics</span>
                <span className={styles.metricLabel}>Completed</span>
              </div>
            </div>

            {/* Card 3: Watching Time */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderLeft: '4px solid #2563EB' }}>
              <div className={`${styles.metricIconBox} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : dashboardData?.metrics?.watchingTime || "0h 0m"}</span>
                <span className={styles.metricLabel}>Watching Time</span>
              </div>
            </div>

            {/* Card 4: Total Points */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', borderLeft: '4px solid #6366F1' }}>
              <div className={`${styles.metricIconBox} ${styles.iconPink}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : dashboardData?.metrics?.pointsEarned || 0}</span>
                <span className={styles.metricLabel}>Total Points</span>
              </div>
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
          {/* CAT READINESS METER */}
          <section className={styles.readinessSection}>
            <div className={styles.readinessHeader}>
              <h2 className={styles.sectionTitleSmall}>CAT Readiness Meter</h2>
              <span className={styles.readinessBadge}>Updated Today</span>
            </div>

            <div className={styles.readinessMain}>
              {/* Circular Score */}
              <div className={styles.readinessScoreBox}>
                <div className={styles.circularProgress}>
                  <svg viewBox="0 0 100 100" className={styles.progressSvg}>
                    <circle cx="50" cy="50" r="42" className={styles.progressBg}></circle>
                    <circle cx="50" cy="50" r="42" className={styles.progressValue} style={{ strokeDashoffset: strokeOffset }}></circle>
                  </svg>
                  <div className={styles.scoreText}>
                    <span className={styles.scoreNumber}>{readiness}<span className={styles.scorePercent}>%</span></span>
                    <span className={styles.scoreLabel}>Readiness</span>
                  </div>
                </div>
              </div>

              {/* 4 Metrics */}
              <div className={styles.readinessMetrics}>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Concepts</span>
                    <span className={styles.metricVal}>{concepts}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${concepts}%`, background: '#0EA5E9'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Accuracy</span>
                    <span className={styles.metricVal}>{accuracy}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${accuracy}%`, background: '#2DD4BF'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Speed</span>
                    <span className={styles.metricVal}>{speed}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${speed}%`, background: '#F59E0B'}}></div></div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>Consistency</span>
                    <span className={styles.metricVal}>{consistency}%</span>
                  </div>
                  <div className={styles.metricBar}><div className={styles.metricFill} style={{width: `${consistency}%`, background: '#8B5CF6'}}></div></div>
                </div>
              </div>
            </div>

            {/* Affecting Readiness */}
            <div className={styles.affectingSection}>
              <h3 className={styles.affectingTitle}>What is affecting your readiness?</h3>
              <div className={styles.insightCards}>
                <div className={styles.insightCard}>
                  <div className={`${styles.insightIconBox} ${styles.iconWarn}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Speed Under Pressure</span>
                    <span className={styles.insightDesc}>Taking too long on tricky QA questions.</span>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={`${styles.insightIconBox} ${styles.iconGood}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>DILR Set Selection</span>
                    <span className={styles.insightDesc}>Excellent accuracy in choosing the right sets.</span>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={`${styles.insightIconBox} ${styles.iconNeutral}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Mock Consistency</span>
                    <span className={styles.insightDesc}>Consistent scores, but lacking breakthroughs.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Challenge */}
            <div className={styles.challengeSection}>
              <div className={styles.challengeHeaderRow}>
                <h3 className={styles.challengeTitle}>Your 7-Day CAT Challenge</h3>
                <Link href="/dashboard" className={styles.challengeCta}>
                  Start Today's Challenge &rarr;
                </Link>
              </div>
              <div className={styles.timeline}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className={`${styles.timelineDay} ${day < 5 ? styles.dayCompleted : day === 5 ? styles.dayToday : styles.dayUpcoming}`}>
                    <div className={styles.dayCircle}>
                      {day < 5 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : day === 5 ? (
                        <span className={styles.dayDot}></span>
                      ) : null}
                    </div>
                    <span className={styles.dayLabel}>
                      {day === 5 ? "Today" : `Day ${day}`}
                    </span>
                  </div>
                ))}
              </div>
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
