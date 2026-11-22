"use client";

import React from "react";
import styles from "./LiveViva.module.css";
import type { LiveVivaAssessment, LiveVivaMetrics, LiveVivaTurn } from "@/lib/viva/liveVivaConfig";

export interface ReportState {
  loading: boolean;
  error: string | null;
  assessment: LiveVivaAssessment | null;
  metrics: LiveVivaMetrics;
  turns: LiveVivaTurn[];
}

function scoreColor(v: number): string {
  if (v >= 75) return "#059669";
  if (v >= 55) return "#D97706";
  return "#DC2626";
}

function ScoreRing({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.ring} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${v} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreColor(v)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 4} fontWeight={800} fill="#0F172A">
          {v}
        </text>
      </svg>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
      {note && <span className={styles.metricNote}>{note}</span>}
    </div>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" | "info" }) {
  if (!items.length) return null;
  return (
    <div className={`${styles.listCard} ${styles[`tone_${tone}`]}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LiveVivaReport({
  report,
  vivaLabel,
  onRetry,
  onRestart,
}: {
  report: ReportState;
  vivaLabel: string;
  onRetry: () => void;
  onRestart: () => void;
}) {
  const { metrics: m, assessment: a, turns } = report;
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
  const mins = Math.floor(m.durationSeconds / 60);
  const secs = m.durationSeconds % 60;
  const feedbackFor = (q: string) => a?.perAnswer.find((p) => p.question === q)?.feedback;

  return (
    <div className={styles.report}>
      <div className={styles.reportHead}>
        <div>
          <h3 className={styles.reportTitle}>Your viva report</h3>
          <p className={styles.reportSub}>{vivaLabel}</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={onRestart}>
          Start another viva
        </button>
      </div>

      <div className={styles.scoreRow}>
        {report.loading ? (
          <div className={styles.loadingBox} role="status">
            <span className={styles.spinner} aria-hidden="true" /> Writing your feedback…
          </div>
        ) : a ? (
          <>
            <ScoreRing value={a.overallScore} label="Overall" size={132} />
            <ScoreRing value={a.contentScore} label="Answers" size={96} />
            {a.deliveryScore !== null && <ScoreRing value={a.deliveryScore} label="Delivery" size={96} />}
            <p className={styles.verdict}>{a.verdict}</p>
          </>
        ) : (
          <div className={styles.errorBox} role="alert">
            <span>{report.error || "Feedback isn't available."}</span>
            <button type="button" className={styles.btnGhostSm} onClick={onRetry}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className={styles.metricsGrid}>
        <Metric label="Eye contact" value={pct(m.eyeContactPct)} note={m.eyeContactPct === null ? "not measured" : "looking at camera"} />
        <Metric label="Face in frame" value={pct(m.faceInFramePct)} />
        <Metric label="Framing & posture" value={pct(m.framingPct)} />
        <Metric label="Avg pace" value={m.avgWpm === null ? "—" : `${m.avgWpm} wpm`} note="ideal 120–160" />
        <Metric label="Filler words" value={String(m.fillerCount)} />
        <Metric label="Answered" value={`${m.questionsAnswered}/${m.questionsAsked}`} />
        <Metric label="Duration" value={`${mins}m ${String(secs).padStart(2, "0")}s`} />
      </div>

      {a && (
        <div className={styles.listGrid}>
          <ListCard title="What went well" items={a.strengths} tone="good" />
          <ListCard title="What to improve" items={a.improvements} tone="warn" />
          <ListCard title="Topics to revise" items={a.topicsToRevise} tone="info" />
          <ListCard title="Next steps" items={a.nextSteps} tone="info" />
        </div>
      )}
      {a?.source === "local" && (
        <p className={styles.smallNote}>AI feedback was unavailable, so this report uses TechnoCAT&apos;s built-in rules.</p>
      )}

      <details className={styles.transcript} open={turns.length <= 6}>
        <summary>Full transcript ({turns.length} questions)</summary>
        {turns.length === 0 ? (
          <p className={styles.smallNote}>No questions were answered.</p>
        ) : (
          <ol>
            {turns.map((t, i) => {
              const fb = feedbackFor(t.question);
              return (
                <li key={i}>
                  <p className={styles.tQ}>
                    <strong>Panelist:</strong> {t.question}
                  </p>
                  <p className={styles.tA}>
                    <strong>You:</strong> {t.answer || <em>(skipped / no answer)</em>}
                  </p>
                  {fb && <p className={styles.tF}>Feedback: {fb}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </details>
    </div>
  );
}
