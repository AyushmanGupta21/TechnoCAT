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

/**
 * Load all notifications for the user, applying read and dismissal states.
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
  return [];
}

/**
 * Push a new dynamic notification into the user's feed.
 */
export function pushNotification(
  notif: Omit<NotificationItem, "id" | "timestamp" | "read">,
  userId?: string
): NotificationItem[] {
  const state = getStoredState(userId);
  const newItem: NotificationItem = {
    ...notif,
    id: `notif-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now(),
    read: false,
  };
  state.customList.unshift(newItem);
  saveStoredState(state, userId);
  return loadNotifications(userId);
}
