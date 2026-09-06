"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TOPICS_DATA, getTopicById, Lesson } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import VideoAskPanel from "@/components/VideoAskPanel";
import QuizViewer from "@/components/QuizViewer";
import { getLessonKnowledge } from "@/data/videoPortions";
import styles from "./topicDetail.module.css";

function parseLessonDuration(durationStr?: string): number {
  if (!durationStr) return 0;
  if (durationStr.includes(":")) {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1];
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  let seconds = 0;
  const hourMatch = durationStr.match(/(\d+)\s*(?:hour|hr)/i);
  if (hourMatch) seconds += parseInt(hourMatch[1], 10) * 3600;
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  if (minMatch) seconds += parseInt(minMatch[1], 10) * 60;
  const secMatch = durationStr.match(/(\d+)\s*sec/i);
  if (secMatch) seconds += parseInt(secMatch[1], 10);
  return seconds;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const totalSec = Math.floor(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function TopicDetailPage() {
  const { id } = useParams();
  const topicId = Array.isArray(id) ? id[0] : id || "qa-quantitative-ability";
  const { user, logout } = useAuth();

  const [activeQuizModal, setActiveQuizModal] = useState<{
    title: string;
    questions: any[];
  } | null>(null);

  useEffect(() => {
    // Ensure viewport starts at the top where the video player is located
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setPlayerState("idle");
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 50);
    return () => clearTimeout(timer);
  }, [topicId]);

  // Find topic or default to QA
  const topic = getTopicById(topicId) || TOPICS_DATA[0];

  const [activeNav, setActiveNav] = useState("My Topics");
  // Default to first lesson or lesson marked active
  const initialLesson =
    topic.lessons.find((l) => l.active) || topic.lessons[0];
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLesson.id);
  const [playerState, setPlayerState] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const playerCardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrubberRailRef = useRef<HTMLDivElement>(null);
  const [iframeOrigin, setIframeOrigin] = useState("");

  // Video playback & seeking state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(() => parseLessonDuration(initialLesson.duration));
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(0);
  const maxWatchedTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [showForwardWarning, setShowForwardWarning] = useState<boolean>(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio, Speed & Display state
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep maxWatchedTime ref updated for asynchronous callbacks
  useEffect(() => {
    maxWatchedTimeRef.current = maxWatchedTime;
  }, [maxWatchedTime]);

  // Sync origin for YouTube JS API
  useEffect(() => {
    setIframeOrigin(window.location.origin);
  }, []);

  // PostMessage sender to YouTube iframe
  const sendPlayerCommand = useCallback((func: string, args: (string | number | boolean)[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, []);

  const playVideo = useCallback(() => {
    sendPlayerCommand("playVideo");
    setPlayerState("playing");
  }, [sendPlayerCommand]);

  const pauseVideo = useCallback(() => {
    sendPlayerCommand("pauseVideo");
    setPlayerState("paused");
  }, [sendPlayerCommand]);

  const togglePlayPause = useCallback(() => {
    if (playerState === "playing") {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [playerState, pauseVideo, playVideo]);

  const seekTo = useCallback((targetSeconds: number) => {
    sendPlayerCommand("seekTo", [targetSeconds, true]);
    setCurrentTime(targetSeconds);
  }, [sendPlayerCommand]);

  const triggerForwardWarning = useCallback(() => {
    setShowForwardWarning(true);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setShowForwardWarning(false);
    }, 2600);
  }, []);

  // Scrubber calculation: allows backward dragging anywhere, strictly locks forward skipping past maxWatchedTime
  const handleScrubberInteract = useCallback((clientX: number, commit = false) => {
    if (!scrubberRailRef.current || duration <= 0) return;
    const rect = scrubberRailRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;
    const currentMax = maxWatchedTimeRef.current;

    if (targetTime > currentMax + 1.2) {
      // Fast-forward blocked: lock to max watched time
      triggerForwardWarning();
      if (commit) {
        seekTo(currentMax);
      }
      setCurrentTime(currentMax);
    } else {
      // Backward or within watched section is 100% permitted
      if (commit) {
        seekTo(targetTime);
      }
      setCurrentTime(targetTime);
    }
  }, [duration, seekTo, triggerForwardWarning]);

  // Global mouse & touch listeners during scrubber dragging
  useEffect(() => {
    if (!isDraggingScrubber) return;

    const onMouseMove = (e: MouseEvent) => {
      handleScrubberInteract(e.clientX, false);
    };
    const onMouseUp = (e: MouseEvent) => {
      handleScrubberInteract(e.clientX, true);
      setIsDraggingScrubber(false);
      isDraggingRef.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleScrubberInteract(e.touches[0].clientX, false);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleScrubberInteract(e.changedTouches[0].clientX, true);
      }
      setIsDraggingScrubber(false);
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDraggingScrubber, handleScrubberInteract]);

  const onMouseDownScrubber = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingScrubber(true);
    isDraggingRef.current = true;
    handleScrubberInteract(e.clientX, true);
  };

  const onTouchStartScrubber = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length > 0) {
      setIsDraggingScrubber(true);
      isDraggingRef.current = true;
      handleScrubberInteract(e.touches[0].clientX, true);
    }
  };

  const onMouseMoveRail = (e: React.MouseEvent) => {
    if (!scrubberRailRef.current || duration <= 0) return;
    const rect = scrubberRailRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
    setHoverPos(ratio * 100);
  };

  const onMouseLeaveRail = () => {
    setHoverTime(null);
  };

  // Rewind 10 seconds button
  const rewind10s = useCallback(() => {
    const target = Math.max(0, currentTime - 10);
    seekTo(target);
  }, [currentTime, seekTo]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (isMuted) {
      sendPlayerCommand("unMute");
      setIsMuted(false);
    } else {
      sendPlayerCommand("mute");
      setIsMuted(true);
    }
  }, [isMuted, sendPlayerCommand]);

  // Volume slider change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    sendPlayerCommand("setVolume", [val]);
    if (val > 0 && isMuted) {
      sendPlayerCommand("unMute");
      setIsMuted(false);
    }
  }, [isMuted, sendPlayerCommand]);

  // Cycle playback rate (1x -> 1.25x -> 1.5x -> 2x)
  const cyclePlaybackSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    sendPlayerCommand("setPlaybackRate", [nextSpeed]);
  }, [playbackSpeed, sendPlayerCommand]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!playerCardRef.current) return;
    if (!document.fullscreenElement) {
      playerCardRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-hide controls bar during active playback
  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (playerState === "playing") {
      inactivityTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [playerState]);

  useEffect(() => {
    if (playerState === "paused" || playerState === "idle" || playerState === "ended") {
      setShowControls(true);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    } else if (playerState === "playing") {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [playerState, resetInactivityTimer]);

  // Listen for YouTube IFrame player events via postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data: Record<string, unknown>;
        if (typeof e.data === "string") {
          data = JSON.parse(e.data);
        } else if (typeof e.data === "object" && e.data !== null) {
          data = e.data as Record<string, unknown>;
        } else return;

        // YouTube postMessage event: onStateChange or infoDelivery
        // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
        if (data.event === "onStateChange") {
          if (data.info === 1) setPlayerState("playing");
          else if (data.info === 2) setPlayerState("paused");
          else if (data.info === 0) setPlayerState("ended");
        } else if (data.event === "infoDelivery" && data.info && typeof data.info === "object") {
          const info = data.info as Record<string, unknown>;
          if (info.playerState !== undefined) {
            const ps = info.playerState;
            if (ps === 1) setPlayerState("playing");
            else if (ps === 2) setPlayerState("paused");
            else if (ps === 0) setPlayerState("ended");
          }
          if (typeof info.currentTime === "number") {
            const t = info.currentTime;
            if (!isDraggingRef.current) {
              setCurrentTime(t);
            }
            setMaxWatchedTime((prev) => {
              if (t > prev + 4 && prev > 0) {
                return prev;
              }
              return Math.max(prev, t);
            });
          }
          if (typeof info.duration === "number" && info.duration > 0) {
            setDuration(info.duration);
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Periodically request playback time from YouTube iframe
  useEffect(() => {
    if (playerState !== "playing") return;
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "listening" }),
          "*"
        );
      }
    }, 400);
    return () => clearInterval(interval);
  }, [playerState]);

  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("All");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showFullAbout, setShowFullAbout] = useState<boolean>(false);

  // Active lesson object
  const activeLesson: Lesson =
    topic.lessons.find((l) => l.id === activeLessonId) || initialLesson;

  // Next lesson for completion flow
  const currentLessonIndex = topic.lessons.findIndex((l) => l.id === activeLesson.id);
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < topic.lessons.length - 1
      ? topic.lessons[currentLessonIndex + 1]
      : null;

  // Filter lessons if a specific module is selected
  const visibleLessons =
    selectedModuleFilter === "All"
      ? topic.lessons
      : topic.lessons.filter((l) => l.moduleTitle === selectedModuleFilter);

  // Distinct module titles
  const moduleTitles = [
    "All",
    ...Array.from(new Set(topic.lessons.map((l) => l.moduleTitle).filter(Boolean))) as string[],
  ];

  const handleLessonSelect = async (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    setPlayerState("idle");
    setCurrentTime(0);
    setMaxWatchedTime(0);
    maxWatchedTimeRef.current = 0;
    setDuration(parseLessonDuration(lesson.duration));
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    try {
      await fetch("/api/topics/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          lessonId: lesson.id,
          totalLessons: topic.lessons.length,
        }),
      });
    } catch (err) {
      console.warn("[Progress update error]", err);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== DARK UPPER HEADER ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation Bar */}
          <nav className={styles.topNav} aria-label="Topic Detail Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <span className={styles.logoTechno}>Techno</span>
              <span className={styles.logoCAT}>CAT</span>
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "#", hasDropdown: true },
                { name: "My Topics", href: "/topics" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                    setActiveNav(item.name);
                  }}
                  className={`${styles.navLink} ${
                    activeNav === item.name ? styles.navLinkActive : ""
                  }`}
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
            <div className={styles.navRight}>
              <button className={styles.iconBtn} aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button className={styles.iconBtn} aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>

              <div
                className={styles.userPill}
                onClick={() => {
                  if (confirm("Would you like to log out of TechnoCAT?")) logout();
                }}
                title="Click to logout"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"}
                  alt={user?.fullName || "Sabrina Gomez"}
                  className={styles.userAvatar}
                />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.fullName || "Sabrina Gomez"}</span>
                  <span className={styles.userRole}>{user?.role || "Student"}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* ===== SUBHEADER: BREADCRUMBS & MAIN TOPIC TITLE ===== */}
      <section className={styles.subHeader}>
        <div className={styles.breadcrumb}>
          <Link href="/topics" className={styles.breadcrumbLink}>
            My Topics
          </Link>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbLink}>{topic.shortTitle || topic.title}</span>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{activeLesson.code || "Video Lesson"}</span>
        </div>
        <h1 className={styles.topicMainTitle}>{topic.title}</h1>
      </section>

      {/* ===== MAIN 2-COLUMN CONTAINER ===== */}
      <main className={styles.mainContainer}>
        {/* ===== LEFT COLUMN: REAL YOUTUBE PLAYER & DETAILS ===== */}
        <div className={styles.leftColumn}>
          <div
            ref={playerCardRef}
            className={styles.playerCard}
            onMouseMove={resetInactivityTimer}
            onMouseEnter={resetInactivityTimer}
          >
            {playerState === "idle" ? (
              <div
                className={styles.facadeWrapper}
                onClick={playVideo}
                role="button"
                tabIndex={0}
                title="Click to play video"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${activeLesson.youtubeId}/maxresdefault.jpg`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${activeLesson.youtubeId}/hqdefault.jpg`;
                  }}
                  alt={activeLesson.title}
                  className={styles.facadeThumbnail}
                />
                <div className={styles.facadeOverlay} />

                {/* Top Badge */}
                <div className={styles.facadeTopRow}>
                  {activeLesson.code && (
                    <span className={styles.facadeBadge}>{activeLesson.code}</span>
                  )}
                  {activeLesson.moduleTitle && (
                    <span className={styles.facadeModule}>{activeLesson.moduleTitle}</span>
                  )}
                </div>

                {/* Big Centered Play Button */}
                <div className={styles.facadePlayBtn}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </div>

                {/* Bottom Row */}
                <div className={styles.facadeBottomRow}>
                  <span className={styles.facadeTitle}>{activeLesson.title}</span>
                  {activeLesson.duration && (
                    <span className={styles.facadeDuration}>{activeLesson.duration}</span>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* YouTube iframe: controls=0 natively removes YouTube's bottom bar, More videos, and Watch on YouTube link */}
                {iframeOrigin && (
                  <iframe
                    ref={iframeRef}
                    key={activeLesson.youtubeId}
                    src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeId}?enablejsapi=1&autoplay=1&controls=0&disablekb=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&origin=${iframeOrigin}`}
                    title={activeLesson.title}
                    className={styles.youtubeIframe}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {/* Custom TechnoCAT Pause Screen */}
                {playerState === "paused" && (
                  <div
                    className={styles.pauseOverlay}
                    onClick={playVideo}
                    role="button"
                    tabIndex={0}
                    title="Click to resume video"
                  >
                    <span className={styles.pauseBadge}>
                      {activeLesson.code || "Lecture"} • Paused
                    </span>
                    <div className={styles.pausePlayBtn}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    </div>
                    <div className={styles.pauseTitle}>{activeLesson.title}</div>
                    <span className={styles.pauseHint}>Click anywhere to resume lecture</span>
                  </div>
                )}

                {/* Lesson Completed Screen */}
                {playerState === "ended" && (
                  <div className={styles.endedOverlay}>
                    <span className={styles.endedBadge}>🎉 Lecture Completed</span>
                    <h3 className={styles.endedTitle}>{activeLesson.title}</h3>
                    <p className={styles.endedSubtitle}>
                      Great job completing this lecture! You can re-watch any part or continue to the next lesson.
                    </p>
                    <div className={styles.endedActions}>
                      <button
                        className={styles.rewatchBtn}
                        onClick={() => {
                          seekTo(0);
                          playVideo();
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        Rewatch
                      </button>
                      {nextLesson && (
                        <button
                          className={styles.nextLessonBtn}
                          onClick={() => handleLessonSelect(nextLesson)}
                        >
                          Next Lesson ({nextLesson.code}) →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Forward Seeking Warning Tooltip */}
                {showForwardWarning && (
                  <div className={styles.seekWarningTooltip}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ED1C24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Fast-forwarding locked. You can rewind to review any watched part.</span>
                  </div>
                )}

                {/* Custom TechnoCAT Video Control Bar */}
                <div
                  className={`${styles.controlsBar} ${
                    showControls || playerState === "paused"
                      ? styles.controlsBarVisible
                      : styles.controlsBarHidden
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Custom Scrubber / Progress Bar */}
                  <div
                    ref={scrubberRailRef}
                    className={styles.scrubberContainer}
                    onMouseDown={onMouseDownScrubber}
                    onTouchStart={onTouchStartScrubber}
                    onMouseMove={onMouseMoveRail}
                    onMouseLeave={onMouseLeaveRail}
                    title="Drag backward to review missed parts. Forward skipping is locked."
                  >
                    <div className={styles.scrubberRail}>
                      {/* Watched unlocked segment */}
                      <div
                        className={styles.scrubberWatched}
                        style={{
                          width: `${duration > 0 ? Math.min(100, (maxWatchedTime / duration) * 100) : 0}%`,
                        }}
                      />
                      {/* Current playhead progress */}
                      <div
                        className={styles.scrubberProgress}
                        style={{
                          width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                        }}
                      />
                      {/* Scrubber Knob */}
                      <div
                        className={styles.scrubberThumb}
                        style={{
                          left: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                        }}
                      />
                    </div>

                    {/* Hover timestamp preview pill */}
                    {hoverTime !== null && (
                      <div
                        className={`${styles.scrubberHoverPill} ${
                          hoverTime > maxWatchedTime + 1 ? styles.scrubberHoverLocked : ""
                        }`}
                        style={{ left: `${hoverPos}%` }}
                      >
                        {hoverTime > maxWatchedTime + 1 && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                        <span>
                          {formatTime(hoverTime)} {hoverTime > maxWatchedTime + 1 ? "(Locked)" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Controls Row */}
                  <div className={styles.controlsRow}>
                    {/* Left: Play/Pause, Rewind 10s, Time Display */}
                    <div className={styles.controlsLeft}>
                      <button
                        className={styles.ctrlPlayBtn}
                        onClick={togglePlayPause}
                        title={playerState === "playing" ? "Pause (Space)" : "Play (Space)"}
                        aria-label={playerState === "playing" ? "Pause" : "Play"}
                      >
                        {playerState === "playing" ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                            <polygon points="6 3 20 12 6 21 6 3" />
                          </svg>
                        )}
                      </button>

                      <button
                        className={styles.rewindBtn}
                        onClick={rewind10s}
                        title="Rewind 10 seconds"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        10s
                      </button>

                      <div className={styles.timeDisplay}>
                        <span>{formatTime(currentTime)}</span>
                        <span style={{ opacity: 0.5 }}>/</span>
                        <span>{formatTime(duration)}</span>
                        {duration > 0 && maxWatchedTime > 0 && (
                          <span className={styles.timeWatchedBadge}>
                            {Math.round((maxWatchedTime / duration) * 100)}% Watched
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Volume, Speed, Fullscreen */}
                    <div className={styles.controlsRight}>
                      {/* Volume */}
                      <div className={styles.volumeGroup}>
                        <button
                          className={styles.ctrlBtn}
                          onClick={toggleMute}
                          title={isMuted ? "Unmute (M)" : "Mute (M)"}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted || volume === 0 ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="1" y1="1" x2="23" y2="23" />
                              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23" />
                              <line x1="12" y1="19" x2="12" y2="23" />
                              <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                          )}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className={styles.volumeSlider}
                          title={`Volume: ${isMuted ? 0 : volume}%`}
                          aria-label="Volume"
                        />
                      </div>

                      {/* Speed */}
                      <button
                        className={styles.speedBtn}
                        onClick={cyclePlaybackSpeed}
                        title="Change Playback Speed"
                      >
                        {playbackSpeed}x
                      </button>

                      {/* Fullscreen */}
                      <button
                        className={styles.ctrlBtn}
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullscreen ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 14 10 14 10 20" />
                            <polyline points="20 10 14 10 14 4" />
                            <line x1="14" y1="10" x2="21" y2="3" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Lesson Bar below video */}
          <div className={styles.activeLessonBar}>
            <div className={styles.activeLessonMetaRow}>
              {activeLesson.code && (
                <span className={styles.codeBadge}>{activeLesson.code}</span>
              )}
              {activeLesson.moduleTitle && (
                <span className={styles.moduleTag}>{activeLesson.moduleTitle}</span>
              )}
              {activeLesson.duration && (
                <span className={styles.moduleTag}>⏱ {activeLesson.duration}</span>
              )}
              <button
                type="button"
                className={styles.quizTriggerPill}
                onClick={() => {
                  const knowledge = getLessonKnowledge(
                    activeLesson.code,
                    activeLesson.title,
                    activeLesson.coverage
                  );
                  setActiveQuizModal({
                    title: `${activeLesson.code ? `${activeLesson.code}: ` : ""}${activeLesson.title}`,
                    questions: knowledge.quiz,
                  });
                }}
                title="Practice interactive TechnoEEE quiz for this lecture"
              >
                🎯 Interactive Quiz
              </button>
            </div>

            <h2 className={styles.activeLessonTitle}>{activeLesson.title}</h2>

            {activeLesson.coverage && (
              <p className={styles.activeLessonCoverage}>
                <strong>Topics Covered:</strong> {activeLesson.coverage}
              </p>
            )}

            {activeLesson.videoTitle && (
              <div className={styles.videoSourceTag}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ED1C24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Curated Video: <strong>{activeLesson.videoTitle}</strong></span>
              </div>
            )}
          </div>

          {/* Ask AI Tutor Panel (Video RAG & Interactive Quiz) */}
          <VideoAskPanel
            topicId={topic.id}
            topicTitle={topic.title}
            lessonCode={activeLesson.code}
            lessonTitle={activeLesson.title}
            lessonCoverage={activeLesson.coverage}
            onSeekTo={(seconds) => {
              seekTo(seconds);
              playVideo();
            }}
            onLaunchFullQuiz={(quiz) => {
              setActiveQuizModal(quiz);
            }}
          />

          {/* Instructor Profile Card */}
          <div className={styles.instructorCard}>
            <div className={styles.instructorInfoLeft}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={topic.instructor.avatar}
                alt={topic.instructor.name}
                className={styles.mentorAvatar}
              />
              <div>
                <h3 className={styles.mentorName}>{topic.instructor.name}</h3>
                <p className={styles.mentorTitle}>{topic.instructor.role}</p>
              </div>
            </div>

            <div className={styles.instructorActions}>
              <button
                className={styles.actionCircleBtn}
                title="Share Topic"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Topic link copied to clipboard!");
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>

              <button
                className={`${styles.actionCircleBtn} ${
                  isBookmarked ? styles.actionCircleBtnActive : ""
                }`}
                title={isBookmarked ? "Saved to Bookmarks" : "Save to Bookmarks"}
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* About This Course Card */}
          <div className={styles.aboutCard}>
            <h2 className={styles.sectionHeading}>About This Topic</h2>
            <p className={styles.aboutText}>
              {showFullAbout ? topic.fullAbout : `${topic.fullAbout.slice(0, 280)}...`}
            </p>
            <button
              className={styles.showMoreBtn}
              onClick={() => setShowFullAbout(!showFullAbout)}
            >
              {showFullAbout ? "Show less ∧" : "Show more ∨"}
            </button>

            <h3 className={styles.suitsHeading}>This Topic Suits For:</h3>
            <ul className={styles.suitsList}>
              {topic.suitsFor.map((item, idx) => (
                <li key={idx} className={styles.suitItem}>
                  <span className={styles.bulletDot} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: STUDY PROGRESS & LESSON COMPLETION ===== */}
        <div className={styles.rightColumn}>
          {/* Card 1: Study Progress */}
          <div className={styles.progressCard}>
            <div className={styles.progressCardHeader}>
              <h2 className={styles.progressCardTitle}>Your Study Progress</h2>
              <span className={styles.progressPercentBadge}>{topic.progressPercent}%</span>
            </div>

            {/* Stepped Milestone Track */}
            <div className={styles.milestoneTrack}>
              <div className={styles.milestoneLineBg} />
              <div
                className={styles.milestoneLineFill}
                style={{
                  width: `${Math.min(100, Math.max(0, (topic.progressPercent / 100) * 100))}%`,
                }}
              />
              <div className={styles.milestoneNodesRow}>
                {topic.milestones.map((m) => (
                  <div key={m.label} className={styles.milestoneNodeCol}>
                    <div
                      className={`${styles.milestoneDot} ${
                        m.reached ? styles.milestoneDotFilled : ""
                      }`}
                    />
                    <span
                      className={`${styles.milestoneLabel} ${
                        m.reached ? styles.milestoneLabelActive : ""
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Box */}
            <div className={styles.motivationalBox}>
              {topic.motivationalMessage}
            </div>
          </div>

          {/* Card 2: Course Completion with Interactive YouTube Lessons */}
          <div className={styles.completionCard}>
            <div className={styles.completionHeader}>
              <h2 className={styles.completionTitle}>Topic Completion</h2>
              <span className={styles.completionCount}>
                {topic.completedLessonsCount}/{topic.totalLessons}
              </span>
            </div>

            {/* Module Filter Chips */}
            {moduleTitles.length > 2 && (
              <div className={styles.moduleFilterRow}>
                {moduleTitles.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setSelectedModuleFilter(mod)}
                    className={`${styles.moduleFilterChip} ${
                      selectedModuleFilter === mod ? styles.moduleFilterChipActive : ""
                    }`}
                  >
                    {mod === "All" ? "All Modules" : mod.split(":")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Interactive Lesson List */}
            <div className={styles.lessonsList}>
              {visibleLessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`${styles.lessonItem} ${
                      isActive ? styles.lessonItemActive : ""
                    }`}
                  >
                    <div className={styles.lessonItemLeft}>
                      <div className={styles.lessonIconBox}>
                        {isActive ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </div>

                      <div className={styles.lessonTextContainer}>
                        {lesson.code && (
                          <span className={styles.lessonCodeBadge}>{lesson.code}</span>
                        )}
                        <div className={styles.lessonTitleText} title={lesson.title}>
                          {lesson.title}
                        </div>
                        <div className={styles.lessonDurationText}>{lesson.duration}</div>
                      </div>
                    </div>

                    {lesson.completed && (
                      <div className={styles.checkCircleDone} title="Completed">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* TechnoEEE Full-Screen Interactive Quiz Viewer */}
      {activeQuizModal && (
        <QuizViewer
          title={activeQuizModal.title}
          questions={activeQuizModal.questions}
          onClose={() => setActiveQuizModal(null)}
          onSubmitQuiz={(score, total) => {
            console.log(`[Quiz Completed] Scored ${score}/${total}`);
          }}
        />
      )}
    </div>
  );
}
