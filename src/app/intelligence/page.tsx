"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./intelligence.module.css";
import Image from "next/image";
import PostLoginNavActions from "@/components/PostLoginNavActions";

interface ChallengeData {
  startDate: string;
  currentDay: number;
  completedDays: number;
  totalDays: number;
  days: {
    day: number;
    date: string;
    status: 'completed' | 'incomplete' | 'today' | 'upcoming';
    title: string;
    desc: string;
    tasks: { name: string; done: boolean }[];
    progress: { tasksDone: number; tasksTotal: number };
  }[];
}

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
    const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [selectedChallengeDay, setSelectedChallengeDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
            const fetchDashboard = async () => {
      try {
        const [dashRes, chalRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/intelligence/challenge")
        ]);

        if (dashRes.ok) {
          const text = await dashRes.text();
          if (text && text.trim().length > 0) {
            setDashboardData(JSON.parse(text));
          }
        }
        
        if (chalRes.ok) {
          const text = await chalRes.text();
          if (text && text.trim().length > 0) {
            const data = JSON.parse(text);
            setChallengeData(data);
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
                { name: "Browse", href: "/browse" },
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
          <section className={styles.readinessSection} style={{position: 'relative'}}>
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
                <div className={`${styles.insightCard} ${selectedInsight === 'speed' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('speed')}>
                  <div className={`${styles.insightIconBox} ${styles.iconWarn}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Speed Under Pressure</span>
                    <span className={styles.insightDesc}>Taking too long on tricky QA questions.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
                <div className={`${styles.insightCard} ${selectedInsight === 'dilr' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('dilr')}>
                  <div className={`${styles.insightIconBox} ${styles.iconGood}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>DILR Set Selection</span>
                    <span className={styles.insightDesc}>Excellent accuracy in choosing the right sets.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
                <div className={`${styles.insightCard} ${selectedInsight === 'mock' ? styles.insightActive : ''}`} onClick={() => setSelectedInsight('mock')}>
                  <div className={`${styles.insightIconBox} ${styles.iconNeutral}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightName}>Mock Consistency</span>
                    <span className={styles.insightDesc}>Consistent scores, but lacking breakthroughs.</span>
                  </div>
                  <div className={styles.insightTap}>Tap to understand &rarr;</div>
                </div>
              </div>
            </div>

            {selectedInsight && (
              <>
                <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50}} onClick={() => setSelectedInsight(null)}></div>
                <div className={styles.detailPanel}>
                  <button className={styles.panelClose} onClick={() => setSelectedInsight(null)}>&times;</button>
                  
                  {selectedInsight === 'speed' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconWarn}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>Speed Under Pressure</h4>
                            <span className={`${styles.impactBadge} ${styles.impactHigh}`}>IMPACT: HIGH</span>
                          </div>
                          <p className={styles.panelDesc}>You are taking more time than expected on QA questions, especially in the last part of the section.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>You spend more time on complex calculation-based questions.</li>
                        <li>This reduces the time left for easier questions.</li>
                        <li>Leads to lower attempt rate and higher pressure.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Practice timed QA sets (15-20 min).</li>
                        <li>Focus on quick calculation techniques and shortcuts.</li>
                        <li>Avoid spending too much time on a single question.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Try solving 1 timed QA set daily to improve your speed and confidence.</div>
                      </div>
                      
                      <div className={styles.panelVisual}>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Current</span>
                          <span className={styles.pvValWarn}>3.2 min/q</span>
                        </div>
                        <div className={styles.pvArrow}>&rarr;</div>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Target</span>
                          <span className={styles.pvValGood}>2.0 min/q</span>
                        </div>
                      </div>

                      
                    </div>
                  )}

                  {selectedInsight === 'dilr' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconGood}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>DILR Set Selection</h4>
                            <span className={`${styles.impactBadge} ${styles.impactMedium}`}>IMPACT: MEDIUM</span>
                          </div>
                          <p className={styles.panelDesc}>Your accuracy is good, but you are not selecting the most suitable sets, which is affecting your overall score.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>Difficulty in identifying high-scoring sets.</li>
                        <li>Spending time on low-value sets.</li>
                        <li>Inconsistent approach to set analysis.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Practice set-selection strategies.</li>
                        <li>Focus on question types and patterns.</li>
                        <li>Attempt more sectional DILR sets.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Spend 1-2 minutes analyzing each set before attempting.</div>
                      </div>
                      
                      <div className={styles.panelVisual}>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Current</span>
                          <span className={styles.pvValNeutral}>Poor Selection</span>
                        </div>
                        <div className={styles.pvArrow}>&rarr;</div>
                        <div className={styles.pvItem}>
                          <span className={styles.pvLabel}>Target</span>
                          <span className={styles.pvValGood}>Higher Attempts</span>
                        </div>
                      </div>

                      
                    </div>
                  )}

                  {selectedInsight === 'mock' && (
                    <div className={styles.panelContent}>
                      <div className={styles.panelHeader}>
                        <div className={`${styles.panelIcon} ${styles.iconNeutral}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                        <div className={styles.panelTitleArea}>
                          <div className={styles.panelTitleRow}>
                            <h4 className={styles.panelTitle}>Mock Consistency</h4>
                            <span className={`${styles.impactBadge} ${styles.impactMedium2}`}>IMPACT: MEDIUM</span>
                          </div>
                          <p className={styles.panelDesc}>Your scores are consistent, but you are not seeing significant improvement over time.</p>
                        </div>
                      </div>
                      
                      <h5 className={styles.panelSubtitle}>Why it's affecting your readiness?</h5>
                      <ul className={styles.panelList}>
                        <li>Limited number of full mock attempts.</li>
                        <li>Inconsistent performance in some sections.</li>
                        <li>Lack of post-mock analysis and revision.</li>
                      </ul>
                      
                      <h5 className={styles.panelSubtitle} style={{marginTop: '20px', color: '#059669'}}>How to improve?</h5>
                      <ul className={`${styles.panelList} ${styles.listCheck}`}>
                        <li>Take more full-length mocks (at least 2 per week).</li>
                        <li>Analyze mistakes after each mock.</li>
                        <li>Focus on weak topics and track progress.</li>
                      </ul>
                      
                      <div className={styles.panelTip}>
                        <div className={styles.tipIcon}>💡</div>
                        <div className={styles.tipText}><strong>Tip:</strong> Consistency with analysis = real improvement.</div>
                      </div>
                      
                      <div className={styles.panelVisualPath}>
                        <span>TAKE MOCK</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span>ANALYZE</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span>FIX WEAKNESS</span>
                        <span className={styles.pvArrowDown}>&darr;</span>
                        <span className={styles.pvValGood}>IMPROVE</span>
                      </div>

                      
                    </div>
                  )}

                </div>
              </>
            )}


            {/* 7-Day Challenge */}
            <div className={styles.challengeSection} style={{position: 'relative'}}>
              {challengeData ? (
                <>
                  <div className={styles.challengeHeaderRow}>
                    <div>
                      <h3 className={styles.challengeTitle}>Your 7-Day CAT Challenge</h3>
                      <p className={styles.challengeSubtitle} style={{fontSize: '14px', color: '#64748B', marginTop: '4px'}}>
                        Your personalized CAT improvement journey starts today.
                      </p>
                    </div>
                    {challengeData.completedDays === 7 ? (
                      <div className={styles.challengeCta} style={{background: '#10B981'}}>
                        7-Day Journey Completed!
                      </div>
                    ) : (
                      <div className={styles.challengeProgressBadge} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', background: '#F0F9FF', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', color: '#0369A1'
                      }}>
                        {challengeData.completedDays} / {challengeData.totalDays} Days Complete
                        <div style={{width: '60px', height: '6px', background: '#E0F2FE', borderRadius: '3px', overflow: 'hidden'}}>
                          <div style={{width: `${(challengeData.completedDays / 7) * 100}%`, height: '100%', background: '#0EA5E9'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.timeline}>
                    {challengeData.days.map((d) => (
                      <div 
                        key={d.day} 
                        onClick={() => setSelectedChallengeDay(d.day)}
                        className={`${styles.timelineDay} ${d.status === 'completed' ? styles.dayCompleted : d.status === 'today' ? styles.dayToday : d.status === 'incomplete' ? styles.dayIncomplete : styles.dayUpcoming}`}
                        style={{ cursor: 'pointer', opacity: (d.status === 'upcoming' || d.status === 'incomplete') ? 0.7 : 1 }}
                      >
                        <div className={styles.dayCircle} style={{
                          borderColor: d.status === 'incomplete' ? '#FCA5A5' : '',
                          background: d.status === 'incomplete' ? '#FEF2F2' : ''
                        }}>
                          {d.status === 'completed' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : d.status === 'today' ? (
                            <span className={styles.dayDot}></span>
                          ) : d.status === 'incomplete' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          ) : null}
                        </div>
                        <span className={styles.dayLabel} style={{
                          color: d.status === 'incomplete' ? '#EF4444' : '',
                          fontWeight: d.status === 'today' ? 'bold' : 'normal'
                        }}>
                          {d.status === 'today' ? "Today" : `Day ${d.day}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  
                    
                    {/* Static Today's Challenge Summary Card */}
                    {(() => {
                      const todayInfo = challengeData.days.find((d: any) => d.status === 'today') || challengeData.days.find((d: any) => d.day === challengeData.currentDay);
                      if (!todayInfo) return null;
                      const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                      return (
                        <div className={styles.challengeDetailCard} style={{
                          marginTop: '24px',
                          padding: '24px 32px',
                          background: '#F8FAFC',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          position: 'relative',
                          cursor: 'pointer'
                        }} onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                          <div style={{marginBottom: '12px'}}>
                            <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                              Today's Focus: <span style={{color: '#2563EB'}}>{todayInfo.title}</span>
                            </h4>
                          </div>
                          
                          <p style={{fontSize: '14px', color: '#475569', marginBottom: '24px'}}>{todayInfo.desc}</p>
                          
                          <div style={{fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                            TASKS PROGRESS ({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})
                          </div>
                          <ul style={{listStyle: 'none', padding: 0, margin: '0 0 24px 0'}}>
                            {todayInfo.tasks.map((t: any, idx: number) => (
                              <li key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#334155'}}>
                                {t.done ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                                <span style={{textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1}}>{t.name}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <button onClick={(e) => { e.stopPropagation(); setSelectedChallengeDay(todayInfo.day); }} style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '32px',
                            background: 'transparent',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background 0.2s'
                          }}>
                            {isComplete ? "Challenge Completed ✓" : "Start Today's Challenge"}
                            {!isComplete && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </button>
                        </div>
                      );
                    })()}
                </>
              ) : (
                <div style={{padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px'}}>
                  Loading your journey...
                </div>
              )}
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

      
          {/* SLIDE OUT PANEL OVERLAY for Challenge */}
            {selectedChallengeDay !== null && challengeData && (
              <>
                <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50, backdropFilter: 'blur(4px)'}} onClick={() => setSelectedChallengeDay(null)}></div>
                
                <div className="challenge-drawer" style={{
                  position: "fixed", 
                  top: '16px', 
                  right: '16px', 
                  bottom: '16px', 
                  zIndex: 51, 
                  background: "#FFFFFF", 
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", 
                  width: '42vw', minWidth: 'min(520px, calc(100vw - 32px))', maxWidth: '680px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '24px',
                  overflow: 'hidden'
                }}>
                  
                  {(() => {
                    const dayInfo = challengeData.days.find((d: any) => d.day === selectedChallengeDay);
                    if (!dayInfo) return null;
                    
                    const isCompleted = dayInfo.progress.tasksDone === dayInfo.progress.tasksTotal;
                    const task1 = dayInfo.tasks[0];
                    const task2 = dayInfo.tasks[1];
  
                    return (
                      <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                        {/* Header (Fixed) */}
                        <header className="challenge-header" style={{padding: "24px 32px", borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0}}>
                          <button className={styles.panelClose} style={{position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B'}} onClick={() => setSelectedChallengeDay(null)}>&times;</button>
                          
                          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                            
                            <div>
                              <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0}}>Today's Challenge</h2>
                              <p style={{fontSize: '14px', color: '#64748B', margin: '4px 0 0 0'}}>Day {dayInfo.day} of 7</p>
                            </div>
                          </div>
                          
                          <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginRight: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              <span style={{fontSize: '13px', fontWeight: '700', color: '#0F172A'}}>{new Date(dayInfo.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                            </div>
                            <span style={{fontSize: '10px', color: '#94A3B8'}}>Your Learning Journey</span>
                          </div>
                        </header>
                        {/* Scrollable Content */}
                        <main className="challenge-content" style={{flexGrow: 1, overflowY: "auto", padding: '24px 32px'}}>
                          
                          {/* Today's Focus Card */}
                          <div style={{background: '#F8FAFC', borderRadius: '20px', padding: '24px', marginBottom: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                              <div style={{background: '#D1FAE5', color: '#059669', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                              </div>
                              <span style={{fontSize: '14px', fontWeight: '700', color: '#0F172A'}}>Today's Focus</span>
                            </div>
                            
                            <h3 style={{fontSize: '20px', fontWeight: '700', color: '#2563EB', margin: '0 0 12px 0'}}>{dayInfo.title}</h3>
                            <p style={{fontSize: '14px', color: '#475569', margin: '0 0 20px 0', lineHeight: '1.5'}}>{dayInfo.desc}</p>
                            
                            <div style={{borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '12px'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3" style={{flexShrink: 0, marginTop: '2px'}}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 -1 8 1 8z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 7-1 8 1 8z"></path></svg>
                              <div style={{flexGrow: 1}}>
                                <p style={{fontSize: '14px', fontStyle: 'italic', color: '#3B82F6', margin: '0 0 8px 0'}}>"Track your progress, learn from your mistakes, and come back stronger."</p>
                                <p style={{fontSize: '13px', color: '#3B82F6', textAlign: 'right', margin: 0}}>— TechnoCAT</p>
                              </div>
                            </div>
                          </div>
  
                          {/* Tasks Section */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px'}}>
                            <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                              Tasks ({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                            </h3>
                            <span style={{fontSize: '13px', color: '#64748B'}}>Complete both tasks to finish Day {dayInfo.day}</span>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            {/* Task 1 */}
                            {task1 && (
                              <Link href={task1.done ? "#" : "/dashboard"} style={{textDecoration: 'none', color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task1.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task1.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#EFF6FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task1.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Attempt and submit a full-length CAT mock test.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 2 hours
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> All sections
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                            
                            {/* Task 2 */}
                            {task2 && (
                              <Link href={task2.done ? "#" : (task1.done ? "/intelligence/ai-analysis" : "#")} style={{textDecoration: 'none', pointerEvents: (!task1.done && !task2.done) ? 'none' : 'auto', opacity: (!task1.done && !task2.done) ? 0.6 : 1, color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task2.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task2.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#F5F3FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task2.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Review your performance, check detailed analysis and identify weak areas.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 10-15 mins
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> AI Insights
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                          </div>

                          {/* Motivation Card */}
                          <div style={{background: '#ECFDF5', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px'}}>
                            <div>
                              <h4 style={{fontSize: '15px', fontWeight: '700', color: '#065F46', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Complete today's challenge to:
                              </h4>
                              <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#065F46', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Improve your CAT readiness</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Unlock tomorrow's challenge</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Build a consistent study habit</li>
                              </ul>
                            </div>
                            <div style={{textAlign: 'center', flexShrink: 0, paddingLeft: '16px', borderLeft: '1px solid #D1FAE5'}}>
                              <div style={{fontSize: '40px', marginBottom: '8px'}}>🏆</div>
                              <div style={{fontSize: '14px', fontWeight: '700', color: '#065F46'}}>Keep Going!</div>
                              <div style={{fontSize: '11px', color: '#047857', marginTop: '4px'}}>Consistency creates results.</div>
                            </div>
                          </div>
                          
                        </main>
                        {/* Bottom CTA (Fixed at bottom) */}
                        <footer className="challenge-footer" style={{padding: "24px 32px", borderTop: '1px solid #F1F5F9', background: '#FFFFFF', flexShrink: 0}}>
                          <Link 
                            href={isCompleted ? '/intelligence' : (task1.done ? '/intelligence/ai-analysis' : '/browse')}
                            style={{
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              gap: '8px', 
                              background: isCompleted ? '#F1F5F9' : '#2563EB', 
                              color: isCompleted ? '#475569' : '#FFFFFF', 
                              padding: '16px', 
                              borderRadius: '16px', 
                              fontWeight: '700', 
                              fontSize: '16px', 
                              textDecoration: 'none',
                              transition: 'background 0.2s',
                              cursor: isCompleted ? 'default' : 'pointer'
                            }}
                          >
                            {isCompleted ? "Challenge Completed ✓" : (task1.done ? "Continue Analysis" : "Start Today's Challenge")}
                            {!isCompleted && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </Link>
                          <p style={{fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0', textAlign: 'center'}}>You'll be redirected to the relevant section. Your progress will be tracked automatically.</p>
                        </footer>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

        </main>
    </div>
  );
}






