"use client";

import React from "react";
import styles from "./LeaderboardWidget.module.css";
import { useAuth } from "@/context/AuthContext";

const mockLeaderboard = [
  { id: "u1", name: "Ravi Kumar", points: 2450, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "u2", name: "Sabrina Gomez", points: 2100, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { id: "u3", name: "Aisha Patel", points: 1950, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80" },
  { id: "u4", name: "David Chen", points: 1820, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
  { id: "u5", name: "Priya Sharma", points: 1650, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
];

export default function LeaderboardWidget() {
  const { user } = useAuth();
  
  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <h2 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          Weekly Leaderboard
        </h2>
      </div>

      <div className={styles.list}>
        {mockLeaderboard.map((person, index) => {
          const isCurrentUser = user && user.fullName === person.name;
          return (
            <div key={person.id} className={`${styles.listItem} ${isCurrentUser ? styles.isCurrentUser : ''}`}>
              <span className={`${styles.rank} ${index < 3 ? styles.topRank : ''}`}>
                {index + 1}
              </span>
              <img src={person.avatar} alt={person.name} className={styles.avatar} />
              <div className={styles.userInfo}>
                <p className={styles.userName}>
                  {person.name}
                  {isCurrentUser && <span className={styles.currentUserBadge}>You</span>}
                </p>
                <p className={styles.userPoints}>{person.points} XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}