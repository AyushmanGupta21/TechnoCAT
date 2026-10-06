"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./PostLoginNavActions.module.css";
import { useAuth } from "@/context/AuthContext";
import { resolveStudentName, resolveUserAvatarUrl } from "@/lib/nameUtils";
import { createPortal } from "react-dom";
import {
  NotificationItem,
  NotificationCategory,
  loadNotifications,
  checkDailyNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAllNotifications,
} from "@/services/notificationService";

const TABS: { id: NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mocks", label: "Mocks & Tests" },
  { id: "learning", label: "Learning & AI" },
];

function renderNotificationIcon(notif: NotificationItem) {
  const type = notif.type;
  const iconKey = notif.icon;

  if (iconKey === "alert" || type === "streak_alert") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  }
  if (iconKey === "brain" || type === "revision") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 .88.29 1.7.78 2.36A4 4 0 0 0 7 12a4 4 0 0 0 .5 1.93A4 4 0 0 0 8 18a4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0 .5-4.07A4 4 0 0 0 17 12a4 4 0 0 0-1.78-3.64A4 4 0 0 0 16 6a4 4 0 0 0-4-4Z"/></svg>;
  }
  if (iconKey === "target" || type === "mock") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
  }
  if (iconKey === "bschool" || type === "bschool") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
  if (iconKey === "play" || type === "resume") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
  }
  if (iconKey === "clipboard" || type === "mock_pyq" || iconKey === "notes") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>;
  }
  if (iconKey === "search" || type === "ai") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  }
  if (iconKey === "trophy" || type === "milestone") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
  }
  if (iconKey === "rocket" || type === "system") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5"/><path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5"/></svg>;
  }
  if (iconKey === "calendar") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  }
  if (iconKey === "flame") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
  }
  if (iconKey === "check") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  }
  if (iconKey === "schedule") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  }
  if (iconKey === "learning") {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
}

export default function PostLoginNavActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isDemo = Boolean(user && user.email === "student@technocat.edu");

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Check daily notifications on mount
    checkDailyNotifications(user?.id);

    const refresh = () => {
      setNotifications(loadNotifications(user?.id, isDemo));
    };

    refresh();

    // Listen to real-time notification updates triggered anywhere across the app
    window.addEventListener("technocat_notifications_updated", refresh);
    // Refresh relative times (e.g. "Just now" -> "1m ago") every 60 seconds
    const interval = setInterval(refresh, 60000);

    return () => {
      window.removeEventListener("technocat_notifications_updated", refresh);
      clearInterval(interval);
    };
  }, [user?.id, isDemo]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "mocks":
        return notifications.filter((n) => n.category === "mocks");
      case "learning":
        return notifications.filter((n) => n.category === "learning");
      case "all":
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Handle clicking outside profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key and lock body scroll when notification drawer is open
  useEffect(() => {
    if (!isNotifOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotifOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotifOpen]);

  const displayName = resolveStudentName(user?.fullName, user?.email);
  const firstName = displayName.split(" ")[0] || displayName;

  // Default profile icon is /profile_icon.png, replaced by custom photo if provided by user
  const userAvatarUrl = resolveUserAvatarUrl(user?.avatarUrl);

  const userRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Student";

  const handleNotificationClick = (notif: NotificationItem) => {
    const updated = markAsRead(notif.id, user?.id);
    setNotifications(updated);
    setIsNotifOpen(false);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleActionClick = (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    handleNotificationClick(notif);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = dismissNotification(id, user?.id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead(user?.id);
    setNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = clearAllNotifications(user?.id);
    setNotifications(updated);
  };

  return (
    <div className={styles.actionsContainer}>
      {/* Notifications Bell Button with Live Badge */}
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setIsNotifOpen(true)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Profile Dropdown Area */}
      <div className={styles.profileWrapper} ref={profileRef}>
        <div
          className={styles.userPill}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userAvatarUrl}
            alt={displayName}
            className={styles.userAvatar}
            onError={(e) => {
              e.currentTarget.src = "/profile_icon.png";
            }}
          />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{firstName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
          <svg
            className={`${styles.caretIcon} ${isProfileOpen ? styles.caretOpen : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isProfileOpen && (
          <div className={styles.profileDropdown}>
            <div className={styles.dropdownHeader}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userAvatarUrl}
                alt="Profile"
                className={styles.dropdownHeaderAvatar}
                onError={(e) => {
                  e.currentTarget.src = "/profile_icon.png";
                }}
              />
              <div className={styles.dropdownHeaderInfo}>
                <span className={styles.dropdownHeaderName}>{displayName}</span>
                <span className={styles.dropdownHeaderRole} title={user?.email || ""}>
                  {user?.email || ""}
                </span>
              </div>
            </div>

            <div className={styles.dropdownList}>
              <Link
                href="/profile/edit"
                className={styles.dropdownItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Profile</span>
              </Link>

              <Link
                href="/analytics"
                className={styles.dropdownItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>My Analytics &amp; Reports</span>
              </Link>

              <div className={styles.dropdownDivider} />

              <div className={styles.dropdownSectionHeader}>Settings &amp; Preferences</div>

              <Link
                href="/settings?tab=notifications"
                className={styles.dropdownItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notifications</span>
              </Link>

              <Link
                href="/settings?tab=exam"
                className={styles.dropdownItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>Exam Environment</span>
              </Link>

              <Link
                href="/settings?tab=security"
                className={styles.dropdownItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Account &amp; Security</span>
              </Link>

              <div className={styles.dropdownDivider} />

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
              >
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Drawer (Portal) */}
      {isNotifOpen &&
        mounted &&
        createPortal(
          <>
            <div
              className={styles.notificationOverlay}
              onClick={() => setIsNotifOpen(false)}
            />
            <div className={styles.notificationDrawer}>
              {/* Drawer Top Header */}
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitleRow}>
                  <h3 className={styles.drawerTitle}>Notifications</h3>
                  {unreadCount > 0 ? (
                    <span className={styles.unreadPill}>{unreadCount} unread</span>
                  ) : (
                    <span className={styles.allCaughtUpPill}>All caught up</span>
                  )}
                </div>
                <div className={styles.drawerHeaderActions}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.markReadBtn}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.closeDrawerBtn}
                    onClick={() => setIsNotifOpen(false)}
                    aria-label="Close notifications"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className={styles.tabsContainer}>
                {TABS.map((tab) => {
                  const count =
                    tab.id === "all"
                      ? notifications.length
                      : tab.id === "unread"
                      ? unreadCount
                      : notifications.filter((n) => n.category === tab.id).length;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.tabBtn} ${
                        activeTab === tab.id ? styles.tabBtnActive : ""
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span className={styles.tabBadge}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notification Items List */}
              <div className={styles.drawerContent}>
                {filteredNotifications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                      >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    </div>
                    <h4 className={styles.emptyTitle}>
                      {activeTab === "unread"
                        ? "No unread notifications"
                        : activeTab === "mocks"
                        ? "No mock test alerts"
                        : activeTab === "learning"
                        ? "No learning reminders"
                        : "You have no notifications"}
                    </h4>
                    <p className={styles.emptyDesc}>
                      {activeTab === "unread"
                        ? "You're completely up to date with your CAT prep schedule!"
                        : "Notifications about your mocks, revisions, and study tasks will appear here."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`${styles.notificationItem} ${
                        !notif.read ? styles.notificationItemUnread : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                      title={`Click to open: ${notif.title}`}
                    >
                      <div
                        className={styles.notifIcon}
                        style={{
                          background: notif.iconBg,
                          color: notif.iconColor,
                        }}
                      >
                        {renderNotificationIcon(notif)}
                      </div>

                      <div className={styles.notifContent}>
                        <div className={styles.notifHeaderRow}>
                          <h4 className={styles.notifTitle}>{notif.title}</h4>
                          {notif.priority === "urgent" && (
                            <span className={styles.priorityUrgentTag}>
                              Alert
                            </span>
                          )}
                        </div>
                        <p className={styles.notifDesc}>{notif.desc}</p>

                        <div className={styles.notifFooterRow}>
                          <span className={styles.notifTime}>{notif.time}</span>
                          {notif.actionLabel && (
                            <button
                              type="button"
                              className={styles.notifActionBtn}
                              onClick={(e) => handleActionClick(e, notif)}
                            >
                              <span>{notif.actionLabel}</span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Individual dismiss button */}
                      <button
                        type="button"
                        className={styles.dismissBtn}
                        onClick={(e) => handleDismiss(e, notif.id)}
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>

                      {!notif.read && (
                        <div className={styles.unreadIndicator} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {notifications.length > 0 && (
                <div className={styles.drawerFooter}>
                  <button
                    type="button"
                    className={styles.clearAllBtn}
                    onClick={handleClearAll}
                  >
                    Clear all
                  </button>
                  <Link
                    href="/settings"
                    className={styles.settingsLink}
                    onClick={() => setIsNotifOpen(false)}
                  >
                    Notification preferences
                  </Link>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}