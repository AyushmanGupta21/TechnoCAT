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

  // Notification settings
  const [emailNotif, setEmailNotif] = useState(true);
  const [streakNotif, setStreakNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [mockAlerts, setMockAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Exam simulation settings
  const [ionCalculator, setIonCalculator] = useState(true);
  const [autoSaveResponses, setAutoSaveResponses] = useState(true);
  const [compactPalette, setCompactPalette] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [timerAlerts, setTimerAlerts] = useState(true);

  // Security settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Danger zone modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Load preferences from localStorage
  useEffect(() => {
    const uid = user?.id || (isDemo ? "demo-student" : "guest");
    try {
      const stored = localStorage.getItem(`technocat_settings_${uid}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.emailNotif === "boolean") setEmailNotif(parsed.emailNotif);
        if (typeof parsed.streakNotif === "boolean") setStreakNotif(parsed.streakNotif);
        if (typeof parsed.weeklyDigest === "boolean") setWeeklyDigest(parsed.weeklyDigest);
        if (typeof parsed.mockAlerts === "boolean") setMockAlerts(parsed.mockAlerts);
        if (typeof parsed.whatsappAlerts === "boolean") setWhatsappAlerts(parsed.whatsappAlerts);
        if (typeof parsed.ionCalculator === "boolean") setIonCalculator(parsed.ionCalculator);
        if (typeof parsed.autoSaveResponses === "boolean") setAutoSaveResponses(parsed.autoSaveResponses);
        if (typeof parsed.compactPalette === "boolean") setCompactPalette(parsed.compactPalette);
        if (typeof parsed.highContrast === "boolean") setHighContrast(parsed.highContrast);
        if (typeof parsed.timerAlerts === "boolean") setTimerAlerts(parsed.timerAlerts);
        if (typeof parsed.twoFactorAuth === "boolean") setTwoFactorAuth(parsed.twoFactorAuth);
      }
    } catch {}
  }, [user, isDemo]);

  // Persist updated toggle
  const persistSettings = (updates: Record<string, boolean>) => {
    const uid = user?.id || (isDemo ? "demo-student" : "guest");
    try {
      const stored = localStorage.getItem(`technocat_settings_${uid}`);
      const current = stored ? JSON.parse(stored) : {};
      const updated = {
        emailNotif,
        streakNotif,
        weeklyDigest,
        mockAlerts,
        whatsappAlerts,
        ionCalculator,
        autoSaveResponses,
        compactPalette,
        highContrast,
        timerAlerts,
        twoFactorAuth,
        ...updates,
      };
      localStorage.setItem(`technocat_settings_${uid}`, JSON.stringify(updated));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {}
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: "error", message: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setPasswordFeedback({ type: "success", message: "Your password has been changed successfully!" });
    }, 700);
  };

  const handleDeleteAccount = () => {
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
    alert("Account deletion request submitted. You will be logged out.");
    setShowDeleteModal(false);
    router.push("/login");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== HEADER & TOP NAVIGATION ===== */}
      <header className={styles.darkHeader}>
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

          {/* Breadcrumb & Hero Heading */}
          <div className={styles.heroRow}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeLabel}>★ Platform Preferences &amp; Security</span>
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
      </header>

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
                        Notification Preferences
                      </h2>
                      <p className={styles.cardDesc}>
                        Manage how and when TechnoCAT keeps you informed about curriculum updates and study milestones.
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
                    {/* Email Notifications */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Email Notifications</h3>
                        <p className={styles.optionSub}>
                          Receive critical course announcements, faculty schedule notices, and module updates.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={emailNotif}
                          onChange={(e) => {
                            setEmailNotif(e.target.checked);
                            persistSettings({ emailNotif: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Streak & Study Reminders */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Daily Practice &amp; Streak Alerts</h3>
                        <p className={styles.optionSub}>
                          Get a reminder at 8:00 PM if you have not completed your target questions for the day.
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

                    {/* Sunday Digest */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Sunday Performance Digest</h3>
                        <p className={styles.optionSub}>
                          Receive a personalized weekly summary with time spent, QA/VARC accuracy, and ranking shifts.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={weeklyDigest}
                          onChange={(e) => {
                            setWeeklyDigest(e.target.checked);
                            persistSettings({ weeklyDigest: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {/* Mock & Viva Alerts */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Mock Test &amp; Viva Feedback Alerts</h3>
                        <p className={styles.optionSub}>
                          Instant notification when full-length mock percentiles and AI Mock Viva reviews are published.
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
                  </div>
                </div>

                {/* Additional Notification Channels */}
                <div className={styles.cardBox}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Instant Messaging Channels
                      </h2>
                      <p className={styles.cardDesc}>Connect external messaging services for urgent cohort announcements.</p>
                    </div>
                  </div>

                  <div className={styles.optionList}>
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>
                          WhatsApp Study Broadcasts
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", background: "#DCFCE7", color: "#15803D", borderRadius: "12px" }}>
                            Beta
                          </span>
                        </h3>
                        <p className={styles.optionSub}>
                          Receive high-priority mock release alerts and live faculty doubt session links directly on WhatsApp.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={whatsappAlerts}
                          onChange={(e) => {
                            setWhatsappAlerts(e.target.checked);
                            persistSettings({ whatsappAlerts: e.target.checked });
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

                    {/* 2FA Toggle */}
                    <div className={styles.optionItem}>
                      <div className={styles.optionText}>
                        <h3 className={styles.optionTitle}>Two-Factor Authentication (2FA)</h3>
                        <p className={styles.optionSub}>
                          Prompt for a one-time verification code whenever signing in from a new computer or mobile browser.
                        </p>
                      </div>
                      <label className={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={twoFactorAuth}
                          onChange={(e) => {
                            setTwoFactorAuth(e.target.checked);
                            persistSettings({ twoFactorAuth: e.target.checked });
                          }}
                          className={styles.switchInput}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Active Sessions Card */}
                <div className={styles.cardBox}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        Active Browser Sessions
                      </h2>
                      <p className={styles.cardDesc}>Devices currently signed into your TechnoCAT learning account.</p>
                    </div>
                  </div>

                  <div className={styles.optionList}>
                    <div className={styles.optionItem} style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                      <div className={styles.optionText}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                          <h3 className={styles.optionTitle} style={{ margin: 0 }}>
                            Current Device • Windows Desktop
                          </h3>
                        </div>
                        <p className={styles.optionSub}>Chrome 122 • Kolkata, India • Active Now</p>
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          background: "#DCFCE7",
                          color: "#15803D",
                          borderRadius: "14px",
                        }}
                      >
                        This Device
                      </span>
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
                disabled={deleteConfirmationText !== "DELETE"}
                style={{
                  background: deleteConfirmationText === "DELETE" ? "#DC2626" : "#FCA5A5",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: deleteConfirmationText === "DELETE" ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                Permanently Delete
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
