// Notification service for TechnoCAT (client).
//
// The feed comes from GET /api/notifications, which derives every item from the student's
// real data (study tasks, quiz attempts, points, announcements). Only the demo account gets
// sample items, and those are flagged `isSample`. Read/dismissed state stays in localStorage
// per user, keyed by the server's stable ids. Actions that "just happened" in this browser
// (enrolment, reminder set, task completed) may add short-lived local entries for that user.

import type { ServerNotification } from "@/lib/notifications";

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
  | "system"
  | "task"
  | "live_class"
  | "notice"
  | "points";

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
  /** True only for showcase items shown to the demo account. */
  isSample?: boolean;
}

interface NotificationStorageState {
  readIds: string[];
  dismissedIds: string[];
  customList: NotificationItem[];
}

const STORAGE_KEY_PREFIX = "technocat_notifications_v3";
const UPDATE_EVENT = "technocat_notifications_updated";
const LOCAL_ITEM_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_LOCAL_ITEMS = 20;
const MAX_STORED_IDS = 300;

// Server feed cache, per user id. Populated by refreshNotifications().
const serverCache = new Map<string, NotificationItem[]>();
const inflight = new Map<string, Promise<void>>();
let lastUserId: string | undefined;

const EMPTY_STATE = (): NotificationStorageState => ({ readIds: [], dismissedIds: [], customList: [] });

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

function resolveUserId(userId?: string): string | undefined {
  return userId || lastUserId;
}

function getStoredState(userId?: string): NotificationStorageState {
  const uid = resolveUserId(userId);
  if (typeof window === "undefined" || !uid) return EMPTY_STATE();
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotificationStorageState>;
      return {
        readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
        dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : [],
        customList: Array.isArray(parsed.customList) ? parsed.customList : [],
      };
    }
  } catch (err) {
    console.warn("[NotificationService] Error reading from localStorage:", err);
  }
  return EMPTY_STATE();
}

function saveStoredState(state: NotificationStorageState, userId?: string) {
  const uid = resolveUserId(userId);
  if (typeof window === "undefined" || !uid) return;
  const cutoff = Date.now() - LOCAL_ITEM_TTL_MS;
  const pruned: NotificationStorageState = {
    readIds: state.readIds.slice(-MAX_STORED_IDS),
    dismissedIds: state.dismissedIds.slice(-MAX_STORED_IDS),
    customList: state.customList.filter((n) => n.timestamp >= cutoff).slice(0, MAX_LOCAL_ITEMS),
  };
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(pruned));
  } catch (err) {
    console.warn("[NotificationService] Error writing to localStorage:", err);
  }
}

function notifyListeners() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }
}

/**
 * Format timestamp into human-readable relative time (e.g. "Just now", "15m ago", "2h ago", "Yesterday").
 * Future timestamps (upcoming classes) read as "Upcoming".
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < -minute) return "Upcoming";
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < 24 * hour) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 48 * hour) return "Yesterday";
  return `${Math.floor(diff / day)} days ago`;
}

const ICONS: Record<ServerNotification["type"], { icon: string; iconBg: string; iconColor: string }> = {
  task: { icon: "calendar", iconBg: "#EFF6FF", iconColor: "#2563EB" },
  live_class: { icon: "schedule", iconBg: "#F5F3FF", iconColor: "#7C3AED" },
  notice: { icon: "notes", iconBg: "#F0FDF4", iconColor: "#16A34A" },
  quiz: { icon: "target", iconBg: "#ECFDF5", iconColor: "#059669" },
  mock: { icon: "clipboard", iconBg: "#EFF6FF", iconColor: "#2563EB" },
  points: { icon: "trophy", iconBg: "#FEF3C7", iconColor: "#D97706" },
  system: { icon: "rocket", iconBg: "#EFF6FF", iconColor: "#2563EB" },
};

function fromServer(n: ServerNotification): NotificationItem {
  const timestamp = new Date(n.createdAt).getTime() || Date.now();
  const style = ICONS[n.type] ?? ICONS.system;
  const urgentOverdue = n.type === "task" && n.priority === "urgent";
  return {
    id: n.id,
    type: n.type,
    category: n.category,
    title: n.title,
    desc: n.desc,
    time: formatRelativeTime(timestamp),
    timestamp,
    read: false,
    actionUrl: n.actionUrl,
    actionLabel: n.actionLabel,
    priority: n.priority,
    ...style,
    ...(urgentOverdue ? { icon: "alert", iconBg: "#FEF2F2", iconColor: "#DC2626" } : {}),
    isSample: n.isSample === true,
  };
}

/**
 * Fetch the user's feed from /api/notifications and notify listeners.
 * Safe to call repeatedly; concurrent calls for the same user share one request.
 */
export function refreshNotifications(userId?: string): Promise<void> {
  const uid = resolveUserId(userId);
  if (typeof window === "undefined" || !uid) return Promise.resolve();
  lastUserId = uid;
  const existing = inflight.get(uid);
  if (existing) return existing;
  const p = (async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return; // keep whatever we had; never substitute fake items
      const data = (await res.json()) as { items?: ServerNotification[] };
      serverCache.set(uid, Array.isArray(data.items) ? data.items.map(fromServer) : []);
      notifyListeners();
    } catch (err) {
      console.warn("[NotificationService] Could not load notifications:", err);
    } finally {
      inflight.delete(uid);
    }
  })();
  inflight.set(uid, p);
  return p;
}

/** Forget cached items (e.g. on logout / user switch). */
export function resetNotificationCache(): void {
  serverCache.clear();
  lastUserId = undefined;
}

function readPrefs(userId?: string) {
  const prefs = { streakNotif: true, revisionNotif: true, mockAlerts: true, milestoneNotif: true };
  if (typeof window === "undefined") return prefs;
  try {
    const stored = localStorage.getItem(`technocat_settings_${resolveUserId(userId) || "guest"}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const key of Object.keys(prefs) as (keyof typeof prefs)[]) {
        if (typeof parsed[key] === "boolean") prefs[key] = parsed[key];
      }
    }
  } catch {}
  return prefs;
}

/**
 * Load the user's notifications (cached server feed + local "just happened" entries),
 * applying read/dismissed state and recomputing relative times. Synchronous; call
 * refreshNotifications() to pull fresh data from the server.
 * The second argument is accepted for backwards compatibility and ignored — the server
 * decides whether the account is the demo showcase.
 */
export function loadNotifications(userId?: string, _isDemo?: boolean): NotificationItem[] {
  const uid = resolveUserId(userId);
  if (!uid) return [];
  const state = getStoredState(uid);
  const readSet = new Set(state.readIds);
  const dismissedSet = new Set(state.dismissedIds);
  const prefs = readPrefs(uid);
  const cutoff = Date.now() - LOCAL_ITEM_TTL_MS;

  const combined = [...state.customList.filter((n) => n.timestamp >= cutoff), ...(serverCache.get(uid) ?? [])];

  const map = new Map<string, NotificationItem>();
  for (const item of combined) {
    if (dismissedSet.has(item.id) || map.has(item.id)) continue;
    if ((item.type === "streak_alert" || item.type === "task") && !prefs.streakNotif) continue;
    if (item.type === "revision" && !prefs.revisionNotif) continue;
    if ((item.type === "mock" || item.type === "mock_pyq") && !prefs.mockAlerts) continue;
    if ((item.type === "milestone" || item.type === "quiz" || item.type === "points") && !prefs.milestoneNotif) continue;
    map.set(item.id, {
      ...item,
      time: formatRelativeTime(item.timestamp),
      read: readSet.has(item.id) || item.read,
    });
  }

  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/** Mark a single notification as read. */
export function markAsRead(id: string, userId?: string): NotificationItem[] {
  const state = getStoredState(userId);
  if (!state.readIds.includes(id)) {
    state.readIds.push(id);
    saveStoredState(state, userId);
    notifyListeners();
  }
  return loadNotifications(userId);
}

/** Mark all current notifications as read. */
export function markAllAsRead(userId?: string): NotificationItem[] {
  const list = loadNotifications(userId);
  const state = getStoredState(userId);
  state.readIds = Array.from(new Set([...state.readIds, ...list.map((n) => n.id)]));
  saveStoredState(state, userId);
  notifyListeners();
  return loadNotifications(userId);
}

/** Dismiss a single notification. */
export function dismissNotification(id: string, userId?: string): NotificationItem[] {
  const state = getStoredState(userId);
  if (!state.dismissedIds.includes(id)) {
    state.dismissedIds.push(id);
    saveStoredState(state, userId);
    notifyListeners();
  }
  return loadNotifications(userId);
}

/** Dismiss all current notifications. */
export function clearAllNotifications(userId?: string): NotificationItem[] {
  const list = loadNotifications(userId);
  const state = getStoredState(userId);
  state.dismissedIds = Array.from(new Set([...state.dismissedIds, ...list.map((n) => n.id)]));
  state.customList = [];
  saveStoredState(state, userId);
  notifyListeners();
  return loadNotifications(userId);
}

/**
 * Record something the user just did in this browser (e.g. enrolled in a topic, set a reminder).
 * Stored locally for that user only and expires after 3 days. Without a known user it is a no-op.
 */
export function pushNotification(
  notif: Omit<NotificationItem, "id" | "timestamp" | "read" | "time">,
  userId?: string
): NotificationItem[] {
  const uid = resolveUserId(userId);
  if (!uid) return [];
  const state = getStoredState(uid);
  const newItem: NotificationItem = {
    ...notif,
    isSample: false,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: "Just now",
    timestamp: Date.now(),
    read: false,
  };
  state.customList.unshift(newItem);
  saveStoredState(state, uid);
  notifyListeners();
  return loadNotifications(uid);
}

// ==========================================
// ACTIVITY-BASED TRIGGERS
// ==========================================

/**
 * Called when a quiz is submitted. The attempt is recorded server-side, so instead of
 * creating a local item we re-fetch the feed (after the save has had time to land).
 */
export function notifyQuizCompleted(
  _quizTitle: string,
  _score: number,
  _total: number,
  userId?: string
): NotificationItem[] {
  const uid = resolveUserId(userId);
  if (typeof window !== "undefined" && uid) {
    window.setTimeout(() => void refreshNotifications(uid), 2500);
  }
  return loadNotifications(uid);
}

/** Called when a study task is ticked off; the task state itself lives in the database. */
export function notifyTaskCompleted(
  taskTitle: string,
  remainingToday: number,
  userId?: string
): NotificationItem[] {
  const uid = resolveUserId(userId);
  if (typeof window !== "undefined" && uid) {
    window.setTimeout(() => void refreshNotifications(uid), 1500);
  }
  if (remainingToday === 0) {
    return pushNotification(
      {
        type: "milestone",
        category: "learning",
        title: "All tasks finished today!",
        desc: "You completed every task scheduled for today.",
        actionUrl: "/dashboard",
        actionLabel: "View Schedule",
        priority: "normal",
        icon: "flame",
        iconBg: "#FEF3C7",
        iconColor: "#D97706",
      },
      uid
    );
  }
  return pushNotification(
    {
      type: "task",
      category: "learning",
      title: `Task completed: ${taskTitle}`,
      desc: `${remainingToday} task${remainingToday > 1 ? "s" : ""} left in today's plan.`,
      actionUrl: "/dashboard",
      actionLabel: "Continue",
      priority: "low",
      icon: "check",
      iconBg: "#F0FDF4",
      iconColor: "#16A34A",
    },
    uid
  );
}
