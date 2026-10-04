"use client";

import React, { useState, useEffect, Suspense } from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./settings.module.css";

const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Browse", href: "/browse" },
  { name: "My Topics", href: "/topics" },
  { name: "Intelligence Hub", href: "/intelligence" },
  { name: "Mock Viva Prep", href: "#" },
];

type SettingsTab = "notifications" | "exam" | "security";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");

  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [justSaved, setJustSaved] = useState(false);

  // Sync tab with URL query param (?tab=notifications | exam | security)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as SettingsTab | null;
    if (tabParam && ["notifications", "exam", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // In-app notification preferences
  const [streakNotif, setStreakNotif] = useState(true);
  const [revisionNotif, setRevisionNotif] = useState(true);
  const [mockAlerts, setMockAlerts] = useState(true);
  const [milestoneNotif, setMilestoneNotif] = useState(true);

  // Exam simulation preferences
  const [ionCalculator, setIonCalculator] = useState(true);
  const [autoSaveResponses, setAutoSaveResponses] = useState(true);
  const [compactPalette, setCompactPalette] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [timerAlerts, setTimerAlerts] = useState(true);

  // Security & credentials state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Danger zone modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load preferences from user.preferences or localStorage
  useEffect(() => {
    const uid = user?.id || (isDemo ? "demo-student" : "guest");
    try {
      const dbPrefs = user?.preferences;
      const stored = localStorage.getItem(`technocat_settings_${uid}`);
      const prefs = dbPrefs && Object.keys(dbPrefs).length > 0 ? dbPrefs : (stored ? JSON.parse(stored) : null);

      if (prefs) {
        if (typeof prefs.streakNotif === "boolean") setStreakNotif(prefs.streakNotif);
        if (typeof prefs.revisionNotif === "boolean") setRevisionNotif(prefs.revisionNotif);
        if (typeof prefs.mockAlerts === "boolean") setMockAlerts(prefs.mockAlerts);
        if (typeof prefs.milestoneNotif === "boolean") setMilestoneNotif(prefs.milestoneNotif);
        if (typeof prefs.ionCalculator === "boolean") setIonCalculator(prefs.ionCalculator);
        if (typeof prefs.autoSaveResponses === "boolean") setAutoSaveResponses(prefs.autoSaveResponses);
        if (typeof prefs.compactPalette === "boolean") setCompactPalette(prefs.compactPalette);
        if (typeof prefs.highContrast === "boolean") setHighContrast(prefs.highContrast);
        if (typeof prefs.timerAlerts === "boolean") setTimerAlerts(prefs.timerAlerts);
      }
    } catch {}
  }, [user, isDemo]);

  // Persist updated toggle
  const persistSettings = async (updates: Record<string, boolean>) => {
    const uid = user?.id || (isDemo ? "demo-student" : "guest");
    const updated = {
      streakNotif,
      revisionNotif,
      mockAlerts,
      milestoneNotif,
      ionCalculator,
      autoSaveResponses,
      compactPalette,
      highContrast,
      timerAlerts,
      ...updates,
    };

    try {
      localStorage.setItem(`technocat_settings_${uid}`, JSON.stringify(updated));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);

      // Notify notification service and exam simulation listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("technocat_notifications_updated"));
        window.dispatchEvent(new CustomEvent("technocat_exam_settings_updated", { detail: updated }));
      }

      // If user is authenticated and not demo, sync to PostgreSQL preferences column
      if (user && !isDemo) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: updated }),
        }).catch(() => {});
      }
    } catch {}
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: "error", message: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (isDemo) {
      setPasswordFeedback({
        type: "error",
        message: "Notice: Demo accounts cannot change passwords. Please register or sign in to your personal account.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setPasswordFeedback({ type: "success", message: data.message || "Your password has been changed successfully!" });
    } catch (err: any) {
      setPasswordFeedback({ type: "error", message: err.message || "Could not update password. Please check your credentials." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      alert("Please type 'DELETE' to confirm account deletion.");
      return;
    }
    if (isDemo) {
      alert("Notice: Demo accounts cannot be deleted as they are shared sandbox showcase environments.");
      setShowDeleteModal(false);
      setDeleteConfirmationText("");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }

      setShowDeleteModal(false);
      alert("Your account and all associated test records have been permanently deleted.");
      router.push("/login");
    } catch (err: any) {
      alert(err.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== STICKY TOP NAVIGATION ===== */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Main Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              {navLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                  }}
                  className={styles.navLink}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HERO HEADER SECTION ===== */}
      <div className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Breadcrumb & Hero Heading */}
          <div className={styles.heroRow}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeLabel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Platform Preferences &amp; Security
              </span>
              {isDemo && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "5px 12px",
                    background: "#FEF3C7",
                    color: "#B45309",
                    borderRadius: "20px",
                    border: "1px solid #FDE68A",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Demo Showcase Account
                </span>
              )}
            </div>

            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/dashboard" className={styles.breadcrumbLink}>
                Dashboard
              </Link>
              <span className={styles.breadcrumbSep}>›</span>
              <span className={styles.breadcrumbCurrent}>Settings</span>
            </nav>

            <div>
              <h1 className={styles.heroHeading}>
                System &amp; Account <span className={styles.heroHighlight}>Settings</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Customize your exam simulation environment, manage study notifications, and configure security preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main className={styles.mainContent}>
        <div className={styles.settingsGrid}>
          {/* Left Sidebar Tab Navigation */}
          <aside className={styles.tabNavCard}>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`${styles.tabBtn} ${activeTab === "notifications" ? styles.tabBtnActive : ""}`}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exam")}
              className={`${styles.tabBtn} ${activeTab === "exam" ? styles.tabBtnActive : ""}`}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Exam Environment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`${styles.tabBtn} ${activeTab === "security" ? styles.tabBtnActive : ""}`}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Account &amp; Security</span>
            </button>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
              <Link
                href="/profile/edit"
                className={styles.tabBtn}
                style={{ textDecoration: "none", color: "#2563EB", background: "#EFF6FF" }}
              >
                <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Edit Profile</span>
              </Link>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className={styles.contentArea}>
            {/* ================= TAB 1: NOTIFICATIONS ================= */}
            {activeTab === "notifications" && (
              <>
                <div className={styles.cardBox}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        In-App Notification Preferences
                      </h2>
                      <p className={styles.cardDesc}>
                        Manage real-time study prompts, streak alerts, and mock benchmark notifications inside your TechnoCAT panel.
                      </p>
                    </div>

                    {justSaved && (
                      <span className={styles.saveSuccessPill}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>

                  <div className={styles.optionList}>
                    {/* Streak & Study Reminders */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Daily Practice &amp; Streak Alerts</h3>
                        <p className={styles.optionSub}>
                          Header alerts reminding you of pending daily curriculum drills and study streak maintenance.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={streakNotif}
                          onChange={(e) => {
                            setStreakNotif(e.target.checked);
                            persistSettings({ streakNotif: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Mock & Score Benchmark Alerts */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Mock Test &amp; Benchmark Score Alerts</h3>
                        <p className={styles.optionSub}>
                          Instant notification when full-length All-India mock test percentiles and AI detailed analyses are published.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={mockAlerts}
                          onChange={(e) => {
                            setMockAlerts(e.target.checked);
                            persistSettings({ mockAlerts: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Spaced Revision & Retention Drills */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Spaced Retention &amp; Topic Revision Drills</h3>
                        <p className={styles.optionSub}>
                          Intelligent memory retention alerts prompting formula and concept reviews after 5-7 days of topic inactivity.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={revisionNotif}
                          onChange={(e) => {
                            setRevisionNotif(e.target.checked);
                            persistSettings({ revisionNotif: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Milestones & Badges */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Performance Milestones &amp; Achievement Alerts</h3>
                        <p className={styles.optionSub}>
                          Celebratory notifications when you unlock practice points, pass module quizzes, or jump leaderboard ranks.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={milestoneNotif}
                          onChange={(e) => {
                            setMilestoneNotif(e.target.checked);
                            persistSettings({ milestoneNotif: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================= TAB 2: EXAM ENVIRONMENT ================= */}
            {activeTab === "exam" && (
              <>
                <div className={styles.cardBox}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        TCS iON CAT Mock Simulator Preferences
                      </h2>
                      <p className={styles.cardDesc}>
                        Tune the mock examination interface to replicate the official computer-based CAT test environment.
                      </p>
                    </div>

                    {justSaved && (
                      <span className={styles.saveSuccessPill}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>

                  <div className={styles.optionList}>
                    {/* Virtual Calculator */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>TCS iON Virtual Calculator Mode</h3>
                        <p className={styles.optionSub}>
                          Keep the on-screen official scientific calculator readily available in the QA and DILR sections.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={ionCalculator}
                          onChange={(e) => {
                            setIonCalculator(e.target.checked);
                            persistSettings({ ionCalculator: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Auto-Save Responses */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Auto-Save Answers on Section Switch</h3>
                        <p className={styles.optionSub}>
                          Automatically save chosen radio options whenever navigating between VARC, DILR, and QA tabs.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={autoSaveResponses}
                          onChange={(e) => {
                            setAutoSaveResponses(e.target.checked);
                            persistSettings({ autoSaveResponses: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Compact Question Palette */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Compact Question Palette</h3>
                        <p className={styles.optionSub}>
                          Collapse the right question number grid to provide maximum horizontal space for VARC RC passages.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={compactPalette}
                          onChange={(e) => {
                            setCompactPalette(e.target.checked);
                            persistSettings({ compactPalette: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* High Contrast Reading Mode */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>High Contrast Reading Mode</h3>
                        <p className={styles.optionSub}>
                          Increases text contrast and enhances DI chart line borders for fatigue-free 120-minute mocks.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={highContrast}
                          onChange={(e) => {
                            setHighContrast(e.target.checked);
                            persistSettings({ highContrast: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Timer Alert */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>5-Minute Section Remaining Pulse</h3>
                        <p className={styles.optionSub}>
                          Display an amber countdown warning when 5 minutes remain in the current sectional timer.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={timerAlerts}
                          onChange={(e) => {
                            setTimerAlerts(e.target.checked);
                            persistSettings({ timerAlerts: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================= TAB 3: ACCOUNT & SECURITY ================= */}
            {activeTab === "security" && (
              <>
                <div className={styles.cardBox}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Security &amp; Credentials
                      </h2>
                      <p className={styles.cardDesc}>
                        Keep your TechnoCAT account protected with strong passwords and active session controls.
                      </p>
                    </div>

                    {justSaved && (
                      <span className={styles.saveSuccessPill}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>

                  {passwordFeedback && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        fontWeight: 500,
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: passwordFeedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
                        border: passwordFeedback.type === "success" ? "1px solid #A7F3D0" : "1px solid #FECACA",
                        color: passwordFeedback.type === "success" ? "#065F46" : "#991B1B",
                      }}
                    >
                      {passwordFeedback.type === "success" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      )}
                      <span>{passwordFeedback.message}</span>
                    </div>
                  )}

                  <div className={styles.optionList}>
                    {/* Password change item */}
                    <div className={styles.optionItem} style={{ flexDirection: "column", alignItems: "stretch" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div className={styles.optionText}>
                          <h3 className={styles.optionTitle}>Account Password</h3>
                          <p className={styles.optionSub}>
                            Last changed 2 months ago. Updating your password regularly maintains account integrity.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPassword(!isChangingPassword);
                            setPasswordFeedback(null);
                          }}
                          className={styles.actionBtn}
                        >
                          {isChangingPassword ? "Cancel" : "Change Password"}
                        </button>
                      </div>

                      {/* Expandable Password Form */}
                      {isChangingPassword && (
                        <form onSubmit={handlePasswordSubmit} className={styles.passwordPanel}>
                          <div className={styles.formField}>
                            <label className={styles.formLabel}>Current Password</label>
                            <input
                              type="password"
                              placeholder="Enter your current password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                              className={styles.formInput}
                            />
                          </div>

                          <div className={styles.passwordInputGrid}>
                            <div className={styles.formField}>
                              <label className={styles.formLabel}>New Password</label>
                              <input
                                type="password"
                                placeholder="At least 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className={styles.formInput}
                              />
                            </div>

                            <div className={styles.formField}>
                              <label className={styles.formLabel}>Confirm New Password</label>
                              <input
                                type="password"
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className={styles.formInput}
                              />
                            </div>
                          </div>

                          <div className={styles.panelActions}>
                            <button
                              type="button"
                              onClick={() => setIsChangingPassword(false)}
                              className={styles.actionBtn}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUpdatingPassword}
                              style={{
                                background: "#2563EB",
                                color: "#FFFFFF",
                                border: "none",
                                padding: "9px 20px",
                                borderRadius: "10px",
                                fontSize: "13.5px",
                                fontWeight: 600,
                                cursor: isUpdatingPassword ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              {isUpdatingPassword ? "Updating..." : "Update Password"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                  </div>
                </div>

                {/* Danger Zone Card */}
                <div className={`${styles.cardBox} ${styles.dangerCard}`}>
                  <div className={`${styles.cardHeader} ${styles.dangerHeader}`}>
                    <div>
                      <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BE123C" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Danger Zone
                      </h2>
                      <p className={styles.cardDesc}>
                        Irreversible account actions. Please exercise caution when modifying these parameters.
                      </p>
                    </div>
                  </div>

                  <div className={styles.optionList}>
                    <div className={styles.optionItem} style={{ background: "#FFF5F5", borderColor: "#FECDD3" }}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle} style={{ color: "#BE123C" }}>
                          Delete Account &amp; Test Records
                        </h3>
                        <p className={styles.optionSub}>
                          Permanently delete your profile, video watch progress, full mock test submissions, and percentile history.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className={styles.dangerBtn}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
                  Delete TechnoCAT Account?
                </h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
              All of your enrolled modules, video watch timestamps, test attempt percentiles, and AI Viva logs will be permanently erased.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Type <strong style={{ color: "#DC2626" }}>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #CBD5E1",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                }}
                className={styles.actionBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmationText !== "DELETE"}
                style={{
                  background: deleteConfirmationText === "DELETE" && !isDeletingAccount ? "#DC2626" : "#FCA5A5",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: deleteConfirmationText === "DELETE" && !isDeletingAccount ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {isDeletingAccount ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
