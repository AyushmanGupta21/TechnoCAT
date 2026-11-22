"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./LeaderboardWidget.module.css";
import type { Leaderboard, LeaderboardPeriod, LeaderboardEntry } from "@/lib/leaderboard";

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function LeaderboardWidget() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Leaderboard) => !cancelled && setBoard(data))
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, [period]);

  const row = (person: LeaderboardEntry, key: string) => (
    <li key={key} className={`${styles.listItem} ${person.isCurrentUser ? styles.isCurrentUser : ""}`}>
      <span className={`${styles.rank} ${person.rank <= 3 ? styles[`rank${person.rank}`] : ""}`}>{person.rank}</span>
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl} alt="" className={styles.avatar} />
      ) : (
        <span className={`${styles.avatar} ${styles.avatarInitials}`} aria-hidden="true">
          {initials(person.displayName)}
        </span>
      )}
      <p className={styles.userName}>
        <span className={styles.userNameText}>{person.displayName}</span>
        {person.isCurrentUser && <span className={styles.currentUserBadge}>You</span>}
      </p>
      <span className={styles.userPoints}>
        {person.points.toLocaleString("en-IN")}
        <span className={styles.xp}>XP</span>
      </span>
    </li>
  );

  const meOutsideTop = board?.me && !board.entries.some((e) => e.isCurrentUser);

  return (
    <section className={`glass-card ${styles.widgetBox}`} data-tint="coral">
      <div className={styles.widgetHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Leaderboard</h2>
          {board?.isSample && <span className={styles.sampleBadge}>Sample data</span>}
        </div>
        <div role="tablist" aria-label="Leaderboard period" className={styles.tabs}>
          {(["week", "all"] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`${styles.tab} ${period === p ? styles.tabActive : ""}`}
            >
              {p === "week" ? "This week" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.note}>The leaderboard could not be loaded. Please try again later.</p>}
      {!error && !board && <p className={styles.note}>Loading…</p>}
      {board && board.entries.length === 0 && (
        <p className={styles.note}>
          {period === "week" ? "No points earned by anyone this week yet." : "No points earned yet."} Complete lessons and
          quizzes to earn XP and appear here.
        </p>
      )}
      {board && (board.entries.length > 0 || meOutsideTop) && (
        <ol className={styles.list}>
          {board.entries.map((p) => row(p, `${p.rank}-${p.displayName}`))}
          {meOutsideTop && board.me && (
            <>
              <li className={styles.gap} aria-hidden="true">···</li>
              {row(board.me, "me")}
            </>
          )}
        </ol>
      )}
      {board && !board.isSample && (
        <p className={styles.footNote}>
          {board.optedOut
            ? "You are hidden from the leaderboard. "
            : `${board.participants} student${board.participants === 1 ? "" : "s"} ranked · names shown as first name + initial. `}
          <Link href="/settings">{board.optedOut ? "Show me again" : "Privacy settings"}</Link>
        </p>
      )}
    </section>
  );
}
