"use client";

// On-device eye-contact / framing analysis for the live viva using MediaPipe
// FaceLandmarker (478 landmarks incl. irises). Frames never leave the browser;
// only aggregate percentages are reported at the end of the session.
//
// Heuristics (normalised landmark geometry, robust to mirroring):
//  - face in frame: a face was detected
//  - eye contact: head yaw + pitch near neutral AND irises roughly centred in the eyes
//  - framing/posture: face centred, sensible size (not too far/close) and head level (low roll)

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

// Keep in lockstep with the installed @mediapipe/tasks-vision version (same as proctoring).
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const FRAME_INTERVAL_MS = 200; // ~5 fps is plenty and cheap on laptops/phones
const LIVE_WINDOW = 8; // frames used to smooth the live indicators (~1.6 s)

export type FaceMetricsStatus = "idle" | "loading" | "ready" | "unavailable";

export interface LiveFaceState {
  face: boolean;
  eyeContact: boolean;
  framing: boolean;
  hint: string | null;
}

export interface FaceTotals {
  eyeContactPct: number | null;
  faceInFramePct: number | null;
  framingPct: number | null;
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function loadLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
      const make = (delegate: "GPU" | "CPU") =>
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

interface FrameEval {
  face: boolean;
  eyeContact: boolean;
  framing: boolean;
  hint: string | null;
}

function evaluate(lm: NormalizedLandmark[] | undefined): FrameEval {
  if (!lm || lm.length < 468) return { face: false, eyeContact: false, framing: false, hint: "We can't see your face — move into the frame." };

  const rOuter = lm[33], rInner = lm[133], lInner = lm[362], lOuter = lm[263];
  const nose = lm[1], chin = lm[152], forehead = lm[10];

  // Head yaw: nose offset from the eye midpoint relative to eye span.
  const eyeMidX = (rOuter.x + lOuter.x) / 2;
  const eyeMidY = (rOuter.y + lOuter.y) / 2;
  const eyeSpan = Math.hypot(lOuter.x - rOuter.x, lOuter.y - rOuter.y) || 1e-6;
  const yaw = (nose.x - eyeMidX) / eyeSpan; // ~0 when facing the camera
  // Head pitch: where the nose sits between the eye line and the chin (~0.45 neutral).
  const faceLower = chin.y - eyeMidY || 1e-6;
  const pitch = (nose.y - eyeMidY) / faceLower;
  // Head roll in degrees from the eye line.
  const roll = (Math.atan2(lOuter.y - rOuter.y, lOuter.x - rOuter.x) * 180) / Math.PI;

  // Iris position within each eye (0..1 along the corner-to-corner line, ~0.5 centred).
  let gazeOk = true;
  if (lm.length >= 478) {
    const ratio = (iris: NormalizedLandmark, a: NormalizedLandmark, b: NormalizedLandmark) => {
      const dx = b.x - a.x;
      return Math.abs(dx) < 1e-6 ? 0.5 : (iris.x - a.x) / dx;
    };
    const rr = ratio(lm[468], rOuter, rInner);
    const lr = ratio(lm[473], lInner, lOuter);
    const avg = (rr + lr) / 2;
    gazeOk = avg > 0.3 && avg < 0.7;
  }

  const headOk = Math.abs(yaw) < 0.22 && pitch > 0.3 && pitch < 0.65;
  const eyeContact = headOk && gazeOk;

  // Framing: bounding box of a few extreme landmarks.
  let minX = 1, maxX = 0, minY = forehead.y, maxY = chin.y;
  for (const i of [234, 454, 127, 356, 10, 152]) {
    const p = lm[i];
    if (!p) continue;
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const width = maxX - minX;
  const centred = Math.abs(cx - 0.5) < 0.18 && cy > 0.22 && cy < 0.65;
  const sizeOk = width > 0.16 && width < 0.62;
  const level = Math.abs(roll) < 12;
  const framing = centred && sizeOk && level;

  let hint: string | null = null;
  if (!sizeOk) hint = width <= 0.16 ? "Move a little closer to the camera." : "Sit back a little from the camera.";
  else if (!centred) hint = "Centre yourself in the frame.";
  else if (!level) hint = "Keep your head level.";
  else if (!eyeContact) hint = "Look at the camera lens while you speak.";

  return { face: true, eyeContact, framing, hint };
}

/**
 * Runs FaceLandmarker on `videoRef` while `active` is true. Live indicators are
 * smoothed and only update state when they change, to avoid re-render storms.
 */
export function useFaceMetrics(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const [status, setStatus] = useState<FaceMetricsStatus>("idle");
  const [live, setLive] = useState<LiveFaceState | null>(null);

  const countsRef = useRef({ frames: 0, face: 0, eye: 0, framing: 0 });
  const windowRef = useRef<FrameEval[]>([]);
  const liveKeyRef = useRef("");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let raf = 0;
    let last = 0;
    let lastVideoTime = -1;
    let landmarker: FaceLandmarker | null = null;

    // Deferred so the state update doesn't happen synchronously inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) setStatus((s) => (s === "ready" ? s : "loading"));
    });

    const loop = (now: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_INTERVAL_MS) return;
      last = now;
      const video = videoRef.current;
      if (!landmarker || !video || video.readyState < 2 || video.videoWidth === 0) return;
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      let res;
      try {
        res = landmarker.detectForVideo(video, now);
      } catch {
        return;
      }
      const ev = evaluate(res.faceLandmarks?.[0]);
      const c = countsRef.current;
      c.frames += 1;
      if (ev.face) c.face += 1;
      if (ev.eyeContact) c.eye += 1;
      if (ev.framing) c.framing += 1;

      const win = windowRef.current;
      win.push(ev);
      if (win.length > LIVE_WINDOW) win.shift();
      const majority = (k: "face" | "eyeContact" | "framing") => win.filter((w) => w[k]).length * 2 >= win.length;
      const next: LiveFaceState = {
        face: majority("face"),
        eyeContact: majority("eyeContact"),
        framing: majority("framing"),
        hint: ev.hint,
      };
      const key = `${next.face}|${next.eyeContact}|${next.framing}|${next.hint}`;
      if (key !== liveKeyRef.current) {
        liveKeyRef.current = key;
        setLive(next);
      }
    };

    loadLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarker = lm;
        setStatus("ready");
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [active, videoRef]);

  /** Release the shared model (call when leaving the feature). */
  useEffect(() => {
    return () => {
      const p = landmarkerPromise;
      landmarkerPromise = null;
      p?.then((lm) => {
        try {
          lm.close();
        } catch {
          /* ignore */
        }
      }).catch(() => {});
    };
  }, []);

  const reset = useCallback(() => {
    countsRef.current = { frames: 0, face: 0, eye: 0, framing: 0 };
    windowRef.current = [];
    liveKeyRef.current = "";
    setLive(null);
  }, []);

  const getTotals = useCallback((): FaceTotals => {
    const c = countsRef.current;
    if (c.frames < 5) return { eyeContactPct: null, faceInFramePct: null, framingPct: null };
    const pct = (n: number) => Math.round((n / c.frames) * 100);
    return { eyeContactPct: pct(c.eye), faceInFramePct: pct(c.face), framingPct: pct(c.framing) };
  }, []);

  return { status, live, reset, getTotals };
}
