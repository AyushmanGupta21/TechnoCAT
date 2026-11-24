"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  KeyRound,
  Monitor,
  Shield,
  Trash2,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AppNav from "@/components/app/AppNav";
import BackLink from "@/components/app/BackLink";
import PageHeader, { pageHeaderStyles } from "@/components/app/PageHeader";
import { Reveal } from "@/components/landing/motion";
import styles from "./settings.module.css";

type SettingsTab = "notifications" | "exam" | "security";

const TAB_META: { id: SettingsTab; label: string; hint: string; icon: LucideIcon; color: string }[] = [
  { id: "notifications", label: "Notifications", hint: "Reminders and alerts", icon: Bell, color: "var(--data-blue)" },
  { id: "exam", label: "Exam environment", hint: "Mock test interface", icon: Monitor, color: "var(--data-teal)" },
  { id: "security", label: "Account & security", hint: "Password and account", icon: Shield, color: "var(--data-violet)" },
];

/** One preference row with a switch (markup only; state lives in the page). */
function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  accent,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  accent: string;
}) {
  return (
    <label className={styles.optionItem} style={{ "--row-accent": accent } as React.CSSProperties}>
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        <span className={styles.optionSub}>{desc}</span>
      </span>
      <span className={styles.switchLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.switchInput}
          aria-label={title}
        />
        <span className={styles.slider} aria-hidden="true" />
      </span>
    </label>
  );
}

function SavedPill() {
  return (
    <span className={styles.saveSuccessPill} role="status">
      <Check size={14} strokeWidth={2.6} />
      Saved
    </span>
  );
}

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
  // Leaderboard visibility (profiles.leaderboard_opt_out), loaded from the server.
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  useEffect(() => {
    if (!user || isDemo) return;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setLeaderboardVisible(!data.user.leaderboardOptOut);
      })
      .catch(() => {});
  }, [user, isDemo]);
  const updateLeaderboardVisibility = async (visible: boolean) => {
    setLeaderboardVisible(visible);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderboardOptOut: !visible }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setLeaderboardVisible(!visible); // revert on failure
    } else {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };
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
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (isDemo) {
      setPasswordFeedback({
        type: "error",
        message: "Password changes are turned off for this shared account. Sign in to your personal account to change a password.",
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
      alert("This shared account cannot be deleted.");
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

  const activeMeta = TAB_META.find((t) => t.id === activeTab) ?? TAB_META[0];

  const displayName = user?.fullName?.trim() || "Student";
  const displayInitials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ""))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";
  const syncsToAccount = Boolean(user && !isDemo);

  return (
    <div className={styles.pageWrapper}>
      <AppNav />

      <main className={styles.page}>
        {/* ===== PAGE HEADER ===== */}
        <div className={styles.headGroup}>
          <BackLink href="/dashboard" label="Back to dashboard" />
          <PageHeader
            title="Account"
            accent="settings"
            subtitle="Choose which reminders you get, tune the mock exam interface and keep your account secure."
            actions={
              <Link href="/profile/edit" className={pageHeaderStyles.secondaryAction}>
                <UserPen size={18} strokeWidth={2} />
                Edit profile
              </Link>
            }
          />
        </div>

        {/* ===== SECTION NAV + PANEL + RAIL ===== */}
        <div className={styles.settingsGrid}>
          {/* Sub-navigation: vertical + sticky on desktop, scrollable tab bar on tablet / phone */}
          <Reveal delay={0.05} className={styles.tabNavWrap}>
            <nav className={`glass-card ${styles.tabNavCard}`} data-tint="blue" aria-label="Settings sections">
              <span className={styles.tabNavLabel}>Settings</span>
              <div className={styles.tabList} role="tablist" aria-orientation="vertical">
                {TAB_META.map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(t.id)}
                      className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ""}`}
                      style={{ "--tab-accent": t.color } as React.CSSProperties}
                    >
                      <Icon className={styles.tabIcon} size={18} strokeWidth={1.9} />
                      <span className={styles.tabText}>
                        <span className={styles.tabName}>{t.label}</span>
                        <span className={styles.tabHint}>{t.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </Reveal>

          {/* Content */}
          <div data-sticky-col className={styles.contentArea} key={activeTab}>
            {/* ================= TAB 1: NOTIFICATIONS ================= */}
            {activeTab === "notifications" && (
              <Reveal y={14}>
                <section className={`glass-card ${styles.cardBox}`} data-tint="blue">
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <span className={styles.cardMarker} style={{ background: activeMeta.color }} aria-hidden="true" />
                        In-app notifications
                      </h2>
                      <p className={styles.cardDesc}>
                        Pick the reminders and alerts that show up in the bell menu.
                      </p>
                    </div>
                    {justSaved && <SavedPill />}
                  </div>

                  <div className={styles.optionList}>
                    {!isDemo && (
                      <ToggleRow
                        accent="var(--data-violet)"
                        title="Show me on the leaderboard"
                        desc="Other students see your first name and last initial with your XP. Turn off to stay hidden."
                        checked={leaderboardVisible}
                        onChange={(v) => updateLeaderboardVisibility(v)}
                      />
                    )}
                    <ToggleRow
                      accent="var(--data-amber)"
                      title="Daily practice and streak alerts"
                      desc="Reminders about pending daily drills and keeping your study streak alive."
                      checked={streakNotif}
                      onChange={(v) => {
                        setStreakNotif(v);
                        persistSettings({ streakNotif: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-blue)"
                      title="Mock test and score alerts"
                      desc="A notification when your mock percentile and analysis report are ready."
                      checked={mockAlerts}
                      onChange={(v) => {
                        setMockAlerts(v);
                        persistSettings({ mockAlerts: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-teal)"
                      title="Topic revision reminders"
                      desc="A nudge to review formulas and concepts after 5–7 days away from a topic."
                      checked={revisionNotif}
                      onChange={(v) => {
                        setRevisionNotif(v);
                        persistSettings({ revisionNotif: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-emerald)"
                      title="Milestones and achievements"
                      desc="When you earn practice points, pass module quizzes or climb leaderboard ranks."
                      checked={milestoneNotif}
                      onChange={(v) => {
                        setMilestoneNotif(v);
                        persistSettings({ milestoneNotif: v });
                      }}
                    />
                  </div>
                </section>
              </Reveal>
            )}

            {/* ================= TAB 2: EXAM ENVIRONMENT ================= */}
            {activeTab === "exam" && (
              <Reveal y={14}>
                <section className={`glass-card ${styles.cardBox}`} data-tint="teal">
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <span className={styles.cardMarker} style={{ background: activeMeta.color }} aria-hidden="true" />
                        Mock exam interface
                      </h2>
                      <p className={styles.cardDesc}>
                        Make the mock test screen behave like the official TCS iON CAT interface.
                      </p>
                    </div>
                    {justSaved && <SavedPill />}
                  </div>

                  <div className={styles.optionList}>
                    <ToggleRow
                      accent="var(--data-teal)"
                      title="On-screen calculator"
                      desc="Keep the official TCS iON calculator available in the QA and DILR sections."
                      checked={ionCalculator}
                      onChange={(v) => {
                        setIonCalculator(v);
                        persistSettings({ ionCalculator: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-blue)"
                      title="Auto-save answers on section switch"
                      desc="Save your chosen options whenever you move between VARC, DILR and QA."
                      checked={autoSaveResponses}
                      onChange={(v) => {
                        setAutoSaveResponses(v);
                        persistSettings({ autoSaveResponses: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-violet)"
                      title="Compact question palette"
                      desc="Collapse the question-number grid to give long RC passages more room."
                      checked={compactPalette}
                      onChange={(v) => {
                        setCompactPalette(v);
                        persistSettings({ compactPalette: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-cyan)"
                      title="High contrast reading mode"
                      desc="Stronger text contrast and chart borders for long mock sessions."
                      checked={highContrast}
                      onChange={(v) => {
                        setHighContrast(v);
                        persistSettings({ highContrast: v });
                      }}
                    />
                    <ToggleRow
                      accent="var(--data-amber)"
                      title="5-minute section warning"
                      desc="Show an amber countdown when 5 minutes remain in the current section."
                      checked={timerAlerts}
                      onChange={(v) => {
                        setTimerAlerts(v);
                        persistSettings({ timerAlerts: v });
                      }}
                    />
                  </div>
                </section>
              </Reveal>
            )}

            {/* ================= TAB 3: ACCOUNT & SECURITY ================= */}
            {activeTab === "security" && (
              <>
                <Reveal y={14}>
                  <section className={`glass-card ${styles.cardBox}`} data-tint="violet">
                    <div className={styles.cardHeader}>
                      <div>
                        <h2 className={styles.cardTitle}>
                          <span className={styles.cardMarker} style={{ background: activeMeta.color }} aria-hidden="true" />
                          Password
                        </h2>
                        <p className={styles.cardDesc}>
                          Use a strong password you don&apos;t use anywhere else.
                        </p>
                      </div>
                      {justSaved && <SavedPill />}
                    </div>

                    {passwordFeedback && (
                      <div
                        className={`${styles.feedback} ${
                          passwordFeedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError
                        }`}
                        role={passwordFeedback.type === "error" ? "alert" : "status"}
                      >
                        {passwordFeedback.type === "success" ? (
                          <Check size={17} strokeWidth={2.4} />
                        ) : (
                          <AlertCircle size={17} strokeWidth={2.2} />
                        )}
                        <span>{passwordFeedback.message}</span>
                      </div>
                    )}

                    <div className={styles.optionList}>
                      <div className={`${styles.optionItem} ${styles.optionItemStack}`}>
                        <div className={styles.optionRow}>
                          <span className={styles.optionLead} aria-hidden="true">
                            <KeyRound size={18} strokeWidth={1.9} />
                          </span>
                          <div className={styles.optionText}>
                            <h3 className={styles.optionTitle}>Account password</h3>
                            <p className={styles.optionSub}>
                              Changing it from time to time keeps your account and test history safe.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPassword(!isChangingPassword);
                              setPasswordFeedback(null);
                            }}
                            className={styles.actionBtn}
                            aria-expanded={isChangingPassword}
                          >
                            {isChangingPassword ? "Cancel" : "Change password"}
                          </button>
                        </div>

                        {isChangingPassword && (
                          <form onSubmit={handlePasswordSubmit} className={styles.passwordPanel}>
                            <div className={styles.formField}>
                              <label className={styles.formLabel} htmlFor="set-current-pw">
                                Current password
                              </label>
                              <input
                                id="set-current-pw"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter your current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className={styles.formInput}
                              />
                            </div>

                            <div className={styles.passwordInputGrid}>
                              <div className={styles.formField}>
                                <label className={styles.formLabel} htmlFor="set-new-pw">
                                  New password
                                </label>
                                <input
                                  id="set-new-pw"
                                  type="password"
                                  autoComplete="new-password"
                                  placeholder="At least 8 characters"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required
                                  className={styles.formInput}
                                />
                              </div>

                              <div className={styles.formField}>
                                <label className={styles.formLabel} htmlFor="set-confirm-pw">
                                  Confirm new password
                                </label>
                                <input
                                  id="set-confirm-pw"
                                  type="password"
                                  autoComplete="new-password"
                                  placeholder="Repeat new password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                  className={styles.formInput}
                                />
                              </div>
                            </div>

                            <div className={styles.strengthRow} aria-hidden="true">
                              {[0, 1, 2, 3].map((i) => (
                                <span
                                  key={i}
                                  className={styles.strengthBar}
                                  data-on={newPassword.length >= 8 + i * 3 || (i === 0 && newPassword.length > 0) ? "true" : "false"}
                                />
                              ))}
                              <span className={styles.strengthText}>
                                {newPassword.length === 0
                                  ? "8+ characters"
                                  : newPassword.length < 8
                                  ? `${8 - newPassword.length} more characters`
                                  : confirmPassword && confirmPassword !== newPassword
                                  ? "Passwords don't match yet"
                                  : "Looks good"}
                              </span>
                            </div>

                            <div className={styles.panelActions}>
                              <button type="button" onClick={() => setIsChangingPassword(false)} className={styles.ghostBtn}>
                                Cancel
                              </button>
                              <button type="submit" disabled={isUpdatingPassword} className={styles.primaryBtn}>
                                {isUpdatingPassword ? "Updating…" : "Update password"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </section>
                </Reveal>

                {/* Danger zone */}
                <Reveal y={14} delay={0.06}>
                  <section className={`glass-card ${styles.cardBox} ${styles.dangerCard}`} data-tint="coral">
                    <div className={styles.cardHeader}>
                      <div>
                        <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>
                          <AlertTriangle size={18} strokeWidth={2} />
                          Danger zone
                        </h2>
                        <p className={styles.cardDesc}>These actions are permanent and can&apos;t be undone.</p>
                      </div>
                    </div>

                    <div className={styles.optionList}>
                      <div className={`${styles.optionItem} ${styles.dangerRow}`}>
                        <div className={styles.optionText}>
                          <h3 className={styles.optionTitle}>Delete account and test records</h3>
                          <p className={styles.optionSub}>
                            Permanently deletes your profile, video progress, mock test submissions and percentile history.
                          </p>
                        </div>
                        <button type="button" onClick={() => setShowDeleteModal(true)} className={styles.dangerBtn}>
                          <Trash2 size={15} strokeWidth={2} />
                          Delete account
                        </button>
                      </div>
                    </div>
                  </section>
                </Reveal>
              </>
            )}
          </div>

          {/* At-a-glance rail: right column on wide screens, card pair below the panel on smaller ones */}
          <div data-sticky-col className={styles.rail}>
            <Reveal delay={0.1} className={styles.railItem}>
              <section className={`glass-card ${styles.railCard}`} data-tint="violet" aria-labelledby="set-account-title">
                <h2 id="set-account-title" className={styles.railTitle}>
                  Your account
                </h2>
                <div className={styles.accountRow}>
                  <span className={styles.accountAvatar} aria-hidden="true">
                    {displayInitials}
                  </span>
                  <span className={styles.accountText}>
                    <span className={styles.accountName}>{displayName}</span>
                    {user?.email && <span className={styles.accountEmail}>{user.email}</span>}
                  </span>
                </div>
                <Link href="/profile/edit" className={styles.railLink}>
                  <UserPen size={16} strokeWidth={1.9} />
                  <span>Edit name, photo and goals</span>
                  <ChevronRight size={15} className={styles.railLinkArrow} />
                </Link>
              </section>
            </Reveal>

            <Reveal delay={0.15} className={styles.railItem}>
              <section className={`glass-card ${styles.railCard}`} data-tint="teal" aria-labelledby="set-saving-title">
                <h2 id="set-saving-title" className={styles.railTitle}>
                  How changes save
                </h2>
                <ul className={styles.factList}>
                  <li className={styles.factItem}>
                    <Check size={16} strokeWidth={2.4} className={styles.factIcon} />
                    <span>Switches apply the moment you flip them. There&apos;s no save button to press.</span>
                  </li>
                  <li className={styles.factItem}>
                    <Check size={16} strokeWidth={2.4} className={styles.factIcon} />
                    <span>
                      {syncsToAccount
                        ? "Preferences are synced to your account, so they follow you to any device."
                        : isDemo
                        ? "On this shared account, preferences are kept in this browser only."
                        : "Preferences are kept in this browser."}
                    </span>
                  </li>
                </ul>
              </section>
            </Reveal>
          </div>
        </div>
      </main>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className={styles.modalHead}>
              <span className={styles.modalIcon} aria-hidden="true">
                <AlertTriangle size={22} strokeWidth={2.2} />
              </span>
              <div>
                <h3 id="delete-modal-title" className={styles.modalTitle}>
                  Delete your TechnoCAT account?
                </h3>
                <p className={styles.modalSub}>This action cannot be undone.</p>
              </div>
            </div>

            <p className={styles.modalBody}>
              Your enrolled modules, video watch progress, test percentiles and Speak &amp; Assess history will be permanently
              erased.
            </p>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="delete-confirm">
                Type <strong className={styles.deleteWord}>DELETE</strong> to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                placeholder="DELETE"
                autoComplete="off"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className={`${styles.formInput} ${styles.deleteInput}`}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                }}
                className={styles.ghostBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmationText !== "DELETE"}
                className={styles.dangerSolidBtn}
              >
                {isDeletingAccount ? "Deleting…" : "Permanently delete"}
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
