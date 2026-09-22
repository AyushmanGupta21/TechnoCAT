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

  if (isLoading) return null; // Or loader

  const hasData = data?.hasData && data?.data;
  if (!hasData) {
    return (
      <div className={styles.pageWrapper} style={{display: 'flex', flexDirection: 'column'}}>
        <header className={styles.darkHeader}>
          <div className={styles.headerLeft}><Link href="/dashboard"><Image src="/logo.jpg" alt="TechnoCAT" width={180} height={75} className={styles.logo} /></Link></div>
          <PostLoginNavActions />
        </header>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <h1 style={{fontSize: 28, fontWeight: 800, marginBottom: 16}}>Your AI Performance Profile Is Waiting</h1>
          <p style={{color: '#64748B', marginBottom: 32}}>Complete your first mock test and TechnoCAT will analyze your accuracy, speed, mistakes and improvement opportunities.</p>
          <Link href="/dashboard" className={styles.btnPrimary}>Take Your First Mock</Link>
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
        <div className={styles.headerLeft}>
          <Link href="/dashboard"><Image src="/logo.jpg" alt="TechnoCAT" width={180} height={75} className={styles.logo} /></Link>
          <nav className={styles.mainNav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/browse" className={styles.navLink}>Browse</Link>
            <Link href="/intelligence" className={`${styles.navLink} ${styles.active}`}>Intelligence Hub</Link>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.navLink}>My Topics</Link>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
          </nav>
        </div>
        <PostLoginNavActions />
      </header>

      <div className={styles.breadcrumb}>Intelligence Hub &gt; AI Performance Analysis</div>

      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}><span>✦</span> AI PERFORMANCE INTELLIGENCE</div>
          <h1 className={styles.heroTitle}>Your CAT Performance,<br/><span>Explained.</span></h1>
          <p className={styles.heroSubtitle}>AI analyzes your attempts, accuracy, speed and mistakes to identify exactly where you are losing marks.</p>
          <div className={styles.heroActions}>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.btnPrimary}>View My Weaknesses &rarr;</Link>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.btnSecondary}>Explore Full Analysis</Link>
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
            <div className={styles.hmRow}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}><span className={styles.hmIcon} style={{background: '#EFF6FF', color: '#2563EB'}}>🎯</span> Accuracy</span>
                <span className={styles.hmVal}>{d.dna.accuracy.value}%</span>
              </div>
              <div className={styles.hmBar}><div className={styles.hmFill} style={{width: `${d.dna.accuracy.value}%`, background: '#2563EB'}}></div></div>
            </div>
            <div className={styles.hmRow}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}><span className={styles.hmIcon} style={{background: '#F0FDF4', color: '#10B981'}}>⚡</span> Speed</span>
                <span className={styles.hmVal}>{d.dna.speed.value}%</span>
              </div>
              <div className={styles.hmBar}><div className={styles.hmFill} style={{width: `${d.dna.speed.value}%`, background: '#10B981'}}></div></div>
            </div>
            <div className={styles.hmRow}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}><span className={styles.hmIcon} style={{background: '#F5F3FF', color: '#8B5CF6'}}>🛡️</span> Consistency</span>
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
              {l: 'Accuracy', i: '🎯', v: d.dna.accuracy.value, s: 'Strong', c: '#2563EB', m: 'Maintain current level'},
              {l: 'Speed', i: '⚡', v: d.dna.speed.value, s: 'Needs Improvement', c: '#10B981', m: 'Focus on time management'},
              {l: 'Consistency', i: '🛡️', v: d.dna.consistency.value, s: 'Good', c: '#8B5CF6', m: 'Keep up the momentum'},
              {l: 'Concept Strength', i: '📚', v: d.dna.conceptStrength.value, s: 'Moderate', c: '#D946EF', m: 'Review weak topics'},
              {l: 'Question Selection', i: '🎯', v: d.dna.questionSelection.value, s: 'Needs Work', c: '#0EA5E9', m: 'Avoid low-value questions'}
            ].map((dna, i) => (
              <div key={i} className={styles.dnaCard}>
                <div className={styles.dnaTopBorder} style={{background: dna.c}}></div>
                <div className={styles.dnaHeader}>
                  <div className={styles.dnaLbl}><span style={{color: dna.c}}>{dna.i}</span> {dna.l}</div>
                  <span style={{color: '#94A3B8', fontSize: 12}}>ⓘ</span>
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
        <section>
          <div className={styles.wysHeader}>
            <div>
              <h2 className={styles.secTitle}>Where You Stand</h2>
              <div className={styles.secSubtitle}>Section-wise performance analysis from your mock attempts</div>
            </div>
            <div className={styles.wysTabs}>
              <div className={`${styles.wysTab} ${styles.active}`}>Overview</div>
              <div className={styles.wysTab}>Detailed</div>
              <div className={styles.wysTab}>Trends</div>
            </div>
          </div>
          
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
        <section className={styles.lowerGrid}>
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
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.lcBtn}>View All Mistakes &rarr;</Link>
          </div>

          {/* Gain Marks */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Where Can You Gain Marks?</div>
            <div className={styles.lcSubtitle}>Estimated opportunity based on your previous attempts</div>
            <div className={styles.oppList}>
              {[
                {i: '🎯', c: '#D1FAE5', tc: '#059669', n: 'Reduce careless errors', m: '+8 marks'},
                {i: '🧩', c: '#FEF3C7', tc: '#D97706', n: 'Improve DILR accuracy', m: '+6 marks'},
                {i: '⚙️', c: '#F3E8FF', tc: '#7E22CE', n: 'Better question selection', m: '+4 marks'},
                {i: '⚡', c: '#E0F2FE', tc: '#0369A1', n: 'Increase QA speed', m: '+3 marks'},
              ].map((opp, i) => (
                <div key={i} className={styles.oppRow}>
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
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.apBtn}>Start My Improvement Plan &rarr;</Link>
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
    </div>
  );
}
