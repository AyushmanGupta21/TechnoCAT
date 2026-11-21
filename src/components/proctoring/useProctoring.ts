"use client";

// On-device webcam proctoring for the exam modal.
//
// Frames are analysed locally in the browser with MediaPipe Tasks (face + object detection).
// No video or images ever leave the device; only short event labels ("no_face", "phone", ...)
// are logged to /api/proctoring. Detection is heuristic: it reduces cheating but is not perfect.

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceDetector, ObjectDetector, Detection } from "@mediapipe/tasks-vision";

export type ProctorKind = "pyq" | "module_quiz" | "grand_quiz";
export type ProctorEvent =
  | "no_face"
  | "multiple_faces"
  | "phone"
  | "looking_away"
  | "camera_off"
  | "proctoring_declined";

export type ProctorStatus =
  | "idle" // not requested yet
  | "requesting" // waiting for camera permission
  | "ready" // camera granted, exam not running yet
  | "loading" // loading detection models
  | "active" // monitoring
  | "denied" // camera permission denied / no camera
  | "unavailable" // models failed to load (exam continues unproctored)
  | "camera_off" // camera stopped mid-exam
  | "off"; // user started without proctoring

// Keep the wasm version in lockstep with the installed npm package.
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const OBJECT_MODEL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

const FRAME_INTERVAL_MS = 500; // ~2 frames per second
const PERSIST_MS = 3000; // a condition must persist this long before it counts
const LOOK_AWAY_PERSIST_MS = 5000;
const COOLDOWN_MS = 15000; // per-condition cooldown after a violation fires
const GRACE_MS = 1000; // brief detection dropouts don't reset the persistence timer
const PHONE_SCORE = 0.5;

type Condition = "no_face" | "multiple_faces" | "phone" | "looking_away";

export const VIOLATION_MESSAGES: Record<Exclude<ProctorEvent, "proctoring_declined">, string> = {
  no_face: "No face detected on camera. Stay in front of the camera.",
  multiple_faces: "More than one person detected on camera.",
  phone: "A mobile phone was detected on camera.",
  looking_away: "You appear to be looking away from the screen.",
  camera_off: "The camera was turned off or disconnected.",
};

interface Detectors {
  face: FaceDetector;
  object: ObjectDetector;
}

// Models are cached for the page lifetime so later exams start instantly.
let detectorsPromise: Promise<Detectors> | null = null;

function loadDetectors(): Promise<Detectors> {
  if (!detectorsPromise) {
    detectorsPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
      const make = async (delegate: "GPU" | "CPU"): Promise<Detectors> => {
        const [face, object] = await Promise.all([
          vision.FaceDetector.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          }),
          vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: OBJECT_MODEL, delegate },
            runningMode: "VIDEO",
            scoreThreshold: PHONE_SCORE,
            maxResults: 3,
            categoryAllowlist: ["cell phone"],
          }),
        ]);
        return { face, object };
      };
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })();
    detectorsPromise.catch(() => {
      detectorsPromise = null; // allow a retry on the next exam
    });
  }
  return detectorsPromise;
}

export function newAttemptKey(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function logProctorEvent(attemptKey: string, kind: ProctorKind, event: ProctorEvent): void {
  try {
    void fetch("/api/proctoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptKey, kind, event, at: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** Cheap "looking away" heuristic from the face box position and nose/eye keypoints. */
function isLookingAway(det: Detection, width: number, height: number): boolean {
  const box = det.boundingBox;
  if (box && width > 0 && height > 0) {
    const cx = (box.originX + box.width / 2) / width;
    const cy = (box.originY + box.height / 2) / height;
    if (Math.abs(cx - 0.5) > 0.32 || Math.abs(cy - 0.5) > 0.35) return true;
  }
  // Keypoints (normalised): 0 right eye, 1 left eye, 2 nose tip.
  const kp = det.keypoints;
  if (kp && kp.length >= 3) {
    const eyeMidX = (kp[0].x + kp[1].x) / 2;
    const eyeDist = Math.abs(kp[0].x - kp[1].x);
    if (eyeDist > 0.005) {
      const yaw = Math.abs(kp[2].x - eyeMidX) / eyeDist;
      if (yaw > 0.6) return true;
    }
  }
  return false;
}

interface UseProctoringOptions {
  /** True while the exam is running with proctoring enabled. */
  running: boolean;
  /** Called once per debounced violation (adds a strike in the modal). */
  onViolation: (event: Exclude<ProctorEvent, "proctoring_declined">, message: string) => void;
}

export function useProctoring({ running, onViolation }: UseProctoringOptions) {
  const [status, setStatus] = useState<ProctorStatus>("idle");
  const [liveHint, setLiveHint] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Ask for the camera. Resolves true when granted. */
  const enable = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("denied");
      return false;
    }
    setStatus("requesting");
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setStatus("ready");
      // Start fetching the models while the exam UI mounts.
      loadDetectors().catch(() => {});
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, [stopStream]);

  const markOff = useCallback(() => {
    stopStream();
    setStatus("off");
  }, [stopStream]);

  const reset = useCallback(() => {
    stopStream();
    setStatus("idle");
    setLiveHint(null);
  }, [stopStream]);

  // Monitoring loop: runs only while the exam is in progress.
  useEffect(() => {
    if (!running) return;
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) {
      setStatus("unavailable");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let lastTs = 0;
    const firstSeen: Partial<Record<Condition, number>> = {};
    const lastTrue: Partial<Record<Condition, number>> = {};
    const lastFired: Partial<Record<Condition, number>> = {};

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {});

    const track = stream.getVideoTracks()[0];
    if (track) {
      track.onended = () => {
        if (cancelled) return;
        if (timer) clearInterval(timer);
        setStatus("camera_off");
        setLiveHint(null);
        onViolationRef.current("camera_off", VIOLATION_MESSAGES.camera_off);
      };
    }

    const evaluate = (cond: Condition, present: boolean, now: number, persistMs: number) => {
      if (present) {
        lastTrue[cond] = now;
        if (firstSeen[cond] === undefined) firstSeen[cond] = now;
        const since = now - (firstSeen[cond] as number);
        const cooled = now - (lastFired[cond] ?? -Infinity) >= COOLDOWN_MS;
        if (since >= persistMs && cooled) {
          lastFired[cond] = now;
          firstSeen[cond] = undefined;
          onViolationRef.current(cond, VIOLATION_MESSAGES[cond]);
        }
      } else if (firstSeen[cond] !== undefined && now - (lastTrue[cond] ?? 0) > GRACE_MS) {
        firstSeen[cond] = undefined;
      }
    };

    setStatus("loading");
    loadDetectors()
      .then((det) => {
        if (cancelled) return;
        setStatus("active");
        timer = setInterval(() => {
          if (cancelled || video.readyState < 2 || !video.videoWidth) return;
          let ts = performance.now();
          if (ts <= lastTs) ts = lastTs + 1;
          lastTs = ts;
          try {
            const faces = det.face.detectForVideo(video, ts).detections;
            const objects = det.object.detectForVideo(video, ts).detections;
            const phone = objects.some((d) =>
              d.categories.some((c) => c.categoryName === "cell phone" && c.score >= PHONE_SCORE)
            );
            const now = Date.now();
            const noFace = faces.length === 0;
            const many = faces.length > 1;
            const away = faces.length === 1 && isLookingAway(faces[0], video.videoWidth, video.videoHeight);
            evaluate("no_face", noFace, now, PERSIST_MS);
            evaluate("multiple_faces", many, now, PERSIST_MS);
            evaluate("phone", phone, now, PERSIST_MS);
            evaluate("looking_away", away, now, LOOK_AWAY_PERSIST_MS);
            setLiveHint(
              phone
                ? "Phone in view"
                : noFace
                  ? "Face not visible"
                  : many
                    ? "Multiple faces"
                    : away
                      ? "Look at the screen"
                      : null
            );
          } catch {
            // A single bad frame should never break the exam.
          }
        }, FRAME_INTERVAL_MS);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unavailable");
        setLiveHint(null);
        stopStream();
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (track) track.onended = null;
      stopStream();
      setLiveHint(null);
    };
  }, [running, stopStream]);

  // Always release the camera on unmount.
  useEffect(() => () => stopStream(), [stopStream]);

  return { status, liveHint, videoRef, enable, markOff, reset, stopStream };
}
