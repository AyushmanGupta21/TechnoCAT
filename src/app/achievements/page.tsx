"use client";

import React from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import styles from "../dashboard/dashboard.module.css";

export default function AchievementsPage() {
  const achievements = [
    { title: "First Blood", desc: "Completed your first module", date: "May 10, 2026", icon: "🏆", color: "#fef3c7" },
    { title: "Perfect Score", desc: "Scored 100% in a section test", date: "May 15, 2026", icon: "⭐", color: "#dbeafe" },
    { title: "7-Day Streak", desc: "Studied for 7 consecutive days", date: "May 22, 2026", icon: "🔥", color: "#fee2e2" },
    { title: "Quant Master", desc: "Finished 50% of the Quant syllabus", date: "May 28, 2026", icon: "📈", color: "#dcfce7" },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== DARK HEADER SECTION ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Settings Navigation">
            {/* Brand Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link href="/dashboard" className={styles.brandLogo} title="Back to Dashboard">
                <span className={styles.logoTechno}>Techno</span>
                <span className={styles.logoCAT}>CAT</span>
              </Link>
              
              <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: 500, padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", transition: "all 0.2s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Dashboard
              </Link>
            </div>

            {/* Right Utilities & Profile */}
            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent} style={{ maxWidth: "800px", margin: "0 auto", marginTop: "32px", width: "100%" }}>
        <div className={styles.cardBox} style={{ padding: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>My Achievements</h1>
          <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "14px" }}>Track your earned badges and course completion milestones.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {achievements.map((a, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  {a.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#334155", margin: 0, marginBottom: "4px" }}>{a.title}</h4>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, marginBottom: "4px" }}>{a.desc}</p>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500" }}>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: "32px", padding: "24px", background: "linear-gradient(to right, #1e3a8a, #2563eb)", borderRadius: "12px", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0, marginBottom: "8px" }}>Certificate of Excellence</h3>
              <p style={{ fontSize: "14px", color: "#bfdbfe", margin: 0 }}>Complete the entire CAT curriculum to unlock your final certificate.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: "700" }}>38%</div>
              <div style={{ fontSize: "12px", color: "#bfdbfe" }}>Completed</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
