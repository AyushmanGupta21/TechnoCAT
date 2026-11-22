"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronRight, Clock, Lightbulb, Search, X } from "lucide-react";
import styles from "./error-tracking.module.css";
import AppNav from "@/components/app/AppNav";
import BackLink from "@/components/app/BackLink";
import { Reveal, RevealGroup, RevealItem, SpotlightCard, GradientText, CountUp, type Tint } from "@/components/landing/motion";
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
const SECTION_COLOR: Record<SectionKey, string> = { QA: "#8B5CF6", DILR: "#14B8A6", VARC: "#3B82F6" };
const SECTION_TINT: Record<SectionKey, Tint> = { QA: "violet", DILR: "teal", VARC: "blue" };
const SECTION_NAME: Record<SectionKey, string> = { QA: "QA (Quant)", DILR: "DILR", VARC: "VARC" };
const KIND_LABEL: Record<MistakeRecord["kind"], string> = {
  pyq: "CAT PYQ",
  module_quiz: "Module quiz",
  grand_quiz: "Grand quiz",
  lesson_practice: "Lesson practice",
  topic_drill: "Practice drills",
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
    // Opening Error Tracking counts toward the 7-day challenge's mistake audit / analysis task.
    fetch("/api/intelligence/record-analysis-view", { method: "POST" }).catch(() => {});
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
    ...(stats.unsectioned > 0 ? [{ name: "Other", count: stats.unsectioned, color: "#98A1B5" }] : []),
  ];
  const total = mistakes.length;
  const topConcept = stats.byConcept.find((c) => c.concept !== "Unlabelled") ?? null;
  const conceptsInvolved = stats.byConcept.filter((c) => c.concept !== "Unlabelled").length;
  const maxConceptCount = Math.max(1, ...stats.byConcept.slice(0, 5).map((c) => c.count));

  const jumpToList = (sec: SectionFilter) => {
    setActiveSection(sec);
    setActiveConcept("ALL");
    setVisible(PAGE_SIZE);
    document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const renderSectionBadge = (sec: SectionKey | null) => {
    if (!sec) return null;
    return (
      <span className={styles.sectionTag} style={{ ["--sec" as string]: SECTION_COLOR[sec] }}>
        <i aria-hidden="true" />
        {SECTION_NAME[sec]}
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <AppNav />

      <main className={styles.main}>
        {/* Page header */}
        <Reveal className={styles.head}>
          <BackLink href="/intelligence" label="Back to Intelligence Hub" />
          <div className={styles.headRow}>
            <div className={styles.headText}>
              <h1 className={styles.title}>
                Stop repeating the <GradientText>same mistakes</GradientText>
              </h1>
              <p className={styles.lede}>
                Every wrong answer from your tests and CAT PYQs, with the correct answer and explanation, grouped by section and concept.
              </p>
            </div>
            <div className={styles.headActions}>
              <a href="#mistakes-review-list" onClick={(e) => { e.preventDefault(); jumpToList("ALL"); }} className={`${styles.btn} ${styles.btnPrimary}`}>
                Review detailed log <ArrowDown size={16} aria-hidden="true" />
              </a>
              <Link href="/browse#pyq-section" className={`${styles.btn} ${styles.btnSecondary}`}>
                Practise PYQs
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Stat row */}
        <RevealGroup className={styles.statRow}>
          <RevealItem>
            <SpotlightCard tint="blue" className={styles.stat}>
              <span className={styles.statLabel}>Wrong answers recorded</span>
              <span className={styles.statValue}>{loading ? "…" : <CountUp to={total} />}</span>
              <span className={styles.statNote}>{loading ? "Loading…" : total > 0 ? "From tests, quizzes and PYQs" : "Nothing recorded yet"}</span>
            </SpotlightCard>
          </RevealItem>
          <RevealItem>
            <SpotlightCard tint="coral" className={styles.stat} title="CAT marking: -1 for each wrong MCQ; wrong TITA answers carry no negative mark.">
              <span className={styles.statLabel}>Marks lost (negative marking)</span>
              <span className={styles.statValue} style={{ color: stats.marksLost > 0 ? "#E11D48" : undefined }}>
                {loading ? "…" : stats.marksLost > 0 ? `−${stats.marksLost}` : "0"}
              </span>
              <span className={styles.statNote}>Each wrong MCQ costs 1 mark under CAT marking</span>
            </SpotlightCard>
          </RevealItem>
          <RevealItem>
            <SpotlightCard tint="amber" className={styles.stat}>
              <span className={styles.statLabel}>Concepts involved</span>
              <span className={styles.statValue}>{loading ? "…" : <CountUp to={conceptsInvolved} />}</span>
              <span className={styles.statNote}>Distinct concepts behind your errors</span>
            </SpotlightCard>
          </RevealItem>
          <RevealItem>
            <SpotlightCard tint="violet" className={styles.stat}>
              <span className={styles.statLabel}>Most repeated</span>
              {topConcept ? (
                <>
                  <span className={styles.statText}>{topConcept.concept}</span>
                  <span className={styles.statNote}>{plural(topConcept.count, "wrong answer")}. Start your review there.</span>
                </>
              ) : (
                <>
                  <span className={styles.statText}>{loading ? "…" : "–"}</span>
                  <span className={styles.statNote}>Attempt a PYQ section or module quiz; your wrong answers will appear here for review.</span>
                </>
              )}
            </SpotlightCard>
          </RevealItem>
        </RevealGroup>

        {loading ? (
          <div className={styles.emptyCard} aria-busy="true">Loading your mistakes…</div>
        ) : error ? (
          <Reveal className={`glass-card ${styles.emptyCard}`} data-tint="coral">{error}</Reveal>
        ) : total === 0 ? (
          <Reveal className={`glass-card ${styles.emptyCard}`} data-tint="blue">
            <h2 className={styles.emptyTitle}>No wrong answers recorded yet</h2>
            <p className={styles.emptyBody}>
              Attempt a CAT PYQ section or a module quiz. Every question you get wrong will be listed here with the correct answer, the explanation and a link to the lesson that covers it.
            </p>
            <Link href="/browse#pyq-section" className={`${styles.btn} ${styles.btnPrimary}`}>
              Attempt a CAT PYQ section <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>
        ) : (
          <>
            <RevealGroup className={styles.analyticsGrid}>
              {/* Where the mistakes are */}
              <RevealItem className={`glass-card ${styles.card}`} data-tint="blue">
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Where your mistakes are</h2>
                  <span className={styles.cardMeta}>By section</span>
                </div>
                <div className={styles.whereBody}>
                  <div className={styles.donutWrap}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={56} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="name">
                          {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} mistakes`, ""]} contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid #E4E9F2", fontFamily: "var(--ff-sans)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.donutCenter}>
                      <span className={styles.donutVal}>{total}</span>
                      <span className={styles.donutLbl}>Mistakes</span>
                    </div>
                  </div>
                  <div className={styles.secRows}>
                    {stats.bySection.map((b) => (
                      <button
                        key={b.section}
                        type="button"
                        className={`${styles.secRow} ${activeSection === b.section ? styles.secRowActive : ""}`}
                        onClick={() => jumpToList(b.section)}
                        title={`Show ${b.section} mistakes`}
                        style={{ ["--sec" as string]: SECTION_COLOR[b.section] }}
                      >
                        <span className={styles.secRowTop}>
                          <span className={styles.secRowName}><i aria-hidden="true" />{b.section}</span>
                          <span className={styles.secRowCount}>{b.count}<small> · {total ? Math.round((b.count / total) * 100) : 0}%</small></span>
                        </span>
                        <span className={styles.secRowTrack}><span style={{ width: `${(b.count / stats.maxSectionCount) * 100}%` }} /></span>
                        <span className={styles.secRowDesc}>
                          {b.count === 0 ? "No mistakes" : `${b.topConcept ? `Most in ${b.topConcept}` : plural(b.count, "mistake")}`}
                          <span className={b.marksLost > 0 ? styles.lossRed : styles.lossNone}>{b.marksLost > 0 ? `−${b.marksLost} marks` : "0 marks"}</span>
                        </span>
                      </button>
                    ))}
                    {stats.unsectioned > 0 && (
                      <span className={styles.otherNote}>Plus {plural(stats.unsectioned, "mistake")} without a section.</span>
                    )}
                  </div>
                </div>
              </RevealItem>

              {/* Concepts */}
              <RevealItem className={`glass-card ${styles.card}`} data-tint="amber">
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Concepts with the most mistakes</h2>
                  <span className={styles.cardMeta}>By concept</span>
                </div>
                <ol className={styles.conceptList}>
                  {stats.byConcept.slice(0, 5).map((c, i) => {
                    const topicId = topicIdForLesson(c.lessonId);
                    return (
                      <li key={c.concept} className={styles.conceptRow}>
                        <span className={styles.conceptRank}>{String(i + 1).padStart(2, "0")}</span>
                        <div className={styles.conceptMain}>
                          <div className={styles.conceptTop}>
                            <span className={styles.conceptName}>
                              {c.concept}
                              {c.section && <span className={styles.conceptSec} style={{ color: SECTION_COLOR[c.section] }}>{c.section}</span>}
                            </span>
                            <span className={styles.conceptCount}>{c.count}</span>
                          </div>
                          <span className={styles.conceptTrack}><span style={{ width: `${(c.count / maxConceptCount) * 100}%` }} /></span>
                          <div className={styles.conceptFoot}>
                            <span>{plural(c.count, "wrong answer")}{c.marksLost > 0 ? `, ${plural(c.marksLost, "mark")} lost` : ", no negative marks"}</span>
                            <span className={styles.conceptLinks}>
                              <button
                                type="button"
                                className={styles.inlineLink}
                                onClick={() => { setActiveSection("ALL"); setActiveConcept(c.concept); setVisible(PAGE_SIZE); document.getElementById("mistakes-review-list")?.scrollIntoView({ behavior: "smooth" }); }}
                              >
                                Show them
                              </button>
                              {topicId && <Link href={`/topics/${topicId}`} className={styles.inlineLink}>Open lesson</Link>}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </RevealItem>
            </RevealGroup>

            {/* Filter bar */}
            <Reveal id="mistakes-review-list" className={`glass-card ${styles.filterBar}`} data-tint="blue">
              <div className={styles.filterTop}>
                <div className={styles.segment} role="group" aria-label="Filter by section">
                  {(["ALL", "QA", "DILR", "VARC"] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      aria-pressed={activeSection === sec}
                      className={`${styles.segBtn} ${activeSection === sec ? styles.segBtnActive : ""}`}
                      onClick={() => { setActiveSection(sec); setActiveConcept("ALL"); setVisible(PAGE_SIZE); }}
                    >
                      {sec !== "ALL" && <i style={{ background: SECTION_COLOR[sec] }} aria-hidden="true" />}
                      {sec === "ALL" ? "All sections" : sec}
                    </button>
                  ))}
                </div>
                <label className={styles.searchBox}>
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search concept or question…"
                    aria-label="Search concept or question"
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setVisible(PAGE_SIZE); }}
                  />
                  {searchQuery && (
                    <button type="button" className={styles.searchClear} aria-label="Clear search" onClick={() => { setSearchQuery(""); setVisible(PAGE_SIZE); }}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </label>
              </div>
              <div className={styles.chips} role="group" aria-label="Filter by concept">
                {["ALL", ...conceptsForFilter].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={activeConcept === c}
                    className={`${styles.chipBtn} ${activeConcept === c ? styles.chipBtnActive : ""}`}
                    onClick={() => { setActiveConcept(c); setVisible(PAGE_SIZE); }}
                  >
                    {c === "ALL" ? "All concepts" : c}
                  </button>
                ))}
              </div>
            </Reveal>

            <p className={styles.resultCount}>
              Showing <strong>{Math.min(visible, filtered.length)}</strong> of <strong>{filtered.length}</strong> {filtered.length === 1 ? "mistake" : "mistakes"}
            </p>

            <div className={styles.list}>
              {filtered.length === 0 ? (
                <div className={`glass-card ${styles.emptyCard}`} data-tint="blue">
                  <h3 className={styles.emptyTitle}>No mistakes found for this filter</h3>
                  <p className={styles.emptyBody}>Try another section or concept, or clear your search.</p>
                </div>
              ) : (
                filtered.slice(0, visible).map((x) => {
                  const d = details[x.questionId];
                  const topicId = topicIdForLesson(x.lessonId ?? d?.recommendedLessonId ?? null);
                  return (
                    <Reveal
                      key={`${x.attemptId}-${x.questionId}`}
                      y={16}
                      className={`glass-card ${styles.qCard}`}
                      data-tint={x.section ? SECTION_TINT[x.section] : "blue"}
                      style={x.section ? { ["--sec" as string]: SECTION_COLOR[x.section] } : undefined}
                    >
                      <article>
                        <header className={styles.qHeader}>
                          <div className={styles.qTags}>
                            {renderSectionBadge(x.section)}
                            <span className={styles.sourceTag}>{sourceLabel(x)}</span>
                            {x.concept && <span className={styles.conceptTag}>{x.concept}</span>}
                          </div>
                          <div className={styles.qChips}>
                            <span className={styles.typeChip}>{x.questionType}</span>
                            <span className={`${styles.typeChip} ${x.marksLost > 0 ? styles.chipLoss : styles.chipNoLoss}`}>
                              {x.marksLost > 0 ? `−${x.marksLost} mark` : "No negative"}
                            </span>
                            {x.timeSpentSeconds !== null && (
                              <span className={`${styles.typeChip} ${styles.chipTime}`}>
                                <Clock size={12} aria-hidden="true" />
                                {Math.floor(x.timeSpentSeconds / 60)}m {x.timeSpentSeconds % 60}s
                              </span>
                            )}
                          </div>
                        </header>

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
                              <div className={styles.options}>
                                {d.options.map((opt, i) => {
                                  const isCorrect = d.correctOption === i;
                                  const isChosen = x.selectedOption === i;
                                  const state = isCorrect ? "correct" : isChosen ? "wrong" : undefined;
                                  return (
                                    <div key={i} className={styles.option} data-state={state}>
                                      <span className={styles.optLetter}>{OPTION_LABELS[i] ?? i + 1}</span>
                                      <span className={styles.optText}><MathText text={opt} /></span>
                                      {isChosen && !isCorrect && (
                                        <span className={`${styles.optMark} ${styles.optMarkWrong}`}><X size={12} aria-hidden="true" />Your answer</span>
                                      )}
                                      {isCorrect && (
                                        <span className={`${styles.optMark} ${styles.optMarkRight}`}><Check size={12} aria-hidden="true" />Correct answer</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : d.correctTita !== null ? (
                              <div className={styles.titaCompare}>
                                {x.titaAnswer && (
                                  <div className={styles.titaBox} data-state="wrong">
                                    <span className={styles.titaLbl}><X size={13} aria-hidden="true" />Your answer</span>
                                    <span className={styles.titaVal}>{x.titaAnswer}</span>
                                  </div>
                                )}
                                <div className={styles.titaBox} data-state="correct">
                                  <span className={styles.titaLbl}><Check size={13} aria-hidden="true" />Correct answer</span>
                                  <span className={styles.titaVal}>{d.correctTita}</span>
                                </div>
                              </div>
                            ) : null}

                            {d.explanation && (
                              <div className={styles.explain}>
                                <div className={styles.explainTitle}><Lightbulb size={15} aria-hidden="true" />Explanation</div>
                                <div className={styles.explainText}><PYQMarkdownViewer content={d.explanation} /></div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`${styles.qBody} ${styles.qMissing}`}>
                            {detailsLoading || !(x.questionId in details)
                              ? "Loading question…"
                              : "The full text of this question is not available (for example, an auto-generated practice question)."}
                          </div>
                        )}

                        <footer className={styles.qFooter}>
                          <span className={styles.qDate}>Answered on {shortDate(x.submittedAt)}</span>
                          {topicId && (
                            <Link href={`/topics/${topicId}`} className={styles.textLink}>
                              Review concept lesson <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                          )}
                        </footer>
                      </article>
                    </Reveal>
                  );
                })
              )}
              {filtered.length > visible && (
                <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.moreBtn}`} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
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
