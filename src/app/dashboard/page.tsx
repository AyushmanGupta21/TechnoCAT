"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Gauge,
  Megaphone,
  Play,
  Plus,
  Radio,
  Trophy,
  X,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { Reveal, RevealGroup, RevealItem, CountUp, GradientText, Doodle } from "@/components/landing/motion";
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

/** Status chip for a section's timed-test accuracy (tone maps to a CSS class). */
function sectionBadge(accuracy: number | null, attempted: number): { text: string; tone: "none" | "good" | "mid" | "low" } {
  if (accuracy === null || attempted === 0) return { text: "No timed tests yet", tone: "none" };
  if (accuracy >= 75) return { text: `${accuracy}%`, tone: "good" };
  if (accuracy >= 60) return { text: `${accuracy}%`, tone: "mid" };
  return { text: `${accuracy}%`, tone: "low" };
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
  QA: { label: "Quantitative Aptitude", color: "#2563EB", softBg: "rgba(59, 130, 246, 0.1)", topicUrl: "/topics/qa-quantitative-ability" },
  DILR: { label: "Data Interpretation & Logical Reasoning", color: "#0D9488", softBg: "rgba(20, 184, 166, 0.12)", topicUrl: "/topics/dilr-data-interpretation" },
  VARC: { label: "Verbal Ability & Reading Comprehension", color: "#7C3AED", softBg: "rgba(139, 92, 246, 0.1)", topicUrl: "/topics/varc-verbal-ability" },
  GENERAL: { label: "General", color: "#1C44BD", softBg: "rgba(28, 68, 189, 0.08)", topicUrl: "/topics" },
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
    setTodayDay(String(now.getDate()).padStart(2, "0"));
    setTodayLabel(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);
  // Header date, set on the client so server and client markup match.
  const [todayLabel, setTodayLabel] = useState("");
  const [todayDay, setTodayDay] = useState("");

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


  // Stat-row vignettes (display only, derived from the same metrics)
  const weekTotals = last7Days.map((d) => d.learningSeconds + d.practiceSeconds);
  const weekMax = Math.max(1, ...weekTotals);
  const syllabusBySection = SECTION_ORDER.map((key) => ({
    key,
    done: metrics
      ? metrics.courses.topics.filter((t) => t.section === key).reduce((sum, t) => sum + t.lessonsCompleted, 0)
      : 0,
  }));
  const syllabusTotal = metrics ? Math.max(1, metrics.courses.syllabusLessons) : 1;
  const syllabusPercent = metrics ? Math.round((syllabusLessonsDone / syllabusTotal) * 100) : 0;
  const latestPoints = metrics?.points.recent[0] ?? null;
  const readinessScore = metrics?.readiness.score ?? null;
  const RING = 2 * Math.PI * 17;

  return (
    <div className={styles.dashboardWrapper}>
      <AppNav />

      <main className={styles.page}>
        {/* ===== PAGE HEADER ===== */}
        <Reveal className={styles.pageHeader} y={16}>
          <span className={styles.headerWatermark} aria-hidden="true" suppressHydrationWarning>{todayDay}</span>
          <div className={styles.headerText}>
            <p className={styles.headerDate}>
              <span className={styles.liveDot} aria-hidden="true" />
              <span suppressHydrationWarning>{todayLabel || " "}</span>
            </p>
            <h1 className={styles.pageTitle}>
              Today&apos;s{" "}
              <span className={styles.titleAccent}>
                <GradientText>plan</GradientText>
                <Doodle kind="underline" className={styles.titleUnderline} color="var(--data-cyan)" strokeWidth={3} delay={0.45} />
              </span>
            </h1>
            <p className={styles.pageSubtitle}>Your tasks, progress and next step for today, {firstName}.</p>
          </div>
          <Link href="/browse" className={styles.primaryBtn}>
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
            Browse topics
          </Link>
        </Reveal>

        {/* ===== TODAY'S FOCUS: the one place for guidance (tasks, streak, next step) ===== */}
        <Reveal delay={0.04}>
          <AiMotivationWidget
            firstName={firstName}
            metrics={metrics}
            isLoading={metricsLoading}
            nextStep={metrics ? recommendedNextStep(metrics) : undefined}
          />
        </Reveal>

        {metricsError && !metricsLoading && (
          <p className={styles.metricsErrorNote} role="status">{metricsError}</p>
        )}

        {/* ===== STAT ROW: headline numbers that link to the detailed pages ===== */}
        <RevealGroup className={styles.statRow}>
          {/* Readiness -> Intelligence Hub */}
          <RevealItem className={styles.statItem}>
            <Link href="/intelligence" className={`glass-card ${styles.statCard}`} data-tint="blue" title="See the readiness breakdown in the Intelligence Hub">
              <span className={styles.statLabel}>
                <Gauge size={16} strokeWidth={2} aria-hidden="true" className={styles.statIconBlue} />
                CAT readiness
              </span>
              <div className={styles.statBody}>
                <div className={styles.statMain}>
                  {kpiPending ? (
                    <span className={styles.statValue}>—</span>
                  ) : readinessScore !== null ? (
                    <span className={styles.statValue}>
                      <CountUp to={readinessScore} />
                      <span className={styles.statUnit}>/100</span>
                    </span>
                  ) : (
                    <span className={styles.statValueEmpty}>Not yet</span>
                  )}
                  <span className={styles.statCaption}>
                    {!kpiPending && readinessScore === null ? "Take a timed test to unlock" : "Coverage, accuracy, pace, consistency"}
                  </span>
                </div>
                <svg className={styles.ring} viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="17" className={styles.ringTrack} />
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    className={styles.ringFill}
                    strokeDasharray={RING}
                    strokeDashoffset={RING * (1 - (readinessScore ?? 0) / 100)}
                  />
                </svg>
              </div>
            </Link>
          </RevealItem>

          {/* Study time this week -> My Analytics */}
          <RevealItem className={styles.statItem}>
            <Link href="/analytics" className={`glass-card ${styles.statCard}`} data-tint="teal" title="See your study time in My Analytics">
              <span className={styles.statLabel}>
                <Clock size={16} strokeWidth={2} aria-hidden="true" className={styles.statIconTeal} />
                Study time · 7 days
              </span>
              <div className={styles.statBody}>
                <div className={styles.statMain}>
                  <span className={styles.statValue}>{kpiPending ? "—" : formatDuration(metrics.studyTime.last7DaysSeconds)}</span>
                  <span className={styles.statCaption}>
                    {kpiPending ? "Learning + practice" : `${formatDuration(metrics.studyTime.todaySeconds)} today`}
                  </span>
                </div>
                <div className={styles.miniBars} aria-hidden="true">
                  {(weekTotals.length ? weekTotals : [0, 0, 0, 0, 0, 0, 0]).map((v, i, arr) => (
                    <span
                      key={i}
                      className={`${styles.miniBar} ${i === arr.length - 1 ? styles.miniBarToday : ""}`}
                      style={{ height: `${Math.max(8, Math.round((v / weekMax) * 100))}%` }}
                    />
                  ))}
                </div>
              </div>
            </Link>
          </RevealItem>

          {/* Points -> My Analytics */}
          <RevealItem className={styles.statItem}>
            <Link href="/analytics" className={`glass-card ${styles.statCard}`} data-tint="amber" title="See how you earned your points in My Analytics">
              <span className={styles.statLabel}>
                <Trophy size={16} strokeWidth={2} aria-hidden="true" className={styles.statIconAmber} />
                Total points
              </span>
              <div className={styles.statMain}>
                <span className={styles.statValue}>
                  {kpiPending ? "—" : <CountUp to={metrics.points.total} />}
                  {!kpiPending && <span className={styles.statUnit}>XP</span>}
                </span>
                {latestPoints ? (
                  <span className={styles.pointsChip} title={latestPoints.reason}>
                    <span className={styles.pointsChipValue}>+{latestPoints.points}</span>
                    <span className={styles.pointsChipReason}>{latestPoints.reason}</span>
                  </span>
                ) : (
                  <span className={styles.statCaption}>Earn XP from lessons and quizzes</span>
                )}
              </div>
            </Link>
          </RevealItem>

          {/* Syllabus lessons completed -> My Topics */}
          <RevealItem className={styles.statItem}>
            <Link href="/topics" className={`glass-card ${styles.statCard}`} data-tint="violet" title="Open My Topics">
              <span className={styles.statLabel}>
                <BookOpen size={16} strokeWidth={2} aria-hidden="true" className={styles.statIconViolet} />
                Syllabus coverage
              </span>
              <div className={styles.statMain}>
                <span className={styles.statValue}>
                  {kpiPending ? "—" : syllabusLessonsDone}
                  {!kpiPending && <span className={styles.statUnit}>/ {metrics.courses.syllabusLessons} lessons</span>}
                </span>
                <div className={styles.coverageBar} aria-hidden="true">
                  {syllabusBySection.map((s) => (
                    <span
                      key={s.key}
                      className={`${styles.coverageSeg} ${styles[`seg${s.key}`]}`}
                      style={{ width: `${(s.done / syllabusTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <span className={styles.statCaption}>
                  {kpiPending
                    ? "QA · DILR · VARC"
                    : `${syllabusPercent}% · ${metrics.courses.inProgress} in progress, ${metrics.courses.completed} done`}
                </span>
              </div>
            </Link>
          </RevealItem>
        </RevealGroup>

        {/* ===== CONTINUE LEARNING (featured) ===== */}
        <Reveal className={styles.sectionGap}>
          <ContinueLearningWidget metrics={metrics} isLoading={metricsLoading} />
        </Reveal>

        {/* ===== TWO-COLUMN GRID ===== */}
        <div className={styles.dashboardGrid}>
          {/* LEFT: schedule, study performance, upcoming classes */}
          <div className={styles.dashboardCol}>
            <Reveal>
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
            </Reveal>

            {/* Study performance: last 7 days (metrics.studyTime.daily) + weekly summary */}
            <Reveal>
              <section className={`glass-card ${styles.card}`} data-tint="teal">
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Study performance</h2>
                  <div className={styles.chartLegend}>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.dotLearning}`} />
                      Learning
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.dotPractice}`} />
                      Practice
                    </span>
                  </div>
                </div>

                <div className={styles.studyStatBody}>
                  <div className={styles.chartArea}>
                    {metrics ? (
                      <StudyPerformanceChart daily={last7Days} />
                    ) : (
                      <div className={styles.chartPlaceholder}>
                        {metricsLoading ? "Loading your study time…" : "Study time could not be loaded right now."}
                      </div>
                    )}
                  </div>

                  <div className={styles.weekPanel}>
                    <h3 className={styles.weekTitle}>This week</h3>
                    <p className={styles.weekText}>
                      {metrics ? weeklySummary(metrics) : metricsLoading ? "Loading…" : "Your weekly summary is unavailable right now."}
                    </p>

                    {metrics && (
                      <ul className={styles.sectionList}>
                        {SECTION_ORDER.map((key) => {
                          const sec = metrics.sections[key];
                          const badge = sectionBadge(sec.accuracy, sec.attempted);
                          return (
                            <li key={key} className={styles.sectionRow}>
                              <span className={styles.sectionName}>
                                <span className={`${styles.sectionMarker} ${styles[`seg${key}`]}`} aria-hidden="true" />
                                {SECTION_NAMES[key]}
                                <span className={styles.sectionHint}>timed tests</span>
                              </span>
                              <span className={`${styles.accChip} ${styles[`acc_${badge.tone}`]}`}>{badge.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <Link href="/analytics" className={styles.textLink}>
                      Full study analytics
                      <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            </Reveal>

            {/* Upcoming live classes (published by staff) */}
            <Reveal>
              <section className={`glass-card ${styles.card}`} data-tint="blue">
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Upcoming classes</h2>
                  {announcements?.isSample && <span className={styles.mutedChip}>Sample data</span>}
                </div>
                <div className={styles.agendaList}>
                  {upcomingAgenda.length === 0 ? (
                    <div className={styles.emptyState}>
                      <CalendarClock size={22} strokeWidth={1.75} aria-hidden="true" className={styles.emptyIcon} />
                      <h3 className={styles.emptyTitle}>No live classes scheduled right now</h3>
                      <p className={styles.emptyText}>
                        Live masterclasses and faculty Q&amp;A sessions appear here as soon as they are announced. Meanwhile, keep going with your study plan.
                      </p>
                      <Link href="/browse" className={styles.secondaryBtn}>
                        Browse courses and enroll
                        <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
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
                        <span className={styles.agendaMarker} style={{ background: item.iconBg }} aria-hidden="true" />
                        <div className={styles.agendaMain}>
                          <div className={styles.agendaTitleRow}>
                            {item.isLiveNow && (
                              <span className={styles.agendaLiveTag}>
                                <span className={styles.agendaLivePulse} />
                                Live now
                              </span>
                            )}
                            <h3 className={styles.agendaTitle}>{item.title}</h3>
                          </div>
                          <p className={styles.agendaMeta}>
                            <span className={styles.agendaFaculty}>{item.faculty}</span>
                            <span aria-hidden="true">·</span>
                            <span className={styles.mono}>{item.dateFormatted}</span>
                          </p>
                        </div>
                        <div className={styles.agendaRight}>
                          <span className={styles.agendaMetaCol}>
                            <span className={styles.agendaMetaLabel}>Duration</span>
                            <span className={styles.agendaMetaVal}>{item.duration}</span>
                          </span>
                          <span className={styles.agendaCta}>
                            {item.isLiveNow ? "Join class" : "View session"}
                            <ChevronRight size={16} strokeWidth={2.25} aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </Reveal>
          </div>

          {/* RIGHT: calendar, percentile, leaderboard, notices */}
          <div className={styles.dashboardCol}>
            <Reveal>
              <StudyCalendarWidget
                selectedMonthIndex={selectedMonthIndex}
                onSelectMonthIndex={setSelectedMonthIndex}
                selectedYear={selectedYear}
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay(day)}
                taskCategoryMap={taskCategoryMap}
                isDemo={isDemo}
              />
            </Reveal>

            {/* Estimated percentile + readiness status; full breakdown lives in /intelligence */}
            <Reveal>
              <CatReadinessWidget metrics={metrics} isLoading={metricsLoading} />
            </Reveal>

            <Reveal>
              <LeaderboardWidget />
            </Reveal>

            {/* CAT prep notices */}
            <Reveal>
              <section className={`glass-card ${styles.card}`} data-tint="amber">
                <div className={styles.cardHeader}>
                  <div className={styles.titleGroup}>
                    <h2 className={styles.cardTitle}>Notices</h2>
                    {unreadNoticeCount > 0 && (
                      <span className={styles.unreadChip}>
                        <span className={styles.unreadDot} aria-hidden="true" />
                        {unreadNoticeCount} new
                      </span>
                    )}
                  </div>
                  {prepNotices.length > 0 && unreadNoticeCount > 0 && (
                    <button
                      type="button"
                      className={styles.markAllReadBtn}
                      onClick={() => markAllNoticesVisited(prepNotices.map((n) => n.id))}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className={styles.noticeList}>
                  {prepNotices.length === 0 && (
                    <p className={styles.emptyText}>No notices right now. Official TechnoCAT updates will show up here.</p>
                  )}
                  {prepNotices.map((notice) => {
                    const isUnvisited = noticesHydrated && !visitedNoticeSet.has(notice.id);
                    const cardContent = (
                      <article className={`${styles.noticeItem} ${isUnvisited ? styles.noticeItemUnread : ""}`}>
                        <Megaphone size={16} strokeWidth={2} aria-hidden="true" className={styles.noticeIcon} style={{ color: notice.badgeColor }} />
                        <div className={styles.noticeContent}>
                          <div className={styles.noticeMetaRow}>
                            {isUnvisited && <span className={styles.noticeNew}>New</span>}
                            <span className={styles.noticeBadge} style={{ background: notice.badgeBg, color: notice.badgeColor }}>
                              {notice.badge}
                            </span>
                            <span className={styles.noticeDate}>{notice.dateNotice}</span>
                          </div>
                          <h3 className={styles.noticeTitle}>{notice.title}</h3>
                          {notice.desc && <p className={styles.noticeDesc}>{notice.desc}</p>}
                        </div>
                        {notice.actionUrl && <ChevronRight size={16} strokeWidth={2.25} aria-hidden="true" className={styles.noticeChevron} />}
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
                {prepNotices.length > 0 && (
                  <p className={styles.noticeFoot}>
                    {prepNotices.length} {prepNotices.length === 1 ? "update" : "updates"}
                  </p>
                )}
              </section>
            </Reveal>
          </div>
        </div>
      </main>

      {/* ===== ADD STUDY TASK MODAL ===== */}
      {isTaskModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsTaskModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add study task</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsTaskModalOpen(false)} aria-label="Close">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleAddTask}>
              <div className={styles.formGroup}>
                <label htmlFor="task-title-input" className={styles.formLabel}>Task title</label>
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
                <label htmlFor="task-date-input" className={styles.formLabel}>Target date</label>
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
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button id="create-task-submit-btn" type="submit" disabled={isSubmittingTask} className={styles.submitBtn}>
                  {isSubmittingTask ? "Saving..." : "Create task"}
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
            <div className={styles.modalHeader}>
              <div>
                <span className={`${styles.activityChip} ${selectedAgenda.isLiveNow ? styles.activityChipLive : ""}`}>
                  {selectedAgenda.isLiveNow ? <Radio size={12} strokeWidth={2.25} aria-hidden="true" /> : null}
                  {selectedAgenda.activity}
                </span>
                <h3 className={styles.modalTitle}>{selectedAgenda.title}</h3>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedAgenda(null)} aria-label="Close modal">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className={styles.agendaFacultyBox}>
              <span className={styles.agendaFacultyAvatar}>{selectedAgenda.faculty.charAt(0)}</span>
              <span className={styles.agendaFacultyName}>{selectedAgenda.faculty}</span>
            </div>

            <div className={styles.agendaModalMetaGrid}>
              <div className={styles.agendaModalMetaItem}>
                <label>Date &amp; time</label>
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

            {selectedAgenda.syllabus.length > 0 && (
              <div>
                <h4 className={styles.syllabusHeading}>What the session covers</h4>
                <div className={styles.agendaSyllabusList}>
                  {selectedAgenda.syllabus.map((item, idx) => (
                    <div key={idx} className={styles.agendaSyllabusItem}>
                      <Check size={16} strokeWidth={2.5} className={styles.agendaSyllabusCheck} aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liveStreamAlert && <div className={styles.alertNote}>{liveStreamAlert}</div>}

            <div className={styles.agendaModalActions}>
              {selectedAgenda.joinUrl ? (
                <a href={selectedAgenda.joinUrl} target="_blank" rel="noopener noreferrer" className={styles.agendaPrimaryAction}>
                  <Play size={16} strokeWidth={2.25} aria-hidden="true" />
                  <span>{selectedAgenda.isLiveNow ? "Join class" : "Open class link"}</span>
                </a>
              ) : (
                <span className={styles.agendaPendingNote}>Joining link will be shared before the class</span>
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
                  <>
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    <span>Reminder set</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} strokeWidth={2} aria-hidden="true" />
                    <span>Remind me</span>
                  </>
                )}
              </button>

              <Link href={selectedAgenda.topicUrl} className={styles.agendaSecondaryAction} onClick={() => setSelectedAgenda(null)}>
                View topic
                <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
