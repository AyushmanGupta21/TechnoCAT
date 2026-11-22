"use client";

import React from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Gauge,
  MessageSquareText,
  RotateCcw,
  ScanFace,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
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
  if (v >= 75) return "var(--data-emerald)";
  if (v >= 55) return "var(--data-amber)";
  return "var(--data-coral)";
}

function ScoreRing({
  value,
  label,
  size = 120,
  color,
}: {
  value: number;
  label: string;
  size?: number;
  color?: string;
}) {
  const stroke = size >= 120 ? 11 : 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const id = `ring-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={styles.ring} style={{ width: size }}>
      <div className={styles.ringSvgWrap} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${v} out of 100`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color ?? scoreColor(v)} stopOpacity="0.75" />
              <stop offset="100%" stopColor={color ?? scoreColor(v)} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(12,23,48,0.07)" strokeWidth={stroke} />
          <circle
            className={styles.ringArc}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (v / 100) * c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className={styles.ringValue} style={{ fontSize: size / 3.6 }}>
          {v}
        </span>
      </div>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

/** Metric tile with an optional percentage bar or pace gauge. */
function Metric({
  label,
  value,
  note,
  icon,
  color,
  pct,
  pace,
}: {
  label: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
  color: string;
  pct?: number | null;
  pace?: number | null;
}) {
  return (
    <div className={styles.metric} style={{ "--m-color": color } as React.CSSProperties}>
      <span className={styles.metricHead}>
        <span className={styles.metricIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.metricLabel}>{label}</span>
      </span>
      <span className={styles.metricValue}>{value}</span>
      {pct !== undefined && (
        <span className={styles.metricBar} aria-hidden="true">
          <span style={{ width: `${pct ?? 0}%` }} />
        </span>
      )}
      {pace !== undefined && (
        <span className={styles.paceGauge} aria-hidden="true">
          <span className={styles.paceIdeal} />
          {pace !== null && (
            <span
              className={styles.paceMark}
              style={{ left: `${Math.max(0, Math.min(100, ((pace - 60) / (220 - 60)) * 100))}%` }}
            />
          )}
        </span>
      )}
      {note && <span className={styles.metricNote}>{note}</span>}
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
  icon,
}: {
  title: string;
  items: string[];
  tone: "good" | "warn" | "info" | "next";
  icon: React.ReactNode;
}) {
  if (!items.length) return null;
  return (
    <div className={`${styles.listCard} ${styles[`tone_${tone}`]}`}>
      <h4>
        <span className={styles.listIcon} aria-hidden="true">
          {icon}
        </span>
        {title}
      </h4>
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
  const answeredPct = m.questionsAsked > 0 ? Math.round((m.questionsAnswered / m.questionsAsked) * 100) : 0;

  return (
    <div className={styles.report}>
      <div className={styles.reportHead}>
        <div>
          <span className={styles.reportKicker}>Session complete</span>
          <h3 className={styles.reportTitle}>Your viva report</h3>
          <p className={styles.reportSub}>{vivaLabel}</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={onRestart}>
          <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
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
            <div className={styles.ringGroup}>
              <ScoreRing value={a.overallScore} label="Overall" size={136} />
              <ScoreRing value={a.contentScore} label="Answers" size={96} color="var(--data-blue)" />
              {a.deliveryScore !== null && <ScoreRing value={a.deliveryScore} label="Delivery" size={96} color="var(--data-violet)" />}
            </div>
            <div className={styles.verdictBox}>
              <span className={styles.verdictLabel}>
                AI panel verdict
                <span className={styles.sourceTag}>{a.source === "ai" ? "AI-evaluated" : "Rule-based"}</span>
              </span>
              <p className={styles.verdict}>{a.verdict}</p>
            </div>
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
        <Metric
          label="Eye contact"
          value={pct(m.eyeContactPct)}
          note={m.eyeContactPct === null ? "not measured" : "looking at camera"}
          icon={<Eye size={15} strokeWidth={2} />}
          color="var(--data-blue)"
          pct={m.eyeContactPct}
        />
        <Metric
          label="Face in frame"
          value={pct(m.faceInFramePct)}
          icon={<UserSquare2 size={15} strokeWidth={2} />}
          color="var(--data-teal)"
          pct={m.faceInFramePct}
        />
        <Metric
          label="Framing & posture"
          value={pct(m.framingPct)}
          icon={<ScanFace size={15} strokeWidth={2} />}
          color="var(--data-violet)"
          pct={m.framingPct}
        />
        <Metric
          label="Avg pace"
          value={m.avgWpm === null ? "—" : `${m.avgWpm} wpm`}
          note="ideal 120–160"
          icon={<Gauge size={15} strokeWidth={2} />}
          color="var(--data-amber)"
          pace={m.avgWpm}
        />
        <Metric
          label="Filler words"
          value={String(m.fillerCount)}
          icon={<MessageSquareText size={15} strokeWidth={2} />}
          color="var(--data-coral)"
        />
        <Metric
          label="Answered"
          value={`${m.questionsAnswered}/${m.questionsAsked}`}
          icon={<CheckCircle2 size={15} strokeWidth={2} />}
          color="var(--data-emerald)"
          pct={answeredPct}
        />
        <Metric
          label="Duration"
          value={`${mins}m ${String(secs).padStart(2, "0")}s`}
          icon={<Clock size={15} strokeWidth={2} />}
          color="var(--data-cyan)"
        />
      </div>

      {a && (
        <div className={styles.listGrid}>
          <ListCard title="What went well" items={a.strengths} tone="good" icon={<CheckCircle2 size={16} strokeWidth={2} />} />
          <ListCard title="What to improve" items={a.improvements} tone="warn" icon={<TrendingUp size={16} strokeWidth={2} />} />
          <ListCard title="Topics to revise" items={a.topicsToRevise} tone="info" icon={<BookOpen size={16} strokeWidth={2} />} />
          <ListCard title="Next steps" items={a.nextSteps} tone="next" icon={<ArrowRight size={16} strokeWidth={2} />} />
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
                  <span className={styles.tNum}>{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.tBody}>
                    <p className={styles.tQ}>
                      <strong>Panelist</strong> {t.question}
                    </p>
                    <p className={styles.tA}>
                      <strong>You</strong> {t.answer || <em>(skipped / no answer)</em>}
                    </p>
                    {fb && <p className={styles.tF}>{fb}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </details>
    </div>
  );
}
