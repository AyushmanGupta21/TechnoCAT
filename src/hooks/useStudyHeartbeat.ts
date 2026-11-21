"use client";

// Measures real study time on a lesson and reports it to POST /api/activity.
// Time only counts while `active` is true (e.g. the video is playing) AND the tab is visible.
// Accumulated seconds are sent every ~30 s and flushed when the lesson changes, the tab is
// hidden, or the page unloads.

import { useEffect, useRef } from "react";

const SEND_EVERY_SECONDS = 30;
const MIN_FLUSH_SECONDS = 5;

export function useStudyHeartbeat(opts: {
  enabled: boolean;
  topicId: string;
  lessonId: string;
  active: boolean;
}) {
  const { enabled, topicId, lessonId, active } = opts;
  const pendingRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!enabled || !lessonId) return;
    pendingRef.current = 0;

    const send = (seconds: number, keepalive = false) => {
      if (seconds <= 0) return;
      void fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, lessonId, seconds }),
        keepalive,
      }).catch(() => {});
    };

    const flush = (keepalive = false) => {
      if (pendingRef.current >= MIN_FLUSH_SECONDS) send(pendingRef.current, keepalive);
      pendingRef.current = 0;
    };

    const tick = setInterval(() => {
      if (!activeRef.current || document.visibilityState !== "visible") return;
      pendingRef.current += 1;
      if (pendingRef.current >= SEND_EVERY_SECONDS) {
        send(pendingRef.current);
        pendingRef.current = 0;
      }
    }, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const onUnload = () => flush(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onUnload);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onUnload);
      flush(true); // lesson changed or component unmounted
    };
  }, [enabled, topicId, lessonId]);
}
