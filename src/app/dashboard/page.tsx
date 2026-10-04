"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import AiMotivationWidget from "@/components/AiMotivationWidget";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import ContinueLearningWidget from "@/components/ContinueLearningWidget";
import StudyPerformanceChart from "@/components/StudyPerformanceChart";
import DailyStudySchedule, { ScheduleItem } from "@/components/DailyStudySchedule";
import StudyCalendarWidget from "@/components/StudyCalendarWidget";
import CatReadinessWidget from "@/components/CatReadinessWidget";
import { useAuth } from "@/context/AuthContext";
import { resolveStudentName } from "@/lib/nameUtils";
import { notifyTaskCompleted, pushNotification } from "@/services/notificationService";
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
  enrolledTopics?: string[];
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
  detailed?: {
    inProgressTopics: any[];
    completedTopics: any[];
    watchingHistory: any[];
    pointsHistory: any[];
  };
}



interface AgendaSession {
  id: string;
  title: string;
  topic: string;
  faculty: string;
  facultyBio: string;
  timeRange: string;
  dateFormatted: string;
  isLiveNow: boolean;
  duration: string;
  activity: string;
  color: string;
  iconBg: string;
  topicUrl: string;
  syllabus: string[];
  enrolledCount: number;
}

interface PrepNotice {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  desc: string;
  dateNotice: string;
  thumbUrl: string;
  actionUrl: string;
  actionLabel: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");
  const [activeNav, setActiveNav] = useState("Dashboard");

  // Live Supabase Dashboard Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic enrolled topics list
  const enrolledTopicsList = useMemo(() => {
    if (isDemo) {
      return ["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"];
    }
    return (
      dashboardData?.enrolledTopics ||
      dashboardData?.detailed?.inProgressTopics?.map((t: any) => t.topic_id) ||
      []
    );
  }, [isDemo, dashboardData]);

  const enrolledCount = isDemo ? 3 : enrolledTopicsList.length;

  // Selected Agenda Modal State
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaSession | null>(null);
  const [agendaReminderSaved, setAgendaReminderSaved] = useState<Record<string, boolean>>({});
  const [liveStreamAlert, setLiveStreamAlert] = useState<string | null>(null);

  // Dynamic Planner & Calendar State - automatically derived from current date
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const now = new Date();
    setSelectedMonthIndex(now.getMonth());
    setSelectedYear(now.getFullYear());
    setSelectedDay(now.getDate());
  }, []);

  // Dynamic Agenda sessions derived from current date
  const upcomingAgenda: AgendaSession[] = useMemo(() => {
    const allSessions: AgendaSession[] = [
      {
        id: "agenda-qa-geo",
        title: "CAT QA: Geometry & Mensuration Masterclass",
        topic: "Quantitative Aptitude",
        faculty: "Prof. Rajesh Verma",
        facultyBio: "IIM Bangalore Alum • 99.98%iler QA Lead",
        timeRange: "7:00 PM – 8:30 PM",
        dateFormatted: "Today • 7:00 PM – 8:30 PM",
        isLiveNow: true,
        duration: "90 min",
        activity: "Live Class",
        color: "#ED1C24",
        iconBg: "#ED1C24",
        topicUrl: "/topics/qa-quantitative-ability",
        syllabus: [
          "Tangents, Secants & Cyclic Quadrilaterals high-yield theorems",
          "3D Mensuration: Cones, Frustums, Prisms & Volume ratios",
          "Past 5 Years CAT Geometry PYQ shortcuts & elimination tips",
          "Live Q&A + Rapid 60-second CAT drill with faculty"
        ],
        enrolledCount: 384
      },
      {
        id: "agenda-dilr-matrix",
        title: "CAT DILR: Arrangements & Matrix Sets Workshop",
        topic: "Data Interpretation & Logical Reasoning",
        faculty: "Arun Sharma Mentor Team",
        facultyBio: "DILR Master Strategist • 99.9%ile CAT Mentor",
        timeRange: "10:00 AM – 12:00 PM",
        dateFormatted: "Tomorrow • 10:00 AM – 12:00 PM",
        isLiveNow: false,
        duration: "120 min",
        activity: "Workshop",
        color: "#0D9488",
        iconBg: "#0D9488",
        topicUrl: "/topics/dilr-data-interpretation",
        syllabus: [
          "Complex Linear & Circular Arrangements with conditional clues",
          "Multi-Variable Matrix Grid Deduction & Binary Logic",
          "Constraint Elimination Strategy to solve 4 sets in 40 mins",
          "Interactive Caselet Speed-Run & Doubt Clearing"
        ],
        enrolledCount: 420
      }
    ];

    if (isDemo) {
      return allSessions;
    }

    if (enrolledCount === 0) {
      return [];
    }

    return allSessions.filter((session) => {
      if (session.id === "agenda-qa-geo") {
        return enrolledTopicsList.includes("qa-quantitative-ability");
      }
      if (session.id === "agenda-dilr-matrix") {
        return enrolledTopicsList.includes("dilr-data-interpretation");
      }
      return false;
    });
  }, [isDemo, enrolledCount, enrolledTopicsList]);

  // Dynamic CAT Prep Notices
  const prepNotices: PrepNotice[] = useMemo(() => {
    return [
      {
        id: "notice-mock-07",
        title: "All-India National CAT Mock 07 Registration Open",
        badge: "National Mock",
        badgeBg: "#EFF6FF",
        badgeColor: "#2563EB",
        desc: "Live All-India percentile benchmark with 25,000+ serious aspirants. Timed 66-question simulation.",
        dateNotice: "Registration active • Closes in 3 days",
        thumbUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=160&auto=format&fit=crop&q=80",
        actionUrl: "/browse?section=mocks#mock-section",
        actionLabel: "Attempt Mock"
      },
      {
        id: "notice-gdpi-prep",
        title: "IIM Mock Viva & GD-PI Preparation Schedules Released",
        badge: "Interview Prep",
        badgeBg: "#ECFDF5",
        badgeColor: "#059669",
        desc: "WAT reviews, SOP vetting & 1-on-1 mock interviews by IIM Ahmedabad, Bangalore & Calcutta alumni.",
        dateNotice: "Slot bookings open for CAT 2024/25 qualifiers",
        thumbUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80",
        actionUrl: "/intelligence/b-school-predictor",
        actionLabel: "Check Call Odds"
      }
    ];
  }, []);

  // Calendar indicator dots — derived from real DB tasks + enrolled topics
  const taskCategoryMap = useMemo(() => {
    const map: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">> = {};

    // 1. Dots from real DB tasks (manually-added, with category inferred from title)
    scheduleTasks.forEach((t) => {
      const taskMonth = t.monthIndex !== undefined ? t.monthIndex : selectedMonthIndex;
      const taskYear = t.year !== undefined ? t.year : selectedYear;
      if (taskMonth === selectedMonthIndex && taskYear === selectedYear) {
        if (!map[t.day]) map[t.day] = [];
        const cat = t.category || "QA";
        if (!map[t.day].includes(cat)) map[t.day].push(cat);
      }
    });

    // 2. Dots from enrolled topics — show a realistic study pattern across the month
    //    so the calendar reflects what the user is enrolled in even without manual tasks
    const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const today = new Date();
    const isFutureMonth =
      selectedYear > today.getFullYear() ||
      (selectedYear === today.getFullYear() && selectedMonthIndex > today.getMonth());

    enrolledTopicsList.forEach((topicId, topicIdx) => {
      let cat: "QA" | "DILR" | "VARC" | "Mock" = "QA";
      if (topicId.includes("dilr") || topicId.includes("data")) cat = "DILR";
      else if (topicId.includes("varc") || topicId.includes("verbal")) cat = "VARC";

      // Offset pattern per topic so dots spread across different days
      const offset = topicIdx % 3; // 0, 1, 2 → different days
      for (let day = 1 + offset; day <= daysInMonth; day += 2) {
        // For current/past months: only show up to today; for future: show all
        const cutoff = isFutureMonth ? daysInMonth : today.getDate() + 14;
        if (day <= cutoff) {
          if (!map[day]) map[day] = [];
          if (!map[day].includes(cat)) map[day].push(cat);
        }
      }
    });

    return map;
  }, [scheduleTasks, enrolledTopicsList, selectedMonthIndex, selectedYear]);

  const handleToggleTask = (id: string) => {
    // Only allow toggling tasks for today
    const now = new Date();
    const isToday =
      selectedMonthIndex === now.getMonth() &&
      selectedYear === now.getFullYear() &&
      selectedDay === now.getDate();
    if (!isToday) {
      return;
    }
    setScheduleTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      const willBeCompleted = task ? !task.isCompleted : false;
      const updated = prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));

      if (task && willBeCompleted) {
        const remaining = updated.filter(
          (t) =>
            t.day === selectedDay &&
            (t.monthIndex ?? 8) === selectedMonthIndex &&
            !t.isCompleted
        ).length;
        notifyTaskCompleted(task.title, remaining, user?.id);
      }
      return updated;
    });
  };

  const handleAutoAssignDay = (day: number) => {
    if (!isDemo && enrolledCount === 0) {
      return;
    }

    const newItems: ScheduleItem[] = [];
    const isEnrolledQA = isDemo || enrolledTopicsList.includes("qa-quantitative-ability");
    const isEnrolledDILR = isDemo || enrolledTopicsList.includes("dilr-data-interpretation");
    const isEnrolledVARC = isDemo || enrolledTopicsList.includes("varc-verbal-ability");

    if (isEnrolledQA) {
      newItems.push({
        id: "auto-" + day + "-qa",
        day,
        monthIndex: selectedMonthIndex,
        year: selectedYear,
        timeRange: "10:00 AM",
        duration: "60 min",
        category: "QA",
        code: "CAT-QA-S" + day,
        title: "Arithmetic & Percentage Foundations Problem Set",
        subtitle: "Auto-assigned from Enrolled QA Course",
        isCompleted: false,
      });
    }

    if (isEnrolledDILR) {
      newItems.push({
        id: "auto-" + day + "-dilr",
        day,
        monthIndex: selectedMonthIndex,
        year: selectedYear,
        timeRange: "03:00 PM",
        duration: "45 min",
        category: "DILR",
        code: "CAT-LR-S" + day,
        title: "Matrix & Grid Logic Practice Set",
        subtitle: "Auto-assigned from Enrolled DILR Course",
        isCompleted: false,
      });
    }

    if (isEnrolledVARC && newItems.length === 0) {
      newItems.push({
        id: "auto-" + day + "-varc",
        day,
        monthIndex: selectedMonthIndex,
        year: selectedYear,
        timeRange: "02:00 PM",
        duration: "40 min",
        category: "VARC",
        code: "CAT-VARC-S" + day,
        title: "Reading Comprehension Strategy Set",
        subtitle: "Auto-assigned from Enrolled VARC Course",
        isCompleted: false,
      });
    }

    if (newItems.length > 0) {
      setScheduleTasks((prev) => [...prev, ...newItems]);
      if (!isDemo && user) {
        newItems.forEach((item) => {
          const taskDate = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          fetch("/api/dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: item.title, taskDate }),
          }).catch(() => {});
        });
      }
    }
  };

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Detailed Metric Modal State
  const [activeModal, setActiveModal] = useState<"inProgress" | "completed" | "watching" | "points" | null>(null);

  // Fetch live dashboard analytics from Supabase
  const fetchDashboard = async () => {
    try {
      const headers: Record<string, string> = {};
      // Send user ID as Authorization header as fallback if the httpOnly cookie
      // isn't accessible in some deployment environments
      if (user?.id) {
        headers["Authorization"] = `Bearer ${user.id}`;
      }
      const res = await fetch("/api/dashboard", { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          setDashboardData(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openAddTaskModal = () => {
    const y = selectedYear;
    const m = String(selectedMonthIndex + 1).padStart(2, "0");
    const d = String(selectedDay).padStart(2, "0");
    setTaskDate(`${y}-${m}-${d}`);
    setIsTaskModalOpen(true);
  };

  // Handle adding new task to Supabase & local schedule state
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      const [yearStr, monthStr, dayStr] = taskDate.split("-");
      const targetYear = parseInt(yearStr, 10) || selectedYear;
      const targetMonthIndex = parseInt(monthStr, 10) - 1;
      const targetDay = parseInt(dayStr, 10) || selectedDay;

      const newTask: ScheduleItem = {
        id: "custom-" + Date.now(),
        day: targetDay,
        monthIndex: targetMonthIndex,
        year: targetYear,
        timeRange: "Flexible",
        duration: "45 min",
        category: "QA",
        code: "CUSTOM",
        title: taskTitle.trim(),
        subtitle: "Personal Target Task",
        isCompleted: false,
      };

      setScheduleTasks((prev) => [...prev, newTask]);

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
      } else {
        setTaskTitle("");
        setIsTaskModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      setIsTaskModalOpen(false);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  useEffect(() => {
    // All users: always use real DB tasks — no more hardcoded curriculum
    if (dashboardData?.tasks) {
      const mapped: ScheduleItem[] = dashboardData.tasks.map((t, idx) => {
        const d = new Date(t.task_date + "T00:00:00"); // force local date parse
        // Infer category from task title keywords
        const titleLower = t.title.toLowerCase();
        let cat: "QA" | "DILR" | "VARC" | "Mock" = "QA";
        if (titleLower.includes("dilr") || titleLower.includes("data") || titleLower.includes("logical") || titleLower.includes("arrangement")) {
          cat = "DILR";
        } else if (titleLower.includes("varc") || titleLower.includes("verbal") || titleLower.includes("reading") || titleLower.includes("rc") || titleLower.includes("comprehension")) {
          cat = "VARC";
        } else if (titleLower.includes("mock") || titleLower.includes("test") || titleLower.includes("exam")) {
          cat = "Mock";
        }
        return {
          id: t.id || `task-${idx}`,
          day: d.getDate(),
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          timeRange: "Flexible",
          duration: "45 min",
          category: cat,
          code: "STUDY",
          title: t.title,
          subtitle: "Study Task",
          isCompleted: t.is_completed,
        };
      });
      setScheduleTasks(mapped);
    } else {
      setScheduleTasks([]);
    }
  }, [dashboardData?.tasks]);

  const displayName = resolveStudentName(user?.fullName, user?.email);
  const firstName = displayName.split(" ")[0] || displayName;

  // Always use real DB data — no fake fallback values
  const metrics = dashboardData?.metrics || {
    inProgressCourses: 0,
    completedCourses: 0,
    watchingTime: "0h 0 min",
    pointsEarned: 0,
  };

  const ZERO_WEEK = [
    { day: "Sun", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Mon", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Tue", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Wed", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Thu", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Fri", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Sat", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
  ];
  const currentWeeklyStats = dashboardData?.weeklyStats && dashboardData.weeklyStats.length === 7
    ? dashboardData.weeklyStats
    : ZERO_WEEK;

  const streak = currentWeeklyStats.filter(s => (s.rawLearning || 0) > 0 || (s.rawChallenge || 0) > 0).length;

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== HEADER SECTION ===== */}
      {/* Sticky Top Navigation Bar */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
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
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile Dropdown */}
            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* Hero Welcome / Metrics Section */}
      <div className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Welcome Row */}
          <div className={styles.welcomeRow}>
            <div>
              <div className={styles.pillBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Welcome Back, Aspirant
              </div>
              <h1 className={styles.welcomeHeading}>
                Welcome back, <span className={styles.headingHighlight}>{firstName}</span>
              </h1>
              <p className={styles.welcomeSubtitle}>Here&apos;s a report on your study progress this week.</p>
            </div>
            <div className={styles.welcomeActions}>
              <Link href="/browse" className={styles.addCourseBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Browse Topics
              </Link>
            </div>
          </div>

          {/* AI Motivation Widget */}
          <AiMotivationWidget firstName={firstName} streak={streak} points={metrics.pointsEarned} />

          {/* 4 Metric Cards Row */}
          <div className={styles.metricCardsRow}>
            {/* Card 1: In Progress */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderLeft: '4px solid #8b5cf6' }}
              onClick={() => setActiveModal("inProgress")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.inProgressCourses} Topics</span>
                <span className={styles.metricLabel}>In Progress</span>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', borderLeft: '4px solid #0D9488' }}
              onClick={() => setActiveModal("completed")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.completedCourses} Topics</span>
                <span className={styles.metricLabel}>Completed</span>
              </div>
            </div>

            {/* Card 3: Watching Time */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderLeft: '4px solid #2563EB' }}
              onClick={() => setActiveModal("watching")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.watchingTime}</span>
                <span className={styles.metricLabel}>Watching Time</span>
              </div>
            </div>

            {/* Card 4: Total Points */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', borderLeft: '4px solid #6366F1' }}
              onClick={() => setActiveModal("points")}
            >
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
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.pointsEarned} Points</span>
                <span className={styles.metricLabel}>Total Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN DASHBOARD CONTENT AREA ===== */}
      <main className={styles.mainContent}>
        {/* Full Width Spotlight: Continue Learning Widget */}
        <div style={{ marginBottom: "28px" }}>
          <ContinueLearningWidget isDemo={isDemo} topicProgress={dashboardData?.detailed?.inProgressTopics || []} />
        </div>

        {/* 2-Column Responsive Dashboard Grid (65% / 35%) */}
        <div className={styles.dashboardGrid}>
          {/* LEFT COLUMN: Study Planner, Performance Chart & Notices (65%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Daily Study Schedule & Tasks */}
            <DailyStudySchedule
              selectedMonthIndex={selectedMonthIndex}
              selectedYear={selectedYear}
              selectedDay={selectedDay}
              tasks={scheduleTasks}
              onToggleTask={handleToggleTask}
              onAddTask={openAddTaskModal}
              onAutoAssignDay={handleAutoAssignDay}
              enrolledCount={enrolledCount}
              isDemo={isDemo}
            />

            {/* 2. Study Performance Chart with Side-by-Side AI Performance Analysis */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Study Performance</h2>
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
                <div style={{ flex: 1.25, minWidth: 0, width: "100%" }}>
                  <StudyPerformanceChart data={currentWeeklyStats} />
                </div>

                {/* AI Performance Analysis inside Study Performance card */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", borderLeft: "1px solid #F1F5F9", paddingLeft: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ padding: "6px", background: "#EFF6FF", borderRadius: "8px", color: "#2563EB" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1E293B", margin: 0 }}>AI Performance Analysis</h3>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                    {isDemo ? (
                      <>Your learning hours are <strong>up 16%</strong> this week. You are spending disproportionately more time on Quantitative Ability compared to VARC.</>
                    ) : (dashboardData?.summary?.totalHoursWeek || 0) > 0 ? (
                      <>You have logged <strong>{dashboardData?.summary?.totalHoursWeek} hours</strong> this week. Maintain steady consistency across all 3 CAT sections.</>
                    ) : (
                      <>Your study activity is currently at <strong>0 hours</strong> this week. Attend your first video lecture and solve practice drills to start logging your learning pace.</>
                    )}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#F8FAFC", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Quant Progress</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: isDemo ? "#0D9488" : "#64748B", background: isDemo ? "#F0FDFA" : "#F1F5F9", padding: "2px 8px", borderRadius: "6px" }}>
                        {isDemo ? "Good Pace" : (dashboardData?.detailed?.inProgressTopics?.some(t => t.topic_id === 'qa-quantitative-ability') ? "In Progress" : "Ready to Begin")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>VARC Progress</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: isDemo ? "#EF4444" : "#64748B", background: isDemo ? "#FEE2E2" : "#F1F5F9", padding: "2px 8px", borderRadius: "6px" }}>
                        {isDemo ? "Needs Attention" : (dashboardData?.detailed?.inProgressTopics?.some(t => t.topic_id === 'varc-verbal-ability') ? "In Progress" : "Ready to Begin")}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: "#EFF6FF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "700", color: "#1E3A8A", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommended Next Step</h4>
                    <p style={{ fontSize: "12px", color: "#1E40AF", margin: 0, fontWeight: "500", lineHeight: "1.4" }}>
                      {isDemo
                        ? "Take a Reading Comprehension sectional mock today to identify weak spots."
                        : "Start with QA Module 1.1 Percentage Foundations or explore the CAT syllabus."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Upcoming Agenda (Full Column Width) - Dynamic & Interactive */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 className={styles.cardTitle}>Upcoming Agenda</h2>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: "6px" }}>
                    Live & Upcoming
                  </span>
                </div>
              </div>
              <div className={styles.agendaList}>
                {upcomingAgenda.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 20px", background: "#F8FAFC", borderRadius: "12px", border: "1px dashed #CBD5E1" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", margin: "0 0 4px 0" }}>
                      No Upcoming Live Classes Scheduled
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 16px 0", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                      You haven&apos;t enrolled in any modules yet. Live masterclasses, faculty Q&amp;A sessions, and workshops will appear here once you enroll in Quantitative Aptitude, DILR, or VARC.
                    </p>
                    <Link
                      href="/browse"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <span>Browse Courses &amp; Enroll</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  upcomingAgenda.map((item) => (
                  <div
                    key={item.id}
                    className={styles.agendaItem}
                    onClick={() => {
                      setLiveStreamAlert(null);
                      setSelectedAgenda(item);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedAgenda(item);
                      }
                    }}
                  >
                    <div className={styles.agendaLeft}>
                      <div className={styles.agendaIconBox} style={{ background: item.iconBg }}>
                        {item.activity === "Live Class" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="3" rx="2" />
                            <line x1="8" x2="16" y1="21" y2="21" />
                            <line x1="12" x2="12" y1="17" y2="21" />
                          </svg>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {item.isLiveNow && (
                            <span className={styles.agendaLiveTag}>
                              <span className={styles.agendaLivePulse} />
                              Live Today
                            </span>
                          )}
                          <h3 className={styles.agendaTitle}>{item.title}</h3>
                        </div>
                        <p className={styles.agendaMeta}>
                          <span style={{ fontWeight: "600", color: "#4B5563" }}>{item.faculty}</span>
                          <span>•</span>
                          <span>{item.dateFormatted}</span>
                        </p>
                      </div>
                    </div>
                    <div className={styles.agendaRight}>
                      <div className={styles.agendaMetaCol}>
                        <span className={styles.agendaMetaLabel}>Duration</span>
                        <span className={styles.agendaMetaVal}>{item.duration}</span>
                      </div>
                      <div className={styles.agendaMetaCol}>
                        <span className={styles.agendaMetaLabel}>Activity</span>
                        <span className={styles.agendaMetaVal}>{item.activity}</span>
                      </div>
                      <div className={styles.agendaCtaBtn}>
                        <span>{item.isLiveNow ? "Join Class" : "View Session"}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )))}
              </div>
            </div>

            {/* 4. CAT Prep Notices (Full Column Width) - Dynamic & Clickable */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 className={styles.cardTitle}>CAT Prep Notices</h2>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: "6px" }}>
                    Official Updates
                  </span>
                </div>
              </div>
              <div className={styles.noticeList}>
                {prepNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className={styles.noticeItem}
                    onClick={() => router.push(notice.actionUrl)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(notice.actionUrl);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={notice.thumbUrl}
                      alt={notice.title}
                      className={styles.noticeThumb}
                    />
                    <div className={styles.noticeContent}>
                      <span
                        className={styles.noticeBadge}
                        style={{ background: notice.badgeBg, color: notice.badgeColor }}
                      >
                        {notice.badge}
                      </span>
                      <h3 className={styles.noticeTitle}>{notice.title}</h3>
                      <span className={styles.noticeDate}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {notice.dateNotice}
                      </span>
                    </div>
                    <div className={styles.noticeCtaBtn}>
                      <span>{notice.actionLabel}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Calendar, Readiness & Leaderboard (35%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Interactive Study Calendar */}
            <StudyCalendarWidget
              selectedMonthIndex={selectedMonthIndex}
              onSelectMonthIndex={setSelectedMonthIndex}
              selectedYear={selectedYear}
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay(day)}
              taskCategoryMap={taskCategoryMap}
              isDemo={isDemo}
            />

            {/* 2. CAT 2026 Readiness & Weak Area Diagnostic */}
            <CatReadinessWidget isDemo={isDemo} topicProgress={dashboardData?.detailed?.inProgressTopics || []} />

            {/* 3. Weekly Leaderboard */}
            <LeaderboardWidget />
          </div>
        </div>
      </main>

      {/* ===== DETAILED METRIC MODAL ===== */}
      {activeModal && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
            <div className={styles.modalHeader} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <h3 className={styles.modalTitle} style={{ fontSize: '20px', fontWeight: '700' }}>
                  {activeModal === "inProgress" && "Topics In Progress"}
                  {activeModal === "completed" && "Completed Topics"}
                  {activeModal === "watching" && "Watching Time"}
                  {activeModal === "points" && "Total Points"}
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  {activeModal === "inProgress" && `You have ${metrics.inProgressCourses} topics currently in progress.`}
                  {activeModal === "completed" && `You have completed ${metrics.completedCourses} topics so far.`}
                  {activeModal === "watching" && `You have spent ${metrics.watchingTime} watching video lessons.`}
                  {activeModal === "points" && `You have earned ${metrics.pointsEarned} points across all activities.`}
                </p>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* In Progress */}
              {activeModal === "inProgress" && (!dashboardData?.detailed?.inProgressTopics || dashboardData.detailed.inProgressTopics.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  No topics currently in progress. Browse topics and start learning.
                </div>
              )}
              {activeModal === "inProgress" && dashboardData?.detailed?.inProgressTopics?.map((topic: any) => (
                <div key={topic.topic_id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6' }}>{topic.progress_percent}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      Lessons: {topic.completed_lessons?.length || 0} completed<br/>
                      Last accessed: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </div>
                    <Link href="/browse" onClick={() => setActiveModal(null)} style={{ background: '#2563EB', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}

              {/* Completed Topics */}
              {activeModal === "completed" && (!dashboardData?.detailed?.completedTopics || dashboardData.detailed.completedTopics.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  You haven&apos;t completed any topics yet.
                </div>
              )}
              {activeModal === "completed" && dashboardData?.detailed?.completedTopics?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #F0FDFA', background: '#f0fdfa' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Completed on: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0D9488' }}>+{topic.points_earned || 0} pts</span>
                  </div>
                </div>
              ))}

              {/* Watching Time */}
              {activeModal === "watching" && (!dashboardData?.detailed?.watchingHistory || dashboardData.detailed.watchingHistory.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  No watching activity yet.
                </div>
              )}
              {activeModal === "watching" && dashboardData?.detailed?.watchingHistory?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #DBEAFE', background: '#EFF6FF' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Last watched: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#2563EB' }}>
                      {Math.floor(topic.watching_time_minutes / 60) > 0 && `${Math.floor(topic.watching_time_minutes / 60)}h `}
                      {topic.watching_time_minutes % 60}m
                    </span>
                  </div>
                </div>
              ))}

              {/* Total Points */}
              {activeModal === "points" && (!dashboardData?.detailed?.pointsHistory || dashboardData.detailed.pointsHistory.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  Start learning and completing activities to earn points.
                </div>
              )}
              {activeModal === "points" && dashboardData?.detailed?.pointsHistory?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #eef2ff', background: '#f8fafc' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Earned on: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#6366F1' }}>+{topic.points_earned || 0} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

      {/* ===== AGENDA SESSION DETAILS MODAL ===== */}
      {selectedAgenda && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedAgenda(null)}>
          <div className={styles.agendaModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ marginBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      background: selectedAgenda.isLiveNow ? "#FEF2F2" : "#F0FDF4",
                      color: selectedAgenda.isLiveNow ? "#DC2626" : "#16A34A",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedAgenda.activity}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6B7280", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>{selectedAgenda.enrolledCount} Aspirants Enrolled</span>
                  </span>
                </div>
                <h3 className={styles.modalTitle} style={{ fontSize: "19px", lineHeight: "1.3" }}>
                  {selectedAgenda.title}
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedAgenda(null)}
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Faculty Box */}
            <div className={styles.agendaFacultyBox}>
              <div className={styles.agendaFacultyAvatar}>
                {selectedAgenda.faculty.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1E3A8A" }}>
                  {selectedAgenda.faculty}
                </div>
                <div style={{ fontSize: "11.5px", color: "#3B82F6", fontWeight: "500" }}>
                  {selectedAgenda.facultyBio}
                </div>
              </div>
            </div>

            {/* Meta Grid */}
            <div className={styles.agendaModalMetaGrid}>
              <div className={styles.agendaModalMetaItem}>
                <label>Date & Time</label>
                <span>{selectedAgenda.dateFormatted}</span>
              </div>
              <div className={styles.agendaModalMetaItem}>
                <label>Duration</label>
                <span>{selectedAgenda.duration}</span>
              </div>
              <div className={styles.agendaModalMetaItem}>
                <label>Subject</label>
                <span>{selectedAgenda.topic}</span>
              </div>
            </div>

            {/* Syllabus */}
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#111827", margin: "14px 0 8px" }}>
                Session Key Takeaways & Syllabus:
              </h4>
              <div className={styles.agendaSyllabusList}>
                {selectedAgenda.syllabus.map((item, idx) => (
                  <div key={idx} className={styles.agendaSyllabusItem}>
                    <svg className={styles.agendaSyllabusCheck} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {liveStreamAlert && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "10px 14px", borderRadius: "10px", color: "#065F46", fontSize: "12.5px", fontWeight: "600", marginBottom: "14px" }}>
                {liveStreamAlert}
              </div>
            )}

            {/* Actions */}
            <div className={styles.agendaModalActions}>
              <button
                type="button"
                className={styles.agendaPrimaryAction}
                onClick={() => {
                  setLiveStreamAlert("Connecting to Live Classroom stream... Redirecting to Topic Masterclass!");
                  setTimeout(() => {
                    const url = selectedAgenda.topicUrl;
                    setSelectedAgenda(null);
                    router.push(url);
                  }, 800);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Enter Classroom</span>
              </button>

              <button
                type="button"
                className={styles.agendaSecondaryAction}
                onClick={() => {
                  const id = selectedAgenda.id;
                  const alreadySaved = agendaReminderSaved[id];
                  if (!alreadySaved) {
                    setAgendaReminderSaved((prev) => ({ ...prev, [id]: true }));
                    pushNotification({
                      type: "system",
                      category: "learning",
                      title: `Reminder Set: ${selectedAgenda.title}`,
                      desc: `Session scheduled for ${selectedAgenda.dateFormatted}. We will alert you 15 minutes before start.`,
                      actionUrl: selectedAgenda.topicUrl,
                      actionLabel: "View Session",
                      priority: "normal",
                      icon: "schedule",
                      iconBg: "#EFF6FF",
                      iconColor: "#2563EB",
                    }, user?.id);
                  }
                }}
              >
                {agendaReminderSaved[selectedAgenda.id] ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Reminder Set</span>
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Remind Me</span>
                  </span>
                )}
              </button>

              <Link
                href={selectedAgenda.topicUrl}
                className={styles.agendaSecondaryAction}
                onClick={() => setSelectedAgenda(null)}
              >
                View Topic →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
