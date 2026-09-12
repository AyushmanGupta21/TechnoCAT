"use client";

import React, { useState } from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import styles from "../dashboard/dashboard.module.css";

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

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
                <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
              </Link>
              
              <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563EB", textDecoration: "none", fontSize: "13px", fontWeight: 600, padding: "6px 12px", background: "#F0F9FF", border: "1px solid #E0F2FE", borderRadius: "8px", transition: "all 0.2s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
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
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", marginBottom: "32px" }}>Settings</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Notification Preferences */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Notification Preferences</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#334155", margin: 0, marginBottom: "4px" }}>Email Notifications</h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Receive updates about course materials and announcements.</p>
                  </div>
                  <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#334155", margin: 0, marginBottom: "4px" }}>Push Notifications</h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Get notified when your streak is about to break.</p>
                  </div>
                  <input type="checkbox" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#334155", margin: 0, marginBottom: "4px" }}>Weekly Report</h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Receive a summary of your learning progress every Sunday.</p>
                  </div>
                  <input type="checkbox" checked={weeklyReport} onChange={() => setWeeklyReport(!weeklyReport)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb" }} />
                </div>
              </div>
            </div>

            {/* Account & Security */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Account & Security</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#334155", margin: 0, marginBottom: "4px" }}>Change Password</h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Update your password regularly to keep your account secure.</p>
                  </div>
                  <button style={{ padding: "8px 16px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "13px" }}>Update</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#e11d48", margin: 0, marginBottom: "4px" }}>Delete Account</h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Permanently remove your account and all learning data.</p>
                  </div>
                  <button style={{ padding: "8px 16px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
