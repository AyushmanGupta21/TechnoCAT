"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./error-tracking.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import BrandLogo from "@/components/BrandLogo";
import PYQMarkdownViewer, { MathText } from "@/components/pyq/PYQMarkdownViewer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StudentMetrics, SectionKey, MistakeRecord } from "@/lib/metrics/types";

// Real wrong answers only: metrics.mistakes from GET /api/me/metrics, with question text, correct
// answer and explanation from GET /api/quiz/questions (which only returns already-answered questions).

interface QuestionDetail {
  id: string;
  type: "MCQ" | "TITA";
  text: string;
  context: string | null;
  options: string[];
  correctOption: number | null;
  correctTita: string | null;
  explanation: string | null;
  concept: string | null;
  recommendedLessonId: string | null;
}

type SectionFilter = "ALL" | SectionKey;

const SECTIONS: SectionKey[] = ["QA", "DILR", "VARC"];
const SECTION_COLOR: Record<SectionKey, string> = { QA: "#2563EB", DILR: "#9333EA", VARC: "#EF4444" };
const KIND_LABEL: Record<MistakeRecord["kind"], string> = {
  pyq: "CAT PYQ",
  module_quiz: "Module quiz",
  grand_quiz: "Grand quiz",
  lesson_practice: "Lesson practice",
};
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];
const ID_BATCH = 100;
const PAGE_SIZE = 20;

function topicIdForLesson(lessonId: string | null): string | null {
  const id = (lessonId || "").toLowerCase();
  if (id.startsWith("qa-")) return "qa-quantitative-ability";
  if (id.startsWith("dilr-")) return "dilr-data-interpretation";
  if (id.startsWith("varc-")) return "varc-verbal-ability";
  return null;
}

/** "CAT-2024-Slot2-DILR-Q14" → "CAT 2024 Slot2 · Q14"; other ids are not shown. */
function sourceLabel(m: MistakeRecord): string {
  const pyq = /^CAT-(\d{4})-([^-]+)-[A-Z]+-Q(\d+)$/.exec(m.questionId);
  if (pyq) return `CAT ${pyq[1]} ${pyq[2]} · Q${pyq[3]}`;
  return KIND_LABEL[m.kind];
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function ErrorTrackingPage() {
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, QuestionDetail | null>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionFilter>("ALL");
  const [activeConcept, setActiveConcept] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/metrics");
        if (!res.ok) {
          setError(res.status === 401 ? "Please log in to see your mistakes." : "We could not load your mistakes right now. Please refresh to try again.");
          return;
        }
        const data = (await res.json()) as StudentMetrics;
        setMetrics(data);
        setLoading(false);

        const ids = [...new Set(data.mistakes.map((x) => x.questionId))];
        if (ids.length === 0) return;
        setDetailsLoading(true);
        const found: Record<string, QuestionDetail | null> = {};
        for (let i = 0; i < ids.length; i += ID_BATCH) {
          const batch = ids.slice(i, i + ID_BATCH);
          try {
            const qr = await fetch(`/api/quiz/questions?ids=${batch.map(encodeURIComponent).join(",")}`);
            if (qr.ok) {
              const json = (await qr.json()) as { questions?: Record<string, QuestionDetail | null> };
              for (const id of batch) found[id] = json.questions?.[id] ?? null;
            } else {
              for (const id of batch) found[id] = null;
            }
          } catch {
            for (const id of batch) found[id] = null;
          }
        }
        setDetails(found);
        setDetailsLoading(false);
      } catch {
        setError("We could not load your mistakes right now. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mistakes = useMemo(() => metrics?.mistakes ?? [], [metrics]);

  const stats = useMemo(() => {
    const marksLost = mistakes.reduce((s, x) => s + x.marksLost, 0);
    const bySection = SECTIONS.map((s) => {
      const list = mistakes.filter((x) => x.section === s);
      const conceptCount = new Map<string, number>();
      for (const x of list) if (x.concept) conceptCount.set(x.concept, (conceptCount.get(x.concept) ?? 0) + 1);
      const top = [...conceptCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
      return { section: s, count: list.length, marksLost: list.reduce((a, x) => a + x.marksLost, 0), topConcept: top ? top[0] : null };
    });
    const unsectioned = mistakes.filter((x) => !x.section).length;
    const conceptMap = new Map<string, { concept: string; section: SectionKey | null; lessonId: string | null; count: number; marksLost: number }>();
    for (const x of mistakes) {
      const key = x.concept ?? "Unlabelled";
      const e = conceptMap.get(key) ?? { concept: key, section: x.section, lessonId: x.lessonId, count: 0, marksLost: 0 };
      e.count++;
      e.marksLost += x.marksLost;
      conceptMap.set(key, e);
    }
    const byConcept = [...conceptMap.values()].sort((a, b) => b.count - a.count || b.marksLost - a.marksLost);
    return { marksLost, bySection, unsectioned, byConcept, maxSectionCount: Math.max(1, ...bySection.map((b) => b.count)) };
  }, [mistakes]);

  const conceptsForFilter = useMemo(
    () => stats.byConcept.filter((c) => activeSection === "ALL" || c.section === activeSection).slice(0, 8).map((c) => c.concept),
    [stats.byConcept, activeSection]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mistakes.filter((x) => {
      if (activeSection !== "ALL" && x.section !== activeSection) return false;
      if (activeConcept !== "ALL" && (x.concept ?? "Unlabelled") !== activeConcept) return false;
      if (q) {
        const d = details[x.questionId];
        const hay = `${x.concept ?? ""} ${sourceLabel(x)} ${d?.text ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mistakes, activeSection, activeConcept, searchQuery, details]);

  const pieData = [
    ...stats.bySection.filter((b) => b.count > 0).map((b) => ({ name: b.section, count: b.count, color: SECTION_COLOR[b.section] })),
    ...(stats.unsectioned > 0 ? [{ name: "Other", count: stats.unsectioned, color: "#94A3B8" }] : []),
  ];
  const total = mistakes.length;
  const topConcept = stats.byConcept.find((c) => c.concept !== "Unlabelled") ?? null;

  const jumpToList = (sec: SectionFilter) => {
    setActiveSection(sec);
    setActiveConcept("ALL");
    setVisible(PAGE_SIZE);
    document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const renderSectionBadge = (sec: SectionKey | null) => {
    if (sec === "QA") return <span className={`${styles.sectionBadge} ${styles.badgeQA}`}>QA (Quant)</span>;
    if (sec === "DILR") return <span className={`${styles.sectionBadge} ${styles.badgeDILR}`}>DILR</span>;
    if (sec === "VARC") return <span className={`${styles.sectionBadge} ${styles.badgeVARC}`}>VARC</span>;
    return null;
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Error Tracking Navigation">
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
        <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>Error Tracking</span>
      </div>

      {/* Hero */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>ERROR LOG</div>
            <h1 className={styles.heroTitle}>
              Stop Repeating the <span>Same Mistakes.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Every wrong answer from your tests and CAT PYQs, with the correct answer and explanation, grouped by section and concept.
            </p>
            <div className={styles.statRow}>
              <div className={styles.statPill}>
                <div className={styles.statPillVal}>{loading ? "..." : total}</div>
                <div className={styles.statPillLabel}>Wrong Answers Recorded</div>
              </div>
              <div className={styles.statPill} title="CAT marking: -1 for each wrong MCQ; wrong TITA answers carry no negative mark.">
                <div className={styles.statPillVal} style={{ color: "#DC2626" }}>
                  {loading ? "..." : stats.marksLost > 0 ? `−${stats.marksLost}` : "0"}
                </div>
                <div className={styles.statPillLabel}>Marks Lost (negative marking)</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillVal} style={{ color: "#D97706" }}>
                  {loading ? "..." : stats.byConcept.filter((c) => c.concept !== "Unlabelled").length}
                </div>
                <div className={styles.statPillLabel}>Concepts Involved</div>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.radarCard}>
              <div className={styles.radarCardTop}>
                <div className={styles.radarStatusWrapper}>
                  <span className={styles.radarTitle}>Mistakes by Section</span>
                </div>
                <span className={styles.radarMetaBadge}>
                  {loading ? "Loading..." : total > 0 ? `${plural(total, "wrong answer")}` : "Nothing recorded yet"}
                </span>
              </div>

              <div className={styles.recoveryBanner}>
                <div className={styles.recoveryBannerLeft}>
                  <span className={styles.recoveryScoreBig}>{loading ? "..." : stats.marksLost > 0 ? `−${stats.marksLost}` : "0"}</span>
                  <div className={styles.recoveryLabelGroup}>
                    <span className={styles.recoveryScoreHeading}>Marks lost in these answers</span>
                    <span className={styles.recoveryScoreSub}>Each wrong MCQ costs 1 mark under CAT marking</span>
                  </div>
                </div>
              </div>

              <div className={styles.radarSectionsGrid}>
                {stats.bySection.map((b) => (
                  <div
                    key={b.section}
                    className={`${styles.radarSectionBox} ${styles.radarSectionClickable} ${activeSection === b.section ? styles.radarSectionActive : ""}`}
                    onClick={() => jumpToList(b.section)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpToList(b.section); } }}
                    role="button"
                    tabIndex={0}
                    title={`Show ${b.section} mistakes`}
                  >
                    <div className={styles.radarSecHead}>
                      <span className={`${styles.radarSecName} ${b.section === "QA" ? styles.radarSecNameQA : b.section === "DILR" ? styles.radarSecNameDILR : styles.radarSecNameVARC}`}>{b.section}</span>
                      <span className={`${styles.radarSecLoss} ${b.marksLost > 0 ? styles.lossRed : styles.lossGreen}`}>
                        {loading ? "..." : b.marksLost > 0 ? `-${b.marksLost} marks` : "0 marks"}
                      </span>
                    </div>
                    <div className={styles.radarProgressBar}>
                      <div className={styles.radarProgressFill} style={{ width: `${(b.count / stats.maxSectionCount) * 100}%`, background: SECTION_COLOR[b.section] }} />
                    </div>
                    <span className={styles.radarSecDesc}>
                      {b.count === 0 ? "No mistakes" : `${plural(b.count, "mistake")}${b.topConcept ? ` · most in ${b.topConcept}` : ""}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.radarInsightCallout}>
                <div className={styles.radarInsightText}>
                  {topConcept ? (
                    <>
                      <strong>Most repeated:</strong> {topConcept.concept} with {plural(topConcept.count, "wrong answer")}. Start your review there.
                    </>
                  ) : (
                    <>Attempt a PYQ section or module quiz; your wrong answers will appear here for review.</>
                  )}
                </div>
              </div>

              <div className={styles.radarFooterActions}>
                <a href="#mistakes-review-list" onClick={(e) => { e.preventDefault(); jumpToList("ALL"); }} className={styles.radarActionBtnPrimary}>
                  <span>Review Detailed Log</span>
                  <span aria-hidden="true">&darr;</span>
                </a>
                <Link href="/browse#pyq-section" className={styles.radarActionBtnSecondary}>
                  Practise PYQs &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.container}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748B" }}>Loading your mistakes...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#FFF", borderRadius: "18px", border: "1px dashed #CBD5E1", margin: "24px 0", color: "#0F172A" }}>
            {error}
          </div>
        ) : total === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#FFF", borderRadius: "18px", border: "1px dashed #CBD5E1", margin: "24px 0" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "0 0 10px 0" }}>No Wrong Answers Recorded Yet</h2>
            <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "540px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
              Attempt a CAT PYQ section or a module quiz. Every question you get wrong will be listed here with the correct answer, the explanation and a link to the lesson that covers it.
            </p>
            <Link href="/browse#pyq-section" style={{ display: "inline-flex", textDecoration: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, color: "#fff", background: "#2563EB" }}>
              Attempt a CAT PYQ Section &rarr;
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Where Your Mistakes Are</h2>
                  <span className={styles.cardBadge}>By Section</span>
                </div>
                <div className={styles.chartContainer}>
                  <div className={styles.donutWrapper}>
                    <div style={{ width: "230px", height: "230px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={68} outerRadius={98} paddingAngle={3} dataKey="count" nameKey="name">
                            {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} mistakes`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E2E8F0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={styles.donutCenterLabel}>
                      <span className={styles.donutCenterVal}>{total}</span>
                      <span className={styles.donutCenterText}>Mistakes</span>
                    </div>
                  </div>
                  <div className={styles.legendList}>
                    {pieData.map((item) => (
                      <div key={item.name} className={styles.legendItem}>
                        <div className={styles.legendItemLeft}>
                          <span className={styles.legendColor} style={{ background: item.color }} />
                          <span className={styles.legendName}>{item.name}</span>
                        </div>
                        <div className={styles.legendItemRight}>
                          <span className={styles.legendCountBadge}>{plural(item.count, "error")}</span>
                          <span className={styles.legendPercentVal}>{Math.round((item.count / total) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Concepts With the Most Mistakes</h2>
                  <span className={styles.cardBadge}>By Concept</span>
                </div>
                <div className={styles.recoveryTipsList}>
                  {stats.byConcept.slice(0, 5).map((c) => {
                    const topicId = topicIdForLesson(c.lessonId);
                    return (
                      <div key={c.concept} className={styles.tipItem}>
                        <span className={styles.tipHighlight}>
                          {c.concept}{c.section ? ` · ${c.section}` : ""}
                        </span>
                        {plural(c.count, "wrong answer")}{c.marksLost > 0 ? `, ${plural(c.marksLost, "mark")} lost` : ", no negative marks"}.{" "}
                        <button
                          type="button"
                          onClick={() => { setActiveSection("ALL"); setActiveConcept(c.concept); setVisible(PAGE_SIZE); document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" }); }}
                          style={{ background: "none", border: "none", padding: 0, color: "#2563EB", fontWeight: 600, cursor: "pointer", fontSize: "inherit" }}
                        >
                          Show them
                        </button>
                        {topicId && (
                          <>
                            {" · "}
                            <Link href={`/topics/${topicId}`} style={{ color: "#2563EB", fontWeight: 600 }}>Open lesson</Link>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div id="mistakes-review-list" className={styles.filterBar}>
              <div className={styles.subjectTabs}>
                {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
                  <button key={sec} className={`${styles.tabBtn} ${activeSection === sec ? styles.tabBtnActive : ""}`}
                    onClick={() => { setActiveSection(sec); setActiveConcept("ALL"); setVisible(PAGE_SIZE); }}>
                    {sec === "ALL" ? "All Sections" : sec}
                  </button>
                ))}
              </div>

              <div className={styles.errorTypePills}>
                {["ALL", ...conceptsForFilter].map((c) => (
                  <button key={c} className={`${styles.pillBtn} ${activeConcept === c ? styles.pillBtnActive : ""}`}
                    onClick={() => { setActiveConcept(c); setVisible(PAGE_SIZE); }}>
                    {c === "ALL" ? "All Concepts" : c}
                  </button>
                ))}
              </div>

              <div className={styles.searchBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search concept or question..." className={styles.searchInput} value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisible(PAGE_SIZE); }} />
              </div>
            </div>

            <div className={styles.questionsList}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>No mistakes found for this filter</h3>
                  <p style={{ color: "#64748B", fontSize: "14px" }}>Try another section or concept, or clear your search.</p>
                </div>
              ) : (
                filtered.slice(0, visible).map((x) => {
                  const d = details[x.questionId];
                  const topicId = topicIdForLesson(x.lessonId ?? d?.recommendedLessonId ?? null);
                  return (
                    <div key={`${x.attemptId}-${x.questionId}`} className={styles.questionCard}>
                      <div className={styles.qHeader}>
                        <div className={styles.qTags}>
                          {renderSectionBadge(x.section)}
                          <span className={styles.sourceBadge}>{sourceLabel(x)}{x.concept ? ` • ${x.concept}` : ""}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className={`${styles.errorBadge} ${x.marksLost > 0 ? styles.errorCalc : styles.errorConcept}`}>
                            {x.questionType}{x.marksLost > 0 ? ` · −${x.marksLost}` : " · no negative"}
                          </span>
                          {x.timeSpentSeconds !== null && (
                            <span className={styles.timeSpentBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                              </svg>
                              {Math.floor(x.timeSpentSeconds / 60)}m {x.timeSpentSeconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>

                      {d ? (
                        <>
                          {d.context && (
                            <details className={styles.contextBox}>
                              <summary>Show passage / data set</summary>
                              <div className={styles.contextText}><PYQMarkdownViewer content={d.context} /></div>
                            </details>
                          )}
                          <div className={styles.qBody}><PYQMarkdownViewer content={d.text} /></div>

                          {d.type === "MCQ" && d.options.length > 0 ? (
                            <div className={styles.optionsGrid}>
                              {d.options.map((opt, i) => {
                                const isCorrect = d.correctOption === i;
                                const isChosen = x.selectedOption === i;
                                return (
                                  <div
                                    key={i}
                                    className={isCorrect ? `${styles.optionItem} ${styles.optionCorrect}` : styles.optionItem}
                                    style={isChosen && !isCorrect ? { borderColor: "#FCA5A5", background: "#FEF2F2" } : undefined}
                                  >
                                    <span><strong>{OPTION_LABELS[i] ?? i + 1}.</strong> <MathText text={opt} /></span>
                                    {isChosen && !isCorrect && <span className={styles.optionMarkerWrong}>Your answer</span>}
                                    {isCorrect && (
                                      <span className={styles.optionMarkerCorrect} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        Correct Answer
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : d.correctTita !== null ? (
                            <div className={styles.optionsGrid}>
                              {x.titaAnswer && (
                                <div className={styles.optionItem} style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}>
                                  <span><strong>Your answer:</strong> {x.titaAnswer}</span>
                                </div>
                              )}
                              <div className={`${styles.optionItem} ${styles.optionCorrect}`}>
                                <span><strong>Correct answer:</strong> {d.correctTita}</span>
                              </div>
                            </div>
                          ) : null}

                          {d.explanation && (
                            <div className={styles.aiDiagnosticBox}>
                              <div className={styles.aiDiagTitle}>Explanation</div>
                              <div className={styles.aiDiagText}><PYQMarkdownViewer content={d.explanation} /></div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.qBody} style={{ color: "#64748B", fontWeight: 500 }}>
                          {detailsLoading || !(x.questionId in details)
                            ? "Loading question..."
                            : "The full text of this question is not available (for example, an auto-generated practice question)."}
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>Answered on {shortDate(x.submittedAt)}</span>
                        {topicId && (
                          <Link href={`/topics/${topicId}`} className={`${styles.btnAction} ${styles.btnPrimaryAction}`}>
                            Review Concept Lesson &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {filtered.length > visible && (
                <button type="button" className={styles.tabBtn} style={{ alignSelf: "center" }} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Show more ({filtered.length - visible} left)
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
