"use client";

import React from "react";
import type { StudentMetrics } from "@/lib/metrics/types";
import styles from "./AiMotivationWidget.module.css";

// "Today's Focus" line. Deterministic and derived only from metrics (today's tasks, overdue
// tasks, streak, study time today) — no random messages and no simulated AI typing.

interface TodayFocusWidgetProps {
  firstName: string;
  metrics: StudentMetrics | null;
  isLoading?: boolean;
}

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Builds the focus line from today's tasks, overdue tasks, streak and study time. */
export function buildFocusLine(firstName: string, m: StudentMetrics): string {
  const { todayTotal, todayDone, overdue } = m.tasks;
  const remaining = Math.max(0, todayTotal - todayDone);
  const parts: string[] = [];

  if (todayTotal > 0 && remaining > 0) {
    parts.push(
      `${firstName}, ${remaining} of today's ${plural(todayTotal, "study task")} ${remaining === 1 ? "is" : "are"} still open` +
        (overdue > 0 ? ` and ${overdue} ${overdue === 1 ? "is" : "are"} overdue — finish today's first, then catch up.` : ".")
    );
  } else if (todayTotal > 0) {
    parts.push(
      `All ${plural(todayTotal, "task")} for today are done, ${firstName}` +
        (overdue > 0 ? ` — ${overdue} overdue ${overdue === 1 ? "task is" : "tasks are"} still waiting.` : ".")
    );
  } else {
    parts.push(
      `${firstName}, no study tasks are planned for today` +
        (overdue > 0 ? ` and ${overdue} ${overdue === 1 ? "is" : "are"} overdue` : "") +
        " — add one in the schedule below."
    );
  }

  const { current, best, activeToday } = m.streak;
  if (activeToday) {
    parts.push(
      `${formatMinutes(m.studyTime.todaySeconds)} studied today — your ${plural(current, "day")} streak is safe.`
    );
  } else if (current > 0) {
    parts.push(`Study at least 2 minutes today to extend your ${plural(current, "day")} streak.`);
  } else if (best > 0) {
    parts.push(`Study today to start a new streak (your best is ${plural(best, "day")}).`);
  } else {
    parts.push("Study for a few minutes today to start your first streak.");
  }

  return parts.join(" ");
}

export default function AiMotivationWidget({ firstName, metrics, isLoading = false }: TodayFocusWidgetProps) {
  const message = metrics
    ? buildFocusLine(firstName, metrics)
    : isLoading
      ? "Loading today's plan…"
      : "Today's plan could not be loaded right now. Refresh the page to try again.";

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.avatarBox}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </div>

      <div className={styles.messageBox}>
        <div className={styles.aiHeader}>Today&apos;s Focus</div>
        <p className={styles.messageContent}>{message}</p>
      </div>

      {metrics && (
        <div className={styles.streakBox} title="A day counts when you study for at least 2 minutes">
          <span className={styles.streakValue}>{metrics.streak.current}</span>
          <span className={styles.streakLabel}>day streak</span>
          <span className={styles.streakBest}>Best: {plural(metrics.streak.best, "day")}</span>
        </div>
      )}
    </div>
  );
}
