"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ai-analysis.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";

export default function AiAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/ai-analysis");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <header className={styles.darkHeader}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard">
              <Image src="/logo.jpg" alt="TechnoCAT" width={180} height={75} className={styles.logo} />
            </Link>
          </div>
          <PostLoginNavActions />
        </header>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Analyzing performance data...</p>
        </div>
      </div>
    );
  }

  const hasData = data?.hasData && data?.data;

  return (
    <div className={styles.pageWrapper}>
      {/* Header (Shared) */}
      <header className={styles.darkHeader}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard">
            <Image src="/logo.jpg" alt="TechnoCAT" width={180} height={75} className={styles.logo} />
          </Link>
          <nav className={styles.mainNav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/browse" className={styles.navLink}>Browse</Link>
            <Link href="/intelligence" className={styles.navLink}>Intelligence Hub</Link>
          </nav>
        </div>
        <PostLoginNavActions />
      </header>

      {/* Conditional Rendering: Empty State vs Real Dashboard */}
      {!hasData ? (
        <main className={styles.emptyStateContainer}>
          <div className={styles.emptyGraphic}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h1 className={styles.emptyTitle}>AI Performance Analysis</h1>
          <p className={styles.emptySubtitle}>Your personalized analysis will appear here after your first completed mock.</p>
          <div className={styles.emptyActions}>
            <Link href="/dashboard" className={styles.primaryBtn}>Start Your First Mock</Link>
            <Link href="/browse" className={styles.secondaryBtn}>Explore Mock Tests</Link>
          </div>
          <p className={styles.aiTransparency} style={{ marginTop: '40px' }}>
            AI insights become more reliable as you complete more mocks.
          </p>
        </main>
      ) : (
        <main className={styles.mainContent}>
          {/* Page Header Area */}
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.breadcrumb}>Intelligence Hub &nbsp;/&nbsp; AI Performance Analysis</div>
              <h1 className={styles.pageTitle}>AI Performance Analysis</h1>
              <p className={styles.pageSubtitle}>Understand how you actually perform — not just what you scored.</p>
              <div className={styles.aiBadge}>AI-Powered Performance Diagnosis</div>
            </div>
            <Link href="/intelligence/mentor" className={styles.mentorBtn}>
              Ask AI Mentor &rarr;
            </Link>
          </div>

          {/* 3. Personal Performance Header */}
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Your Performance Overview</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.sumItem}>
                <span className={styles.sumLabel}>Latest Mock</span>
                <span className={styles.sumValue}>{data.data.overview.latestMockTitle}</span>
              </div>
              <div className={styles.sumItem}>
                <span className={styles.sumLabel}>Score</span>
                <span className={styles.sumValue}>{data.data.overview.latestScore}</span>
              </div>
              <div className={styles.sumItem}>
                <span className={styles.sumLabel}>Accuracy</span>
                <span className={styles.sumValue}>{data.data.overview.latestAccuracy}%</span>
              </div>
              <div className={styles.sumItem}>
                <span className={styles.sumLabel}>Time Used</span>
                <span className={styles.sumValue}>{data.data.overview.timeUsedMin} min</span>
              </div>
              <div className={styles.sumItem}>
                <span className={styles.sumLabel}>Mocks Analyzed</span>
                <span className={styles.sumValue}>{data.data.overview.mocksAnalyzed}</span>
              </div>
            </div>
          </div>

          {/* 4. AI Performance Diagnosis (Hero) */}
          <div className={styles.aiHeroCard}>
            <h2 className={styles.aiHeroTitle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              TechnoCAT AI Diagnosis
            </h2>
            
            <div className={styles.aiBlock}>
              <div className={styles.aiBlockLabel}>Performance Pattern</div>
              <div className={styles.aiBlockText}>"{data.data.diagnosis.pattern}"</div>
            </div>

            <div className={styles.aiBlock}>
              <div className={styles.aiBlockLabel}>Why This Is Happening</div>
              <ul className={styles.aiList}>
                {data.data.diagnosis.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div className={styles.aiBlock} style={{background: '#EFF6FF', border: '1px solid #BFDBFE'}}>
              <div className={styles.aiBlockLabel}>What To Do Next</div>
              <div className={styles.aiBlockText} style={{fontWeight: 700}}>"{data.data.diagnosis.action}"</div>
            </div>
          </div>

          {/* 5. Section-Wise AI Analysis */}
          <div className={styles.sectionGrid}>
            {Object.keys(data.data.sections).map((secKey) => {
              const sec = data.data.sections[secKey];
              return (
                <div key={secKey} className={styles.sectionCard}>
                  <h3 className={styles.secName}>{secKey}</h3>
                  <div className={styles.secStats}>
                    <div className={styles.secStatItem}>
                      <span className={styles.secStatLbl}>Score</span>
                      <span className={styles.secStatVal}>{sec.score}</span>
                    </div>
                    <div className={styles.secStatItem}>
                      <span className={styles.secStatLbl}>Accuracy</span>
                      <span className={styles.secStatVal}>{sec.accuracy}%</span>
                    </div>
                    <div className={styles.secStatItem}>
                      <span className={styles.secStatLbl}>Attempts</span>
                      <span className={styles.secStatVal}>{sec.attemptRate}</span>
                    </div>
                    <div className={styles.secStatItem}>
                      <span className={styles.secStatLbl}>Avg Time/Q</span>
                      <span className={styles.secStatVal}>{sec.avgTimeSec}s</span>
                    </div>
                  </div>
                  <div className={styles.secInsight}>
                    "{sec.insight}"
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Performance Trend */}
          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Your Performance Journey</h2>
            {data.data.trend.length > 1 ? (
              <div className={styles.chartPlaceholder}>
                [ Interactive Line Chart: {data.data.trend.length} Mocks plotted ]
              </div>
            ) : (
              <div className={styles.chartPlaceholder}>
                Complete another mock to unlock performance trends.
              </div>
            )}
          </div>

          {/* 7. Speed vs Accuracy Map */}
          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Speed × Accuracy Map</h2>
            <div className={styles.chartPlaceholder}>
              [ Scatter Plot: Fast+Accurate | Slow+Accurate | Fast+Inacc | Slow+Inacc ]
            </div>
          </div>

          {/* 8. Topic-Level Performance */}
          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Where Your Performance Stands (Topic Level)</h2>
            <div className={styles.chartPlaceholder}>
              [ Horizontal Performance Visualization by Topic ]
            </div>
          </div>

          {/* 9. Error Pattern Intelligence */}
          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Your Most Repeated Error Patterns</h2>
            <div className={styles.errorList}>
              {data.data.errorPatterns.map((err: any, i: number) => (
                <div key={i} className={styles.errorItem}>
                  <div className={styles.errLeft}>
                    <span className={styles.errType}>{err.type}</span>
                    <span className={styles.errMeta}>Mostly observed in {err.topic} • Recent: {err.recent}</span>
                  </div>
                  <span className={styles.errFreq}>{err.freq} occurrences</span>
                </div>
              ))}
            </div>
          </div>

          {/* 10. AI Why Did I Lose Marks? */}
          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Why Did I Lose Marks?</h2>
            <div className={styles.lostMarksGrid}>
              {data.data.lostMarks.map((lm: any, i: number) => (
                <div key={i} className={styles.lostMarkItem}>
                  <div className={styles.lmHeader}>
                    <span className={styles.lmTopic}>{lm.question}</span>
                    <span className={styles.lmMeta}>Time: {lm.time} • {lm.result}</span>
                  </div>
                  <div className={styles.lmInsight}>
                    <strong>AI Insight:</strong> "{lm.insight}"
                  </div>
                  <Link href="#" className={styles.lmBtn}>Review Question &rarr;</Link>
                </div>
              ))}
            </div>
          </div>

          {/* 11. Score Opportunity */}
          <div className={styles.featureCard} style={{background: '#F8FAFC'}}>
            <h2 className={styles.cardTitle}>Where Can You Gain Marks?</h2>
            <p style={{fontSize: '16px', color: '#334155', lineHeight: '1.6'}}>
              {data.data.opportunities}
            </p>
          </div>

          {/* 12. Personal AI Action Plan */}
          <div className={styles.actionPlanBox}>
            <h2 className={styles.apTitle}>Your Next-Mock Action Plan</h2>
            <div className={styles.apList}>
              {data.data.actionPlan.map((ap: string, i: number) => (
                <div key={i} className={styles.apItem}>
                  <div className={styles.apNum}>{i + 1}</div>
                  {ap}
                </div>
              ))}
            </div>
            <Link href="/dashboard" className={styles.apBtn}>Start Practice &rarr;</Link>
          </div>

          <p className={styles.aiTransparency}>
            Analysis based on your completed mock attempts, question responses and timing data.
          </p>
        </main>
      )}
    </div>
  );
}
