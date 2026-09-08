"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import AiMotivationWidget from "@/components/AiMotivationWidget";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import ContinueLearningWidget from "@/components/ContinueLearningWidget";
import { useAuth } from "@/context/AuthContext";
import styles from "./dashboard.module.css";

interface WeeklyStat {
  day: string;
  learning: number;
  challenge: number;
  rawLearning?: number;
  rawChallenge?: number;
}

interface StudyTask {
  id: string;
  title: string;
  task_date: string;
  is_completed: boolean;
}

interface DashboardData {
  metrics: {
    inProgressCourses: number;
    completedCourses: number;
    watchingTime: string;
    pointsEarned: number;
  };
  weeklyStats: WeeklyStat[];
  summary: {
    totalHoursWeek: number;
    avgHoursDay: number;
    courseHoursWeek: number;
    challengeHoursWeek: number;
  };
  tasks: StudyTask[];
}

// Fallback weekly stats
const defaultWeeklyStats: WeeklyStat[] = [
  { day: "Sun", learning: 50, challenge: 40 },
  { day: "Mon", learning: 75, challenge: 60 },
  { day: "Tue", learning: 50, challenge: 42 },
  { day: "Wed", learning: 60, challenge: 50 },
  { day: "Thu", learning: 60, challenge: 52 },
  { day: "Fri", learning: 38, challenge: 32 },
  { day: "Sat", learning: 28, challenge: 22 },
];

// Calendar days: May 2023 (or current month)
const calendarDays = [
  { day: 30, isCurrentMonth: false, dateStr: "2023-04-30" },
  { day: 1, isCurrentMonth: true, dateStr: "2023-05-01" },
  { day: 2, isCurrentMonth: true, dateStr: "2023-05-02" },
  { day: 3, isCurrentMonth: true, dateStr: "2023-05-03" },
  { day: 4, isCurrentMonth: true, dateStr: "2023-05-04" },
  { day: 5, isCurrentMonth: true, dateStr: "2023-05-05" },
  { day: 6, isCurrentMonth: true, dateStr: "2023-05-06" },
  { day: 7, isCurrentMonth: true, dateStr: "2023-05-07" },
  { day: 8, isCurrentMonth: true, dateStr: "2023-05-08" },
  { day: 9, isCurrentMonth: true, dateStr: "2023-05-09" },
  { day: 10, isCurrentMonth: true, dateStr: "2023-05-10" },
  { day: 11, isCurrentMonth: true, dateStr: "2023-05-11" },
  { day: 12, isCurrentMonth: true, dateStr: "2023-05-12" },
  { day: 13, isCurrentMonth: true, dateStr: "2023-05-13" },
  { day: 14, isCurrentMonth: true, dateStr: "2023-05-14" },
  { day: 15, isCurrentMonth: true, dateStr: "2023-05-15" },
  { day: 16, isCurrentMonth: true, dateStr: "2023-05-16" },
  { day: 17, isCurrentMonth: true, dateStr: "2023-05-17" },
  { day: 18, isCurrentMonth: true, dateStr: "2023-05-18" },
  { day: 19, isCurrentMonth: true, dateStr: "2023-05-19" },
  { day: 20, isCurrentMonth: true, dateStr: "2023-05-20" },
  { day: 21, isCurrentMonth: true, dateStr: "2023-05-21" },
  { day: 22, isCurrentMonth: true, dateStr: "2023-05-22" },
  { day: 23, isCurrentMonth: true, dateStr: "2023-05-23" },
  { day: 24, isCurrentMonth: true, dateStr: "2023-05-24" },
  { day: 25, isCurrentMonth: true, dateStr: "2023-05-25" },
  { day: 26, isCurrentMonth: true, dateStr: "2023-05-26" },
  { day: 27, isCurrentMonth: true, dateStr: "2023-05-27" },
  { day: 28, isCurrentMonth: true, dateStr: "2023-05-28" },
  { day: 29, isCurrentMonth: true, dateStr: "2023-05-29" },
  { day: 30, isCurrentMonth: true, dateStr: "2023-05-30" },
  { day: 31, isCurrentMonth: true, dateStr: "2023-05-31" },
  { day: 1, isCurrentMonth: false, dateStr: "2023-06-01" },
  { day: 2, isCurrentMonth: false, dateStr: "2023-06-02" },
  { day: 3, isCurrentMonth: false, dateStr: "2023-06-03" },
];

export default function DashboardPage() {
  const { user, logout, openAuthModal } = useAuth();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState("Weekly");
  const [selectedDay, setSelectedDay] = useState(24);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Live Supabase Dashboard Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Fetch live dashboard analytics from Supabase
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  // Handle adding new task to Supabase
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          taskDate: taskDate,
        }),
      });

      if (res.ok) {
        setTaskTitle("");
        setIsTaskModalOpen(false);
        await fetchDashboard();
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const displayName = user?.fullName || "Sabrina Gomez";
  const firstName = displayName.split(" ")[0];
  const userAvatar = user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80";
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student";

  const metrics = dashboardData?.metrics || {
    inProgressCourses: 4,
    completedCourses: 23,
    watchingTime: "12h 10 min",
    pointsEarned: 40,
  };

  const currentWeeklyStats = dashboardData?.weeklyStats && dashboardData.weeklyStats.length === 7
    ? dashboardData.weeklyStats
    : defaultWeeklyStats;

  const summary = dashboardData?.summary || {
    totalHoursWeek: 37,
    avgHoursDay: 5,
    courseHoursWeek: 18,
    challengeHoursWeek: 20,
  };

  const tasks = dashboardData?.tasks || [];

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== DARK HEADER SECTION ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <span className={styles.logoTechno}>Techno</span>
              <span className={styles.logoCAT}>CAT</span>
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/topics", hasDropdown: true },
                { name: "My Topics", href: "/topics" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") {
                      e.preventDefault();
                    }
                    setActiveNav(item.name);
                  }}
                  className={`${styles.navLink} ${activeNav === item.name ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg
                      className={styles.dropdownChevron}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile */}
            <PostLoginNavActions />
          </nav>

          {/* Welcome Row */}
          <div className={styles.welcomeRow}>
            <div>
              <h1 className={styles.welcomeHeading}>Welcome back, {firstName}</h1>
              <p className={styles.welcomeSubtitle}>Here&apos;s a report on your study progress this week.</p>
            </div>
            <div className={styles.welcomeActions}>
              <button
                className={styles.periodDropdown}
                onClick={() => setSelectedPeriod(selectedPeriod === "Weekly" ? "Monthly" : "Weekly")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                {selectedPeriod}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <Link href="/topics" className={styles.addCourseBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Browse Topics
              </Link>
            </div>
          </div>

          {/* AI Motivation Widget */}
          <AiMotivationWidget firstName={firstName} streak={7} points={metrics.pointsEarned} />

          {/* 4 Metric Cards Row */}
          <div className={styles.metricCardsRow}>
            {/* Card 1: In Progress */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderLeft: '4px solid #8b5cf6' }}>
              <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{metrics.inProgressCourses} Topics</span>
                <span className={styles.metricLabel}>In Progress</span>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderLeft: '4px solid #10b981' }}>
              <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{metrics.completedCourses} Topics</span>
                <span className={styles.metricLabel}>Completed</span>
              </div>
            </div>

            {/* Card 3: Watching Time */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderLeft: '4px solid #2563EB' }}>
              <div className={`${styles.metricIconBox} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{metrics.watchingTime}</span>
                <span className={styles.metricLabel}>Watching Time</span>
              </div>
            </div>

            {/* Card 4: Earning Point */}
            <div className={styles.metricCard} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderLeft: '4px solid #f59e0b' }}>
              <div className={`${styles.metricIconBox} ${styles.iconPink}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{metrics.pointsEarned} Points</span>
                <span className={styles.metricLabel}>Earning Point</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent}>
        
        {/* New Top Widgets Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <ContinueLearningWidget />
          <LeaderboardWidget />
        </div>

        <div className={styles.dashboardGrid}>
          {/* Top Left: Study Statistic */}
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Study Statistic</h2>
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.dotLearning} />
                  <span>Learning</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotChallenge} />
                  <span>Challenge</span>
                </div>
              </div>
            </div>

            <div className={styles.studyStatBody}>
              {/* Dual Bar Chart */}
              <div className={styles.chartContainer}>
                <div className={styles.chartInner}>
                  {/* Y Axis */}
                  <div className={styles.yAxis}>
                    <span>10h</span>
                    <span>6h</span>
                    <span>4h</span>
                    <span>2h</span>
                    <span>0h</span>
                  </div>

                  {/* Grid Lines & Bars */}
                  <div className={styles.chartGrid}>
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />

                    <div className={styles.barsArea}>
                      {currentWeeklyStats.map((item) => (
                        <div key={item.day} className={styles.barGroup}>
                          <div className={styles.barsPair}>
                            <div
                              className={styles.barLearning}
                              style={{ height: `${item.learning}%` }}
                              title={`Learning: ${item.rawLearning !== undefined ? item.rawLearning : (item.learning / 10).toFixed(1)}h`}
                            />
                            <div
                              className={styles.barChallenge}
                              style={{ height: `${item.challenge}%` }}
                              title={`Challenge: ${item.rawChallenge !== undefined ? item.rawChallenge : (item.challenge / 10).toFixed(1)}h`}
                            />
                          </div>
                          <span className={styles.xAxisLabel}>{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Summary Metrics */}
              <div className={styles.statSummaryCol}>
                <div className={styles.statItem}>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValueNumber}>{summary.totalHoursWeek}</span>
                    <span className={styles.trendBadgeGreen}>↗ 16%</span>
                  </div>
                  <span className={styles.statItemLabel}>Total hours in a week</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValueNumber}>{summary.avgHoursDay}</span>
                    <span className={styles.trendBadgeRed}>↘ 2%</span>
                  </div>
                  <span className={styles.statItemLabel}>Average hours in a day</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValueNumber}>{summary.courseHoursWeek}</span>
                    <span className={styles.trendBadgeGreen}>↗ 16%</span>
                  </div>
                  <span className={styles.statItemLabel}>Course hours in a week</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValueNumber}>{summary.challengeHoursWeek}</span>
                    <span className={styles.trendBadgeRed}>↘ 4%</span>
                  </div>
                  <span className={styles.statItemLabel}>Challenge hours in a week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Calendar */}
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Study Calendar</h2>
              <button
                id="add-task-btn"
                className={styles.addTaskBtn}
                onClick={() => setIsTaskModalOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Task
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className={styles.calendarDayHeader}>
                  {day}
                </div>
              ))}

              {calendarDays.map((item, idx) => {
                const isSelected = item.isCurrentMonth && item.day === selectedDay;
                const hasTask = tasks.some((t) => t.task_date && t.task_date.endsWith(`-${String(item.day).padStart(2, '0')}`));
                return (
                  <div
                    key={idx}
                    onClick={() => item.isCurrentMonth && setSelectedDay(item.day)}
                    className={`${styles.calendarDateCell} ${
                      !item.isCurrentMonth ? styles.dateMuted : ""
                    } ${isSelected ? styles.dateActive : ""}`}
                  >
                    <div className={styles.taskItemCell}>
                      <span>{item.day}</span>
                      {hasTask && !isSelected && <span className={styles.taskDot} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Study Tasks list under calendar */}
            <div className={styles.tasksContainer}>
              <div className={styles.tasksHeader}>
                <span>Scheduled Study Tasks</span>
                <span className={styles.taskCountBadge}>{tasks.length} active</span>
              </div>
              <div className={styles.taskList}>
                {tasks.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", padding: "12px" }}>
                    No pending tasks. Click &quot;Add Task&quot; above to plan your study!
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className={styles.taskItem}>
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        readOnly
                        className={styles.taskCheckbox}
                      />
                      <span className={task.is_completed ? styles.taskCompleted : ""}>
                        {task.title}
                      </span>
                      <span className={styles.taskDateTag}>
                        {new Date(task.task_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Left: Upcoming Agenda */}
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Agenda</h2>
            </div>

            <div className={styles.agendaList}>
              {/* Agenda 1 */}
              <div className={styles.agendaItem}>
                <div className={styles.agendaLeft}>
                  <div className={styles.agendaIconBox} style={{ background: "#ED1C24" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.agendaTitle}>CAT QA: Geometry & Mensuration Masterclass</h3>
                    <p className={styles.agendaMeta}>Faculty Live Session • 27 May, 7am-10am</p>
                  </div>
                </div>
                <div className={styles.agendaRight}>
                  <div className={styles.agendaMetaCol}>
                    <span className={styles.agendaMetaLabel}>Duration</span>
                    <span className={styles.agendaMetaVal}>90 min</span>
                  </div>
                  <div className={styles.agendaMetaCol}>
                    <span className={styles.agendaMetaLabel}>Activity</span>
                    <span className={styles.agendaMetaVal}>Live Class</span>
                  </div>
                </div>
              </div>

              {/* Agenda 2 */}
              <div className={styles.agendaItem}>
                <div className={styles.agendaLeft}>
                  <div className={styles.agendaIconBox} style={{ background: "#10B981" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="3" rx="2" />
                      <line x1="8" x2="16" y1="21" y2="21" />
                      <line x1="12" x2="12" y1="17" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.agendaTitle}>CAT DILR: Arrangements & Matrix Sets</h3>
                    <p className={styles.agendaMeta}>Mock Workshop • 28 May, 9am-11.30am</p>
                  </div>
                </div>
                <div className={styles.agendaRight}>
                  <div className={styles.agendaMetaCol}>
                    <span className={styles.agendaMetaLabel}>Duration</span>
                    <span className={styles.agendaMetaVal}>120 min</span>
                  </div>
                  <div className={styles.agendaMetaCol}>
                    <span className={styles.agendaMetaLabel}>Activity</span>
                    <span className={styles.agendaMetaVal}>Workshop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Notice Board */}
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>CAT Prep Notices</h2>
            </div>

            <div className={styles.noticeList}>
              {/* Notice 1 */}
              <div className={styles.noticeItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=160&auto=format&fit=crop&q=80"
                  alt="CAT Mock Series"
                  className={styles.noticeThumb}
                />
                <div className={styles.noticeContent}>
                  <h3 className={styles.noticeTitle}>
                    All-India National CAT Mock 07 Registration Open
                  </h3>
                  <span className={styles.noticeDate}>Registration closes 28 May</span>
                </div>
              </div>

              {/* Notice 2 */}
              <div className={styles.noticeItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80"
                  alt="IIM Interview Prep"
                  className={styles.noticeThumb}
                />
                <div className={styles.noticeContent}>
                  <h3 className={styles.noticeTitle}>
                    IIM Mock Viva & GD-PI Preparation Schedules Released
                  </h3>
                  <span className={styles.noticeDate}>Slot bookings open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== ADD STUDY TASK MODAL ===== */}
      {isTaskModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsTaskModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Study Task</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsTaskModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask}>
              <div className={styles.formGroup}>
                <label htmlFor="task-title-input" className={styles.formLabel}>Task Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="e.g. Finish Geometry Circles & Triangles"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={styles.formInput}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="task-date-input" className={styles.formLabel}>Target Date</label>
                <input
                  id="task-date-input"
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  id="create-task-submit-btn"
                  type="submit"
                  disabled={isSubmittingTask}
                  className={styles.submitBtn}
                >
                  {isSubmittingTask ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
