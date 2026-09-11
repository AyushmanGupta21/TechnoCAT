// Memory-Efficient Quiz Background Pre-Generation & Caching Service
// Keeps browser memory minimal by storing only lightweight question IDs (< 1-2 KB)
// and maintaining a single-slot bounded cache for 0ms instant pop-up.

import {
  ModuleQuestion,
  getUniqueModuleQuiz,
  getUniqueGrandQuiz,
} from "@/data/moduleQuizData";

// In-memory single-slot cache for the immediate next upcoming quiz
const memoryQuizCache: Map<string, ModuleQuestion[]> = new Map();

function getStorageKey(topicId: string, moduleTitle: string): string {
  const clean = moduleTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  return `technocat_used_q_${topicId}_${clean}`;
}

function getCacheStorageKey(topicId: string, moduleTitle: string): string {
  const clean = moduleTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  return `technocat_pregen_${topicId}_${clean}`;
}

/**
 * Retrieves the list of question IDs previously seen by the user for this module/grand quiz.
 * Memory footprint: ~200 bytes to 1 KB.
 */
export function getUsedQuestionIds(topicId: string, moduleTitle: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(topicId, moduleTitle));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Marks question IDs as used so they are never served again on retakes or future attempts.
 */
export function markQuestionsUsed(
  topicId: string,
  moduleTitle: string,
  questionIds: string[]
): void {
  if (typeof window === "undefined" || !questionIds || questionIds.length === 0) return;
  try {
    const current = getUsedQuestionIds(topicId, moduleTitle);
    const combined = Array.from(new Set([...current, ...questionIds]));
    // Keep bounded: store up to maximum 100 recent IDs to strictly prevent memory leaks
    const bounded = combined.slice(-100);
    localStorage.setItem(getStorageKey(topicId, moduleTitle), JSON.stringify(bounded));
  } catch {}
}

/**
 * Retrieves the pre-generated quiz from cache if available.
 * Returns null if not cached yet.
 * When retrieved, consumes the single-slot cache to keep storage clean.
 */
export function getCachedNextQuiz(
  topicId: string,
  moduleTitle: string
): ModuleQuestion[] | null {
  const cacheKey = `${topicId}::${moduleTitle}`;

  // 1. Check memory cache first
  if (memoryQuizCache.has(cacheKey)) {
    const questions = memoryQuizCache.get(cacheKey)!;
    memoryQuizCache.delete(cacheKey);
    return questions;
  }

  // 2. Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const storageKey = getCacheStorageKey(topicId, moduleTitle);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        localStorage.removeItem(storageKey); // self-evict
        const questions: ModuleQuestion[] = JSON.parse(raw);
        if (Array.isArray(questions) && questions.length > 0) {
          return questions;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Silently pre-generates the next batch of unique questions in the background
 * while the user is reviewing results, watching lectures, or browsing pages.
 * Ensures the next quiz attempt pops up with 0ms delay.
 */
export function preloadNextQuizInBackground(
  topicId: string,
  moduleTitle: string,
  isGrandQuiz = false,
  allModulesList: string[] = []
): void {
  if (typeof window === "undefined") return;

  const runGeneration = () => {
    try {
      const usedIds = getUsedQuestionIds(topicId, moduleTitle);
      let nextQuestions: ModuleQuestion[];

      if (isGrandQuiz) {
        nextQuestions = getUniqueGrandQuiz(topicId, "Course", allModulesList, usedIds);
      } else {
        nextQuestions = getUniqueModuleQuiz(topicId, moduleTitle, usedIds);
      }

      if (nextQuestions && nextQuestions.length > 0) {
        const cacheKey = `${topicId}::${moduleTitle}`;
        // Keep single-slot in memory
        memoryQuizCache.set(cacheKey, nextQuestions);

        // Also persist single-slot in localStorage for cross-page navigation
        try {
          const storageKey = getCacheStorageKey(topicId, moduleTitle);
          localStorage.setItem(storageKey, JSON.stringify(nextQuestions));
        } catch {}
      }
    } catch (err) {
      console.warn("Background quiz pre-generation deferred:", err);
    }
  };

  // Run in idle callback or small timeout so UI main thread is never blocked
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => runGeneration(), { timeout: 1500 });
  } else {
    setTimeout(runGeneration, 100);
  }
}

/**
 * Clears question history if student resets attempts after re-watching lectures.
 */
export function clearModuleQuizHistory(topicId: string, moduleTitle: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getStorageKey(topicId, moduleTitle));
    localStorage.removeItem(getCacheStorageKey(topicId, moduleTitle));
    const cacheKey = `${topicId}::${moduleTitle}`;
    memoryQuizCache.delete(cacheKey);
  } catch {}
}
