"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./PostLoginNavActions.module.css";
import { useAuth } from "@/context/AuthContext";
import { createPortal } from "react-dom";

export default function PostLoginNavActions() {
  const { user, logout } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "milestone",
      title: "Milestone Reached! 🎉",
      desc: "You just hit 25 Points in Quantitative Ability.",
      time: "2 hours ago",
      read: false
    },
    {
      id: "2",
      type: "resume",
      title: "Continue watching",
      desc: "Resume where you left off: QA-1.1 Percentages",
      time: "Yesterday",
      read: false
    },
    {
      id: "3",
      type: "quiz",
      title: "New Quiz Available 📝",
      desc: "Topic Test for QA-0 is ready to take.",
      time: "2 days ago",
      read: true
    }
  ]);

  const hasUnread = notifications.some(n => !n.read);

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
  const userAvatar = user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80";
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student";

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className={styles.actionsContainer}>
      {/* Notifications Button */}
      <button 
        className={styles.iconBtn} 
        aria-label="Notifications"
        onClick={() => setIsNotifOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {hasUnread && <span className={styles.unreadDot}></span>}
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
            className={`${styles.caretIcon} ${isProfileOpen ? styles.caretOpen : ''}`} 
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isProfileOpen && (
          <div className={styles.profileDropdown}>
            <div className={styles.dropdownHeader}>
              <img src={userAvatar} alt="Profile" className={styles.dropdownHeaderAvatar} />
              <div className={styles.dropdownHeaderInfo}>
                <span className={styles.dropdownHeaderName}>{displayName}</span>
                <span className={styles.dropdownHeaderRole}>{user?.email || "sabrina@example.com"}</span>
              </div>
            </div>
            
            <div className={styles.dropdownList}>
              <button className={styles.dropdownItem}>
                <svg className={styles.dropdownItemIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
              <button className={styles.dropdownItem}>
                <svg className={styles.dropdownItemIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                My Achievements
              </button>
              <button className={styles.dropdownItem}>
                <svg className={styles.dropdownItemIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
              
              <div className={styles.dropdownDivider}></div>
              
              <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={logout}>
                <svg className={styles.dropdownItemIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Drawer (Portal) */}
      {isNotifOpen && mounted && createPortal(
        <>
          <div className={styles.notificationOverlay} onClick={() => setIsNotifOpen(false)}></div>
          <div className={styles.notificationDrawer}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Notifications</h3>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                {hasUnread && <button className={styles.markReadBtn} onClick={markAllRead}>Mark all read</button>}
                <button className={styles.closeDrawerBtn} onClick={() => setIsNotifOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            
            <div className={styles.drawerContent}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  <p>You have no notifications right now.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`${styles.notificationItem} ${!notif.read ? styles.notificationItemUnread : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`${styles.notifIcon} ${
                      notif.type === 'milestone' ? styles.iconMilestone : 
                      notif.type === 'resume' ? styles.iconResume : styles.iconQuiz
                    }`}>
                      {notif.type === 'milestone' ? '🎉' : notif.type === 'resume' ? '▶️' : '📝'}
                    </div>
                    <div className={styles.notifContent}>
                      <h4 className={styles.notifTitle}>{notif.title}</h4>
                      <p className={styles.notifDesc}>{notif.desc}</p>
                      <span className={styles.notifTime}>{notif.time}</span>
                    </div>
                    {!notif.read && <div className={styles.unreadIndicator}></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}