"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ai-analysis.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import BrandLogo from "@/components/BrandLogo";
import {
  LineChart, Line, ComposedChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { StudentMetrics, SectionKey, ConceptStat, TestRecord } from "@/lib/metrics/types";

// Every number on this page comes from GET /api/me/metrics. Wording is generated deterministically
// from those numbers; no model writes any of it.

const SECTIONS: SectionKey[] = ["VARC", "DILR", "QA"];
const SECTION_LABEL: Record<SectionKey, string> = { VARC: "VARC", DILR: "DILR", QA: "Quantitative Aptitude" };
const SECTION_COLOR: Record<SectionKey, string> = { VARC: "#0EA5E9", DILR: "#10B981", QA: "#8B5CF6" };
const OTHER_COLOR = "#94A3B8";

function topicIdForLesson(lessonId: string | null): string | null {
  const id = (lessonId || "").toLowerCase();
  if (id.startsWith("qa-")) return "qa-quantitative-ability";
  if (id.startsWith("dilr-")) return "dilr-data-interpretation";
  if (id.startsWith("varc-")) return "varc-verbal-ability";
  return null;
}

function topicIdForSection(section: SectionKey | null): string | null {
  if (section === "QA") return "qa-quantitative-ability";
  if (section === "DILR") return "dilr-data-interpretation";
  if (section === "VARC") return "varc-verbal-ability";
  return null;
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtPct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 10) / 10}%`);
const fmtPercentile = (v: number) => (v > 99 ? v.toFixed(2) : v.toFixed(1));
const fmtSecs = (s: number | null) => (s === null ? "–" : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function accuracyBadge(acc: number | null): { label: string; bg: string; fg: string } {
  if (acc === null) return { label: "NO DATA", bg: "#F1F5F9", fg: "#64748B" };
  if (acc >= 80) return { label: "STRONG", bg: "#D1FAE5", fg: "#047857" };
  if (acc >= 60) return { label: "MODERATE", bg: "#DBEAFE", fg: "#1D4ED8" };
  return { label: "NEEDS ATTENTION", bg: "#FEE2E2", fg: "#B91C1C" };
}

function conceptBadgeClass(acc: number): string {
  if (acc >= 80) return styles.badgeStrong;
  if (acc >= 60) return styles.badgeModerate;
  if (acc >= 45) return styles.badgeNeeds;
  return styles.badgeWeak;
}

function conceptBarColor(acc: number): string {
  if (acc >= 80) return "#10B981";
  if (acc >= 60) return "#2563EB";
  if (acc >= 45) return "#F59E0B";
  return "#EF4444";
}

/** PYQ pace for a section, from its PYQ attempts (seconds per answered question). */
function pyqPace(tests: TestRecord[]): number | null {
  const timed = tests.filter((t) => t.attempted > 0 && t.durationSeconds > 0);
  const answered = timed.reduce((s, t) => s + t.attempted, 0);
  return answered > 0 ? Math.round(timed.reduce((s, t) => s + t.durationSeconds, 0) / answered) : null;
}

function Header() {
  return (
    <>
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Performance Analysis Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <BrandLogo height={70} />
            </Link>
            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
              <Link href="/mock-viva-prep" className={styles.navLink}>Speak & Assess</Link>
            </div>
            <PostLoginNavActions />
          </nav>
        </div>
      </header>
      <div className={styles.breadcrumb}>
        <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>Performance Analysis</span>
      </div>
    </>
  );
}

function CenterMessage({ title, body, primary }: { title: string; body: string; primary?: { href: string; label: string } }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: "#0F172A" }}>{title}</h1>
      <p style={{ color: "#64748B", marginBottom: 32, maxWidth: 540, lineHeight: 1.6, fontSize: 15 }}>{body}</p>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {primary && <Link href={primary.href} className={styles.btnPrimary}>{primary.label}</Link>}
        <Link href="/intelligence" className={styles.btnSecondary}>&larr; Back to Intelligence Hub</Link>
      </div>
    </div>
  );
}

export default function PerformanceAnalysisPage() {
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Overview" | "Concepts" | "Trends">("Overview");
  const [journeyTab, setJourneyTab] = useState<"Score" | "Accuracy" | "Pace">("Score");

  useEffect(() => {
    // Opening this page counts toward the 7-day challenge's "review your analysis" task.
    fetch("/api/intelligence/record-analysis-view", { method: "POST" }).catch(console.error);
    (async () => {
      try {
        const res = await fetch("/api/me/metrics");
        if (res.ok) setMetrics((await res.json()) as StudentMetrics);
        else setError(res.status === 401 ? "Please log in to see your performance analysis." : "We could not load your analysis right now. Please refresh to try again.");
      } catch {
        setError("We could not load your analysis right now. Please refresh to try again.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const derived = useMemo(() => {
    if (!metrics) return null;
    const pyq = metrics.tests.pyq; // newest first
    const pyqChrono = [...pyq].reverse();
    const latest = pyq[0] ?? null;

    const pyqBySection: Record<SectionKey, TestRecord[]> = { VARC: [], DILR: [], QA: [] };
    for (const t of pyq) if (t.section) pyqBySection[t.section].push(t);

    const sectionsWithAccuracy = SECTIONS.filter((s) => metrics.sections[s].accuracy !== null);
    const bySectionAcc = [...sectionsWithAccuracy].sort((a, b) => (metrics.sections[a].accuracy as number) - (metrics.sections[b].accuracy as number));
    const weakestSection = bySectionAcc[0] ?? null;
    const strongestSection = bySectionAcc.length > 1 ? bySectionAcc[bySectionAcc.length - 1] : null;

    // Mistakes by section and by concept (from the recorded wrong answers).
    const mistakes = metrics.mistakes;
    const mistakeBySection = SECTIONS.map((s) => ({ key: s as SectionKey | "Other", name: s as string, count: mistakes.filter((m) => m.section === s).length, color: SECTION_COLOR[s] }));
    const otherCount = mistakes.filter((m) => !m.section).length;
    if (otherCount > 0) mistakeBySection.push({ key: "Other", name: "Other", count: otherCount, color: OTHER_COLOR });
    const conceptCounts = new Map<string, { concept: string; section: SectionKey | null; lessonId: string | null; count: number }>();
    for (const m of mistakes) {
      if (!m.concept) continue;
      const k = `${m.concept}|${m.section ?? ""}`;
      const e = conceptCounts.get(k) ?? { concept: m.concept, section: m.section, lessonId: m.lessonId, count: 0 };
      e.count++;
      conceptCounts.set(k, e);
    }
    const mistakeByConcept = [...conceptCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    const weak = metrics.concepts.weak;
    const strong = metrics.concepts.strong;
    const weakest: ConceptStat | null = weak[0] ?? null;

    return { pyq, pyqChrono, latest, pyqBySection, weakestSection, strongestSection, mistakeBySection, mistakeByConcept, weak, strong, weakest };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <section className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.loadingSpinner} style={{ borderColor: "rgba(37, 99, 235, 0.3)", borderTopColor: "#2563EB" }}></span>
              PERFORMANCE ANALYSIS
            </div>
            <h1 className={styles.heroTitle} style={{ color: "#0F172A", opacity: 0.9 }}>
              Loading Your<br /><span>CAT Performance...</span>
            </h1>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.mainRing} style={{ background: "#FFF" }}>
              <div className={styles.skeletonPulse} style={{ width: 140, height: 140, borderRadius: "50%" }}></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !metrics || !derived) {
    return (
      <div className={styles.pageWrapper} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <CenterMessage title="Analysis unavailable" body={error ?? "We could not load your analysis right now."} />
      </div>
    );
  }

  const m = metrics;
  const { pyq, pyqChrono, latest, pyqBySection, weakestSection, strongestSection, mistakeBySection, mistakeByConcept, weak, strong, weakest } = derived;

  if (m.tests.recent.length === 0) {
    return (
      <div className={styles.pageWrapper} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <CenterMessage
          title="Your Performance Analysis Is Waiting"
          body="Attempt a full PYQ section (or a module quiz) and this page will show your scores, accuracy, pace, where your mistakes cluster and a plan to fix them."
          primary={{ href: "/browse#pyq-section", label: "Attempt a PYQ Section" }}
        />
      </div>
    );
  }

  // ── Overview numbers ────────────────────────────────────────────────────────
  const overallPercentile = m.percentile.overallEstimate;
  const latestPercentile = latest?.estimatedPercentile ?? null;
  const shownPercentile = overallPercentile ?? latestPercentile;
  const percentileLabel = overallPercentile !== null ? "Estimated overall percentile" : latest?.section ? `Estimated ${latest.section} percentile` : "Estimated percentile";
  const ringPct = latest ? Math.max(0, Math.min(100, latest.percentage)) : 0;
  const spq = m.speed.secondsPerQuestion;
  const bench = m.speed.benchmarkSecondsPerQuestion;

  // ── Summary lists (deterministic) ───────────────────────────────────────────
  const doingWell: string[] = [];
  for (const s of SECTIONS) {
    const acc = m.sections[s].accuracy;
    if (acc !== null && acc >= 75) doingWell.push(`${s} accuracy is ${fmtPct(acc)} in timed tests`);
  }
  for (const c of strong.slice(0, 3)) doingWell.push(`${c.concept}: ${c.correct}/${c.attempted} correct`);
  if (spq !== null && spq <= bench) doingWell.push(`Pace of ${spq}s per question is at or faster than CAT pace (${bench}s)`);

  const holdingBack: string[] = [];
  for (const c of weak.slice(0, 3)) holdingBack.push(`${c.concept}: only ${c.correct}/${c.attempted} correct (${Math.round(c.accuracy)}%)`);
  if (m.accuracy.negativeMarksLost > 0) holdingBack.push(`${plural(m.accuracy.negativeMarksLost, "mark")} lost to wrong MCQ answers in PYQs`);
  if (spq !== null && spq > bench) holdingBack.push(`Pace of ${spq}s per question is slower than CAT pace (${bench}s)`);

  // ── Action plan: fix weakest concept → practise → retest the PYQ section ────
  const focusSection: SectionKey | null = weakest?.section ?? weakestSection;
  const focusTopic = weakest ? topicIdForLesson(weakest.lessonId) ?? topicIdForSection(weakest.section) : topicIdForSection(weakestSection);
  const focusMistakes = weakest
    ? m.mistakes.filter((x) => x.concept === weakest.concept).length
    : focusSection ? m.mistakes.filter((x) => x.section === focusSection).length : m.mistakes.length;
  const plan: { title: string; desc: string; href: string; cta: string }[] = [];
  if (weakest) {
    plan.push({
      title: `Revise ${weakest.concept}`,
      desc: `Your weakest concept: ${weakest.correct} of ${weakest.attempted} correct (${Math.round(weakest.accuracy)}%). Re-read the lesson before practising.`,
      href: focusTopic ? `/topics/${focusTopic}` : "/topics",
      cta: "Open lesson",
    });
  } else if (weakestSection) {
    plan.push({
      title: `Revise ${weakestSection} lessons`,
      desc: `${weakestSection} has your lowest timed-test accuracy (${fmtPct(m.sections[weakestSection].accuracy)}).`,
      href: focusTopic ? `/topics/${focusTopic}` : "/topics",
      cta: "Open course",
    });
  }
  if (focusMistakes > 0) {
    plan.push({
      title: `Review ${plural(focusMistakes, "wrong answer")}${weakest ? ` in ${weakest.concept}` : focusSection ? ` in ${focusSection}` : ""}`,
      desc: "Read the correct answer and explanation for each one, then solve them again without looking.",
      href: "/intelligence/error-tracking",
      cta: "Open Error Tracking",
    });
  } else {
    plan.push({
      title: "Practise with the lesson exercises",
      desc: "Answer the practice questions in the lesson until you get them right consistently.",
      href: focusTopic ? `/topics/${focusTopic}` : "/topics",
      cta: "Practise",
    });
  }
  plan.push({
    title: `Retest with a ${focusSection ?? "full"} PYQ section`,
    desc: focusSection && m.sections[focusSection].latestScore !== null
      ? `Your latest ${focusSection} PYQ score is ${m.sections[focusSection].latestScore}/${m.sections[focusSection].maxScore}. Attempt a new slot to measure the change.`
      : "Attempt a full timed PYQ section to measure your progress.",
    href: "/browse#pyq-section",
    cta: "Browse PYQs",
  });

  // ── Chart data ──────────────────────────────────────────────────────────────
  const journeyData = pyqChrono.map((t) => ({
    name: `${shortDate(t.submittedAt)} ${t.section ?? ""}`.trim(),
    title: t.title,
    Score: Math.round(t.percentage * 10) / 10,
    Accuracy: t.accuracy,
    Pace: t.secondsPerQuestion,
  }));
  const journeyUnit = journeyTab === "Pace" ? "s/question" : "%";
  const bestPct = pyq.length ? Math.max(...pyq.map((t) => t.percentage)) : null;
  const avgPct = pyq.length ? Math.round((pyq.reduce((s, t) => s + t.percentage, 0) / pyq.length) * 10) / 10 : null;
  const firstVsLast = pyqChrono.length >= 2 ? Math.round((pyqChrono[pyqChrono.length - 1].percentage - pyqChrono[0].percentage) * 10) / 10 : null;

  const trendsData = pyqChrono.map((t) => ({
    name: shortDate(t.submittedAt),
    title: t.title,
    VARC: t.section === "VARC" ? t.score : null,
    DILR: t.section === "DILR" ? t.score : null,
    QA: t.section === "QA" ? t.score : null,
  }));

  const sectionBarData = SECTIONS.map((s) => ({
    name: s,
    accuracy: m.sections[s].accuracy,
    pace: pyqPace(pyqBySection[s]),
  }));
  const withPace = sectionBarData.filter((d) => d.pace !== null) as { name: string; accuracy: number | null; pace: number }[];
  const fastest = withPace.length > 1 ? [...withPace].sort((a, b) => a.pace - b.pace)[0] : null;

  const totalMistakes = m.mistakes.length;
  const pieData = mistakeBySection.filter((x) => x.count > 0);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>PERFORMANCE ANALYSIS</span>
          </div>
          <h1 className={styles.heroTitle}>Your CAT Performance,<br /><span>Explained.</span></h1>
          <p className={styles.heroSubtitle}>
            Built from your recorded tests: scores, accuracy, pace and every wrong answer, so you can see exactly where you are losing marks.
          </p>
          <div className={styles.heroActions}>
            <a href="#mistake-section" onClick={(e) => { e.preventDefault(); document.getElementById("mistake-section")?.scrollIntoView({ behavior: "smooth" }); }} className={styles.btnPrimary}>
              View My Weaknesses &rarr;
            </a>
            <a href="#where-you-stand" onClick={(e) => { e.preventDefault(); document.getElementById("where-you-stand")?.scrollIntoView({ behavior: "smooth" }); }} className={styles.btnSecondary}>
              Explore Full Analysis
            </a>
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
              {latest && <circle className={styles.ringProgress} cx="125" cy="125" r="110" style={{ strokeDashoffset: 700 - (700 * ringPct) / 100 }} />}
            </svg>
            <div className={styles.ringLbl}>Latest PYQ Section</div>
            {latest ? (
              <>
                <div className={styles.ringVal} style={{ fontSize: 48 }}>{latest.score}<span style={{ fontSize: 18, color: "#64748B" }}>/{latest.maxScore}</span></div>
                <div className={styles.ringStatus} style={{ color: "#475569", textAlign: "center", padding: "0 18px" }}>{latest.title}</div>
                <div className={styles.ringTrend} style={{ background: "#E0F2FE", color: "#0369A1" }}>{shortDate(latest.submittedAt)}</div>
              </>
            ) : (
              <div className={styles.ringStatus} style={{ color: "#64748B", textAlign: "center", padding: "0 24px" }}>No PYQ section attempted yet</div>
            )}
          </div>

          <div className={styles.heroMetrics}>
            <div className={styles.hmRow} title={m.percentile.disclaimer}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                    </svg>
                  </span>
                  {percentileLabel}
                  <span className={styles.hmInfoIcon} aria-hidden="true">ⓘ</span>
                </span>
                <span className={styles.hmVal} style={{ color: "#6D28D9" }}>{shownPercentile !== null ? fmtPercentile(shownPercentile) : "–"}</span>
              </div>
              <div className={styles.hmBar}>
                <div className={styles.hmFill} style={{ width: `${shownPercentile ?? 0}%`, background: "linear-gradient(90deg, #8B5CF6, #6366F1)" }}></div>
              </div>
              <div className={styles.hmSubtext}>
                <span className={styles.disclaimerText}>
                  {shownPercentile === null ? "Attempt a full PYQ section to see an estimate. " : overallPercentile === null ? `${m.percentile.basis} ` : ""}
                  {m.percentile.disclaimer}
                </span>
              </div>
            </div>

            <div className={styles.hmRow}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                    </svg>
                  </span>
                  Accuracy (timed tests)
                </span>
                <span className={styles.hmVal} style={{ color: "#1D4ED8" }}>{fmtPct(m.accuracy.overall)}</span>
              </div>
              <div className={styles.hmBar}>
                <div className={styles.hmFill} style={{ width: `${m.accuracy.overall ?? 0}%`, background: "linear-gradient(90deg, #0EA5E9, #2563EB)" }}></div>
              </div>
              <div className={styles.hmSubtext}>
                <span>{m.accuracy.overall === null ? "Needs at least 5 answers in timed tests" : `${m.accuracy.correct} of ${m.accuracy.attempted} correct`}</span>
              </div>
            </div>

            <div className={styles.hmRow}>
              <div className={styles.hmTop}>
                <span className={styles.hmLabel}>
                  <span className={styles.hmIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  Pace per question
                </span>
                <span className={styles.hmVal} style={{ color: "#D97706" }}>{spq === null ? "–" : `${spq}s`}</span>
              </div>
              <div className={styles.hmBar}>
                <div className={styles.hmFill} style={{ width: `${m.speed.index ?? 0}%`, background: "linear-gradient(90deg, #F59E0B, #10B981)" }}></div>
              </div>
              <div className={styles.hmSubtext}>
                <span>CAT pace: about {bench}s per question</span>
                {m.speed.index !== null && <span style={{ fontWeight: 700 }}>Pace index {m.speed.index}/100</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.contentWrapper}>

        {/* PERFORMANCE SUMMARY (deterministic, from the numbers below) */}
        <section className={styles.aiDiagnosisCard}>
          <div className={styles.aiRobot}>
            <div style={{ width: 80, height: 80, background: "#2563EB", borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
          </div>
          <div className={styles.aiRight}>
            <div>
              <div className={styles.aiTitle}>Performance Summary</div>
              <div className={styles.aiSubtitle}>
                From {plural(m.tests.recent.length, "recorded test")}{pyq.length ? `, including ${plural(pyq.length, "PYQ section")}` : ""}.
              </div>
            </div>
            <div className={styles.aiMainInsight}>
              {weakestSection && strongestSection
                ? `Your strongest section is ${strongestSection} (${fmtPct(m.sections[strongestSection].accuracy)} accuracy) and your weakest is ${weakestSection} (${fmtPct(m.sections[weakestSection].accuracy)}).`
                : weakestSection
                  ? `So far you have timed-test answers only in ${weakestSection} (${fmtPct(m.sections[weakestSection].accuracy)} accuracy). Attempt the other sections for a full comparison.`
                  : "Attempt timed PYQ sections or module quizzes to compare your sections."}
            </div>
            <div className={styles.aiCols}>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}>
                  <div className={styles.acIcon} style={{ background: "#D1FAE5", color: "#059669" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span>What You&apos;re Doing Well</span>
                </div>
                <ul className={styles.acList}>
                  {doingWell.length ? doingWell.slice(0, 4).map((t) => <li key={t}>{t}</li>) : <li>Keep attempting timed tests; strengths appear at 80%+ accuracy on a concept.</li>}
                </ul>
              </div>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}>
                  <div className={styles.acIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <span>What&apos;s Holding You Back</span>
                </div>
                <ul className={styles.acList}>
                  {holdingBack.length ? holdingBack.slice(0, 4).map((t) => <li key={t}>{t}</li>) : <li>No weak concepts or negative marks recorded yet.</li>}
                </ul>
              </div>
              <div className={styles.aiCol}>
                <div className={styles.aiColTitle}>
                  <div className={styles.acIcon} style={{ background: "#DBEAFE", color: "#2563EB" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                  </div>
                  <span>What Will Improve Your Score</span>
                </div>
                <ul className={styles.acList}>
                  {plan.map((p) => <li key={p.title}>{p.title}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* WHERE YOU STAND */}
        <section id="where-you-stand">
          <div className={styles.wysHeader}>
            <div>
              <h2 className={styles.secTitle}>Where You Stand</h2>
              <div className={styles.secSubtitle}>Section-wise performance from your timed tests and PYQ sections</div>
            </div>
            <div className={styles.wysTabs}>
              {(["Overview", "Concepts", "Trends"] as const).map((tab) => (
                <div key={tab} className={`${styles.wysTab} ${activeTab === tab ? styles.active : ""}`} onClick={() => setActiveTab(tab)} style={{ cursor: "pointer" }} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab(tab); } }}>
                  {tab}
                </div>
              ))}
            </div>
          </div>

          {activeTab === "Overview" && (
            <div className={styles.wysGrid}>
              {SECTIONS.map((s) => {
                const sec = m.sections[s];
                const badge = accuracyBadge(sec.accuracy);
                const spark = [...pyqBySection[s]].reverse().map((t) => ({ name: shortDate(t.submittedAt), v: t.score }));
                const secWeak = weak.find((c) => c.section === s);
                const secStrong = strong.find((c) => c.section === s);
                const color = SECTION_COLOR[s];
                return (
                  <div key={s} className={styles.wysCard}>
                    <div className={styles.wcHeader}>
                      <div className={styles.wcTitle}><span>{SECTION_LABEL[s]}</span></div>
                      <div className={styles.wcBadge} style={{ background: badge.bg, color: badge.fg }}>{badge.label}</div>
                    </div>
                    <div className={styles.wcMain}>
                      <div className={styles.wcDonut}>
                        <svg viewBox="0 0 100 100">
                          <circle className={styles.wcDonutCircle} cx="50" cy="50" r="40" />
                          {sec.accuracy !== null && <circle className={styles.wcDonutProgress} cx="50" cy="50" r="40" style={{ stroke: color, strokeDashoffset: 250 - (250 * sec.accuracy) / 100 }} />}
                        </svg>
                        <div className={styles.wcDonutText}>
                          <div className={styles.wcDonutVal}>{sec.accuracy === null ? "–" : `${Math.round(sec.accuracy)}%`}</div>
                          <div className={styles.wcDonutLbl}>Accuracy</div>
                        </div>
                      </div>
                      <div className={styles.wcStats}>
                        <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Latest PYQ</span><span className={styles.wcStatVal}>{sec.latestScore === null ? "–" : `${sec.latestScore} / ${sec.maxScore}`}</span></div>
                        <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Best PYQ</span><span className={styles.wcStatVal}>{sec.bestScore === null ? "–" : `${sec.bestScore} / ${sec.maxScore}`}</span></div>
                        <div className={styles.wcStatRow}><span className={styles.wcStatLbl}>Answered</span><span className={styles.wcStatVal}>{sec.correct} / {sec.attempted} correct</span></div>
                        <div className={styles.wcStatRow} title={m.percentile.disclaimer}><span className={styles.wcStatLbl}>Est. percentile</span><span className={styles.wcStatVal}>{sec.estimatedPercentile === null ? "–" : fmtPercentile(sec.estimatedPercentile)}</span></div>
                      </div>
                    </div>

                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>PYQ Scores ({sec.pyqAttempts})</div>
                    <div className={styles.wcSparkline}>
                      {spark.length >= 2 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={spark}>
                            <Tooltip contentStyle={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px" }} />
                            <Line type="monotone" dataKey="v" name="Score" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className={styles.emptyNote}>{spark.length === 1 ? "One PYQ attempt so far; a trend needs two." : `No ${s} PYQ section attempted yet.`}</div>
                      )}
                    </div>
                    <div className={styles.wcInsight} style={{ borderLeft: `3px solid ${color}` }}>
                      <span>
                        {secWeak
                          ? `Weakest concept: ${secWeak.concept} (${secWeak.correct}/${secWeak.attempted} correct).`
                          : secStrong
                            ? `Strongest concept: ${secStrong.concept} (${secStrong.correct}/${secStrong.attempted} correct).`
                            : sec.attempted === 0
                              ? `Attempt a timed ${s} test to see your standing.`
                              : "No concept below 60% accuracy in this section."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "Concepts" && (
            <div className={styles.detailedGrid}>
              {SECTIONS.map((s) => {
                const list = [...weak, ...strong].filter((c) => c.section === s).sort((a, b) => a.accuracy - b.accuracy);
                return (
                  <div key={s} className={styles.detailedCard}>
                    <div className={styles.detailedSecHeader}>
                      <div className={styles.detailedSecTitle}><span>{s} Concepts</span></div>
                      {m.sections[s].accuracy !== null && <span className={`${styles.topicBadge} ${conceptBadgeClass(m.sections[s].accuracy as number)}`}>{fmtPct(m.sections[s].accuracy)}</span>}
                    </div>
                    <div className={styles.topicsList}>
                      {list.length === 0 ? (
                        <div className={styles.emptyNote}>No concept is below 60% or at 80%+ yet. Concepts appear after 3+ answers.</div>
                      ) : list.map((c) => {
                        const topicId = topicIdForLesson(c.lessonId);
                        return (
                          <div key={`${c.concept}-${s}`} className={styles.topicItem}>
                            <div className={styles.topicHeader}>
                              {topicId ? <Link href={`/topics/${topicId}`} style={{ color: "inherit" }}>{c.concept}</Link> : <span>{c.concept}</span>}
                              <span className={`${styles.topicBadge} ${conceptBadgeClass(c.accuracy)}`}>{c.accuracy >= 80 ? "Strong" : "Weak"}</span>
                            </div>
                            <div className={styles.topicStats}>
                              <span>Accuracy: <strong>{Math.round(c.accuracy)}%</strong></span>
                              <span>{c.correct} / {c.attempted} correct</span>
                            </div>
                            <div className={styles.topicBar}>
                              <div className={styles.topicFill} style={{ width: `${c.accuracy}%`, background: conceptBarColor(c.accuracy) }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "Trends" && (
            <div className={styles.trendsContainer}>
              <div className={styles.trendsCard}>
                <div className={styles.trendsHeader}>
                  <div>
                    <div className={styles.trendsTitle}>PYQ Section Scores Over Time</div>
                    <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>Each point is one PYQ section attempt (CAT marking)</div>
                  </div>
                </div>
                {trendsData.length === 0 ? (
                  <div className={styles.metricEmptyState}>Attempt a PYQ section to start your score trend.</div>
                ) : (
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#FFF", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600, paddingTop: "10px" }} />
                        {SECTIONS.map((s) => (
                          <Line key={s} type="monotone" dataKey={s} name={s} stroke={SECTION_COLOR[s]} strokeWidth={2} dot={{ r: 4, fill: SECTION_COLOR[s] }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* JOURNEY & SECTION COMPARISON */}
        <section className={styles.dualGrid}>
          <div className={styles.graphCard}>
            <div className={styles.gcHeader}>
              <div>
                <div className={styles.gcTitle}>Your PYQ Score Trend</div>
                <div className={styles.gcSubtitle}>Score as % of section maximum, oldest to newest</div>
              </div>
              <div className={styles.wysTabs}>
                {(["Score", "Accuracy", "Pace"] as const).map((tab) => (
                  <div key={tab} className={`${styles.wysTab} ${journeyTab === tab ? styles.active : ""}`} onClick={() => setJourneyTab(tab)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setJourneyTab(tab); } }}>
                    {tab}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.gcBody}>
              <div className={styles.chartArea}>
                {journeyData.length === 0 ? (
                  <div className={styles.metricEmptyState}>Attempt a full PYQ section to see your score trend.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={journeyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip
                        formatter={(value) => [`${value} ${journeyUnit}`, journeyTab]}
                        labelFormatter={(_label, payload) => (payload && payload[0] ? (payload[0].payload as { title: string }).title : "")}
                        contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                      />
                      <Line type="monotone" dataKey={journeyTab} stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={styles.chartStats}>
                <div className={styles.csItem}><span className={styles.csLbl}>PYQ Sections</span><span className={styles.csVal}>{pyq.length}</span></div>
                <div className={styles.csItem}><span className={styles.csLbl}>Best</span><span className={styles.csVal}>{bestPct === null ? "–" : `${Math.round(bestPct)}%`}</span></div>
                <div className={styles.csItem}><span className={styles.csLbl}>Average</span><span className={styles.csVal}>{avgPct === null ? "–" : `${Math.round(avgPct)}%`}</span></div>
                <div className={styles.csInsight}>
                  <span>
                    {firstVsLast === null
                      ? "Two or more PYQ attempts are needed to show a trend."
                      : firstVsLast > 0
                        ? `Your latest attempt is ${firstVsLast} points (of 100) higher than your first.`
                        : firstVsLast < 0
                          ? `Your latest attempt is ${Math.abs(firstVsLast)} points (of 100) lower than your first. Sections differ in difficulty, so compare like with like.`
                          : "Your latest attempt matches your first."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.graphCard}>
            <div className={styles.gcHeader}>
              <div>
                <div className={styles.gcTitle}>Accuracy vs Pace by Section</div>
                <div className={styles.gcSubtitle}>Accuracy from timed tests; pace from PYQ sections</div>
              </div>
            </div>
            <div className={styles.gcBody} style={{ position: "relative" }}>
              <div className={styles.chartArea} style={{ zIndex: 2, minWidth: 0 }}>
                {sectionBarData.every((d) => d.accuracy === null && d.pace === null) ? (
                  <div className={styles.metricEmptyState}>Attempt timed tests to compare your sections.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sectionBarData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#3B82F6" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }} />
                      <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="pace" name="Seconds / question" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: "#10B981" }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={styles.chartStats} style={{ width: "180px" }}>
                <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "16px", border: "1px solid #E2E8F0", height: "100%" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#3B82F6", background: "#EFF6FF", display: "inline-flex", padding: "4px 10px", borderRadius: "100px", marginBottom: "12px" }}>
                    Key Numbers
                  </div>
                  <div style={{ fontSize: "13px", color: "#0F172A", fontWeight: 500, lineHeight: 1.5 }}>
                    {strongestSection && <div>Most accurate: <strong>{strongestSection}</strong> ({fmtPct(m.sections[strongestSection].accuracy)})</div>}
                    {fastest && <div>Fastest in PYQs: <strong>{fastest.name}</strong> ({fmtSecs(fastest.pace)}/q)</div>}
                    <div>CAT pace: about <strong>{bench}s</strong>/q</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOWER ANALYTICS */}
        <section className={styles.lowerGrid} id="mistake-section">
          {/* Mistakes map */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Mistakes Map</div>
            <div className={styles.lcSubtitle}>
              {totalMistakes > 0 ? `Your ${plural(totalMistakes, "most recent wrong answer")}, by section and concept` : "Wrong answers from your tests, by section and concept"}
            </div>
            {totalMistakes === 0 ? (
              <div className={styles.metricEmptyState}>No wrong answers recorded yet.</div>
            ) : (
              <>
                <div className={styles.mistakeViz}>
                  <div className={styles.mistakeDonut}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="count" nameKey="name" stroke="none">
                          {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.mdText}>
                      <div className={styles.mdVal}>{totalMistakes}</div>
                      <div className={styles.mdLbl}>Mistakes</div>
                    </div>
                  </div>
                  <div className={styles.mistakeList}>
                    <div style={{ display: "flex", fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: "4px" }}>
                      <span style={{ flex: 1, marginLeft: "16px" }}>Section</span>
                      <span style={{ width: 30, textAlign: "right", marginRight: "12px" }}>%</span>
                      <span style={{ width: 20, textAlign: "right" }}>Count</span>
                    </div>
                    {pieData.map((x) => (
                      <div key={x.name} className={styles.mlRow}>
                        <div className={styles.mlDot} style={{ background: x.color }}></div>
                        <div className={styles.mlName}>{x.name}</div>
                        <div className={styles.mlPct}>{Math.round((x.count / totalMistakes) * 100)}%</div>
                        <div className={styles.mlCount}>{x.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {mistakeByConcept.length > 0 && (
                  <div className={styles.topicsList} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Top concepts by mistakes</div>
                    {mistakeByConcept.map((c) => (
                      <div key={`${c.concept}-${c.section}`} className={styles.topicStats}>
                        <span>{c.concept}{c.section ? ` (${c.section})` : ""}</span>
                        <strong>{c.count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Link href="/intelligence/error-tracking" className={styles.lcBtn}>View All Mistakes &rarr;</Link>
          </div>

          {/* Opportunities */}
          <div className={styles.lcCard}>
            <div className={styles.lcTitle}>Where Can You Gain Marks?</div>
            <div className={styles.lcSubtitle}>Recorded losses you can recover</div>
            <div className={styles.oppList}>
              {m.accuracy.negativeMarksLost > 0 && (
                <Link href="/intelligence/error-tracking" className={styles.oppRow} style={{ textDecoration: "none" }}>
                  <div className={styles.oppIcon} style={{ background: "#FEE2E2", color: "#B91C1C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  </div>
                  <div className={styles.oppName}>Negative marks lost to wrong MCQs in PYQs</div>
                  <div className={styles.oppMarks} style={{ color: "#B91C1C" }}>&minus;{m.accuracy.negativeMarksLost}</div>
                  <div className={styles.oppArrow}>&gt;</div>
                </Link>
              )}
              {weak.slice(0, 4).map((c) => {
                const topicId = topicIdForLesson(c.lessonId);
                return (
                  <Link key={`${c.concept}-${c.section}`} href={topicId ? `/topics/${topicId}` : "/topics"} className={styles.oppRow} style={{ textDecoration: "none" }}>
                    <div className={styles.oppIcon} style={{ background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                    </div>
                    <div className={styles.oppName}>{c.concept}{c.section ? ` (${c.section})` : ""}</div>
                    <div className={styles.oppMarks} style={{ color: "#D97706" }}>{c.correct}/{c.attempted}</div>
                    <div className={styles.oppArrow}>&gt;</div>
                  </Link>
                );
              })}
              {spq !== null && spq > bench && (
                <Link href="/browse#pyq-section" className={styles.oppRow} style={{ textDecoration: "none" }}>
                  <div className={styles.oppIcon} style={{ background: "#E0F2FE", color: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  </div>
                  <div className={styles.oppName}>Pace: {spq}s per question vs CAT pace {bench}s</div>
                  <div className={styles.oppMarks} style={{ color: "#0369A1" }}>+{spq - bench}s</div>
                  <div className={styles.oppArrow}>&gt;</div>
                </Link>
              )}
              {m.accuracy.negativeMarksLost === 0 && weak.length === 0 && !(spq !== null && spq > bench) && (
                <div className={styles.metricEmptyState}>No recorded losses yet. Attempt a full PYQ section to find your opportunities.</div>
              )}
            </div>
          </div>

          {/* Action Plan */}
          <div className={styles.lcCard} id="action-plan">
            <div className={styles.lcTitle}>Your Next-Mock Action Plan</div>
            <div className={styles.lcSubtitle}>Three steps built from your weakest area</div>
            <div className={styles.apList}>
              {plan.map((p, i) => (
                <div key={p.title} className={styles.apRow}>
                  <div className={styles.apNum}>{String(i + 1).padStart(2, "0")}</div>
                  <div className={styles.apContent}>
                    <div className={styles.apName}>{p.title}</div>
                    <div className={styles.apDesc}>{p.desc}</div>
                    <Link href={p.href} className={styles.lcBtn} style={{ marginTop: 6 }}>{p.cta} &rarr;</Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href={plan[0]?.href ?? "/browse#pyq-section"} className={styles.apBtn}>
              Start Step 1 &rarr;
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <div className={styles.footerBar}>
          <div className={styles.fbLeft}>
            Analysis based on your recorded tests and graded answers. Updated {new Date(m.generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.
          </div>
          <div>More timed tests = a more reliable picture.</div>
        </div>
      </div>
    </div>
  );
}
