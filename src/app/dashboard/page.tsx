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
import BrandLogo from "@/components/BrandLogo";
import type { StudentMetrics, SectionKey } from "@/lib/metrics/types";
import type { Announcements, LiveClass, Notice } from "@/lib/announcements";

interface StudyTask {
  id: string;
  title: string;
  task_date: string;
  is_completed: boolean;
  category?: "QA" | "DILR" | "VARC" | "Mock";
  code?: string;
  time_range?: string;
  duration?: string;
  subtitle?: string;
}

// GET /api/dashboard is used only for the task list and enrolled topic ids.
// Every number on this page comes from GET /api/me/metrics.
interface DashboardData {
  enrolledTopics?: string[];
  tasks: StudyTask[];
  detailed?: {
    inProgressTopics?: { topic_id: string }[];
  };
}

const SECTION_ORDER: SectionKey[] = ["QA", "DILR", "VARC"];
const SECTION_NAMES: Record<SectionKey, string> = { QA: "Quant", DILR: "DILR", VARC: "VARC" };

/** "3h 25m" / "45 min" / "0 min" from seconds. */
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Deterministic weekly summary: last 7 days vs the 7 days before (metrics.studyTime.daily). */
function weeklySummary(m: StudentMetrics): string {
  const daily = m.studyTime.daily;
  const total = (days: typeof daily) => days.reduce((s, d) => s + d.learningSeconds + d.practiceSeconds, 0);
  const thisWeek = total(daily.slice(-7));
  const prevWeek = total(daily.slice(-14, -7));
  if (thisWeek === 0) {
    return prevWeek > 0
      ? `No study time recorded in the last 7 days (previous 7 days: ${formatDuration(prevWeek)}). Open a lesson or a practice set to get back on track.`
      : "No study time recorded in the last 7 days. Open a lesson or attempt a practice set; time is logged automatically.";
  }
  const practice = daily.slice(-7).reduce((s, d) => s + d.practiceSeconds, 0);
  const practiceShare = Math.round((practice / thisWeek) * 100);
  let trend: string;
  if (prevWeek === 0) trend = "with no study time recorded in the 7 days before";
  else {
    const change = Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
    trend =
      change === 0
        ? "the same as the previous 7 days"
        : `${change > 0 ? "up" : "down"} ${Math.abs(change)}% from the previous 7 days (${formatDuration(prevWeek)})`;
  }
  return `You studied ${formatDuration(thisWeek)} in the last 7 days, ${trend}. ${practiceShare}% of it was practice (quizzes and PYQs).`;
}

/** Deterministic next step from weak concepts, section accuracy, readiness and enrolment. */
function recommendedNextStep(m: StudentMetrics): string {
  const weak = m.concepts.weak[0];
  if (weak) {
    return `Revise ${weak.concept}${weak.section ? ` (${weak.section})` : ""}: ${weak.accuracy}% accuracy over ${weak.attempted} questions, your weakest concept so far.`;
  }
  const sectionsWithData = SECTION_ORDER.filter((k) => m.sections[k].accuracy !== null && m.sections[k].attempted >= 5);
  if (sectionsWithData.length > 0) {
    const weakest = [...sectionsWithData].sort((a, b) => (m.sections[a].accuracy ?? 0) - (m.sections[b].accuracy ?? 0))[0];
    return `Your lowest section accuracy is ${weakest} at ${m.sections[weakest].accuracy}%. Attempt a ${weakest} practice set or PYQ section next.`;
  }
  if (m.courses.enrolled === 0) {
    return "Enroll in a CAT topic (QA, DILR or VARC) from Browse to start your study plan.";
  }
  if (m.readiness.score === null) {
    return "Attempt a module quiz or a full PYQ section to unlock your readiness score and section accuracy.";
  }
  return "Keep your streak going and attempt a PYQ section this week to track your estimated percentile.";
}

/** Status badge for a section's timed-test accuracy. */
function sectionBadge(accuracy: number | null, attempted: number): { text: string; color: string; bg: string } {
  if (accuracy === null || attempted === 0) return { text: "No timed tests yet", color: "#64748B", bg: "#F1F5F9" };
  if (accuracy >= 75) return { text: `${accuracy}% accuracy`, color: "#0D9488", bg: "#F0FDFA" };
  if (accuracy >= 60) return { text: `${accuracy}% accuracy`, color: "#B45309", bg: "#FFFBEB" };
  return { text: `${accuracy}% accuracy`, color: "#EF4444", bg: "#FEE2E2" };
}



interface AgendaSession {
  id: string;
  title: string;
  topic: string;
  faculty: string;
  dateFormatted: string;
  isLiveNow: boolean;
  duration: string;
  activity: string;
  iconBg: string;
  topicUrl: string;
  joinUrl: string | null; // real class link published by staff
  syllabus: string[];
}

interface PrepNotice {
  id: string;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  desc: string;
  dateNotice: string;
  actionUrl: string | null;
}

// Live classes and notices are published by staff (scripts/announcements.mjs → GET /api/announcements).
const SECTION_INFO: Record<string, { label: string; color: string; softBg: string; topicUrl: string }> = {
  QA: { label: "Quantitative Aptitude", color: "#DC2626", softBg: "#FEF2F2", topicUrl: "/topics/qa-quantitative-ability" },
  DILR: { label: "Data Interpretation & Logical Reasoning", color: "#0D9488", softBg: "#F0FDFA", topicUrl: "/topics/dilr-data-interpretation" },
  VARC: { label: "Verbal Ability & Reading Comprehension", color: "#7C3AED", softBg: "#F5F3FF", topicUrl: "/topics/varc-verbal-ability" },
  GENERAL: { label: "General", color: "#2563EB", softBg: "#EFF6FF", topicUrl: "/topics" },
};

const istTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

function istDayLabel(iso: string): string {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const target = day(new Date(iso));
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  if (target === day(today)) return "Today";
  if (target === day(tomorrow)) return "Tomorrow";
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
}

function toAgendaSession(c: LiveClass): AgendaSession {
  const info = SECTION_INFO[c.section ?? "GENERAL"] ?? SECTION_INFO.GENERAL;
  const end = c.endsAt ?? new Date(new Date(c.startsAt).getTime() + 3600000).toISOString();
  const minutes = Math.max(1, Math.round((new Date(end).getTime() - new Date(c.startsAt).getTime()) / 60000));
  return {
    id: c.id,
    title: c.title,
    topic: info.label,
    faculty: c.host || "TechnoCAT Faculty",
    dateFormatted: `${istDayLabel(c.startsAt)} • ${istTime(c.startsAt)} – ${istTime(end)}`,
    isLiveNow: c.isLive,
    duration: `${minutes} min`,
    activity: "Live Class",
    iconBg: info.color,
    topicUrl: info.topicUrl,
    joinUrl: c.linkUrl,
    syllabus: (c.body || "").split("\n").map((l) => l.trim()).filter(Boolean),
  };
}

function istNoticeDateLabel(iso: string): string {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const target = day(new Date(iso));
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (target === day(today)) return "Posted Today";
  if (target === day(yesterday)) return "Posted Yesterday";
  return `Posted ${new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}`;
}

function toPrepNotice(n: Notice): PrepNotice {
  const info = SECTION_INFO[n.section ?? "GENERAL"] ?? SECTION_INFO.GENERAL;
  return {
    id: n.id,
    title: n.title,
    badge: n.section && n.section !== "GENERAL" ? n.section : "Notice",
    badgeBg: info.softBg,
    badgeColor: info.color,
    desc: n.body || "",
    dateNotice: istNoticeDateLabel(n.publishedAt),
    actionUrl: n.linkUrl,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");
  const [activeNav, setActiveNav] = useState("Dashboard");

  // Task list + enrolled topic ids (GET /api/dashboard)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Every number on the page (GET /api/me/metrics)
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Enrolled topics: ids from /api/dashboard plus the enrolled courses reported by the metrics endpoint
  const enrolledTopicsList = useMemo(() => {
    const ids = new Set<string>(
      dashboardData?.enrolledTopics ||
        dashboardData?.detailed?.inProgressTopics?.map((t) => t.topic_id) ||
        []
    );
    for (const t of metrics?.courses.topics ?? []) ids.add(t.topicId);
    return Array.from(ids);
  }, [dashboardData, metrics]);

  const enrolledCount = enrolledTopicsList.length;

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

  const [announcements, setAnnouncements] = useState<Announcements | null>(null);
  const [visitedNoticeIds, setVisitedNoticeIds] = useState<string[]>([]);
  const [noticesHydrated, setNoticesHydrated] = useState(false);

  const visitedNoticesStorageKey = useMemo(() => {
    const scope = user?.id || (isDemo ? "demo" : "anon");
    return `technocat_visited_notices_${scope}`;
  }, [user?.id, isDemo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(visitedNoticesStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setVisitedNoticeIds(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
    } catch {
      setVisitedNoticeIds([]);
    } finally {
      setNoticesHydrated(true);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === visitedNoticesStorageKey) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setVisitedNoticeIds(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [visitedNoticesStorageKey]);

  const markNoticeVisited = (noticeId: string) => {
    setVisitedNoticeIds((prev) => {
      if (prev.includes(noticeId)) return prev;
      const next = [noticeId, ...prev].slice(0, 100);
      try {
        localStorage.setItem(visitedNoticesStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const markAllNoticesVisited = (ids: string[]) => {
    setVisitedNoticeIds((prev) => {
      const merged = Array.from(new Set([...ids, ...prev])).slice(0, 100);
      try {
        localStorage.setItem(visitedNoticesStorageKey, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  useEffect(() => {
    if (!user) return;
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Announcements | null) => setAnnouncements(data))
      .catch(() => setAnnouncements(null));
  }, [user]);
  const upcomingAgenda: AgendaSession[] = useMemo(() => (announcements?.liveClasses ?? []).map(toAgendaSession), [announcements]);
  const prepNotices: PrepNotice[] = useMemo(() => (announcements?.notices ?? []).map(toPrepNotice), [announcements]);
  const visitedNoticeSet = useMemo(() => new Set(visitedNoticeIds), [visitedNoticeIds]);
  const unreadNoticeCount = useMemo(
    () => (noticesHydrated ? prepNotices.filter((n) => !visitedNoticeSet.has(n.id)).length : 0),
    [noticesHydrated, prepNotices, visitedNoticeSet]
  );

  // Calendar indicator dots — derived 100% from real DB tasks
  const taskCategoryMap = useMemo(() => {
    const map: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">> = {};

    scheduleTasks.forEach((t) => {
      const taskMonth = t.monthIndex !== undefined ? t.monthIndex : selectedMonthIndex;
      const taskYear = t.year !== undefined ? t.year : selectedYear;
      if (taskMonth === selectedMonthIndex && taskYear === selectedYear) {
        if (!map[t.day]) map[t.day] = [];
        const cat = t.category || "QA";
        if (!map[t.day].includes(cat)) map[t.day].push(cat);
      }
    });

    return map;
  }, [scheduleTasks, selectedMonthIndex, selectedYear]);

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

    let willBeCompleted = false;
    let targetTask: ScheduleItem | undefined;

    setScheduleTasks((prev) => {
      targetTask = prev.find((t) => t.id === id);
      if (!targetTask) return prev;
      willBeCompleted = !targetTask.isCompleted;
      const updated = prev.map((t) => (t.id === id ? { ...t, isCompleted: willBeCompleted } : t));

      if (willBeCompleted) {
        const remaining = updated.filter(
          (t) =>
            t.day === selectedDay &&
            (t.monthIndex ?? 9) === selectedMonthIndex &&
            !t.isCompleted
        ).length;
        notifyTaskCompleted(targetTask.title, remaining, user?.id);
      }
      return updated;
    });

    // Real PostgreSQL update via PATCH
    fetch("/api/dashboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, isCompleted: willBeCompleted }),
    }).then(() => fetchMetrics()).catch((err) => {
      console.error("[Dashboard Task Sync Error]", err);
    });
  };

  const handleAutoAssignDay = async (day: number) => {
    const isEnrolledQA = enrolledTopicsList.includes("qa-quantitative-ability") || enrolledCount === 0;
    const isEnrolledDILR = enrolledTopicsList.includes("dilr-data-interpretation") || enrolledCount === 0;
    const isEnrolledVARC = enrolledTopicsList.includes("varc-verbal-ability");

    const newItems: ScheduleItem[] = [];
    const taskDate = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (isEnrolledQA) {
      newItems.push({
        id: "auto-" + day + "-qa-" + Date.now(),
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
        id: "auto-" + day + "-dilr-" + Date.now(),
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
        id: "auto-" + day + "-varc-" + Date.now(),
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
      // Persist to PostgreSQL database
      for (const item of newItems) {
        await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            taskDate,
            category: item.category,
            code: item.code,
            duration: item.duration,
            subtitle: item.subtitle,
          }),
        }).catch(() => {});
      }
      await fetchDashboard();
      fetchMetrics();
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

  // Fetch the task list / enrolled topics. Auth is carried by the httpOnly session cookie.
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          setDashboardData(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
    }
  };

  // Fetch the single metrics contract (all numbers on this page).
  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/me/metrics");
      if (res.status === 401) {
        setMetricsError("Your session has expired. Please sign in again to see your progress.");
        setMetrics(null);
      } else if (!res.ok) {
        setMetricsError("Your progress numbers could not be loaded right now. Please refresh to try again.");
      } else {
        setMetrics((await res.json()) as StudentMetrics);
        setMetricsError(null);
      }
    } catch (err) {
      console.warn("Failed to fetch metrics:", err);
      setMetricsError("Your progress numbers could not be loaded right now. Please refresh to try again.");
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
      fetchMetrics();
    } else {
      setMetricsLoading(false);
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
        fetchMetrics();
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
    // All users: always use real DB tasks with rich fields and robust date parsing
    if (dashboardData?.tasks) {
      const mapped: ScheduleItem[] = dashboardData.tasks.map((t, idx) => {
        // Robust timezone-free date parsing for 'YYYY-MM-DD'
        const rawDate = String(t.task_date || "").split("T")[0];
        const parts = rawDate.split("-").map(Number);
        const y = parts[0] || 2026;
        const m = (parts[1] || 10) - 1; // 0-indexed month
        const d = parts[2] || 1;

        // Infer category if not explicitly provided
        const titleLower = (t.title || "").toLowerCase();
        let cat: "QA" | "DILR" | "VARC" | "Mock" = "QA";
        if (t.category) {
          cat = t.category;
        } else if (titleLower.includes("dilr") || titleLower.includes("data") || titleLower.includes("logical") || titleLower.includes("arrangement")) {
          cat = "DILR";
        } else if (titleLower.includes("varc") || titleLower.includes("verbal") || titleLower.includes("reading") || titleLower.includes("rc") || titleLower.includes("comprehension")) {
          cat = "VARC";
        } else if (titleLower.includes("mock") || titleLower.includes("test") || titleLower.includes("exam")) {
          cat = "Mock";
        }

        return {
          id: t.id || `task-${idx}`,
          day: d,
          monthIndex: m,
          year: y,
          timeRange: t.time_range || "Flexible",
          duration: t.duration || "60 min",
          category: cat,
          code: t.code || "STUDY",
          title: t.title,
          subtitle: t.subtitle || (cat + " Topic Module"),
          isCompleted: Boolean(t.is_completed),
        };
      });
      setScheduleTasks(mapped);
    } else {
      setScheduleTasks([]);
    }
  }, [dashboardData?.tasks]);

  const displayName = resolveStudentName(user?.fullName, user?.email);
  const firstName = displayName.split(" ")[0] || displayName;

  // KPI values (all from /api/me/metrics)
  const kpiPending = metricsLoading || !metrics;
  const syllabusLessonsDone = metrics
    ? metrics.courses.topics.filter((t) => t.section !== null).reduce((sum, t) => sum + t.lessonsCompleted, 0)
    : 0;
  const last7Days = metrics ? metrics.studyTime.daily.slice(-7) : [];

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== HEADER SECTION ===== */}
      {/* Sticky Top Navigation Bar */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <BrandLogo height={70} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Speak & Assess", href: "/mock-viva-prep" },
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

          {/* Today's Focus (deterministic, from metrics.tasks / metrics.streak / metrics.studyTime) */}
          <AiMotivationWidget firstName={firstName} metrics={metrics} isLoading={metricsLoading} />

          {metricsError && !metricsLoading && (
            <p className={styles.metricsErrorNote} role="status">{metricsError}</p>
          )}

          {/* 4 KPI Cards Row — headline numbers that link to the detailed pages */}
          <div className={styles.metricCardsRow}>
            {/* Card 1: Readiness score -> Intelligence Hub breakdown */}
            <Link
              href="/intelligence"
              className={`${styles.metricCard} ${styles.metricCardLink}`}
              style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderLeft: '4px solid #8b5cf6' }}
              title="See the readiness breakdown in the Intelligence Hub"
            >
              <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                {kpiPending ? (
                  <span className={styles.metricValue}>—</span>
                ) : metrics.readiness.score !== null ? (
                  <span className={styles.metricValue}>{metrics.readiness.score} / 100</span>
                ) : (
                  <span className={styles.metricValueEmpty}>Not yet</span>
                )}
                <span className={styles.metricLabel}>
                  {!kpiPending && metrics.readiness.score === null ? "Readiness · take a timed test" : "CAT Readiness"}
                </span>
              </div>
            </Link>

            {/* Card 2: Study time this week -> My Analytics */}
            <Link
              href="/analytics"
              className={`${styles.metricCard} ${styles.metricCardLink}`}
              style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', borderLeft: '4px solid #0D9488' }}
              title="See your study time in My Analytics"
            >
              <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>
                  {kpiPending ? "—" : formatDuration(metrics.studyTime.last7DaysSeconds)}
                </span>
                <span className={styles.metricLabel}>Study Time · last 7 days</span>
              </div>
            </Link>

            {/* Card 3: Points -> My Analytics */}
            <Link
              href="/analytics"
              className={`${styles.metricCard} ${styles.metricCardLink}`}
              style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderLeft: '4px solid #2563EB' }}
              title="See how you earned your points in My Analytics"
            >
              <div className={`${styles.metricIconBox} ${styles.iconOrange}`}>
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
                <span className={styles.metricValue}>
                  {kpiPending ? "—" : `${metrics.points.total.toLocaleString("en-IN")} Points`}
                </span>
                <span className={styles.metricLabel}>Total Points</span>
              </div>
            </Link>

            {/* Card 4: Syllabus lessons completed -> My Topics */}
            <Link
              href="/topics"
              className={`${styles.metricCard} ${styles.metricCardLink}`}
              style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', borderLeft: '4px solid #6366F1' }}
              title="Open My Topics"
            >
              <div className={`${styles.metricIconBox} ${styles.iconPink}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>
                  {kpiPending ? "—" : `${syllabusLessonsDone} / ${metrics.courses.syllabusLessons}`}
                </span>
                <span className={styles.metricLabel}>
                  {kpiPending
                    ? "CAT Syllabus Lessons"
                    : `Syllabus lessons · ${metrics.courses.inProgress} in progress, ${metrics.courses.completed} done`}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== MAIN DASHBOARD CONTENT AREA ===== */}
      <main className={styles.mainContent}>
        {/* Full Width Spotlight: Continue Learning Widget */}
        <div style={{ marginBottom: "28px" }}>
          <ContinueLearningWidget metrics={metrics} isLoading={metricsLoading} />
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

            {/* 2. Study Performance: last 7 days (metrics.studyTime.daily) + deterministic weekly summary */}
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
                    <span>Practice</span>
                  </div>
                </div>
              </div>

              <div className={styles.studyStatBody}>
                <div style={{ flex: 1.25, minWidth: 0, width: "100%" }}>
                  {metrics ? (
                    <StudyPerformanceChart daily={last7Days} />
                  ) : (
                    <div className={styles.chartPlaceholder}>
                      {metricsLoading ? "Loading your study time…" : "Study time could not be loaded right now."}
                    </div>
                  )}
                </div>

                {/* Weekly summary derived from metrics */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", borderLeft: "1px solid #F1F5F9", paddingLeft: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ padding: "6px", background: "#EFF6FF", borderRadius: "8px", color: "#2563EB" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1E293B", margin: 0 }}>This Week at a Glance</h3>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                    {metrics ? weeklySummary(metrics) : metricsLoading ? "Loading…" : "Your weekly summary is unavailable right now."}
                  </p>

                  {metrics && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#F8FAFC", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                      {SECTION_ORDER.map((key) => {
                        const sec = metrics.sections[key];
                        const badge = sectionBadge(sec.accuracy, sec.attempted);
                        return (
                          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>{SECTION_NAMES[key]} (timed tests)</span>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: badge.color, background: badge.bg, padding: "2px 8px", borderRadius: "6px" }}>
                              {badge.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {metrics && (
                    <div style={{ background: "#EFF6FF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "700", color: "#1E3A8A", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommended Next Step</h4>
                      <p style={{ fontSize: "12px", color: "#1E40AF", margin: 0, fontWeight: "500", lineHeight: "1.4" }}>
                        {recommendedNextStep(metrics)}
                      </p>
                    </div>
                  )}

                  <Link href="/analytics" style={{ fontSize: "12px", fontWeight: 600, color: "#2563EB", textDecoration: "none" }}>
                    Full study analytics →
                  </Link>
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
                  {announcements?.isSample && (
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "6px" }}>
                      Sample data
                    </span>
                  )}
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
                      No live classes scheduled right now
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 16px 0", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                      Live masterclasses and faculty Q&amp;A sessions appear here as soon as they are announced. Meanwhile, keep going with your study plan.
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
                              Live now
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

            {/* 4. CAT Prep Notices (Full Column Width) - Dynamic Daily Notice Board */}
            <div className={styles.cardBox}>
              <div className={styles.noticeBoardHeader}>
                <div className={styles.noticeBoardTitleGroup}>
                  <h2 className={styles.cardTitle}>CAT Prep Notices</h2>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#FEF3C7", color: "#B45309", padding: "3px 9px", borderRadius: "999px" }}>
                    Daily Updates
                  </span>
                  {unreadNoticeCount > 0 && (
                    <span className={styles.noticeUnreadHeaderBadge}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563EB" }} />
                      {unreadNoticeCount} New
                    </span>
                  )}
                </div>
                {prepNotices.length > 0 && (
                  <div className={styles.noticeHeaderActions}>
                    {unreadNoticeCount > 0 && (
                      <button
                        type="button"
                        className={styles.markAllReadBtn}
                        onClick={() => markAllNoticesVisited(prepNotices.map((n) => n.id))}
                      >
                        Mark all read
                      </button>
                    )}
                    <span className={styles.noticeCountPill}>
                      {prepNotices.length} {prepNotices.length === 1 ? "Update" : "Updates"}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.noticeList}>
                {prepNotices.length === 0 && (
                  <p style={{ fontSize: "13px", color: "#64748B", padding: "12px 4px", margin: 0 }}>
                    No notices right now. Official TechnoCAT updates will show up here.
                  </p>
                )}
                {prepNotices.map((notice) => {
                  const isUnvisited = noticesHydrated && !visitedNoticeSet.has(notice.id);
                  const cardContent = (
                    <article
                      className={`${styles.noticeItem} ${isUnvisited ? styles.noticeItemUnread : ""}`}
                      style={{ borderLeftColor: notice.badgeColor }}
                    >
                      <div
                        className={styles.noticeThumb}
                        aria-hidden="true"
                        style={{ background: notice.badgeBg, color: notice.badgeColor }}
                      >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 11l18-5v12L3 14v-3z" />
                          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                        </svg>
                      </div>
                      <div className={styles.noticeContent}>
                        <div className={styles.noticeMetaRow}>
                          {isUnvisited && (
                            <span className={styles.noticeNewBanner}>
                              <span className={styles.noticeNewDot} aria-hidden="true" />
                              NEW
                            </span>
                          )}
                          <span
                            className={styles.noticeBadge}
                            style={{ background: notice.badgeBg, color: notice.badgeColor }}
                          >
                            {notice.badge}
                          </span>
                          <span className={styles.noticeDate}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {notice.dateNotice}
                          </span>
                        </div>
                        <h3 className={styles.noticeTitle}>{notice.title}</h3>
                        {notice.desc && (
                          <p className={styles.noticeDesc}>{notice.desc}</p>
                        )}
                      </div>
                      {notice.actionUrl && (
                        <span className={styles.noticeChevron} aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      )}
                    </article>
                  );

                  return notice.actionUrl ? (
                    <Link
                      key={notice.id}
                      href={notice.actionUrl}
                      className={styles.noticeCardLink}
                      onClick={() => markNoticeVisited(notice.id)}
                    >
                      {cardContent}
                    </Link>
                  ) : isUnvisited ? (
                    <button
                      key={notice.id}
                      type="button"
                      className={styles.noticeCardButton}
                      onClick={() => markNoticeVisited(notice.id)}
                    >
                      {cardContent}
                    </button>
                  ) : (
                    <div key={notice.id}>{cardContent}</div>
                  );
                })}
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

            {/* 2. CAT Readiness: single score + estimated percentile; breakdown lives in /intelligence */}
            <CatReadinessWidget metrics={metrics} isLoading={metricsLoading} />

            {/* 3. Weekly Leaderboard */}
            <LeaderboardWidget />
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

            {/* Syllabus (only when the announcement lists one) */}
            {selectedAgenda.syllabus.length > 0 && (
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
            )}

            {liveStreamAlert && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "10px 14px", borderRadius: "10px", color: "#065F46", fontSize: "12.5px", fontWeight: "600", marginBottom: "14px" }}>
                {liveStreamAlert}
              </div>
            )}

            {/* Actions */}
            <div className={styles.agendaModalActions}>
              {selectedAgenda.joinUrl ? (
                <a
                  href={selectedAgenda.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.agendaPrimaryAction}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{selectedAgenda.isLiveNow ? "Join Class" : "Open Class Link"}</span>
                </a>
              ) : (
                <span className={styles.agendaSecondaryAction} style={{ cursor: "default" }}>
                  Joining link will be shared before the class
                </span>
              )}

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
