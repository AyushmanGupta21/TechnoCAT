const fs = require('fs');
const path = require('path');

const pageContent = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ai-analysis.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar
} from 'recharts';

const scatterData = [
  { name: 'Geometry', speed: 120, accuracy: 85, fill: '#10B981' },
  { name: 'Algebra', speed: 45, accuracy: 40, fill: '#EF4444' },
  { name: 'RC', speed: 150, accuracy: 90, fill: '#3B82F6' },
  { name: 'Arithmetic', speed: 50, accuracy: 88, fill: '#10B981' },
  { name: 'Number System', speed: 90, accuracy: 55, fill: '#F59E0B' },
  { name: 'DILR Sets', speed: 200, accuracy: 70, fill: '#3B82F6' }, 
];

const barData = [
  { name: 'Reading Comp', score: 90 },
  { name: 'Arithmetic', score: 85 },
  { name: 'Geometry', score: 75 },
  { name: 'DILR Sets', score: 65 },
  { name: 'Algebra', score: 60 },
];

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

          <div className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Your Performance Journey</h2>
            {data.data.trend.length > 1 ? (
              <div style={{ width: '100%', height: 350, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.data.trend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={13} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94A3B8" fontSize={13} tickLine={false} axisLine={false} dx={-10} />
                    <RechartsTooltip cursor={{stroke: '#E2E8F0', strokeWidth: 2}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 600 }} />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={4} dot={{r: 5, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8}} name="Overall Score" />
                    <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={4} dot={{r: 5, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8}} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.chartPlaceholder}>
                Complete another mock to unlock performance trends.
              </div>
            )}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.featureCard}>
              <h2 className={styles.cardTitle}>Speed × Accuracy Map</h2>
              <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" dataKey="speed" name="Time (s)" stroke="#94A3B8" fontSize={12} unit="s" tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="accuracy" name="Accuracy" stroke="#94A3B8" fontSize={12} unit="%" tickLine={false} axisLine={false} />
                    <ZAxis type="category" dataKey="name" name="Topic" />
                    <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Scatter name="Topics" data={scatterData} fill="#3B82F6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.featureCard}>
              <h2 className={styles.cardTitle}>Topic-Level Performance</h2>
              <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#475569" fontSize={13} fontWeight={600} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="score" fill="#38BDF8" radius={[0, 6, 6, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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

          <div className={styles.featureCard} style={{background: '#F8FAFC'}}>
            <h2 className={styles.cardTitle}>Where Can You Gain Marks?</h2>
            <p style={{fontSize: '16px', color: '#334155', lineHeight: '1.6'}}>
              {data.data.opportunities}
            </p>
          </div>

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
`;

fs.writeFileSync(path.join(__dirname, 'src/app/intelligence/ai-analysis/page.tsx'), pageContent);
console.log('Written page.tsx');
