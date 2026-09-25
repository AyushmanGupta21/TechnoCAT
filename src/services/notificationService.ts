// Dynamic & Live Notification Service for TechnoCAT

export type NotificationType =
  | "mock"
  | "mock_pyq"
  | "resume"
  | "revision"
  | "streak_alert"
  | "bschool"
  | "ai"
  | "quiz"
  | "milestone"
  | "system";

export type NotificationCategory = "all" | "unread" | "mocks" | "learning";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: "mocks" | "learning";
  title: string;
  desc: string;
  time: string;
  timestamp: number;
  read: boolean;
  actionUrl: string;
  actionLabel: string;
  priority?: "urgent" | "normal" | "low";
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface NotificationStorageState {
  readIds: string[];
  dismissedIds: string[];
  customList: NotificationItem[];
}

const STORAGE_KEY_PREFIX = "technocat_notifications_v2";

const now = Date.now();
const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;

// Initial intelligent base notifications
const BASE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-streak-alert",
    type: "streak_alert",
    category: "learning",
    title: "Study Streak Alert: 2 Days Pending ⚠️",
    desc: "You skipped scheduled VARC & QA practice drills. Spend 20 minutes today to maintain your CAT readiness momentum.",
    time: "15m ago",
    timestamp: now - 15 * minute,
    read: false,
    actionUrl: "/dashboard",
    actionLabel: "Catch Up on Tasks",
    priority: "urgent",
    icon: "⚠️",
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
  },
  {
    id: "notif-spaced-revision",
    type: "revision",
    category: "learning",
    title: "Retention Check: Time to Revise Percentages 🧠",
    desc: "It's been 6 days since your last Percentages session. A 10-minute formula review now locks in 85% long-term recall.",
    time: "1 hour ago",
    timestamp: now - 1 * hour,
    read: false,
    actionUrl: "/topics/qa-quantitative-ability",
    actionLabel: "Revise Topic",
    priority: "normal",
    icon: "🧠",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
  },
  {
    id: "notif-mock-live",
    type: "mock",
    category: "mocks",
    title: "TechnoCAT 6.0 Full Mock is Live 🎯",
    desc: "Live All-India percentile benchmark open with 20,000+ serious aspirants. Attempt in realistic exam-timer conditions.",
    time: "2 hours ago",
    timestamp: now - 2 * hour,
    read: false,
    actionUrl: "/dashboard",
    actionLabel: "Attempt Mock",
    priority: "urgent",
    icon: "🎯",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    id: "notif-bschool-check",
    type: "bschool",
    category: "learning",
    title: "B-School Probability Update: Check IIM Calls 🏛️",
    desc: "Your Quant accuracy is up +8%! Check how this impacts your shortlist probability for IIM Ahmedabad, Bangalore & FMS.",
    time: "4 hours ago",
    timestamp: now - 4 * hour,
    read: false,
    actionUrl: "/intelligence/b-school-predictor",
    actionLabel: "Check IIM Calls",
    priority: "normal",
    icon: "🏛️",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
  },
  {
    id: "notif-resume-video",
    type: "resume",
    category: "learning",
    title: "Continue Watching: QA-1.1 Percentages ▶️",
    desc: "Resume where you left off: Module 1.1 • Speed Maths & Fraction-to-Percentage Conversions with Rodha Quant.",
    time: "Yesterday",
    timestamp: now - 1 * day,
    read: false,
    actionUrl: "/topics/qa-quantitative-ability",
    actionLabel: "Resume Video",
    priority: "normal",
    icon: "▶️",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    id: "notif-cat-pyq",
    type: "mock_pyq",
    category: "mocks",
    title: "CAT 2024 Actual Papers (All 3 Slots) 📋",
    desc: "Official question papers with step-by-step video solutions and timed exam simulation ready for practice.",
    time: "Yesterday",
    timestamp: now - 1.2 * day,
    read: true,
    actionUrl: "/browse?section=pyqs#pyq-section",
    actionLabel: "Practice PYQ",
    priority: "normal",
    icon: "📋",
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
  },
  {
    id: "notif-ai-error",
    type: "ai",
    category: "learning",
    title: "AI Weak Topic Alert: Geometry Dips to 68% 🔍",
    desc: "AI Error Tracker detected recurring negative marks on circle tangents and coordinate geometry.",
    time: "2 days ago",
    timestamp: now - 2 * day,
    read: true,
    actionUrl: "/intelligence/error-tracking",
    actionLabel: "Inspect Errors",
    priority: "normal",
    icon: "🔍",
    iconBg: "#FFF1F2",
    iconColor: "#E11D48",
  },
  {
    id: "notif-milestone-points",
    type: "milestone",
    category: "learning",
    title: "Milestone Unlocked: 50 Quant Points! 🏆",
    desc: "Great consistency! You've unlocked the Level 2 Quantitative Aptitude badge and jumped +42 ranks on the Leaderboard.",
    time: "3 days ago",
    timestamp: now - 3 * day,
    read: true,
    actionUrl: "/analytics",
    actionLabel: "View Standing",
    priority: "low",
    icon: "🏆",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
];

function getStorageKey(userId?: string): string {
  const safeId = userId || "guest";
  return `${STORAGE_KEY_PREFIX}_${safeId}`;
}

function getStoredState(userId?: string): NotificationStorageState {
  if (typeof window === "undefined") {
    return { readIds: [], dismissedIds: [], customList: [] };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[NotificationService] Error reading from localStorage:", err);
  }
  return { readIds: [], dismissedIds: [], customList: [] };
}

function saveStoredState(state: NotificationStorageState, userId?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch (err) {
    console.warn("[NotificationService] Error writing to localStorage:", err);
  }
}

function notifyListeners() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("technocat_notifications_updated"));
  }
}

/**
 * Format timestamp into human-readable relative time (e.g. "Just now", "15m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < 24 * hour) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 48 * hour) return "Yesterday";
  return `${Math.floor(diff / day)} days ago`;
}

/**
 * Daily check: automatically triggers daily morning sprint notification if a new calendar day has arrived.
 */
export function checkDailyNotifications(userId?: string): void {
  if (typeof window === "undefined") return;
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastCheckKey = `technocat_last_daily_check_${userId || "guest"}`;
  const lastCheck = localStorage.getItem(lastCheckKey);

  if (lastCheck !== todayStr) {
    localStorage.setItem(lastCheckKey, todayStr);

    const state = getStoredState(userId);
    const dayLabel = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const newDailyItem: NotificationItem = {
      id: `notif-daily-sprint-${todayStr}`,
      type: "system",
      category: "learning",
      title: `Today's CAT Sprint Ready 📅 (${dayLabel})`,
      desc: "Your adaptive study schedule is loaded with today's target drills. Maintain consistency to boost your CAT percentile.",
      time: "Just now",
      timestamp: Date.now(),
      read: false,
      actionUrl: "/dashboard",
      actionLabel: "View Daily Tasks",
      priority: "normal",
      icon: "📅",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    };

    // Avoid duplicate if already exists
    if (!state.customList.some((n) => n.id === newDailyItem.id)) {
      state.customList.unshift(newDailyItem);
      saveStoredState(state, userId);
      notifyListeners();
    }
  }
}

/**
 * Load all notifications for the user, applying read and dismissal states,
 * recomputing relative time dynamically.
 */
export function loadNotifications(userId?: string): NotificationItem[] {
  const state = getStoredState(userId);
  const readSet = new Set(state.readIds);
  const dismissedSet = new Set(state.dismissedIds);

  const combined = [...state.customList, ...BASE_NOTIFICATIONS];

  // Deduplicate by ID
  const map = new Map<string, NotificationItem>();
  for (const item of combined) {
    if (!dismissedSet.has(item.id) && !map.has(item.id)) {
      map.set(item.id, {
        ...item,
        time: formatRelativeTime(item.timestamp),
        read: readSet.has(item.id) || item.read,
      });
    }
  }

  // Sort descending by timestamp
  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Mark a single notification as read.
 */
export function markAsRead(id: string, userId?: string): NotificationItem[] {
  const state = getStoredState(userId);
  if (!state.readIds.includes(id)) {
    state.readIds.push(id);
    saveStoredState(state, userId);
    notifyListeners();
  }
  return loadNotifications(userId);
}

/**
 * Mark all notifications as read.
 */
export function markAllAsRead(userId?: string): NotificationItem[] {
  const list = loadNotifications(userId);
  const state = getStoredState(userId);
  const allIds = list.map((n) => n.id);
  state.readIds = Array.from(new Set([...state.readIds, ...allIds]));
  saveStoredState(state, userId);
  notifyListeners();
  return loadNotifications(userId);
}

/**
 * Dismiss / delete a single notification.
 */
export function dismissNotification(id: string, userId?: string): NotificationItem[] {
  const state = getStoredState(userId);
  if (!state.dismissedIds.includes(id)) {
    state.dismissedIds.push(id);
    saveStoredState(state, userId);
    notifyListeners();
  }
  return loadNotifications(userId);
}

/**
 * Clear all notifications (dismiss all current items).
 */
export function clearAllNotifications(userId?: string): NotificationItem[] {
  const list = loadNotifications(userId);
  const state = getStoredState(userId);
  const allIds = list.map((n) => n.id);
  state.dismissedIds = Array.from(new Set([...state.dismissedIds, ...allIds]));
  saveStoredState(state, userId);
  notifyListeners();
  return [];
}

/**
 * Push a new dynamic notification into the user's feed.
 */
export function pushNotification(
  notif: Omit<NotificationItem, "id" | "timestamp" | "read" | "time">,
  userId?: string
): NotificationItem[] {
  const state = getStoredState(userId);
  const newItem: NotificationItem = {
    ...notif,
    id: `notif-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    time: "Just now",
    timestamp: Date.now(),
    read: false,
  };
  state.customList.unshift(newItem);
  saveStoredState(state, userId);
  notifyListeners();
  return loadNotifications(userId);
}

// ==========================================
// ACTIVITY-BASED NOTIFICATION TRIGGERS
// ==========================================

/**
 * Triggered when a student completes a quiz or drill.
 */
export function notifyQuizCompleted(
  quizTitle: string,
  score: number,
  total: number,
  userId?: string
): NotificationItem[] {
  const percent = Math.round((score / total) * 100);
  const earnedPoints = score * 5;
  return pushNotification(
    {
      type: "quiz",
      category: "learning",
      title: `Quiz Completed: ${quizTitle} 🎯`,
      desc: `You scored ${score}/${total} (${percent}% accuracy) and earned +${earnedPoints} practice points!`,
      actionUrl: "/analytics",
      actionLabel: "View Analytics",
      priority: percent >= 80 ? "normal" : "urgent",
      icon: "🎯",
      iconBg: percent >= 80 ? "#ECFDF5" : "#FFFBEB",
      iconColor: percent >= 80 ? "#059669" : "#D97706",
    },
    userId
  );
}

/**
 * Triggered when a student completes tasks in DailyStudySchedule.
 */
export function notifyTaskCompleted(
  taskTitle: string,
  remainingToday: number,
  userId?: string
): NotificationItem[] {
  if (remainingToday === 0) {
    return pushNotification(
      {
        type: "milestone",
        category: "learning",
        title: "All Tasks Finished Today! 🔥",
        desc: "Outstanding work! You completed all scheduled drills for today and secured your study streak.",
        actionUrl: "/dashboard",
        actionLabel: "View Schedule",
        priority: "normal",
        icon: "🔥",
        iconBg: "#FEF3C7",
        iconColor: "#D97706",
      },
      userId
    );
  }
  return pushNotification(
    {
      type: "resume",
      category: "learning",
      title: `Task Completed: ${taskTitle} ✅`,
      desc: `Great progress! You have ${remainingToday} task${remainingToday > 1 ? "s" : ""} remaining in today's plan.`,
      actionUrl: "/dashboard",
      actionLabel: "Continue Sprint",
      priority: "low",
      icon: "✅",
      iconBg: "#F0FDF4",
      iconColor: "#16A34A",
    },
    userId
  );
}

/**
 * Triggered when user watches or resumes a video lesson.
 */
export function notifyVideoProgress(
  topicTitle: string,
  moduleTitle: string,
  topicUrl: string,
  userId?: string
): NotificationItem[] {
  return pushNotification(
    {
      type: "resume",
      category: "learning",
      title: `Continue Watching: ${topicTitle} ▶️`,
      desc: `Pick up where you left off on ${moduleTitle}. Keep your daily study pace going.`,
      actionUrl: topicUrl,
      actionLabel: "Resume Video",
      priority: "normal",
      icon: "▶️",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    userId
  );
}

/**
 * Triggered when a full mock or sectional mock is finished.
 */
export function notifyMockResult(
  mockName: string,
  percentile: number,
  score: number,
  userId?: string
): NotificationItem[] {
  return pushNotification(
    {
      type: "mock",
      category: "mocks",
      title: `${mockName} Result Ready! 🏆`,
      desc: `Your national benchmark is live: ${percentile} percentile with a score of ${score}. Check detailed question-by-question analysis.`,
      actionUrl: "/intelligence/error-tracking",
      actionLabel: "View Analysis",
      priority: "urgent",
      icon: "🏆",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    userId
  );
}

/**
 * Triggered when a topic requires spaced repetition revision.
 */
export function notifySpacedRevision(
  topicName: string,
  daysAgo: number,
  topicUrl: string,
  userId?: string
): NotificationItem[] {
  return pushNotification(
    {
      type: "revision",
      category: "learning",
      title: `Retention Check: Revise ${topicName} 🧠`,
      desc: `It's been ${daysAgo} days since your last ${topicName} drill. A quick 10-minute review now locks in long-term memory.`,
      actionUrl: topicUrl,
      actionLabel: "Revise Topic",
      priority: "normal",
      icon: "🧠",
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
    },
    userId
  );
}
