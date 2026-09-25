"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./PostLoginNavActions.module.css";
import { useAuth } from "@/context/AuthContext";
import { createPortal } from "react-dom";
import {
  NotificationItem,
  NotificationCategory,
  loadNotifications,
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

export default function PostLoginNavActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setNotifications(loadNotifications(user?.id));
  }, [user?.id]);

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

  const displayName = user?.fullName || "Sabrina Gomez";
  const firstName = displayName.split(" ")[0];
  const userAvatar =
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80";
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
            src={userAvatar}
            alt={displayName}
            className={styles.userAvatar}
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
              <img
                src={userAvatar}
                alt="Profile"
                className={styles.dropdownHeaderAvatar}
              />
              <div className={styles.dropdownHeaderInfo}>
                <span className={styles.dropdownHeaderName}>{displayName}</span>
                <span className={styles.dropdownHeaderRole}>
                  {user?.email || "sabrina@example.com"}
                </span>
              </div>
            </div>

            <div className={styles.dropdownList}>
              <Link href="/profile/edit" className={styles.dropdownItem}>
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
                Edit Profile
              </Link>
              <Link href="/analytics" className={styles.dropdownItem}>
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
                My Analytics &amp; Reports
              </Link>
              <Link href="/settings" className={styles.dropdownItem}>
                <svg
                  className={styles.dropdownItemIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>

              <div className={styles.dropdownDivider}></div>

              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={logout}
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
                Log Out
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
                        {notif.icon}
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