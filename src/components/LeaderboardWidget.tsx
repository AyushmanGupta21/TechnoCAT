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
    <div key={key} className={`${styles.listItem} ${person.isCurrentUser ? styles.isCurrentUser : ""}`}>
      <span className={`${styles.rank} ${person.rank <= 3 ? styles.topRank : ""}`}>{person.rank}</span>
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl} alt="" className={styles.avatar} />
      ) : (
        <span className={styles.avatar} aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#E0E7FF", color: "#3730A3", fontSize: 12, fontWeight: 700 }}>
          {initials(person.displayName)}
        </span>
      )}
      <div className={styles.userInfo}>
        <p className={styles.userName}>
          {person.displayName}
          {person.isCurrentUser && <span className={styles.currentUserBadge}>You</span>}
        </p>
        <p className={styles.userPoints}>{person.points.toLocaleString("en-IN")} XP</p>
      </div>
    </div>
  );

  const meOutsideTop = board?.me && !board.entries.some((e) => e.isCurrentUser);

  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <h2 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          Leaderboard
          {board?.isSample && <span className={styles.currentUserBadge} style={{ marginLeft: 8 }}>Sample data</span>}
        </h2>
        <div role="tablist" aria-label="Leaderboard period" style={{ display: "flex", gap: 4 }}>
          {(["week", "all"] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              style={{
                border: "1px solid #E2E8F0", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: period === p ? "#0F172A" : "#FFFFFF", color: period === p ? "#FFFFFF" : "#475569",
              }}
            >
              {p === "week" ? "This week" : "All time"}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {error && <p className={styles.userPoints}>The leaderboard could not be loaded. Please try again later.</p>}
        {!error && !board && <p className={styles.userPoints}>Loading…</p>}
        {board && board.entries.length === 0 && (
          <p className={styles.userPoints}>
            {period === "week" ? "No points earned by anyone this week yet." : "No points earned yet."} Complete lessons and
            quizzes to earn XP and appear here.
          </p>
        )}
        {board?.entries.map((p) => row(p, `${p.rank}-${p.displayName}`))}
        {meOutsideTop && board?.me && (
          <>
            <p className={styles.userPoints} style={{ textAlign: "center", margin: "4px 0" }}>⋯</p>
            {row(board.me, "me")}
          </>
        )}
        {board && !board.isSample && (
          <p className={styles.userPoints} style={{ marginTop: 8 }}>
            {board.optedOut
              ? "You are hidden from the leaderboard. "
              : `${board.participants} student${board.participants === 1 ? "" : "s"} ranked · names shown as first name + initial. `}
            <Link href="/settings">{board.optedOut ? "Show me again" : "Privacy settings"}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
