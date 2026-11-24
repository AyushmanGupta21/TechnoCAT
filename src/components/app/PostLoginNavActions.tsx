"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BellOff,
  Brain,
  CalendarDays,
  CheckCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Home,
  LogOut,
  Monitor,
  Play,
  Rocket,
  Search,
  Shield,
  Target,
  Trophy,
  UserPen,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./PostLoginNavActions.module.css";
import { useAuth } from "@/context/AuthContext";
import { resolveStudentName, resolveUserAvatarUrl } from "@/lib/nameUtils";
import {
  NotificationItem,
  NotificationCategory,
  loadNotifications,
  refreshNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAllNotifications,
} from "@/services/notificationService";

const TABS: { id: NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mocks", label: "Mocks & tests" },
  { id: "learning", label: "Learning" },
];

function notificationIcon(notif: NotificationItem): LucideIcon {
  const type = notif.type;
  const iconKey = notif.icon;
  if (iconKey === "alert" || type === "streak_alert") return AlertTriangle;
  if (iconKey === "brain" || type === "revision") return Brain;
  if (iconKey === "target" || type === "mock") return Target;
  if (iconKey === "bschool" || type === "bschool") return Home;
  if (iconKey === "play" || type === "resume") return Play;
  if (iconKey === "clipboard" || type === "mock_pyq" || iconKey === "notes") return ClipboardList;
  if (iconKey === "search" || type === "ai") return Search;
  if (iconKey === "trophy" || type === "milestone") return Trophy;
  if (iconKey === "rocket" || type === "system") return Rocket;
  if (iconKey === "calendar") return CalendarDays;
  if (iconKey === "flame") return Flame;
  if (iconKey === "check") return Check;
  if (iconKey === "schedule") return Clock;
  if (iconKey === "learning") return GraduationCap;
  return Bell;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

const DEFAULT_AVATAR = resolveUserAvatarUrl(null);

export default function PostLoginNavActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number }>({ top: 76, right: 16 });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");

  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const userId = user.id;

    // Re-read cached feed + local read/dismissed state (also recomputes relative times).
    const refresh = () => {
      setNotifications(loadNotifications(userId));
    };

    refresh();
    // Pull the real feed from the server (derived from tasks, quizzes, points, announcements).
    void refreshNotifications(userId);

    // Listen to notification updates triggered anywhere across the app
    window.addEventListener("technocat_notifications_updated", refresh);
    // Refresh relative times every minute; re-fetch from the server every 5 minutes
    const tick = setInterval(refresh, 60000);
    const poll = setInterval(() => void refreshNotifications(userId), 5 * 60000);

    return () => {
      window.removeEventListener("technocat_notifications_updated", refresh);
      clearInterval(tick);
      clearInterval(poll);
    };
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

  // Close the profile menu on Escape
  useEffect(() => {
    if (!isProfileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsProfileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isProfileOpen]);

  // Handle escape key, lock body scroll and keep the popover anchored under the bell
  useEffect(() => {
    if (!isNotifOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const place = () => {
      const r = bellRef.current?.getBoundingClientRect();
      if (!r) return;
      setAnchor({ top: Math.round(r.bottom + 10), right: Math.max(8, Math.round(window.innerWidth - r.right - 8)) });
    };
    place();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotifOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", place);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", place);
    };
  }, [isNotifOpen]);

  const displayName = resolveStudentName(user?.fullName, user?.email);
  const firstName = displayName.split(" ")[0] || displayName;
  const initials = initialsOf(displayName);

  // Custom photo when the user uploaded one; otherwise an initials avatar
  const userAvatarUrl = resolveUserAvatarUrl(user?.avatarUrl);
  const hasPhoto = userAvatarUrl !== DEFAULT_AVATAR && !avatarFailed;

  useEffect(() => setAvatarFailed(false), [userAvatarUrl]);

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

  const avatar = (size: "sm" | "lg") =>
    hasPhoto ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={userAvatarUrl}
        alt=""
        className={size === "sm" ? styles.userAvatar : styles.dropdownHeaderAvatar}
        onError={() => setAvatarFailed(true)}
      />
    ) : (
      <span className={size === "sm" ? styles.avatarInitials : styles.avatarInitialsLg} aria-hidden="true">
        {initials}
      </span>
    );

  const closeProfile = () => setIsProfileOpen(false);

  return (
    <div className={styles.actionsContainer}>
      {/* Notifications bell with unread badge */}
      <button
        ref={bellRef}
        type="button"
        className={`${styles.iconBtn} ${isNotifOpen ? styles.iconBtnActive : ""}`}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="dialog"
        aria-expanded={isNotifOpen}
        onClick={() => {
          setIsProfileOpen(false);
          setIsNotifOpen(true);
        }}
      >
        <Bell size={19} strokeWidth={1.9} />
        {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {/* Profile menu */}
      <div className={styles.profileWrapper} ref={profileRef}>
        <button
          type="button"
          className={`${styles.userPill} ${isProfileOpen ? styles.userPillOpen : ""}`}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          aria-haspopup="menu"
          aria-expanded={isProfileOpen}
          aria-label={`Account menu for ${displayName}`}
        >
          {avatar("sm")}
          <span className={styles.userName}>{firstName}</span>
          <ChevronDown size={15} strokeWidth={2} className={`${styles.caretIcon} ${isProfileOpen ? styles.caretOpen : ""}`} />
        </button>

        {isProfileOpen && (
          <div className={styles.profileDropdown} role="menu">
            <div className={styles.dropdownHeader}>
              {avatar("lg")}
              <div className={styles.dropdownHeaderInfo}>
                <span className={styles.dropdownHeaderName}>{displayName}</span>
                <span className={styles.dropdownHeaderRole} title={user?.email || ""}>
                  {user?.email || userRole}
                </span>
              </div>
            </div>

            <div className={styles.dropdownList}>
              <Link href="/profile/edit" className={styles.dropdownItem} onClick={closeProfile} role="menuitem">
                <UserPen className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>Edit profile</span>
              </Link>
              <Link href="/analytics" className={styles.dropdownItem} onClick={closeProfile} role="menuitem">
                <BarChart3 className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>My analytics &amp; reports</span>
              </Link>

              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownSectionHeader}>Settings</div>

              <Link href="/settings?tab=notifications" className={styles.dropdownItem} onClick={closeProfile} role="menuitem">
                <Bell className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>Notifications</span>
              </Link>
              <Link href="/settings?tab=exam" className={styles.dropdownItem} onClick={closeProfile} role="menuitem">
                <Monitor className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>Exam environment</span>
              </Link>
              <Link href="/settings?tab=security" className={styles.dropdownItem} onClick={closeProfile} role="menuitem">
                <Shield className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>Account &amp; security</span>
              </Link>

              <div className={styles.dropdownDivider} />

              <button
                type="button"
                role="menuitem"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
              >
                <LogOut className={styles.dropdownItemIcon} size={16} strokeWidth={1.9} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification popover (portal) */}
      {isNotifOpen &&
        mounted &&
        createPortal(
          <>
            <div className={styles.notificationOverlay} onClick={() => setIsNotifOpen(false)} />
            <div
              className={styles.notificationDrawer}
              role="dialog"
              aria-label="Notifications"
              style={{ "--pop-top": `${anchor.top}px`, "--pop-right": `${anchor.right}px` } as React.CSSProperties}
            >
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
                    <button type="button" className={styles.markReadBtn} onClick={handleMarkAllRead}>
                      <CheckCheck size={15} strokeWidth={2} />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.closeDrawerBtn}
                    onClick={() => setIsNotifOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X size={17} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className={styles.tabsContainer} role="tablist">
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
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      {count > 0 && <span className={styles.tabBadge}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className={styles.drawerContent}>
                {filteredNotifications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyStateIcon}>
                      <BellOff size={26} strokeWidth={1.6} />
                    </span>
                    <h4 className={styles.emptyTitle}>
                      {activeTab === "unread"
                        ? "No unread notifications"
                        : activeTab === "mocks"
                        ? "No mock test alerts"
                        : activeTab === "learning"
                        ? "No learning reminders"
                        : "You're all caught up"}
                    </h4>
                    <p className={styles.emptyDesc}>
                      {activeTab === "unread"
                        ? "You're all caught up with your CAT prep schedule."
                        : "Reminders about your study tasks, quiz results, points and live classes will appear here."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const Icon = notificationIcon(notif);
                    return (
                      <div
                        key={notif.id}
                        className={`${styles.notificationItem} ${!notif.read ? styles.notificationItemUnread : ""}`}
                        onClick={() => handleNotificationClick(notif)}
                        title={`Click to open: ${notif.title}`}
                      >
                        <span className={styles.notifIcon} style={{ color: notif.iconColor }}>
                          <Icon size={17} strokeWidth={2} />
                        </span>

                        <div className={styles.notifContent}>
                          <div className={styles.notifHeaderRow}>
                            <h4 className={styles.notifTitle}>{notif.title}</h4>
                            {notif.priority === "urgent" && <span className={styles.priorityUrgentTag}>Alert</span>}
                          </div>
                          <p className={styles.notifDesc}>{notif.desc}</p>

                          <div className={styles.notifFooterRow}>
                            <span className={styles.notifTime}>{notif.time}</span>
                            {notif.actionLabel && (
                              <button type="button" className={styles.notifActionBtn} onClick={(e) => handleActionClick(e, notif)}>
                                <span>{notif.actionLabel}</span>
                                <ArrowRight size={12} strokeWidth={2.4} />
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={styles.dismissBtn}
                          onClick={(e) => handleDismiss(e, notif.id)}
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                        >
                          <X size={14} strokeWidth={2} />
                        </button>

                        {!notif.read && <span className={styles.unreadIndicator} />}
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className={styles.drawerFooter}>
                  <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
                    Clear all
                  </button>
                  <Link href="/settings" className={styles.settingsLink} onClick={() => setIsNotifOpen(false)}>
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
