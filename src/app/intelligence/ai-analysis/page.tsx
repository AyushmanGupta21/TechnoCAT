"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ai-analysis.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { 
  LineChart, Line, ComposedChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function AiAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [journeyTab, setJourneyTab] = useState('Score');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number[]>([1]);
  const [selectedMetric, setSelectedMetric] = useState<"accuracy" | "speed" | "consistency" | "conceptStrength" | "questionSelection" | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<"carelessErrors" | "dilrAccuracy" | "questionSelection" | "qaSpeed" | null>(null);

  const toggleTask = (id: number) => {
    setCompletedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!selectedMetric && !selectedOpportunity) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMetric(null);
        setSelectedOpportunity(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMetric, selectedOpportunity]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        fetch("/api/intelligence/record-analysis-view", { method: "POST" }).catch(console.error); const res = await fetch("/api/ai-analysis");
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
          <div className={styles.headerInner}>
            <nav className={styles.topNav} aria-label="AI Analysis Navigation">
              <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
                <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
              </Link>

              <div className={styles.navLinks}>
                <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                <Link href="/browse" className={styles.navLink}>Browse</Link>
                <Link href="/topics" className={styles.navLink}>My Topics</Link>
                <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
                <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
              </div>

              <PostLoginNavActions />
            </nav>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>AI Performance Analysis</span>
        </div>

        {/* Skeleton Hero */}
        <section className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.loadingSpinner} style={{ borderColor: 'rgba(37, 99, 235, 0.3)', borderTopColor: '#2563EB' }}></span>
              AI PERFORMANCE INTELLIGENCE
            </div>
            <h1 className={styles.heroTitle} style={{ color: '#0F172A', opacity: 0.9 }}>
              Synthesizing Your<br /><span>CAT Performance...</span>
            </h1>
            <p className={styles.heroSubtitle}>
              TechnoCAT AI is compiling your mock attempts, accuracy trends, solving speed and diagnostic insights.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <div className={styles.skeletonPulse} style={{ width: 180, height: 46, borderRadius: 100 }}></div>
              <div className={styles.skeletonPulse} style={{ width: 160, height: 46, borderRadius: 100 }}></div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.mainRing} style={{ background: '#FFF' }}>
              <div className={styles.skeletonPulse} style={{ width: 140, height: 140, borderRadius: '50%' }}></div>
            </div>
            <div className={styles.heroMetrics}>
              <div className={styles.hmRow}>
                <div className={styles.skeletonPulse} style={{ width: '60%', height: 16, marginBottom: 8 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '100%', height: 8 }}></div>
              </div>
              <div className={styles.hmRow}>
                <div className={styles.skeletonPulse} style={{ width: '50%', height: 16, marginBottom: 8 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '100%', height: 8 }}></div>
              </div>
              <div className={styles.hmRow}>
                <div className={styles.skeletonPulse} style={{ width: '70%', height: 16, marginBottom: 8 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '100%', height: 8 }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Content */}
        <div className={styles.contentWrapper}>
          <div className={styles.aiDiagnosisCard} style={{ minHeight: 160, alignItems: 'center' }}>
            <div className={styles.skeletonPulse} style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }}></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={styles.skeletonPulse} style={{ width: '28%', height: 22 }}></div>
              <div className={styles.skeletonPulse} style={{ width: '55%', height: 14 }}></div>
              <div className={styles.skeletonPulse} style={{ width: '100%', height: 50, borderRadius: 10 }}></div>
            </div>
          </div>

          <div className={styles.dnaGrid}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.dnaCard} style={{ minHeight: 140 }}>
                <div className={styles.skeletonPulse} style={{ width: '65%', height: 16, marginBottom: 12 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '45%', height: 28, marginBottom: 10 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '90%', height: 12, marginBottom: 6 }}></div>
                <div className={styles.skeletonPulse} style={{ width: '75%', height: 12 }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasData = data?.hasData && data?.data;
  if (!hasData) {
    return (
      <div className={styles.pageWrapper} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className={styles.darkHeader}>
          <div className={styles.headerInner}>
            <nav className={styles.topNav} aria-label="AI Analysis Navigation">
              <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
                <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
              </Link>

              <div className={styles.navLinks}>
                <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                <Link href="/browse" className={styles.navLink}>Browse</Link>
                <Link href="/topics" className={styles.navLink}>My Topics</Link>
                <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
                <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
              </div>

              <PostLoginNavActions />
            </nav>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>AI Performance Analysis</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
            Your AI Performance Profile Is Waiting
          </h1>
          <p style={{ color: '#64748B', marginBottom: 32, maxWidth: 540, lineHeight: 1.6, fontSize: 15 }}>
            Complete your first mock test and TechnoCAT will analyze your accuracy, speed, mistakes and improvement opportunities.
          </p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Link href="/browse#pyq-section" className={styles.btnPrimary}>
              Take Your First Mock
            </Link>
            <Link href="/intelligence" className={styles.btnSecondary} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>← Back to Intelligence Hub</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const d = data.data;

  // Custom tooltips
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background: '#FFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600}}>
          <div>{payload[0].payload.name}</div>
          <div style={{color: '#2563EB', marginTop: '4px'}}>Score: {payload[0].payload.score}</div>
        </div>
      );
    }
    return null;
  };

  const mistakeColors = ['#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#D946EF'];
  const mistakeData = d.mistakesMap ? d.mistakesMap.map((m: any, i: number) => ({ name: m.category, value: m.percent, color: mistakeColors[i % mistakeColors.length] })) : [];

  // Dummy scatter for layout match
  const parseTimeStr = (str: string) => {
    if (!str) return 0;
    let min = 0, sec = 0;
    const mMatch = str.match(/(\d+)m/);
    const sMatch = str.match(/(\d+)s/);
    if (mMatch) min = parseInt(mMatch[1]);
    if (sMatch) sec = parseInt(sMatch[1]);
    return min * 60 + sec;
  };
  
  const barData = [
    { name: 'VARC', accuracy: Math.round((d.topics?.VARC?.reduce((acc: any, t: any) => acc + t.accuracy, 0) || 0) / (d.topics?.VARC?.length || 1)), time: Number((parseTimeStr(d.topics?.VARC?.[0]?.avgTime || '0m 0s') / 60).toFixed(1)) },
    { name: 'DILR', accuracy: Math.round((d.topics?.DILR?.reduce((acc: any, t: any) => acc + t.accuracy, 0) || 0) / (d.topics?.DILR?.length || 1)), time: Number((parseTimeStr(d.topics?.DILR?.[0]?.avgTime || '0m 0s') / 60).toFixed(1)) },
    { name: 'QA', accuracy: Math.round((d.topics?.QA?.reduce((acc: any, t: any) => acc + t.accuracy, 0) || 0) / (d.topics?.QA?.length || 1)), time: Number((parseTimeStr(d.topics?.QA?.[0]?.avgTime || '0m 0s') / 60).toFixed(1)) }
  ];

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="AI Analysis Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
              <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>AI Performance Analysis</span>
      </div>

      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}><span>✦</span> AI PERFORMANCE INTELLIGENCE</div>
          <h1 className={styles.heroTitle}>Your CAT Performance,<br/><span>Explained.</span></h1>
          <p className={styles.heroSubtitle}>AI analyzes your attempts, accuracy, speed and mistakes to identify exactly where you are losing marks.</p>
          <div className={styles.heroActions}>
            <Link 
              href="#mistake-section" 
              onClick={(e) => { 
                e.preventDefault(); 
                document.getElementById('mistake-section')?.scrollIntoView({ behavior: 'smooth' }); 
              }} 
              className={styles.btnPrimary}
            >
              View My Weaknesses &rarr;
            </Link>
            <Link 
              href="#where-you-stand" 
              onClick={(e) => { 
                e.preventDefault(); 
                document.getElementById('where-you-stand')?.scrollIntoView({ behavior: 'smooth' }); 
              }} 
              className={styles.btnSecondary}
            >
              Explore Full Analysis
            </Link>
          </div>
        </div>
        
        <div className={styles.heroRight}>
          <div className={styles.mainRing}>
            <svg viewBox="0 0 250 250">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle className={styles.ringCircle} cx="125" cy="125" r="110" />
              <circle className={styles.ringProgress} cx="125" cy="125" r="110" style={{strokeDashoffset: 700 - (700 * d.overview.latestScore) / 100}} />
            </svg>
            <div className={styles.ringLbl}>Overall Performance</div>
            <div className={styles.ringVal}>{d.overview.latestScore}%</div>
            <div className={styles.ringStatus}>Good Progress</div>
            <div className={styles.ringTrend}>↑ 8% vs last 3 mocks</div>
          </div>
          
          <div className={styles.heroMetrics}>
            <div
              className={`${styles.hmRow} ${styles.hmRowClickable}`}
              onClick={() => setSelectedMetric("accuracy")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMetric("accuracy"); } }}
              role="button"
              tabIndex={0}
              aria-label="Open Accuracy Details"
            >
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{background: '#EFF6FF', color: '#2563EB'}}>🎯</span>
                  Accuracy
                  <span className={styles.hmInfoIcon} aria-hidden="true">ⓘ</span>
                </span>
                <span className={styles.hmVal}>{d.dna.accuracy.value}%</span>
              </div>
              <div className={styles.hmBar}><div className={styles.hmFill} style={{width: `${d.dna.accuracy.value}%`, background: '#2563EB'}}></div></div>
            </div>
            <div
              className={`${styles.hmRow} ${styles.hmRowClickable}`}
              onClick={() => setSelectedMetric("speed")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMetric("speed"); } }}
              role="button"
              tabIndex={0}
              aria-label="Open Speed Analysis"
            >
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{background: '#F0FDF4', color: '#10B981'}}>⚡</span>
                  Speed
                  <span className={styles.hmInfoIcon} aria-hidden="true">ⓘ</span>
                </span>
                <span className={styles.hmVal}>{d.dna.speed.value}%</span>
              </div>
              <div className={styles.hmBar}><div className={styles.hmFill} style={{width: `${d.dna.speed.value}%`, background: '#10B981'}}></div></div>
            </div>
            <div
              className={`${styles.hmRow} ${styles.hmRowClickable}`}
              onClick={() => setSelectedMetric("consistency")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMetric("consistency"); } }}
              role="button"
              tabIndex={0}
              aria-label="Open Consistency Details"
            >
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{background: '#F5F3FF', color: '#8B5CF6'}}>🛡️</span>
                  Consistency
                  <span className={styles.hmInfoIcon} aria-hidden="true">ⓘ</span>
                </span>
                <span className={styles.hmVal}>{d.dna.consistency.value}%</span>
              </div>
              <div className={styles.hmBar}><div className={styles.hmFill} style={{width: `${d.dna.consistency.value}%`, background: '#8B5CF6'}}></div></div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.contentWrapper}>
        
        {/* AI DIAGNOSIS */}
        <section className={styles.aiDiagnosisCard}>
          <div className={styles.aiRobot}>
            <div style={{width: 80, height: 80, background: '#2563EB', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '24px', fontWeight: 'bold'}}>AI</div>
          </div>
          <div className={styles.aiRight}>
            <div>
              <div className={styles.aiTitle}>TechnoCAT AI Diagnosis</div>
              <div className={styles.aiSubtitle}>Based on your last 5 mock attempts, here's what we found:</div>
            </div>
            <div className={styles.aiMainInsight}>
              <span>✨</span> {d.diagnosis.pattern}
            </div>
            <div className={styles.aiCols}>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}><div className={`${styles.acIcon} ${styles.success}`}>✓</div> What You're Doing Well</div>
                <ul className={styles.acList}>
                  <li>Strong accuracy in VARC</li>
                  <li>Good conceptual clarity in QA</li>
                  <li>Consistent performance in recent mocks</li>
                </ul>
              </div>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}><div className={`${styles.acIcon} ${styles.warning}`}>⚠</div> What's Holding You Back</div>
                <ul className={styles.acList}>
                  <li>Slower solving speed in DILR sets</li>
                  <li>Higher error rate in tricky QA questions</li>
                  <li>Time management in final section</li>
                </ul>
              </div>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}><div className={`${styles.acIcon} ${styles.action}`}>↗</div> What Will Improve Your Score</div>
                <ul className={styles.acList}>
                  <li>Practice timed DILR sets</li>
                  <li>Focus on high-weightage QA topics</li>
                  <li>Improve question selection strategy</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PERFORMANCE DNA */}
        <section>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.secTitle}>Your Performance DNA</h2>
            <div className={styles.secSubtitle}>A complete profile of your CAT preparation</div>
          </div>
          <div className={styles.dnaGrid}>
            {[
              {l: 'Accuracy', key: 'accuracy' as const, i: '🎯', v: d.dna.accuracy.value, s: 'Strong', c: '#2563EB', glow: 'rgba(37, 99, 235, 0.14)', ring: 'rgba(37, 99, 235, 0.12)', soft: '#EFF6FF', m: 'Maintain current level'},
              {l: 'Speed', key: 'speed' as const, i: '⚡', v: d.dna.speed.value, s: 'Needs Improvement', c: '#10B981', glow: 'rgba(16, 185, 129, 0.14)', ring: 'rgba(16, 185, 129, 0.12)', soft: '#F0FDF4', m: 'Focus on time management'},
              {l: 'Consistency', key: 'consistency' as const, i: '🛡️', v: d.dna.consistency.value, s: 'Good', c: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.14)', ring: 'rgba(139, 92, 246, 0.12)', soft: '#F5F3FF', m: 'Keep up the momentum'},
              {l: 'Concept Strength', key: 'conceptStrength' as const, i: '📚', v: d.dna.conceptStrength.value, s: 'Moderate', c: '#D946EF', glow: 'rgba(217, 70, 239, 0.14)', ring: 'rgba(217, 70, 239, 0.12)', soft: '#FDF4FF', m: 'Review weak topics'},
              {l: 'Question Selection', key: 'questionSelection' as const, i: '🎯', v: d.dna.questionSelection.value, s: 'Needs Work', c: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.14)', ring: 'rgba(14, 165, 233, 0.12)', soft: '#F0F9FF', m: 'Avoid low-value questions'}
            ].map((dna, i) => (
              <div
                key={i}
                className={`${styles.dnaCard} ${styles.dnaCardClickable}`}
                style={{
                  '--dna-accent': dna.c,
                  '--dna-glow': dna.glow,
                  '--dna-ring': dna.ring,
                  '--dna-soft': dna.soft,
                } as React.CSSProperties}
                onClick={() => setSelectedMetric(dna.key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMetric(dna.key); } }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${dna.l} details`}
              >
                <div className={styles.dnaTopBorder} style={{background: dna.c}}></div>
                <div className={styles.dnaHeader}>
                  <div className={styles.dnaLbl}><span style={{color: dna.c}}>{dna.i}</span> {dna.l}</div>
                  <span className={styles.dnaInfoIcon} aria-hidden="true">ⓘ</span>
                </div>
                <div className={styles.dnaVal}>{dna.v}%</div>
                <div className={styles.dnaStat} style={{color: dna.c}}>{dna.s}</div>
                <div className={styles.dnaInsight}>{dna.m}</div>
                <div className={styles.dnaBar}><div className={styles.dnaFill} style={{width: `${dna.v}%`, background: dna.c}}></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* WHERE YOU STAND */}
        <section id="where-you-stand">
          <div className={styles.wysHeader}>
            <div>
              <h2 className={styles.secTitle}>Where You Stand</h2>
              <div className={styles.secSubtitle}>Section-wise performance analysis from your mock attempts</div>
            </div>
            <div className={styles.wysTabs}>
              <div 
                className={`${styles.wysTab} ${activeTab === 'Overview' ? styles.active : ''}`} 
                onClick={() => setActiveTab('Overview')} 
                style={{cursor: 'pointer'}}
              >
                Overview
              </div>
              <div 
                className={`${styles.wysTab} ${activeTab === 'Detailed' ? styles.active : ''}`} 
                onClick={() => setActiveTab('Detailed')} 
                style={{cursor: 'pointer'}}
              >
                Detailed
              </div>
              <div 
                className={`${styles.wysTab} ${activeTab === 'Trends' ? styles.active : ''}`} 
                onClick={() => setActiveTab('Trends')} 
                style={{cursor: 'pointer'}}
              >
                Trends
              </div>
            </div>
          </div>
          
          {activeTab === 'Overview' && (
            <div className={styles.wysGrid}>
              {/* VARC */}
              <div className={styles.wysCard}>
                <div className={styles.wcHeader}>
                  <div className={styles.wcTitle}><span style={{color: '#0EA5E9'}}>📰</span> VARC</div>
                  <div className={`${styles.wcBadge} ${styles.statusSTRONG}`}>STRONG</div>
                </div>
                <div className={styles.wcMain}>
                  <div className={styles.wcDonut}>
                    <svg viewBox="0 0 100 100">
                      <circle className={styles.wcDonutCircle} cx="50" cy="50" r="40" />
                      <circle className={styles.wcDonutProgress} cx="50" cy="50" r="40" style={{stroke: '#0EA5E9', strokeDashoffset: 250 - (250*82)/100}} />
                    </svg>
                    <div className={styles.wcDonutText}>
                      <div className={styles.wcDonutVal}>82%</div>
                      <div className={styles.wcDonutLbl}>Accuracy</div>
                    </div>
                  </div>
                  <div className={styles.wcStats}>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Score</span><span className={styles.wcStatVal}>32 / 40</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Attempted</span><span className={styles.wcStatVal}>20 / 24</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Avg. Time</span><span className={styles.wcStatVal}>1.8 min</span></div>
                  </div>
                </div>
                
                <div style={{fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Recent Scores Trend</div>
                <div className={styles.wcSparkline}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{name: 'Mock 1', v:20},{name: 'Mock 2', v:22},{name: 'Mock 3', v:28},{name: 'Mock 4', v:25},{name: 'Mock 5', v:32}]}>
                      <Tooltip contentStyle={{fontSize: '11px', padding: '4px 8px', borderRadius: '4px'}} />
                      <Line type="monotone" dataKey="v" name="Score" stroke="#0EA5E9" strokeWidth={2} dot={{r: 3, fill: '#0EA5E9'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.wcInsight} style={{borderLeft: '3px solid #0EA5E9'}}>
                  <span style={{color: '#0EA5E9'}}>🧠</span> Great performance in RC. Keep practicing para jumbles to improve consistency.
                </div>
              </div>

              {/* DILR */}
              <div className={styles.wysCard}>
                <div className={styles.wcHeader}>
                  <div className={styles.wcTitle}><span style={{color: '#10B981'}}>🧩</span> DILR</div>
                  <div className={`${styles.wcBadge} ${styles.statusNEEDS}`}>NEEDS ATTENTION</div>
                </div>
                <div className={styles.wcMain}>
                  <div className={styles.wcDonut}>
                    <svg viewBox="0 0 100 100">
                      <circle className={styles.wcDonutCircle} cx="50" cy="50" r="40" />
                      <circle className={styles.wcDonutProgress} cx="50" cy="50" r="40" style={{stroke: '#10B981', strokeDashoffset: 250 - (250*58)/100}} />
                    </svg>
                    <div className={styles.wcDonutText}>
                      <div className={styles.wcDonutVal}>58%</div>
                      <div className={styles.wcDonutLbl}>Accuracy</div>
                    </div>
                  </div>
                  <div className={styles.wcStats}>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Score</span><span className={styles.wcStatVal}>18 / 40</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Attempted</span><span className={styles.wcStatVal}>12 / 18</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Avg. Time</span><span className={styles.wcStatVal}>3.2 min</span></div>
                  </div>
                </div>
                
                <div style={{fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Recent Scores Trend</div>
                <div className={styles.wcSparkline}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{name: 'Mock 1', v:20},{name: 'Mock 2', v:22},{name: 'Mock 3', v:28},{name: 'Mock 4', v:25},{name: 'Mock 5', v:32}]}>
                      <Tooltip contentStyle={{fontSize: '11px', padding: '4px 8px', borderRadius: '4px'}} />
                      <Line type="monotone" dataKey="v" name="Score" stroke="#10B981" strokeWidth={2} dot={{r: 3, fill: '#10B981'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.wcInsight} style={{borderLeft: '3px solid #10B981'}}>
                  <span style={{color: '#10B981'}}>💡</span> You lose marks due to slower solving speed. Work on set selection and timed practice.
                </div>
              </div>

              {/* QA */}
              <div className={styles.wysCard}>
                <div className={styles.wcHeader}>
                  <div className={styles.wcTitle}><span style={{color: '#8B5CF6'}}>📐</span> QUANTITATIVE APTITUDE</div>
                  <div className={`${styles.wcBadge} ${styles.statusIMPROVING}`}>IMPROVING</div>
                </div>
                <div className={styles.wcMain}>
                  <div className={styles.wcDonut}>
                    <svg viewBox="0 0 100 100">
                      <circle className={styles.wcDonutCircle} cx="50" cy="50" r="40" />
                      <circle className={styles.wcDonutProgress} cx="50" cy="50" r="40" style={{stroke: '#8B5CF6', strokeDashoffset: 250 - (250*68)/100}} />
                    </svg>
                    <div className={styles.wcDonutText}>
                      <div className={styles.wcDonutVal}>68%</div>
                      <div className={styles.wcDonutLbl}>Accuracy</div>
                    </div>
                  </div>
                  <div className={styles.wcStats}>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Score</span><span className={styles.wcStatVal}>27 / 40</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Attempted</span><span className={styles.wcStatVal}>16 / 22</span></div>
                    <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Avg. Time</span><span className={styles.wcStatVal}>2.4 min</span></div>
                  </div>
                </div>
                
                <div style={{fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Recent Scores Trend</div>
                <div className={styles.wcSparkline}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{name: 'Mock 1', v:20},{name: 'Mock 2', v:22},{name: 'Mock 3', v:28},{name: 'Mock 4', v:25},{name: 'Mock 5', v:32}]}>
                      <Tooltip contentStyle={{fontSize: '11px', padding: '4px 8px', borderRadius: '4px'}} />
                      <Line type="monotone" dataKey="v" name="Score" stroke="#8B5CF6" strokeWidth={2} dot={{r: 3, fill: '#8B5CF6'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.wcInsight} style={{borderLeft: '3px solid #8B5CF6'}}>
                  <span style={{color: '#8B5CF6'}}>📈</span> Arithmetic is strong. Focus on algebra and geometry concepts.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Detailed' && (
            <div className={styles.detailedGrid}>
              {/* Detailed VARC Card */}
              <div className={styles.detailedCard}>
                <div className={styles.detailedSecHeader}>
                  <div className={styles.detailedSecTitle}><span>📰</span> VARC Topics</div>
                  <span className={`${styles.topicBadge} ${styles.badgeStrong}`}>STRONG (82%)</span>
                </div>
                <div className={styles.topicsList}>
                  {(d.topics?.VARC?.length ? d.topics.VARC : [
                    { name: "Reading Comprehension", status: "Strong", accuracy: 85, attempts: 16, avgTime: "1m 45s" },
                    { name: "Para Jumbles", status: "Needs Practice", accuracy: 40, attempts: 4, avgTime: "2m 10s" },
                    { name: "Summary & Completion", status: "Good", accuracy: 75, attempts: 6, avgTime: "1m 55s" },
                    { name: "Odd Sentence Out", status: "Moderate", accuracy: 65, attempts: 4, avgTime: "1m 30s" }
                  ]).map((t: any, i: number) => {
                    const badgeClass = t.accuracy >= 75 ? styles.badgeStrong : t.accuracy >= 60 ? styles.badgeModerate : t.accuracy >= 45 ? styles.badgeNeeds : styles.badgeWeak;
                    const barColor = t.accuracy >= 75 ? '#10B981' : t.accuracy >= 60 ? '#2563EB' : t.accuracy >= 45 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={i} className={styles.topicItem}>
                        <div className={styles.topicHeader}>
                          <span>{t.name}</span>
                          <span className={`${styles.topicBadge} ${badgeClass}`}>{t.status || (t.accuracy >= 75 ? 'Strong' : t.accuracy >= 60 ? 'Moderate' : 'Needs Practice')}</span>
                        </div>
                        <div className={styles.topicStats}>
                          <span>Accuracy: <strong>{t.accuracy}%</strong></span>
                          <span>{t.attempts} attempts &bull; {t.avgTime || '2m'}</span>
                        </div>
                        <div className={styles.topicBar}>
                          <div className={styles.topicFill} style={{width: `${t.accuracy}%`, background: barColor}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed DILR Card */}
              <div className={styles.detailedCard}>
                <div className={styles.detailedSecHeader}>
                  <div className={styles.detailedSecTitle}><span>🧩</span> DILR Topics</div>
                  <span className={`${styles.topicBadge} ${styles.badgeNeeds}`}>NEEDS ATTENTION (58%)</span>
                </div>
                <div className={styles.topicsList}>
                  {(d.topics?.DILR?.length ? d.topics.DILR : [
                    { name: "Arrangements & Matrix", status: "Good", accuracy: 75, attempts: 6, avgTime: "6m 20s" },
                    { name: "Games & Tournaments", status: "Critical", accuracy: 25, attempts: 4, avgTime: "8m 15s" },
                    { name: "Charts & Tables DI", status: "Moderate", accuracy: 60, attempts: 5, avgTime: "5m 45s" },
                    { name: "Quant Based LR", status: "Needs Practice", accuracy: 50, attempts: 3, avgTime: "7m 10s" }
                  ]).map((t: any, i: number) => {
                    const badgeClass = t.accuracy >= 75 ? styles.badgeStrong : t.accuracy >= 60 ? styles.badgeModerate : t.accuracy >= 45 ? styles.badgeNeeds : styles.badgeWeak;
                    const barColor = t.accuracy >= 75 ? '#10B981' : t.accuracy >= 60 ? '#2563EB' : t.accuracy >= 45 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={i} className={styles.topicItem}>
                        <div className={styles.topicHeader}>
                          <span>{t.name}</span>
                          <span className={`${styles.topicBadge} ${badgeClass}`}>{t.status || (t.accuracy >= 75 ? 'Strong' : t.accuracy >= 60 ? 'Moderate' : 'Needs Practice')}</span>
                        </div>
                        <div className={styles.topicStats}>
                          <span>Accuracy: <strong>{t.accuracy}%</strong></span>
                          <span>{t.attempts} attempts &bull; {t.avgTime || '6m'}</span>
                        </div>
                        <div className={styles.topicBar}>
                          <div className={styles.topicFill} style={{width: `${t.accuracy}%`, background: barColor}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed QA Card */}
              <div className={styles.detailedCard}>
                <div className={styles.detailedSecHeader}>
                  <div className={styles.detailedSecTitle}><span>📐</span> QA Topics</div>
                  <span className={`${styles.topicBadge} ${styles.badgeModerate}`}>IMPROVING (68%)</span>
                </div>
                <div className={styles.topicsList}>
                  {(d.topics?.QA?.length ? d.topics.QA : [
                    { name: "Arithmetic", status: "Strong", accuracy: 90, attempts: 12, avgTime: "1m 30s" },
                    { name: "Algebra", status: "Critical", accuracy: 30, attempts: 6, avgTime: "3m 40s" },
                    { name: "Geometry & Mensuration", status: "Moderate", accuracy: 65, attempts: 5, avgTime: "2m 15s" },
                    { name: "Number System & P&C", status: "Needs Practice", accuracy: 50, attempts: 4, avgTime: "2m 50s" }
                  ]).map((t: any, i: number) => {
                    const badgeClass = t.accuracy >= 75 ? styles.badgeStrong : t.accuracy >= 60 ? styles.badgeModerate : t.accuracy >= 45 ? styles.badgeNeeds : styles.badgeWeak;
                    const barColor = t.accuracy >= 75 ? '#10B981' : t.accuracy >= 60 ? '#2563EB' : t.accuracy >= 45 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={i} className={styles.topicItem}>
                        <div className={styles.topicHeader}>
                          <span>{t.name}</span>
                          <span className={`${styles.topicBadge} ${badgeClass}`}>{t.status || (t.accuracy >= 75 ? 'Strong' : t.accuracy >= 60 ? 'Moderate' : 'Needs Practice')}</span>
                        </div>
                        <div className={styles.topicStats}>
                          <span>Accuracy: <strong>{t.accuracy}%</strong></span>
                          <span>{t.attempts} attempts &bull; {t.avgTime || '2m'}</span>
                        </div>
                        <div className={styles.topicBar}>
                          <div className={styles.topicFill} style={{width: `${t.accuracy}%`, background: barColor}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trends' && (
            <div className={styles.trendsContainer}>
              <div className={styles.trendsStatsRow}>
                <div className={styles.trendStatPill}>
                  <span className={styles.trendStatLbl}>Latest Score</span>
                  <span className={styles.trendStatVal}>{d.overview?.latestScore || 77} / 198</span>
                  <span className={styles.trendStatDelta}>↑ +14 pts from Mock 1</span>
                </div>
                <div className={styles.trendStatPill}>
                  <span className={styles.trendStatLbl}>Accuracy Trend</span>
                  <span className={styles.trendStatVal}>{d.dna?.accuracy?.value || 78}%</span>
                  <span className={styles.trendStatDelta}>↑ +8.5% improvement</span>
                </div>
                <div className={styles.trendStatPill}>
                  <span className={styles.trendStatLbl}>Avg. Question Speed</span>
                  <span className={styles.trendStatVal}>2m 04s</span>
                  <span className={styles.trendStatDelta} style={{color: '#2563EB'}}>⚡ 18s faster per question</span>
                </div>
                <div className={styles.trendStatPill}>
                  <span className={styles.trendStatLbl}>Consistency Index</span>
                  <span className={styles.trendStatVal}>{d.dna?.consistency?.value || 72}%</span>
                  <span className={styles.trendStatDelta}>🛡️ Low variance in VARC/QA</span>
                </div>
              </div>

              <div className={styles.trendsCard}>
                <div className={styles.trendsHeader}>
                  <div>
                    <div className={styles.trendsTitle}>Sectional Score Progression (Mock 1 to Mock 5)</div>
                    <div style={{fontSize: '13px', color: '#64748B', marginTop: '4px'}}>Comparing section-by-section score trajectory across your mock exam timeline</div>
                  </div>
                </div>

                <div style={{width: '100%', height: 320}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={[
                        { name: 'Mock 1', VARC: 22, DILR: 12, QA: 16, Overall: 50 },
                        { name: 'Mock 2', VARC: 25, DILR: 14, QA: 18, Overall: 57 },
                        { name: 'Mock 3', VARC: 27, DILR: 16, QA: 22, Overall: 65 },
                        { name: 'Mock 4', VARC: 29, DILR: 15, QA: 25, Overall: 69 },
                        { name: 'Mock 5', VARC: 32, DILR: 18, QA: 27, Overall: 77 },
                      ]} 
                      margin={{top: 15, right: 25, left: -10, bottom: 5}}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{background: '#FFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px'}} />
                      <Legend wrapperStyle={{fontSize: '12px', fontWeight: 600, paddingTop: '10px'}} />
                      <Line type="monotone" dataKey="Overall" name="Overall Score" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="VARC" name="VARC" stroke="#0EA5E9" strokeWidth={2} dot={{r: 3, fill: '#0EA5E9'}} />
                      <Line type="monotone" dataKey="QA" name="QA" stroke="#8B5CF6" strokeWidth={2} dot={{r: 3, fill: '#8B5CF6'}} />
                      <Line type="monotone" dataKey="DILR" name="DILR" stroke="#10B981" strokeWidth={2} dot={{r: 3, fill: '#10B981'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* JOURNEY & MAP */}
        <section className={styles.dualGrid}>
          <div className={styles.graphCard}>
            <div className={styles.gcHeader}>
              <div>
                <div className={styles.gcTitle}>Your Performance Journey</div>
                <div className={styles.gcSubtitle}>Track your progress across mock attempts</div>
              </div>
              <div className={styles.wysTabs}>
                {['Score', 'Accuracy', 'Speed'].map(tab => (
                  <div key={tab} className={`${styles.wysTab} ${journeyTab === tab ? styles.active : ''}`} onClick={() => setJourneyTab(tab)}>
                    {tab}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.gcBody}>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.trend} margin={{top:10, right:10, left:-20, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomLineTooltip />} cursor={{stroke: '#E2E8F0', strokeWidth: 1}} />
                    <Line type="monotone" dataKey={journeyTab.toLowerCase()} stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartStats}>
                <div className={styles.csItem}><span className={styles.csLbl}>Total Mocks</span><span className={styles.csVal}>5</span></div>
                <div className={styles.csItem}><span className={styles.csLbl}>Best Score</span><span className={styles.csVal}>78</span></div>
                <div className={styles.csItem}><span className={styles.csLbl}>Avg. Score</span><span className={styles.csVal}>68</span></div>
                <div className={styles.csInsight}>🧠 Your performance is showing a steady improvement. Keep going!</div>
              </div>
            </div>
          </div>

          <div className={styles.graphCard}>
            <div className={styles.gcHeader}>
              <div>
                <div className={styles.gcTitle}>Speed vs Accuracy Analysis</div>
                <div className={styles.gcSubtitle}>Understand your performance pattern</div>
              </div>
               
            </div>
            <div className={styles.gcBody} style={{position: 'relative'}}>
              <div className={styles.chartArea} style={{zIndex: 2, minWidth: 0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={barData} margin={{top:20, right:20, left:0, bottom:20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#3B82F6" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}} />
                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600, color: '#64748B'}} />
                    <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="time" name="Avg Time (mins)" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981'}} activeDot={{r: 6}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartStats} style={{width: '180px'}}>
                <div style={{background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', height: '100%'}}>
                  <div style={{fontSize: '11px', fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', display: 'inline-block', padding: '4px 10px', borderRadius: '100px', marginBottom: '12px'}}>💡 Key Insight</div>
                  <div style={{fontSize: '13px', color: '#0F172A', fontWeight: 500, lineHeight: 1.5}}>You are strong in <strong>Fast + Accurate</strong> zone (VARC), but need improvement in <strong>Slow + Inaccurate</strong> zone (DILR).</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOWER ANALYTICS */}
        <section className={styles.lowerGrid} id="mistake-section">
          {/* Mistake Intelligence */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Mistake Intelligence</div>
            <div className={styles.lcSubtitle}>Based on your wrong and unanswered questions</div>
            <div className={styles.mistakeViz}>
              <div className={styles.mistakeDonut}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mistakeData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                      {mistakeData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.mdText}>
                  <div className={styles.mdVal}>42</div>
                  <div className={styles.mdLbl}>Total Mistakes</div>
                </div>
              </div>
              <div className={styles.mistakeList}>
                <div style={{display: 'flex', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px'}}>
                  <span style={{flex:1, marginLeft: '16px'}}>Category</span>
                  <span style={{width: 30, textAlign: 'right', marginRight: '12px'}}>%</span>
                  <span style={{width: 20, textAlign: 'right'}}>Count</span>
                </div>
                {mistakeData.map((m: any, i: number) => (
                  <div key={i} className={styles.mlRow}>
                    <div className={styles.mlDot} style={{background: m.color}}></div>
                    <div className={styles.mlName}>{m.name}</div>
                    <div className={styles.mlPct}>{m.value}%</div>
                    <div className={styles.mlCount}>{Math.round(42 * (m.value/100))}</div>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/intelligence/error-tracking" className={styles.lcBtn}>View All Mistakes &rarr;</Link>
          </div>

          {/* Gain Marks */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Where Can You Gain Marks?</div>
            <div className={styles.lcSubtitle}>Estimated opportunity based on your previous attempts</div>
            <div className={styles.oppList}>
              {[
                {
                  key: 'carelessErrors' as const,
                  i: '🎯',
                  c: '#D1FAE5',
                  tc: '#059669',
                  n: 'Reduce careless errors',
                  m: `+${d?.opportunities?.[0]?.marks ?? 8} marks`
                },
                {
                  key: 'dilrAccuracy' as const,
                  i: '🧩',
                  c: '#FEF3C7',
                  tc: '#D97706',
                  n: 'Improve DILR accuracy',
                  m: `+${d?.opportunities?.[1]?.marks ?? 6} marks`
                },
                {
                  key: 'questionSelection' as const,
                  i: '⚙️',
                  c: '#F3E8FF',
                  tc: '#7E22CE',
                  n: 'Better question selection',
                  m: `+${d?.opportunities?.[2]?.marks ?? 4} marks`
                },
                {
                  key: 'qaSpeed' as const,
                  i: '⚡',
                  c: '#E0F2FE',
                  tc: '#0369A1',
                  n: 'Increase QA speed',
                  m: `+${d?.opportunities?.[3]?.marks ?? Math.max(3, Math.round(((d?.sections?.QA?.avgTimeSec ?? 160) - 120) / 13))} marks`
                },
              ].map((opp, i) => (
                <div
                  key={i}
                  className={styles.oppRow}
                  onClick={() => setSelectedOpportunity(opp.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedOpportunity(opp.key);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${opp.n} (${opp.m})`}
                >
                  <div className={styles.oppIcon} style={{background: opp.c, color: opp.tc}}>{opp.i}</div>
                  <div className={styles.oppName}>{opp.n}</div>
                  <div className={styles.oppMarks}>{opp.m}</div>
                  <div className={styles.oppArrow}>&gt;</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Your Next-Mock Action Plan</div>
            <div className={styles.lcSubtitle}>Personalized steps to improve your performance</div>
            <div className={styles.apList}>
              <div className={styles.apRow}>
                <div className={styles.apNum}>01</div>
                <div className={styles.apContent}>
                  <div className={styles.apName}>Review your last 5 Algebra mistakes</div>
                  <div className={styles.apDesc}>Focus on concept clarity and formula application.</div>
                </div>
              </div>
              <div className={styles.apRow}>
                <div className={styles.apNum}>02</div>
                <div className={styles.apContent}>
                  <div className={styles.apName}>Practice 2 timed DILR sets</div>
                  <div className={styles.apDesc}>Work on set selection and time management.</div>
                </div>
              </div>
              <div className={styles.apRow}>
                <div className={styles.apNum}>03</div>
                <div className={styles.apContent}>
                  <div className={styles.apName}>Attempt 15 QA questions</div>
                  <div className={styles.apDesc}>Focus on arithmetic and number system.</div>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setShowPlanModal(true)} 
              className={styles.apBtn} 
              style={{cursor: 'pointer', border: 'none', width: '100%'}}
            >
              Start My Improvement Plan &rarr;
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <div className={styles.footerBar}>
          <div className={styles.fbLeft}>
            <span>🧠</span> Analysis based on your completed mock attempts, question responses and timing data.
          </div>
          <div>ⓘ More mocks = more accurate insights.</div>
        </div>

      </div>

      {/* Action Plan Modal */}
      {showPlanModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowPlanModal(false)} aria-label="Close modal">&times;</button>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
              <span style={{fontSize: '24px'}}>🎯</span>
              <h3 style={{fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0}}>Your AI Improvement Plan</h3>
            </div>
            <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5}}>
              Complete these targeted actions before your next mock to maximize your score gain. Click checkboxes to track your preparation.
            </p>

            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569'}}>
              <span>Progress: {completedTasks.length} of 3 tasks completed</span>
              <span>{Math.round((completedTasks.length / 3) * 100)}%</span>
            </div>
            <div className={styles.planProgressBar}>
              <div className={styles.planProgressFill} style={{width: `${(completedTasks.length / 3) * 100}%`}}></div>
            </div>

            <div className={styles.planStepsList}>
              {/* Step 1 */}
              <div className={`${styles.planStepItem} ${completedTasks.includes(1) ? styles.planStepDone : ''}`}>
                <div 
                  className={`${styles.planStepCheck} ${completedTasks.includes(1) ? styles.planStepCheckDone : ''}`}
                  onClick={() => toggleTask(1)}
                  role="checkbox"
                  aria-checked={completedTasks.includes(1)}
                  tabIndex={0}
                >
                  {completedTasks.includes(1) ? '✓' : ''}
                </div>
                <div className={styles.planStepContent}>
                  <div className={styles.planStepTitle}>1. Review your last 5 Algebra mistakes</div>
                  <div className={styles.planStepDesc}>Analyze quadratic equations and progressions questions you missed in recent mocks to eliminate recurring errors.</div>
                  <Link href="/intelligence/error-tracking" className={styles.planStepAction}>
                    Open Error Tracker &rarr;
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`${styles.planStepItem} ${completedTasks.includes(2) ? styles.planStepDone : ''}`}>
                <div 
                  className={`${styles.planStepCheck} ${completedTasks.includes(2) ? styles.planStepCheckDone : ''}`}
                  onClick={() => toggleTask(2)}
                  role="checkbox"
                  aria-checked={completedTasks.includes(2)}
                  tabIndex={0}
                >
                  {completedTasks.includes(2) ? '✓' : ''}
                </div>
                <div className={styles.planStepContent}>
                  <div className={styles.planStepTitle}>2. Practice 2 timed DILR sets</div>
                  <div className={styles.planStepDesc}>Practice matrix arrangements and tournament sets with strict 12-minute caps to refine your set selection intuition.</div>
                  <Link href="/browse#pyq-section" className={styles.planStepAction}>
                    Solve DILR Sets in Archives &rarr;
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`${styles.planStepItem} ${completedTasks.includes(3) ? styles.planStepDone : ''}`}>
                <div 
                  className={`${styles.planStepCheck} ${completedTasks.includes(3) ? styles.planStepCheckDone : ''}`}
                  onClick={() => toggleTask(3)}
                  role="checkbox"
                  aria-checked={completedTasks.includes(3)}
                  tabIndex={0}
                >
                  {completedTasks.includes(3) ? '✓' : ''}
                </div>
                <div className={styles.planStepContent}>
                  <div className={styles.planStepTitle}>3. Attempt 15 QA Arithmetic questions</div>
                  <div className={styles.planStepDesc}>Focus on Percentages, Profit & Loss, and Ratios to convert your arithmetic speed into 100% accuracy.</div>
                  <Link href="/topics" className={styles.planStepAction}>
                    Practice QA Topics &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {completedTasks.length === 3 ? (
              <div className={styles.celebrationBox}>
                <span>🏆</span> All steps completed! You are in prime condition for your next CAT mock test.
              </div>
            ) : null}

            <div style={{marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
              <button 
                onClick={() => setShowPlanModal(false)}
                style={{
                  background: '#2563EB',
                  color: '#FFF',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {completedTasks.length === 3 ? 'Done' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Detail Popup Modal (All 5 Performance DNA Cards) */}
      {selectedMetric && (() => {
        const hasMockHistory = Array.isArray(d?.trend) && d.trend.length > 0;

        const varcAcc = d?.sections?.VARC?.accuracy ?? 82;
        const dilrAcc = d?.sections?.DILR?.accuracy ?? 71;
        const qaAcc = d?.sections?.QA?.accuracy ?? 76;

        const speedComparisonData = [
          {
            section: "VARC",
            label: d?.topics?.VARC?.[0]?.avgTime || "1m 45s",
            seconds: parseTimeStr(d?.topics?.VARC?.[0]?.avgTime || "1m 45s") || 105,
            color: "#10B981"
          },
          {
            section: "DILR",
            label: "2m 40s",
            seconds: 160,
            color: "#059669"
          },
          {
            section: "QA",
            label: "2m 10s",
            seconds: 130,
            color: "#34D399"
          }
        ];

        const consistencyTrendData =
          hasMockHistory && d.trend.length >= 2
            ? d.trend.map((item: any, idx: number) => ({
                name: item.name || `Mock ${idx + 1}`,
                score: Number(item.score) || 0
              }))
            : hasMockHistory && d.trend.length === 1
            ? [
                { name: "Mock 1", score: Math.max(40, (Number(d.trend[0].score) || 72) - 10) },
                { name: "Mock 2", score: Math.max(45, (Number(d.trend[0].score) || 72) - 6) },
                { name: "Mock 3", score: Math.max(48, (Number(d.trend[0].score) || 72) - 3) },
                { name: "Mock 4", score: Number(d.trend[0].score) || 72 }
              ]
            : [];

        const allTopics: Array<{ name: string; section: string; status: string; accuracy: number }> = [
          ...(d?.topics?.VARC || []).map((t: any) => ({ ...t, section: "VARC" })),
          ...(d?.topics?.DILR || []).map((t: any) => ({ ...t, section: "DILR" })),
          ...(d?.topics?.QA || []).map((t: any) => ({ ...t, section: "QA" }))
        ];

        const strongTopics = allTopics.filter((t) => t.accuracy >= 80);
        const moderateTopics = allTopics.filter((t) => t.accuracy >= 55 && t.accuracy < 80);
        const weakTopics = allTopics.filter((t) => t.accuracy < 55);

        const wrongSelectionMistake = (d?.mistakesMap || []).find(
          (m: any) => m.category === "Wrong Selection"
        );
        const lowValuePct = wrongSelectionMistake?.percent ?? 18;
        const highValuePct = d?.dna?.questionSelection?.value ?? 55;
        const mediumValuePct = Math.max(10, 100 - highValuePct - lowValuePct);

        return (
          <div
            className={styles.metricModalOverlay}
            onClick={() => setSelectedMetric(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="metric-modal-title"
          >
            <div
              className={styles.metricModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.metricModalClose}
                onClick={() => setSelectedMetric(null)}
                aria-label="Close popup"
              >
                ✕
              </button>

              {/* 1. ACCURACY POPUP (Blue Theme) */}
              {selectedMetric === "accuracy" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      🎯
                    </div>
                    <h3 id="metric-modal-title" className={styles.metricModalTitle}>
                      Accuracy Details
                    </h3>
                  </div>
                  <p className={styles.metricModalDesc}>
                    Your accuracy shows how many questions you answered correctly out of the total attempted.
                  </p>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock to unlock detailed Performance DNA insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
                          borderColor: "#BFDBFE"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Current Accuracy</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#1D4ED8" }}>
                            {d.dna?.accuracy?.value ?? 78}%
                          </span>
                        </div>
                        <span className={styles.metricImprovementBadge}>
                          ↑ +4% vs last 3 mocks
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Section-wise Accuracy</h4>
                        <div className={styles.metricSecList}>
                          {[
                            { name: "VARC", val: varcAcc, color: "#2563EB" },
                            { name: "DILR", val: dilrAcc, color: "#3B82F6" },
                            { name: "QA", val: qaAcc, color: "#60A5FA" }
                          ].map((sec) => (
                            <div key={sec.name} className={styles.metricSecItem}>
                              <div className={styles.metricSecRowTop}>
                                <span>{sec.name}</span>
                                <span className={styles.metricSecVal} style={{ color: "#2563EB" }}>
                                  {sec.val}%
                                </span>
                              </div>
                              <div className={styles.metricSecBar}>
                                <div
                                  className={styles.metricSecFill}
                                  style={{ width: `${sec.val}%`, background: sec.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Key Insights</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#2563EB", background: "#F8FAFC" }}
                        >
                          <div>
                            <strong>{d.dna?.accuracy?.interpretation || "Strong — maintain current level"}:</strong>{" "}
                            {d.dna?.accuracy?.insight || "You rarely make careless errors when you know the concept."}
                          </div>
                          {d.diagnosis?.well && (
                            <div style={{ color: "#475569", fontSize: "12.5px" }}>
                              • {d.diagnosis.well}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Improvement Suggestions</h4>
                        <ol className={styles.metricTipsList}>
                          {[
                            "Avoid blind guessing to reduce negative marking",
                            "Focus on weak topics where mistakes are frequent",
                            "Review incorrect questions after every mock",
                            "Prioritize high-confidence questions first"
                          ].map((tip, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipNum}
                                style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                              >
                                {idx + 1}
                              </span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 2. SPEED POPUP (Green Theme) */}
              {selectedMetric === "speed" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#ECFDF5", color: "#059669" }}>
                      ⚡
                    </div>
                    <h3 id="metric-modal-title" className={styles.metricModalTitle}>
                      Speed Analysis
                    </h3>
                  </div>
                  <p className={styles.metricModalDesc}>
                    Speed indicates how quickly you attempt questions while maintaining accuracy.
                  </p>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock to unlock detailed Performance DNA insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 100%)",
                          borderColor: "#A7F3D0"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Current Speed</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#059669" }}>
                            {d.dna?.speed?.value ?? 61}%
                          </span>
                        </div>
                        <span className={styles.metricImprovementBadge}>
                          ↑ +5% vs last 3 mocks
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Average Time Per Question</h4>
                        <div className={styles.metricSecList}>
                          {speedComparisonData.map((sec) => (
                            <div key={sec.section} className={styles.metricSecItem}>
                              <div className={styles.metricSecRowTop}>
                                <span>{sec.section} time</span>
                                <span className={styles.metricSecVal} style={{ color: "#059669" }}>
                                  {sec.label}
                                </span>
                              </div>
                              <div className={styles.metricSecBar}>
                                <div
                                  className={styles.metricSecFill}
                                  style={{
                                    width: `${Math.min(100, Math.round((sec.seconds / 200) * 100))}%`,
                                    background: sec.color
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve</h4>
                        <ul className={styles.metricTipsList}>
                          {[
                            "Reduce time spent on difficult questions",
                            "Practice timed sectional sets",
                            "Improve calculation speed",
                            "Learn when to skip and move on"
                          ].map((tip, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipDot}
                                style={{ background: "#10B981" }}
                              />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 3. CONSISTENCY POPUP (Purple Theme) */}
              {selectedMetric === "consistency" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#F5F3FF", color: "#8B5CF6" }}>
                      🛡️
                    </div>
                    <h3 id="metric-modal-title" className={styles.metricModalTitle}>
                      Consistency Details
                    </h3>
                  </div>
                  <p className={styles.metricModalDesc}>
                    Consistency shows how stable your performance is across mocks.
                  </p>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock to unlock detailed Performance DNA insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #F5F3FF 0%, #F8FAFC 100%)",
                          borderColor: "#DDD6FE"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Current Consistency</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#7C3AED" }}>
                            {d.dna?.consistency?.value ?? 72}%
                          </span>
                        </div>
                        <span className={styles.metricImprovementBadge}>
                          ↑ +6% vs last 3 mocks
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Performance Stability</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#8B5CF6", background: "#FAF5FF" }}
                        >
                          <div>
                            <strong>{d.dna?.consistency?.interpretation || "Moderately stable"}:</strong>{" "}
                            {d.dna?.consistency?.insight || "Your VARC scores vary depending on the passage genre."}
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Mock-wise Score Trend</h4>
                        <div className={styles.metricChartContainer}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={consistencyTrendData}
                              margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis
                                dataKey="name"
                                stroke="#64748B"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="#64748B"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "#FFFFFF",
                                  border: "1px solid #DDD6FE",
                                  borderRadius: "10px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  boxShadow: "0 8px 20px rgba(139, 92, 246, 0.12)"
                                }}
                                formatter={(val: any) => [`${val}`, "Score"]}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#7C3AED", strokeWidth: 2, stroke: "#FFFFFF" }}
                                activeDot={{ r: 6, fill: "#6D28D9" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Consistency Tips</h4>
                        <ul className={styles.metricTipsList}>
                          {[
                            "Maintain a regular mock schedule",
                            "Review performance after every mock",
                            "Track score fluctuations",
                            "Focus on maintaining stable accuracy"
                          ].map((tip, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipDot}
                                style={{ background: "#8B5CF6" }}
                              />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 4. CONCEPT STRENGTH POPUP (Pink/Purple Theme) */}
              {selectedMetric === "conceptStrength" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#FDF4FF", color: "#D946EF" }}>
                      📚
                    </div>
                    <h3 id="metric-modal-title" className={styles.metricModalTitle}>
                      Concept Strength
                    </h3>
                  </div>
                  <p className={styles.metricModalDesc}>
                    Concept Strength measures your foundational mastery across core CAT topics in VARC, DILR, and QA.
                  </p>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock to unlock detailed Performance DNA insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #FDF4FF 0%, #F8FAFC 100%)",
                          borderColor: "#F5D0FE"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Overall Concept Strength</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#C026D3" }}>
                            {d.dna?.conceptStrength?.value ?? 85}%
                          </span>
                        </div>
                        <span
                          className={styles.metricImprovementBadge}
                          style={{ background: "#FDF4FF", color: "#A21CAF", borderColor: "#F0ABFC" }}
                        >
                          ✦ {d.dna?.conceptStrength?.interpretation || "Excellent foundation"}
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Topic-wise Strength</h4>
                        <div className={styles.metricTopicTierGrid}>
                          <div className={styles.metricTopicTierBox}>
                            <div className={styles.metricTopicTierLabel} style={{ color: "#059669" }}>
                              <span>●</span> Strong Topics
                            </div>
                            <div className={styles.metricTopicPillList}>
                              {strongTopics.map((t) => (
                                <div
                                  key={t.name}
                                  className={styles.metricTopicPill}
                                  style={{ background: "#ECFDF5", color: "#065F46" }}
                                >
                                  <span>{t.name}</span>
                                  <strong>{t.accuracy}%</strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className={styles.metricTopicTierBox}>
                            <div className={styles.metricTopicTierLabel} style={{ color: "#2563EB" }}>
                              <span>●</span> Moderate Topics
                            </div>
                            <div className={styles.metricTopicPillList}>
                              {moderateTopics.map((t) => (
                                <div
                                  key={t.name}
                                  className={styles.metricTopicPill}
                                  style={{ background: "#EFF6FF", color: "#1E40AF" }}
                                >
                                  <span>{t.name}</span>
                                  <strong>{t.accuracy}%</strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className={styles.metricTopicTierBox}>
                            <div className={styles.metricTopicTierLabel} style={{ color: "#DC2626" }}>
                              <span>●</span> Weak Topics
                            </div>
                            <div className={styles.metricTopicPillList}>
                              {weakTopics.map((t) => (
                                <div
                                  key={t.name}
                                  className={styles.metricTopicPill}
                                  style={{ background: "#FEF2F2", color: "#991B1B" }}
                                >
                                  <span>{t.name}</span>
                                  <strong>{t.accuracy}%</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Recommended Topics to Revise</h4>
                        <div className={styles.metricReviseChips}>
                          {weakTopics.map((t) => (
                            <span key={t.name} className={styles.metricReviseChip}>
                              📌 {t.name} ({t.section})
                            </span>
                          ))}
                          <span className={styles.metricReviseChip}>
                            📌 Permutations &amp; Combinations (QA)
                          </span>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Improvement Tips</h4>
                        <ul className={styles.metricTipsList}>
                          {[
                            "Revise core formulas and conceptual shortcuts for weak QA topics",
                            "Solve 15–20 untimed foundational questions before attempting timed sets",
                            "Maintain a concept formula & logic notebook for recurring errors",
                            "Pair strong topics (Arithmetic, RC) with targeted revision on Algebra"
                          ].map((tip, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipDot}
                                style={{ background: "#D946EF" }}
                              />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 5. QUESTION SELECTION POPUP (Blue/Cyan Theme) */}
              {selectedMetric === "questionSelection" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                      🎯
                    </div>
                    <h3 id="metric-modal-title" className={styles.metricModalTitle}>
                      Question Selection
                    </h3>
                  </div>
                  <p className={styles.metricModalDesc}>
                    Question Selection evaluates how effectively you identify and attempt high-reward questions while skipping time traps.
                  </p>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock to unlock detailed Performance DNA insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 100%)",
                          borderColor: "#BAE6FD"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Current Selection Score</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#0284C7" }}>
                            {d.dna?.questionSelection?.value ?? 55}%
                          </span>
                        </div>
                        <span
                          className={styles.metricImprovementBadge}
                          style={{ background: "#E0F2FE", color: "#0369A1", borderColor: "#7DD3FC" }}
                        >
                          ⚡ Efficiency: {d.dna?.questionSelection?.value ?? 55}%
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Question Selection Breakdown</h4>
                        <div className={styles.metricValueGrid}>
                          <div
                            className={styles.metricValueCard}
                            style={{ borderColor: "#A7F3D0", background: "#F0FDF4" }}
                          >
                            <span className={styles.metricValueCardTitle} style={{ color: "#059669" }}>
                              High-Value Questions
                            </span>
                            <span className={styles.metricValueCardStat} style={{ color: "#065F46" }}>
                              {highValuePct}%
                            </span>
                            <span className={styles.metricValueCardSub}>
                              High-accuracy sitters solved within optimal time
                            </span>
                          </div>

                          <div
                            className={styles.metricValueCard}
                            style={{ borderColor: "#BAE6FD", background: "#F0F9FF" }}
                          >
                            <span className={styles.metricValueCardTitle} style={{ color: "#0284C7" }}>
                              Medium-Value Questions
                            </span>
                            <span className={styles.metricValueCardStat} style={{ color: "#0C4A6E" }}>
                              {mediumValuePct}%
                            </span>
                            <span className={styles.metricValueCardSub}>
                              Moderate difficulty sets requiring 2–3 mins
                            </span>
                          </div>

                          <div
                            className={styles.metricValueCard}
                            style={{ borderColor: "#FECACA", background: "#FEF2F2" }}
                          >
                            <span className={styles.metricValueCardTitle} style={{ color: "#DC2626" }}>
                              Low-Value Questions
                            </span>
                            <span className={styles.metricValueCardStat} style={{ color: "#991B1B" }}>
                              {lowValuePct}%
                            </span>
                            <span className={styles.metricValueCardSub}>
                              Time traps with &lt;30% historical accuracy
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Question Selection Efficiency &amp; Recommended Strategy</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#0EA5E9", background: "#F0F9FF" }}
                        >
                          <div>
                            <strong>Efficiency Insight:</strong>{" "}
                            {d.dna?.questionSelection?.insight ||
                              "You often pick the hardest DILR set first, draining time."}
                          </div>
                          <div>
                            <strong>Recommended Strategy:</strong>{" "}
                            {d.diagnosis?.improveFastest ||
                              "Target DILR set selection to avoid 10-minute traps."}{" "}
                            Use a Two-Round Scanning approach—lock in familiar sitters first before attempting complex multi-step problems.
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve Question Selection</h4>
                        <ul className={styles.metricTipsList}>
                          {[
                            "Scan all DILR sets for 3 minutes before committing to your first set",
                            "Use a strict 90-second bailout rule on unfamiliar QA algebra problems",
                            "Prioritize high-confidence sitters in Round 1 to secure sectional cutoffs",
                            "Avoid ego-solving low-value trap questions with <30% success rate"
                          ].map((tip, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipDot}
                                style={{ background: "#0EA5E9" }}
                              />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Where Can You Gain Marks? — Opportunity Detail Popup Modal */}
      {selectedOpportunity && (() => {
        const hasMockHistory = Array.isArray(d?.trend) && d.trend.length > 0;

        // 1. Reduce Careless Errors real metrics
        const carelessGain = d?.opportunities?.[0]?.marks ?? 8;
        const carelessMistakeObj = (d?.mistakesMap || []).find((m: any) => m.category === "Careless Mistake");
        const calcMistakeObj = (d?.mistakesMap || []).find((m: any) => m.category === "Calculation Error");
        const carelessPct = carelessMistakeObj?.percent ?? 15;
        const calcPct = calcMistakeObj?.percent ?? 17;
        const combinedCarelessPct = carelessPct + calcPct;
        const carelessQuestionsCount = Math.max(2, Math.round(42 * (combinedCarelessPct / 100)));
        const currentAccVal = d?.dna?.accuracy?.value ?? 78;
        const accuracyImpactPct = Math.max(4, Math.round(combinedCarelessPct * 0.25));

        // 2. Improve DILR Accuracy real metrics
        const dilrGain = d?.opportunities?.[1]?.marks ?? 6;
        const dilrAcc = d?.sections?.DILR?.accuracy ?? 75;
        const dilrAttempted = d?.sections?.DILR?.attemptRate ?? 12;
        const dilrSetsAttempted = Math.max(2, Math.round(dilrAttempted / 4));
        const dilrCorrect = Math.round((dilrAttempted * dilrAcc) / 100);
        const dilrIncorrect = Math.max(1, dilrAttempted - dilrCorrect);
        const dilrAvgSetTime = d?.topics?.DILR?.[0]?.avgTime || "6m 20s";

        // 3. Better Question Selection real metrics
        const selectionGain = d?.opportunities?.[2]?.marks ?? 4;
        const wrongSelObj = (d?.mistakesMap || []).find((m: any) => m.category === "Wrong Selection");
        const lowValuePct = wrongSelObj?.percent ?? 18;
        const selectionScore = d?.dna?.questionSelection?.value ?? 55;
        const highValuePct = selectionScore;
        const mediumValuePct = Math.max(10, 100 - highValuePct - lowValuePct);
        const totalAttempted =
          (d?.sections?.VARC?.attemptRate ?? 15) +
          (d?.sections?.DILR?.attemptRate ?? 12) +
          (d?.sections?.QA?.attemptRate ?? 21);
        const totalSkipped = Math.max(0, 66 - totalAttempted);

        // 4. Increase QA Speed real metrics
        const qaSpeedGain =
          d?.opportunities?.[3]?.marks ??
          Math.max(3, Math.round(((d?.sections?.QA?.avgTimeSec ?? 160) - 120) / 13));
        const qaAvgSec = d?.sections?.QA?.avgTimeSec ?? 160;
        const qaAvgMin = Math.floor(qaAvgSec / 60);
        const qaAvgRemSec = qaAvgSec % 60;
        const qaAvgFormatted = `${qaAvgMin}m ${qaAvgRemSec}s`;
        const qaTopics = d?.topics?.QA || [];
        const slowestQaTopic =
          qaTopics.find((t: any) => t.status === "Critical" || t.name === "Algebra") ||
          qaTopics[1] || { name: "Algebra", avgTime: "3m 40s", accuracy: 30 };

        return (
          <div
            className={styles.metricModalOverlay}
            onClick={() => setSelectedOpportunity(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="opp-modal-title"
          >
            <div
              className={styles.metricModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.metricModalClose}
                onClick={() => setSelectedOpportunity(null)}
                aria-label="Close popup"
              >
                ✕
              </button>

              {/* POPUP 1 — REDUCE CARELESS ERRORS */}
              {selectedOpportunity === "carelessErrors" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#D1FAE5", color: "#059669" }}>
                      🎯
                    </div>
                    <h3 id="opp-modal-title" className={styles.metricModalTitle}>
                      Reduce Careless Errors
                    </h3>
                  </div>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock attempt to unlock detailed mark-gain analysis and personalized opportunity insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 100%)",
                          borderColor: "#A7F3D0",
                          marginTop: "12px"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Potential Gain</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#059669" }}>
                            +{carelessGain} marks
                          </span>
                        </div>
                        <span className={styles.metricImprovementBadge}>
                          🎯 High-Impact Quick Win
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Why This Matters</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#059669", background: "#F0FDF4" }}
                        >
                          “You are losing marks from avoidable mistakes even when you understand the underlying concept.”
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>What the Data Shows</h4>
                        <div className={styles.oppDataList}>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Careless mistakes from previous attempts</span>
                            <span className={styles.oppDataVal} style={{ color: "#059669" }}>
                              {combinedCarelessPct}% of total mistakes
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Questions affected</span>
                            <span className={styles.oppDataVal}>
                              {carelessQuestionsCount} questions ({carelessPct}% reading + {calcPct}% calculation)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Accuracy impact</span>
                            <span className={styles.oppDataVal}>
                              -{accuracyImpactPct}% drag (Can lift accuracy from {currentAccVal}% → {Math.min(96, currentAccVal + accuracyImpactPct)}%)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Recent trend</span>
                            <span className={styles.oppDataVal}>
                              {carelessMistakeObj?.insight || "Misreading 'except' or 'not' & final-step QA errors"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve</h4>
                        <ol className={styles.metricTipsList}>
                          {[
                            "Slow down during the final step of calculation.",
                            "Recheck units, signs and values.",
                            "Spend the final few seconds reviewing marked answers.",
                            "Maintain an error log for repeated mistakes."
                          ].map((step, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipNum}
                                style={{ background: "#D1FAE5", color: "#059669" }}
                              >
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className={styles.oppModalCtaWrap}>
                        <Link
                          href="/intelligence/error-tracking"
                          className={styles.oppModalCtaBtn}
                          style={{ background: "linear-gradient(135deg, #059669 0%, #10B981 100%)" }}
                        >
                          Review My Mistakes &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* POPUP 2 — IMPROVE DILR ACCURACY */}
              {selectedOpportunity === "dilrAccuracy" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>
                      🧩
                    </div>
                    <h3 id="opp-modal-title" className={styles.metricModalTitle}>
                      Improve DILR Accuracy
                    </h3>
                  </div>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock attempt to unlock detailed mark-gain analysis and personalized opportunity insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #FFFBEB 0%, #F8FAFC 100%)",
                          borderColor: "#FDE68A",
                          marginTop: "12px"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Potential Gain</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#D97706" }}>
                            +{dilrGain} marks
                          </span>
                        </div>
                        <span
                          className={styles.metricImprovementBadge}
                          style={{ background: "#FEF3C7", color: "#B45309", borderColor: "#FDE68A" }}
                        >
                          🧩 Sectional Score Booster
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Why This Matters</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#D97706", background: "#FFFBEB" }}
                        >
                          “Improving accuracy in DILR sets can significantly increase your overall score.”
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>What the Data Shows</h4>
                        <div className={styles.oppDataList}>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Current DILR accuracy</span>
                            <span className={styles.oppDataVal} style={{ color: "#D97706" }}>
                              {dilrAcc}%
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Attempted questions / sets</span>
                            <span className={styles.oppDataVal}>
                              {dilrAttempted} questions ({dilrSetsAttempted} sets attempted)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Correct vs incorrect</span>
                            <span className={styles.oppDataVal}>
                              {dilrCorrect} Correct vs {dilrIncorrect} Incorrect
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Average time per set</span>
                            <span className={styles.oppDataVal}>
                              {dilrAvgSetTime} (Arrangements) – {d?.topics?.DILR?.[1]?.avgTime || "8m 15s"} (Games)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve</h4>
                        <ol className={styles.metricTipsList}>
                          {[
                            "Practice set selection.",
                            "Identify the easiest set first.",
                            "Avoid spending too long on low-return sets.",
                            "Review incorrect sets after every mock."
                          ].map((step, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipNum}
                                style={{ background: "#FEF3C7", color: "#B45309" }}
                              >
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className={styles.oppModalCtaWrap}>
                        <Link
                          href="/topics/dilr-data-interpretation"
                          className={styles.oppModalCtaBtn}
                          style={{ background: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)" }}
                        >
                          Practice DILR &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* POPUP 3 — BETTER QUESTION SELECTION */}
              {selectedOpportunity === "questionSelection" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#F3E8FF", color: "#7E22CE" }}>
                      ⚙️
                    </div>
                    <h3 id="opp-modal-title" className={styles.metricModalTitle}>
                      Better Question Selection
                    </h3>
                  </div>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock attempt to unlock detailed mark-gain analysis and personalized opportunity insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #FAF5FF 0%, #F8FAFC 100%)",
                          borderColor: "#E9D5FF",
                          marginTop: "12px"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Potential Gain</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#7E22CE" }}>
                            +{selectionGain} marks
                          </span>
                        </div>
                        <span
                          className={styles.metricImprovementBadge}
                          style={{ background: "#F3E8FF", color: "#7E22CE", borderColor: "#D8B4FE" }}
                        >
                          ⚙️ Smart Attempt Strategy
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Why This Matters</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#7E22CE", background: "#FAF5FF" }}
                        >
                          “Choosing the right questions can improve your score without requiring you to solve more questions.”
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>What the Data Shows</h4>
                        <div className={styles.oppDataList}>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>High-value questions</span>
                            <span className={styles.oppDataVal} style={{ color: "#059669" }}>
                              {highValuePct}% (High-confidence sitters)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Medium-value questions</span>
                            <span className={styles.oppDataVal} style={{ color: "#2563EB" }}>
                              {mediumValuePct}% (Moderate time investment)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Low-value questions</span>
                            <span className={styles.oppDataVal} style={{ color: "#DC2626" }}>
                              {lowValuePct}% (&lt;30% historical success rate traps)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Selection accuracy</span>
                            <span className={styles.oppDataVal}>
                              {selectionScore}% ({d?.dna?.questionSelection?.interpretation || "Needs Work"})
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Questions skipped vs attempted</span>
                            <span className={styles.oppDataVal}>
                              {totalSkipped} Skipped vs {totalAttempted} Attempted (of 66)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve</h4>
                        <ol className={styles.metricTipsList}>
                          {[
                            "Identify easy/high-confidence questions first.",
                            "Avoid time-consuming questions early.",
                            "Learn to recognize question patterns quickly.",
                            "Practice timed selection drills."
                          ].map((step, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipNum}
                                style={{ background: "#F3E8FF", color: "#7E22CE" }}
                              >
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className={styles.oppModalCtaWrap}>
                        <Link
                          href="/browse#pyq-section"
                          className={styles.oppModalCtaBtn}
                          style={{ background: "linear-gradient(135deg, #7E22CE 0%, #9333EA 100%)" }}
                        >
                          Practice Question Selection &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* POPUP 4 — INCREASE QA SPEED */}
              {selectedOpportunity === "qaSpeed" && (
                <>
                  <div className={styles.metricModalHeader}>
                    <div className={styles.metricModalIcon} style={{ background: "#E0F2FE", color: "#0369A1" }}>
                      ⚡
                    </div>
                    <h3 id="opp-modal-title" className={styles.metricModalTitle}>
                      Increase QA Speed
                    </h3>
                  </div>

                  {!hasMockHistory ? (
                    <div className={styles.metricEmptyState}>
                      Complete a mock attempt to unlock detailed mark-gain analysis and personalized opportunity insights.
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.metricHeroStatBox}
                        style={{
                          background: "linear-gradient(135deg, #F0F9FF 0%, #F8FAFC 100%)",
                          borderColor: "#BAE6FD",
                          marginTop: "12px"
                        }}
                      >
                        <div className={styles.metricHeroStatLeft}>
                          <span className={styles.metricHeroStatLabel}>Potential Gain</span>
                          <span className={styles.metricHeroStatValue} style={{ color: "#0369A1" }}>
                            +{qaSpeedGain} marks
                          </span>
                        </div>
                        <span
                          className={styles.metricImprovementBadge}
                          style={{ background: "#E0F2FE", color: "#0369A1", borderColor: "#7DD3FC" }}
                        >
                          ⚡ Attempt Rate Optimizer
                        </span>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>Why This Matters</h4>
                        <div
                          className={styles.metricInsightCallout}
                          style={{ borderLeftColor: "#0284C7", background: "#F0F9FF" }}
                        >
                          “Reducing the time spent on solvable QA questions can increase your overall attempt rate.”
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>What the Data Shows</h4>
                        <div className={styles.oppDataList}>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Average QA time per question</span>
                            <span className={styles.oppDataVal} style={{ color: "#0369A1" }}>
                              {qaAvgFormatted}
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Current vs target time</span>
                            <span className={styles.oppDataVal}>
                              {qaAvgFormatted} (Current) vs 1m 45s (Target)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Slowest topic</span>
                            <span className={styles.oppDataVal} style={{ color: "#DC2626" }}>
                              {slowestQaTopic.name} ({slowestQaTopic.avgTime}/q, {slowestQaTopic.accuracy}% accuracy)
                            </span>
                          </div>
                          <div className={styles.oppDataRow}>
                            <span className={styles.oppDataLabel}>Recent speed trend</span>
                            <span className={styles.oppDataVal}>
                              {d?.diagnosis?.holdingBack || "Spending 3m+ on difficult QA algebra questions."}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.metricBlock}>
                        <h4 className={styles.metricBlockTitle}>How to Improve</h4>
                        <ol className={styles.metricTipsList}>
                          {[
                            "Practice timed QA sets.",
                            "Improve calculation speed.",
                            "Memorize useful formulas and shortcuts.",
                            "Skip questions that exceed your time threshold."
                          ].map((step, idx) => (
                            <li key={idx} className={styles.metricTipItem}>
                              <span
                                className={styles.metricTipNum}
                                style={{ background: "#E0F2FE", color: "#0369A1" }}
                              >
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className={styles.oppModalCtaWrap}>
                        <Link
                          href="/topics/qa-quantitative-ability"
                          className={styles.oppModalCtaBtn}
                          style={{ background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)" }}
                        >
                          Practice Timed QA &rarr;
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
