"use client";

import React from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import styles from "../../dashboard/dashboard.module.css"; // Reuse dashboard styles for layout

export default function EditProfilePage() {
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
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", marginBottom: "24px" }}>Edit Profile</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Avatar Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingBottom: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Profile Picture</h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>Change</button>
                  <button style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>Remove</button>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155" }}>Personal Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>First Name</label>
                  <input type="text" defaultValue="Sabrina" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", color: "#334155" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Last Name</label>
                  <input type="text" defaultValue="Gomez" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", color: "#334155" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Email Address</label>
                <input type="email" defaultValue="student@technocat.edu" disabled style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", outline: "none", fontSize: "14px", color: "#94a3b8" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Phone Number</label>
                <input type="tel" placeholder="+91 98765 43210" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", color: "#334155" }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <button style={{ padding: "10px 20px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              <button style={{ padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>Save Changes</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
