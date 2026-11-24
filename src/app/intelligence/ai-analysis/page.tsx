"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  CircleCheck,
  CircleMinus,
  Clock,
  BookOpen,
  Gauge,
  Target,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";
import styles from "./ai-analysis.module.css";
import AppNav from "@/components/app/AppNav";
import BackLink from "@/components/app/BackLink";
import PageHeader, { pageHeaderStyles } from "@/components/app/PageHeader";
import { Reveal, RevealGroup, RevealItem, SpotlightCard, GradientText, CountUp, type Tint } from "@/components/landing/motion";
import {
  LineChart, Line, ComposedChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { StudentMetrics, SectionKey, ConceptStat, TestRecord } from "@/lib/metrics/types";

// Every number on this page comes from GET /api/me/metrics. Wording is generated deterministically
// from those numbers; no model writes any of it.

const SECTIONS: SectionKey[] = ["VARC", "DILR", "QA"];
const SECTION_LABEL: Record<SectionKey, string> = { VARC: "VARC", DILR: "DILR", QA: "Quantitative Aptitude" };
const SECTION_COLOR: Record<SectionKey, string> = { VARC: "#3B82F6", DILR: "#14B8A6", QA: "#8B5CF6" };
const SECTION_TINT: Record<SectionKey, Tint> = { VARC: "blue", DILR: "teal", QA: "violet" };
const OTHER_COLOR = "#98A1B5";

const CHART_TOOLTIP = {
  background: "#FFFFFF",
  borderRadius: "10px",
  border: "1px solid #E4E9F2",
  fontSize: "12px",
  fontFamily: "var(--ff-sans)",
  boxShadow: "0 10px 28px -12px rgba(23, 47, 110, 0.25)",
};
const AXIS_TICK = { fontFamily: "var(--ff-mono)", fontSize: 11, fill: "#98A1B5" };

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

type Band = "strong" | "moderate" | "needs" | "weak" | "none";

function accuracyBand(acc: number | null): Band {
  if (acc === null) return "none";
  if (acc >= 80) return "strong";
  if (acc >= 60) return "moderate";
  if (acc >= 45) return "needs";
  return "weak";
}

function accuracyBadge(acc: number | null): { label: string; band: Band } {
  if (acc === null) return { label: "No data", band: "none" };
  if (acc >= 80) return { label: "Strong", band: "strong" };
  if (acc >= 60) return { label: "Moderate", band: "moderate" };
  return { label: "Needs attention", band: "weak" };
}

function conceptBarColor(acc: number): string {
  if (acc >= 80) return "#10B981";
  if (acc >= 60) return "#3B82F6";
  if (acc >= 45) return "#F59E0B";
  return "#F43F5E";
}

/** PYQ pace for a section, from its PYQ attempts (seconds per answered question). */
function pyqPace(tests: TestRecord[]): number | null {
  const timed = tests.filter((t) => t.attempted > 0 && t.durationSeconds > 0);
  const answered = timed.reduce((s, t) => s + t.attempted, 0);
  return answered > 0 ? Math.round(timed.reduce((s, t) => s + t.durationSeconds, 0) / answered) : null;
}

function PageHead({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.head}>
      <BackLink href="/intelligence" label="Back to Intelligence Hub" />
      <PageHeader
        eyebrow="Performance analysis"
        title="Your CAT performance,"
        accent="explained"
        subtitle="Built from your recorded tests: scores, accuracy, pace and every wrong answer, so you can see exactly where you are losing marks."
        actions={children}
      />
    </div>
  );
}

function CenterMessage({ title, body, primary }: { title: string; body: string; primary?: { href: string; label: string } }) {
  return (
    <Reveal className={`glass-card ${styles.centerCard}`} data-tint="blue">
      <h2 className={styles.centerTitle}>{title}</h2>
      <p className={styles.centerBody}>{body}</p>
      <div className={styles.centerActions}>
        {primary && (
          <Link href={primary.href} className={`${styles.btn} ${styles.btnPrimary}`}>
            {primary.label} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
        <Link href="/intelligence" className={`${styles.btn} ${styles.btnSecondary}`}>Back to Intelligence Hub</Link>
      </div>
    </Reveal>
  );
}

function scrollToId(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
      <div className={styles.page}>
        <AppNav />
        <main className={styles.main} aria-busy="true">
          <PageHead />
          <div className={styles.skeletonFeature} />
          <div className={styles.skeletonRow}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          <p className={styles.srOnly}>Loading your CAT performance…</p>
        </main>
      </div>
    );
  }

  if (error || !metrics || !derived) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className={styles.main}>
          <PageHead />
          <CenterMessage title="Analysis unavailable" body={error ?? "We could not load your analysis right now."} />
        </main>
      </div>
    );
  }

  const m = metrics;
  const { pyq, pyqChrono, latest, pyqBySection, weakestSection, strongestSection, mistakeBySection, mistakeByConcept, weak, strong, weakest } = derived;

  if (m.tests.recent.length === 0) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className={styles.main}>
          <PageHead />
          <CenterMessage
            title="Your performance analysis is waiting"
            body="Attempt a full PYQ section (or a module quiz) and this page will show your scores, accuracy, pace, where your mistakes cluster and a plan to fix them."
            primary={{ href: "/browse#pyq-section", label: "Attempt a PYQ section" }}
          />
        </main>
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
      cta: "Open error log",
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

  // Concept heat strip: every concept with 3+ answers, grouped by section.
  const heatConcepts = m.concepts.all ?? [];
  const heatGroups = [
    ...SECTIONS.map((s) => ({ key: s as string, label: s as string, color: SECTION_COLOR[s], items: heatConcepts.filter((c) => c.section === s) })),
    { key: "Other", label: "Other", color: OTHER_COLOR, items: heatConcepts.filter((c) => !c.section) },
  ].filter((g) => g.items.length > 0);

  const headline = weakestSection && strongestSection
    ? `Your strongest section is ${strongestSection} (${fmtPct(m.sections[strongestSection].accuracy)} accuracy) and your weakest is ${weakestSection} (${fmtPct(m.sections[weakestSection].accuracy)}).`
    : weakestSection
      ? `So far you have timed-test answers only in ${weakestSection} (${fmtPct(m.sections[weakestSection].accuracy)} accuracy). Attempt the other sections for a full comparison.`
      : "Attempt timed PYQ sections or module quizzes to compare your sections.";

  const RING_R = 92;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <PageHead>
          <a href="#mistake-section" onClick={(e) => scrollToId(e, "mistake-section")} className={pageHeaderStyles.primaryAction}>
            View my weaknesses <ArrowDown size={16} aria-hidden="true" />
          </a>
          <a href="#where-you-stand" onClick={(e) => scrollToId(e, "where-you-stand")} className={pageHeaderStyles.secondaryAction}>
            Explore full analysis
          </a>
        </PageHead>

        {/* HEADLINE FINDING (featured) */}
        <Reveal className={styles.feature} delay={0.05}>
          <div className={styles.featureText}>
            <span className={styles.featureEyebrow}><span className={styles.liveDot} aria-hidden="true" /> Headline finding</span>
            <p className={styles.featureHeadline}>{headline}</p>
            <p className={styles.featureMeta}>
              From {plural(m.tests.recent.length, "recorded test")}{pyq.length ? `, including ${plural(pyq.length, "PYQ section")}` : ""}.
            </p>
            <div className={styles.featureSections}>
              {SECTIONS.map((s) => {
                const acc = m.sections[s].accuracy;
                return (
                  <div key={s} className={styles.featureSec}>
                    <div className={styles.featureSecTop}>
                      <span className={styles.featureSecName}><i style={{ background: SECTION_COLOR[s] }} aria-hidden="true" />{s}</span>
                      <span className={styles.featureSecVal}>{acc === null ? "–" : `${Math.round(acc)}%`}</span>
                    </div>
                    <div className={styles.featureSecTrack}>
                      <div className={styles.featureSecFill} style={{ width: `${acc ?? 0}%`, background: SECTION_COLOR[s] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.featureRing}>
            <svg viewBox="0 0 220 220" aria-hidden="true">
              <defs>
                <linearGradient id="perfRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r={RING_R} className={styles.ringTrack} />
              {latest && (
                <circle
                  cx="110" cy="110" r={RING_R}
                  className={styles.ringProgress}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C - (RING_C * ringPct) / 100}
                />
              )}
            </svg>
            <div className={styles.ringInner}>
              <span className={styles.ringLabel}>Latest PYQ section</span>
              {latest ? (
                <>
                  <span className={styles.ringValue}>{latest.score}<small>/{latest.maxScore}</small></span>
                  <span className={styles.ringTitle}>{latest.title}</span>
                  <span className={styles.ringDate}>{shortDate(latest.submittedAt)}</span>
                </>
              ) : (
                <span className={styles.ringTitle}>No PYQ section attempted yet</span>
              )}
            </div>
          </div>
        </Reveal>

        {/* KEY NUMBERS */}
        <RevealGroup className={styles.kpiGrid}>
          <RevealItem>
            <SpotlightCard tint="violet" className={styles.kpi} title={m.percentile.disclaimer}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}><TrendingUp size={16} aria-hidden="true" style={{ color: "#8B5CF6" }} />{percentileLabel}</span>
                <span className={styles.kpiValue}>{shownPercentile !== null ? fmtPercentile(shownPercentile) : "–"}</span>
              </div>
              <div className={styles.kpiTrack}><div className={styles.kpiFill} style={{ width: `${shownPercentile ?? 0}%`, background: "linear-gradient(90deg, #8B5CF6, #6366F1)" }} /></div>
              <p className={styles.kpiNote}>
                {shownPercentile === null ? "Attempt a full PYQ section to see an estimate. " : overallPercentile === null ? `${m.percentile.basis} ` : ""}
                {m.percentile.disclaimer}
              </p>
            </SpotlightCard>
          </RevealItem>
          <RevealItem>
            <SpotlightCard tint="blue" className={styles.kpi}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}><Target size={16} aria-hidden="true" style={{ color: "#3B82F6" }} />Accuracy (timed tests)</span>
                <span className={styles.kpiValue}>{fmtPct(m.accuracy.overall)}</span>
              </div>
              <div className={styles.kpiTrack}><div className={styles.kpiFill} style={{ width: `${m.accuracy.overall ?? 0}%`, background: "linear-gradient(90deg, #06B6D4, #3B82F6)" }} /></div>
              <p className={styles.kpiNote}>{m.accuracy.overall === null ? "Needs at least 5 answers in timed tests" : `${m.accuracy.correct} of ${m.accuracy.attempted} correct`}</p>
            </SpotlightCard>
          </RevealItem>
          <RevealItem>
            <SpotlightCard tint="amber" className={styles.kpi}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}><Clock size={16} aria-hidden="true" style={{ color: "#F59E0B" }} />Pace per question</span>
                <span className={styles.kpiValue}>{spq === null ? "–" : <CountUp to={spq} suffix="s" />}</span>
              </div>
              <div className={styles.kpiTrack}><div className={styles.kpiFill} style={{ width: `${m.speed.index ?? 0}%`, background: "linear-gradient(90deg, #F59E0B, #10B981)" }} /></div>
              <p className={styles.kpiNote}>
                CAT pace: about {bench}s per question{m.speed.index !== null && <> · <strong>Pace index {m.speed.index}/100</strong></>}
              </p>
            </SpotlightCard>
          </RevealItem>
        </RevealGroup>

        {/* SUMMARY */}
        <RevealGroup className={styles.summaryGrid}>
          <RevealItem className={`glass-card ${styles.summaryCard}`} data-tint="teal">
            <h3 className={styles.summaryTitle}><CircleCheck size={18} aria-hidden="true" style={{ color: "#10B981" }} />What you&apos;re doing well</h3>
            <ul className={styles.summaryList} data-tone="good">
              {doingWell.length ? doingWell.slice(0, 4).map((t) => <li key={t}>{t}</li>) : <li>Keep attempting timed tests; strengths appear at 80%+ accuracy on a concept.</li>}
            </ul>
          </RevealItem>
          <RevealItem className={`glass-card ${styles.summaryCard}`} data-tint="coral">
            <h3 className={styles.summaryTitle}><TriangleAlert size={18} aria-hidden="true" style={{ color: "#F43F5E" }} />What&apos;s holding you back</h3>
            <ul className={styles.summaryList} data-tone="bad">
              {holdingBack.length ? holdingBack.slice(0, 4).map((t) => <li key={t}>{t}</li>) : <li>No weak concepts or negative marks recorded yet.</li>}
            </ul>
          </RevealItem>
          <RevealItem className={`glass-card ${styles.summaryCard}`} data-tint="blue">
            <h3 className={styles.summaryTitle}><TrendingUp size={18} aria-hidden="true" style={{ color: "#3B82F6" }} />What will improve your score</h3>
            <ol className={styles.summaryList} data-tone="plan">
              {plan.map((p) => <li key={p.title}>{p.title}</li>)}
            </ol>
          </RevealItem>
        </RevealGroup>

        {/* MAIN ANALYSIS (left) + MISTAKES & PLAN (right rail) */}
        <div className={styles.layout}>
        <div data-sticky-col className={styles.mainCol}>
        {/* WHERE YOU STAND */}
        <section id="where-you-stand" className={`${styles.section} ${styles.oStand}`}>
          <Reveal className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Where you <GradientText>stand</GradientText></h2>
              <p className={styles.sectionSub}>Section-wise performance from your timed tests and PYQ sections</p>
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Analysis view">
              {(["Overview", "Concepts", "Trends"] as const).map((tab) => (
                <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
          </Reveal>

          {activeTab === "Overview" && (
            <RevealGroup className={styles.secGrid}>
              {SECTIONS.map((s) => {
                const sec = m.sections[s];
                const badge = accuracyBadge(sec.accuracy);
                const spark = [...pyqBySection[s]].reverse().map((t) => ({ name: shortDate(t.submittedAt), v: t.score }));
                const secWeak = weak.find((c) => c.section === s);
                const secStrong = strong.find((c) => c.section === s);
                const color = SECTION_COLOR[s];
                return (
                  <RevealItem key={s}>
                    <SpotlightCard tint={SECTION_TINT[s]} className={styles.secCard}>
                      <div className={styles.secHead}>
                        <h3 className={styles.secName}><i style={{ background: color }} aria-hidden="true" />{SECTION_LABEL[s]}</h3>
                        <span className={styles.chip} data-band={badge.band}>{badge.label}</span>
                      </div>

                      <div className={styles.secAcc}>
                        <span className={styles.secAccVal}>{sec.accuracy === null ? "–" : `${Math.round(sec.accuracy)}%`}</span>
                        <span className={styles.secAccLbl}>accuracy</span>
                      </div>
                      <div className={styles.accTrack} aria-hidden="true">
                        <div className={styles.accFill} style={{ width: `${sec.accuracy ?? 0}%`, background: color }} />
                        <span className={styles.accTick} style={{ left: "60%" }} />
                        <span className={styles.accTick} style={{ left: "80%" }} />
                      </div>
                      <div className={styles.accScale}><span>0</span><span style={{ left: "60%" }}>60</span><span style={{ left: "80%" }}>80</span><span>100</span></div>

                      <dl className={styles.secStats}>
                        <div><dt>Latest PYQ</dt><dd>{sec.latestScore === null ? "–" : `${sec.latestScore} / ${sec.maxScore}`}</dd></div>
                        <div><dt>Best PYQ</dt><dd>{sec.bestScore === null ? "–" : `${sec.bestScore} / ${sec.maxScore}`}</dd></div>
                        <div><dt>Answered</dt><dd>{sec.correct} / {sec.attempted}</dd></div>
                        <div title={m.percentile.disclaimer}><dt>Est. percentile</dt><dd>{sec.estimatedPercentile === null ? "–" : fmtPercentile(sec.estimatedPercentile)}</dd></div>
                      </dl>

                      <div className={styles.sparkLabel}>PYQ scores ({sec.pyqAttempts})</div>
                      <div className={styles.spark}>
                        {spark.length >= 2 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={spark}>
                              <Tooltip contentStyle={{ ...CHART_TOOLTIP, padding: "4px 8px" }} />
                              <Line type="monotone" dataKey="v" name="Score" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className={styles.emptyNote}>{spark.length === 1 ? "One PYQ attempt so far; a trend needs two." : `No ${s} PYQ section attempted yet.`}</div>
                        )}
                      </div>
                      <p className={styles.secInsight} style={{ borderLeftColor: color }}>
                        {secWeak
                          ? `Weakest concept: ${secWeak.concept} (${secWeak.correct}/${secWeak.attempted} correct).`
                          : secStrong
                            ? `Strongest concept: ${secStrong.concept} (${secStrong.correct}/${secStrong.attempted} correct).`
                            : sec.attempted === 0
                              ? `Attempt a timed ${s} test to see your standing.`
                              : "No concept below 60% accuracy in this section."}
                      </p>
                    </SpotlightCard>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}

          {activeTab === "Concepts" && (
            <RevealGroup className={styles.secGrid}>
              {SECTIONS.map((s) => {
                const list = [...weak, ...strong].filter((c) => c.section === s).sort((a, b) => a.accuracy - b.accuracy);
                const secAcc = m.sections[s].accuracy;
                return (
                  <RevealItem key={s} className={`glass-card ${styles.conceptCard}`} data-tint={SECTION_TINT[s]}>
                    <div className={styles.secHead}>
                      <h3 className={styles.secName}><i style={{ background: SECTION_COLOR[s] }} aria-hidden="true" />{s} concepts</h3>
                      {secAcc !== null && <span className={styles.chip} data-band={accuracyBand(secAcc)}>{fmtPct(secAcc)}</span>}
                    </div>
                    <div className={styles.conceptList}>
                      {list.length === 0 ? (
                        <div className={styles.emptyNote}>No concept is below 60% or at 80%+ yet. Concepts appear after 3+ answers.</div>
                      ) : list.map((c) => {
                        const topicId = topicIdForLesson(c.lessonId);
                        return (
                          <div key={`${c.concept}-${s}`} className={styles.conceptItem}>
                            <div className={styles.conceptTop}>
                              {topicId ? <Link href={`/topics/${topicId}`} className={styles.conceptName}>{c.concept}</Link> : <span className={styles.conceptName}>{c.concept}</span>}
                              <span className={styles.chip} data-band={accuracyBand(c.accuracy)}>{c.accuracy >= 80 ? "Strong" : "Weak"}</span>
                            </div>
                            <div className={styles.conceptStats}>
                              <span>Accuracy <strong>{Math.round(c.accuracy)}%</strong></span>
                              <span>{c.correct} / {c.attempted} correct</span>
                            </div>
                            <div className={styles.conceptTrack}>
                              <div className={styles.conceptFill} style={{ width: `${c.accuracy}%`, background: conceptBarColor(c.accuracy) }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}

          {activeTab === "Trends" && (
            <Reveal className={`glass-card ${styles.chartCard}`} data-tint="blue">
              <div className={styles.chartHead}>
                <div>
                  <h3 className={styles.cardTitle}>PYQ section scores over time</h3>
                  <p className={styles.cardSub}>Each point is one PYQ section attempt (CAT marking)</p>
                </div>
              </div>
              {trendsData.length === 0 ? (
                <div className={styles.emptyState}>Attempt a PYQ section to start your score trend.</div>
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F8" />
                      <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} dy={8} />
                      <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600, paddingTop: "10px", fontFamily: "var(--ff-sans)" }} />
                      {SECTIONS.map((s) => (
                        <Line key={s} type="monotone" dataKey={s} name={s} stroke={SECTION_COLOR[s]} strokeWidth={2} dot={{ r: 4, fill: SECTION_COLOR[s] }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Reveal>
          )}
        </section>

        {/* CONCEPT HEAT STRIP */}
        <section className={`${styles.section} ${styles.oHeat}`} aria-labelledby="heat-title">
          <Reveal className={`glass-card ${styles.heatCard}`} data-tint="violet">
            <div className={styles.chartHead}>
              <div>
                <h3 id="heat-title" className={styles.cardTitle}>Concept heat strip</h3>
                <p className={styles.cardSub}>Every concept with 3+ answers, coloured by accuracy. Hover a cell for details.</p>
              </div>
              <div className={styles.heatLegend} aria-hidden="true">
                {(["weak", "needs", "moderate", "strong"] as const).map((b) => (
                  <span key={b}><i data-band={b} />{b === "weak" ? "<45%" : b === "needs" ? "45–59%" : b === "moderate" ? "60–79%" : "80%+"}</span>
                ))}
              </div>
            </div>
            {heatGroups.length === 0 ? (
              <div className={styles.emptyState}>Concepts appear here after you answer 3 or more questions on them.</div>
            ) : (
              <div className={styles.heatRows}>
                {heatGroups.map((g) => (
                  <div key={g.key} className={styles.heatRow}>
                    <span className={styles.heatSec}><i style={{ background: g.color }} aria-hidden="true" />{g.label}</span>
                    <div className={styles.heatCells}>
                      {g.items.map((c) => {
                        const topicId = topicIdForLesson(c.lessonId);
                        const label = `${c.concept}: ${Math.round(c.accuracy)}% (${c.correct}/${c.attempted} correct)`;
                        return topicId ? (
                          <Link key={`${c.concept}-${g.key}`} href={`/topics/${topicId}`} className={styles.heatCell} data-band={accuracyBand(c.accuracy)} title={label} aria-label={label}>
                            <span>{Math.round(c.accuracy)}</span>
                          </Link>
                        ) : (
                          <span key={`${c.concept}-${g.key}`} className={styles.heatCell} data-band={accuracyBand(c.accuracy)} title={label} aria-label={label}>
                            <span>{Math.round(c.accuracy)}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </section>

        {/* JOURNEY & SECTION COMPARISON */}
          <Reveal className={`glass-card ${styles.chartCard} ${styles.oJourney}`} data-tint="blue">
            <div className={styles.chartHead}>
              <div>
                <h3 className={styles.cardTitle}>Your PYQ score trend</h3>
                <p className={styles.cardSub}>Score as % of section maximum, oldest to newest</p>
              </div>
              <div className={styles.tabs} role="tablist" aria-label="Trend metric">
                {(["Score", "Accuracy", "Pace"] as const).map((tab) => (
                  <button key={tab} type="button" role="tab" aria-selected={journeyTab === tab} className={`${styles.tab} ${styles.tabSm} ${journeyTab === tab ? styles.tabActive : ""}`} onClick={() => setJourneyTab(tab)}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.chartBody}>
              <div className={styles.chartArea}>
                {journeyData.length === 0 ? (
                  <div className={styles.emptyState}>Attempt a full PYQ section to see your score trend.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={journeyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F8" />
                      <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip
                        formatter={(value) => [`${value} ${journeyUnit}`, journeyTab]}
                        labelFormatter={(_label, payload) => (payload && payload[0] ? (payload[0].payload as { title: string }).title : "")}
                        contentStyle={CHART_TOOLTIP}
                      />
                      <Line type="monotone" dataKey={journeyTab} stroke="#2556E0" strokeWidth={3} dot={{ r: 4, fill: "#2556E0" }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={styles.chartStats}>
                <div className={styles.statLine}><span>PYQ sections</span><strong>{pyq.length}</strong></div>
                <div className={styles.statLine}><span>Best</span><strong>{bestPct === null ? "–" : `${Math.round(bestPct)}%`}</strong></div>
                <div className={styles.statLine}><span>Average</span><strong>{avgPct === null ? "–" : `${Math.round(avgPct)}%`}</strong></div>
                <p className={styles.statInsight}>
                  {firstVsLast === null
                    ? "Two or more PYQ attempts are needed to show a trend."
                    : firstVsLast > 0
                      ? `Your latest attempt is ${firstVsLast} points (of 100) higher than your first.`
                      : firstVsLast < 0
                        ? `Your latest attempt is ${Math.abs(firstVsLast)} points (of 100) lower than your first. Sections differ in difficulty, so compare like with like.`
                        : "Your latest attempt matches your first."}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className={`glass-card ${styles.chartCard} ${styles.oCompare}`} data-tint="teal">
            <div className={styles.chartHead}>
              <div>
                <h3 className={styles.cardTitle}>Accuracy vs pace by section</h3>
                <p className={styles.cardSub}>Accuracy from timed tests; pace from PYQ sections</p>
              </div>
            </div>
            <div className={styles.chartBody}>
              <div className={styles.chartArea}>
                {sectionBarData.every((d) => d.accuracy === null && d.pace === null) ? (
                  <div className={styles.emptyState}>Attempt timed tests to compare your sections.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sectionBarData} margin={{ top: 20, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F8" />
                      <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ ...AXIS_TICK, fill: "#3B82F6" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" tick={{ ...AXIS_TICK, fill: "#14B8A6" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#66708A", fontFamily: "var(--ff-sans)" }} />
                      <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {sectionBarData.map((d) => <Cell key={d.name} fill={SECTION_COLOR[d.name as SectionKey]} />)}
                      </Bar>
                      <Line yAxisId="right" type="monotone" dataKey="pace" name="Seconds / question" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: "#F59E0B" }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={styles.chartStats}>
                <span className={styles.statsEyebrow}>Key numbers</span>
                {strongestSection && <div className={styles.statLine}><span>Most accurate</span><strong>{strongestSection} · {fmtPct(m.sections[strongestSection].accuracy)}</strong></div>}
                {fastest && <div className={styles.statLine}><span>Fastest in PYQs</span><strong>{fastest.name} · {fmtSecs(fastest.pace)}/q</strong></div>}
                <div className={styles.statLine}><span>CAT pace</span><strong>~{bench}s/q</strong></div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* RIGHT RAIL: mistakes, opportunities, action plan */}
        <aside data-sticky-col className={styles.railCol} aria-label="Mistakes and action plan">
          {/* Mistakes map */}
          <Reveal className={`glass-card ${styles.lowerCard} ${styles.oMistakes}`} data-tint="coral" id="mistake-section">
            <h3 className={styles.cardTitle}>Mistakes map</h3>
            <p className={styles.cardSub}>
              {totalMistakes > 0 ? `Your ${plural(totalMistakes, "most recent wrong answer")}, by section and concept` : "Wrong answers from your tests, by section and concept"}
            </p>
            {totalMistakes === 0 ? (
              <div className={styles.emptyState}>No wrong answers recorded yet.</div>
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
                    <div className={styles.donutText}>
                      <span className={styles.donutVal}>{totalMistakes}</span>
                      <span className={styles.donutLbl}>Mistakes</span>
                    </div>
                  </div>
                  <div className={styles.legend}>
                    {pieData.map((x) => (
                      <div key={x.name} className={styles.legendRow}>
                        <i style={{ background: x.color }} aria-hidden="true" />
                        <span className={styles.legendName}>{x.name}</span>
                        <span className={styles.legendPct}>{Math.round((x.count / totalMistakes) * 100)}%</span>
                        <span className={styles.legendCount}>{x.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {mistakeByConcept.length > 0 && (
                  <div className={styles.topConcepts}>
                    <span className={styles.statsEyebrow}>Top concepts by mistakes</span>
                    {mistakeByConcept.map((c) => (
                      <div key={`${c.concept}-${c.section}`} className={styles.statLine}>
                        <span>{c.concept}{c.section ? ` (${c.section})` : ""}</span>
                        <strong>{c.count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Link href="/intelligence/error-tracking" className={styles.textLink}>View all mistakes <ArrowRight size={15} aria-hidden="true" /></Link>
          </Reveal>

          {/* Opportunities */}
          <Reveal className={`glass-card ${styles.lowerCard} ${styles.oOpp}`} data-tint="amber">
            <h3 className={styles.cardTitle}>Where can you gain marks?</h3>
            <p className={styles.cardSub}>Recorded losses you can recover</p>
            <div className={styles.oppList}>
              {m.accuracy.negativeMarksLost > 0 && (
                <Link href="/intelligence/error-tracking" className={styles.oppRow}>
                  <CircleMinus size={18} aria-hidden="true" style={{ color: "#F43F5E" }} />
                  <span className={styles.oppName}>Negative marks lost to wrong MCQs in PYQs</span>
                  <span className={styles.oppVal} style={{ color: "#E11D48" }}>&minus;{m.accuracy.negativeMarksLost}</span>
                  <ChevronRight size={16} className={styles.oppArrow} aria-hidden="true" />
                </Link>
              )}
              {weak.slice(0, 4).map((c) => {
                const topicId = topicIdForLesson(c.lessonId);
                return (
                  <Link key={`${c.concept}-${c.section}`} href={topicId ? `/topics/${topicId}` : "/topics"} className={styles.oppRow}>
                    <BookOpen size={18} aria-hidden="true" style={{ color: "#F59E0B" }} />
                    <span className={styles.oppName}>{c.concept}{c.section ? ` (${c.section})` : ""}</span>
                    <span className={styles.oppVal} style={{ color: "#B45309" }}>{c.correct}/{c.attempted}</span>
                    <ChevronRight size={16} className={styles.oppArrow} aria-hidden="true" />
                  </Link>
                );
              })}
              {spq !== null && spq > bench && (
                <Link href="/browse#pyq-section" className={styles.oppRow}>
                  <Zap size={18} aria-hidden="true" style={{ color: "#06B6D4" }} />
                  <span className={styles.oppName}>Pace: {spq}s per question vs CAT pace {bench}s</span>
                  <span className={styles.oppVal} style={{ color: "#0E7490" }}>+{spq - bench}s</span>
                  <ChevronRight size={16} className={styles.oppArrow} aria-hidden="true" />
                </Link>
              )}
              {m.accuracy.negativeMarksLost === 0 && weak.length === 0 && !(spq !== null && spq > bench) && (
                <div className={styles.emptyState}>No recorded losses yet. Attempt a full PYQ section to find your opportunities.</div>
              )}
            </div>
          </Reveal>

          {/* Action Plan */}
          <Reveal className={`glass-card ${styles.lowerCard} ${styles.oPlan}`} data-tint="blue" id="action-plan">
            <h3 className={styles.cardTitle}>Your next-mock action plan</h3>
            <p className={styles.cardSub}>Three steps built from your weakest area</p>
            <ol className={styles.planList}>
              {plan.map((p, i) => (
                <li key={p.title} className={styles.planRow}>
                  <span className="step-badge" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.planContent}>
                    <span className={styles.planName}>{p.title}</span>
                    <span className={styles.planDesc}>{p.desc}</span>
                    <Link href={p.href} className={styles.textLink}>{p.cta} <ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={plan[0]?.href ?? "/browse#pyq-section"} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
              Start step 1 <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>
        </aside>
        </div>

        {/* FOOTER */}
        <footer className={styles.footNote}>
          <span><Gauge size={15} aria-hidden="true" /> Analysis based on your recorded tests and graded answers. Updated {new Date(m.generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.</span>
          <span>More timed tests = a more reliable picture.</span>
        </footer>
      </main>
    </div>
  );
}
