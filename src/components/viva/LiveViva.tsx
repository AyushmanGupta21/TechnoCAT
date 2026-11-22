"use client";

// Live camera + voice AI viva (mock interview) for Speak & Assess.
// Flow: setup (type/topic/length + device check) -> live session (AI asks by voice,
// candidate answers by voice, auto-submit on silence) -> report.
// Video and audio stay in the browser; only answer text + numeric metrics are sent.

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LiveViva.module.css";
import { useSpeechTranscription } from "@/hooks/useSpeechTranscription";
import { useFaceMetrics } from "./useFaceMetrics";
import { useInterviewerVoice } from "./useInterviewerVoice";
import LiveVivaReport, { type ReportState } from "./LiveVivaReport";
import {
  LIVE_VIVA_LENGTHS,
  LIVE_VIVA_TYPES,
  countFillers,
  countWords,
  findLiveVivaType,
  type LiveVivaAssessment,
  type LiveVivaMetrics,
  type LiveVivaTurn,
} from "@/lib/viva/liveVivaConfig";

type Stage = "setup" | "live" | "report";
type Phase = "thinking" | "speaking" | "listening";
type DeviceState = "idle" | "requesting" | "ready" | "denied";

const SILENCE_SUBMIT_MS = 4000;
const NO_SPEECH_MS = 15000;

export interface LiveVivaTypeMeta {
  icon?: React.ReactNode;
  color?: string;
}

interface HistoryItem {
  role: "interviewer" | "candidate";
  content: string;
}

function mediaErrorMessage(err: unknown, device: "camera" | "microphone"): string {
  const name = (err as { name?: string })?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return `${device === "camera" ? "Camera" : "Microphone"} permission was denied. Allow it from the icon in your browser's address bar, then check again.`;
  if (name === "NotFoundError" || name === "OverconstrainedError") return `No ${device} was found on this device.`;
  if (name === "NotReadableError") return `Your ${device} is being used by another app. Close it and check again.`;
  return `Couldn't access your ${device}.`;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function LiveViva({ typeMeta = {} }: { typeMeta?: Record<string, LiveVivaTypeMeta> }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [vivaTypeId, setVivaTypeId] = useState(LIVE_VIVA_TYPES[0].id);
  const [topic, setTopic] = useState(LIVE_VIVA_TYPES[0].topics[0]);
  const [length, setLength] = useState<number>(LIVE_VIVA_LENGTHS[0]);

  const [camState, setCamState] = useState<DeviceState>("idle");
  const [micState, setMicState] = useState<DeviceState>("idle");
  const [camMsg, setCamMsg] = useState<string | null>(null);
  const [micMsg, setMicMsg] = useState<string | null>(null);

  const [phase, setPhaseState] = useState<Phase>("thinking");
  const [question, setQuestion] = useState("");
  const [questionNo, setQuestionNo] = useState(0);
  const [caption, setCaption] = useState("");
  const [liveWpm, setLiveWpm] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [turns, setTurns] = useState<LiveVivaTurn[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [forceTyped, setForceTyped] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [report, setReport] = useState<ReportState | null>(null);

  const speech = useSpeechTranscription("en-IN");
  const voice = useInterviewerVoice();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const face = useFaceMetrics(videoRef, camState === "ready" && stage !== "report");

  const typedMode = forceTyped || speech.supported === false || Boolean(speech.error) || micState === "denied";
  const vivaType = findLiveVivaType(vivaTypeId);

  // ---- mutable session state (read from timers / async callbacks) ----
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const phaseRef = useRef<Phase>("thinking");
  const historyRef = useRef<HistoryItem[]>([]);
  const turnsRef = useRef<LiveVivaTurn[]>([]);
  const questionRef = useRef("");
  const questionNoRef = useRef(0);
  const isEndingRef = useRef(false);
  const answerRef = useRef("");
  const answerStartRef = useRef<number | null>(null);
  const lastSpeechRef = useRef<number | null>(null);
  const listenStartRef = useRef(0);
  const repromptedRef = useRef(false);
  const lastAnswerRef = useRef("");
  const totalsRef = useRef({ words: 0, speakingMs: 0, fillers: 0 });
  const startTimeRef = useRef(0);
  const latestRef = useRef({ typedMode, typedAnswer, length, vivaTypeId, topic });
  const flowRef = useRef<{ submit: (skipped: boolean) => void; reprompt: () => void }>({
    submit: () => {},
    reprompt: () => {},
  });

  useEffect(() => {
    latestRef.current = { typedMode, typedAnswer, length, vivaTypeId, topic };
  });

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // ---- camera ----
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const checkDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg = "This browser can't access a camera or microphone here (it needs HTTPS or localhost).";
      setCamState("denied");
      setMicState("denied");
      setCamMsg(msg);
      setMicMsg(msg);
      return;
    }
    stopCamera();
    setCamState("requesting");
    setMicState("requesting");
    setCamMsg(null);
    setMicMsg(null);
    const video: MediaTrackConstraints = { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } };
    let videoStream: MediaStream | null = null;
    try {
      const both = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      // Speech recognition opens the mic itself; we only needed the permission.
      both.getAudioTracks().forEach((t) => t.stop());
      videoStream = new MediaStream(both.getVideoTracks());
      setMicState("ready");
    } catch {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video });
      } catch (err) {
        setCamState("denied");
        setCamMsg(mediaErrorMessage(err, "camera"));
      }
      try {
        const a = await navigator.mediaDevices.getUserMedia({ audio: true });
        a.getTracks().forEach((t) => t.stop());
        setMicState("ready");
      } catch (err) {
        setMicState("denied");
        setMicMsg(mediaErrorMessage(err, "microphone") + " You can still type your answers.");
      }
    }
    if (videoStream) {
      streamRef.current = videoStream;
      videoStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setCamState("denied");
        setCamMsg("The camera was disconnected. Eye-contact and framing are no longer measured.");
      });
      setCamState("ready");
      if (videoRef.current) attachVideo(videoRef.current);
    }
  }, [attachVideo, stopCamera]);

  // Re-attach the stream whenever the <video> element is remounted (setup -> live).
  useEffect(() => {
    if (videoRef.current && streamRef.current) attachVideo(videoRef.current);
  }, [stage, camState, attachVideo]);

  // ---- listening ----
  const listen = useCallback(() => {
    const run = runIdRef.current;
    answerRef.current = "";
    answerStartRef.current = null;
    lastSpeechRef.current = null;
    listenStartRef.current = Date.now();
    setCaption("");
    setLiveWpm(null);
    setTypedAnswer("");
    setPhase("listening");
    if (latestRef.current.typedMode) return;
    speech.start((full) => {
      if (runIdRef.current !== run || phaseRef.current !== "listening") return;
      const now = Date.now();
      const text = full.trim();
      if (text && text !== answerRef.current) {
        if (answerStartRef.current === null) answerStartRef.current = now;
        lastSpeechRef.current = now;
      }
      answerRef.current = text;
      setCaption(text);
      const start = answerStartRef.current;
      if (start !== null && now - start > 3000) {
        setLiveWpm(Math.round(countWords(text) / ((now - start) / 60000)));
      }
    });
  }, [setPhase, speech]);

  // ---- AI turn ----
  const askNext = useCallback(
    async (latestAnswer: string) => {
      const run = runIdRef.current;
      setApiError(null);
      setNotice(null);
      setPhase("thinking");
      const qNo = questionNoRef.current + 1;
      const { length: total, vivaTypeId: typeId, topic: t } = latestRef.current;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      lastAnswerRef.current = latestAnswer;
      try {
        const res = await fetch("/api/mock-viva/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            action: "next",
            vivaType: typeId,
            topic: t,
            totalQuestions: total,
            questionNumber: qNo,
            history: historyRef.current.slice(-10),
            latestAnswer,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (runIdRef.current !== run) return;
        if (!res.ok || typeof data?.question !== "string") {
          setApiError(
            res.status === 401
              ? "Please sign in to use the live viva."
              : data?.error || "Couldn't reach the interviewer. Check your connection and retry."
          );
          return;
        }
        const q: string = data.question;
        isEndingRef.current = Boolean(data.isEnding) || qNo >= total;
        questionNoRef.current = qNo;
        questionRef.current = q;
        repromptedRef.current = false;
        historyRef.current.push({ role: "interviewer", content: q });
        setQuestionNo(qNo);
        setQuestion(q);
        setPhase("speaking");
        await voice.speak(q);
        if (runIdRef.current !== run) return;
        listen();
      } catch (err) {
        if (runIdRef.current !== run || (err as Error)?.name === "AbortError") return;
        setApiError("Couldn't reach the interviewer. Check your connection and retry.");
      }
    },
    [listen, setPhase, voice]
  );

  // ---- finishing ----
  const fetchReport = useCallback(async (metrics: LiveVivaMetrics, transcript: LiveVivaTurn[]) => {
    const run = runIdRef.current;
    setReport({ loading: true, error: null, assessment: null, metrics, turns: transcript });
    try {
      const res = await fetch("/api/mock-viva/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          vivaType: latestRef.current.vivaTypeId,
          topic: latestRef.current.topic,
          metrics,
          transcript: transcript.map((t) => ({ question: t.question, answer: t.answer })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (runIdRef.current !== run) return;
      if (!res.ok || !data?.assessment) {
        setReport({ loading: false, error: data?.error || "Couldn't generate feedback.", assessment: null, metrics, turns: transcript });
        return;
      }
      setReport({ loading: false, error: null, assessment: data.assessment as LiveVivaAssessment, metrics, turns: transcript });
    } catch {
      if (runIdRef.current !== run) return;
      setReport({ loading: false, error: "Couldn't reach the server for feedback.", assessment: null, metrics, turns: transcript });
    }
  }, []);

  const finish = useCallback(
    (natural: boolean) => {
      runIdRef.current += 1;
      abortRef.current?.abort();
      speech.abort();
      voice.cancel();
      const totals = face.getTotals();
      const t = totalsRef.current;
      const transcript = turnsRef.current.slice();
      const metrics: LiveVivaMetrics = {
        ...totals,
        avgWpm: t.speakingMs >= 5000 && t.words >= 10 ? Math.round(t.words / (t.speakingMs / 60000)) : null,
        fillerCount: t.fillers,
        questionsAnswered: transcript.filter((x) => !x.skipped && x.answer.trim()).length,
        questionsAsked: questionNoRef.current,
        durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      };
      stopCamera();
      setCamState("idle");
      setStage("report");
      if (natural) void voice.speak("Thank you. That brings us to the end of this viva. Your feedback is ready below.");
      void fetchReport(metrics, transcript);
    },
    [face, fetchReport, speech, stopCamera, voice]
  );

  const submit = useCallback(
    (skipped: boolean) => {
      if (phaseRef.current !== "listening") return;
      const { typedMode: typed, typedAnswer: typedText } = latestRef.current;
      const text = (typed ? typedText : answerRef.current).trim();
      speech.abort();
      const answer = skipped ? "" : text;
      if (answer) {
        const words = countWords(answer);
        totalsRef.current.words += words;
        totalsRef.current.fillers += countFillers(answer);
        if (!typed && answerStartRef.current !== null && lastSpeechRef.current !== null) {
          totalsRef.current.speakingMs += Math.max(1000, lastSpeechRef.current - answerStartRef.current);
        } else {
          totalsRef.current.words -= words; // typed answers don't count towards speaking pace
        }
      }
      const turn: LiveVivaTurn = { question: questionRef.current, answer, skipped: !answer };
      turnsRef.current = [...turnsRef.current, turn];
      setTurns(turnsRef.current);
      historyRef.current.push({ role: "candidate", content: answer || "[skipped / no answer]" });
      setCaption("");
      if (isEndingRef.current || turnsRef.current.length >= latestRef.current.length) {
        finish(true);
      } else {
        void askNext(answer);
      }
    },
    [askNext, finish, speech]
  );

  const reprompt = useCallback(async () => {
    const run = runIdRef.current;
    repromptedRef.current = true;
    speech.abort();
    setPhase("speaking");
    setNotice("No answer heard yet. Take your time.");
    await voice.speak("Take your time. Whenever you're ready, please go ahead. " + questionRef.current);
    if (runIdRef.current !== run) return;
    listen();
  }, [listen, setPhase, speech, voice]);

  useEffect(() => {
    flowRef.current = { submit, reprompt: () => void reprompt() };
  }, [submit, reprompt]);

  // Silence detection while listening (voice mode only).
  useEffect(() => {
    if (stage !== "live" || phase !== "listening" || typedMode) return;
    const id = setInterval(() => {
      if (phaseRef.current !== "listening") return;
      const now = Date.now();
      if (answerRef.current && lastSpeechRef.current !== null) {
        if (now - lastSpeechRef.current >= SILENCE_SUBMIT_MS) flowRef.current.submit(false);
      } else if (now - listenStartRef.current >= NO_SPEECH_MS) {
        if (!repromptedRef.current) flowRef.current.reprompt();
        else flowRef.current.submit(false);
      }
    }, 400);
    return () => clearInterval(id);
  }, [stage, phase, typedMode]);

  // Session timer.
  useEffect(() => {
    if (stage !== "live") return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  // Full cleanup on unmount (speech + TTS hooks clean themselves up too).
  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      abortRef.current?.abort();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startSession = () => {
    runIdRef.current += 1;
    historyRef.current = [];
    turnsRef.current = [];
    questionRef.current = "";
    questionNoRef.current = 0;
    isEndingRef.current = false;
    totalsRef.current = { words: 0, speakingMs: 0, fillers: 0 };
    startTimeRef.current = Date.now();
    face.reset();
    setTurns([]);
    setQuestion("");
    setQuestionNo(0);
    setElapsed(0);
    setReport(null);
    setStage("live");
    void askNext("");
  };

  const restart = () => {
    runIdRef.current += 1;
    voice.cancel();
    setReport(null);
    setApiError(null);
    setNotice(null);
    setStage("setup");
  };

  const retryReport = () => {
    if (report) void fetchReport(report.metrics, report.turns);
  };

  // ================= RENDER =================

  if (stage === "report" && report) {
    return (
      <div className={styles.wrap}>
        <LiveVivaReport report={report} vivaLabel={`${vivaType.label} · ${topic}`} onRetry={retryReport} onRestart={restart} />
      </div>
    );
  }

  const cameraBox = (
    <div className={styles.videoBox}>
      {camState === "ready" ? (
        <video ref={attachVideo} className={styles.video} autoPlay playsInline muted aria-label="Your camera preview (mirrored)" />
      ) : (
        <div className={styles.videoPlaceholder}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          <span>{camState === "requesting" ? "Waiting for permission…" : "Camera off"}</span>
        </div>
      )}
      {camState === "ready" && face.status === "loading" && <span className={styles.videoBadge}>Loading face analysis…</span>}
    </div>
  );

  const indicators = camState === "ready" && face.status === "ready" && face.live && (
    <div className={styles.indicators} aria-live="polite">
      <span className={`${styles.pill} ${face.live.eyeContact ? styles.pillGood : styles.pillWarn}`}>
        Eye contact: {face.live.eyeContact ? "good" : "look at camera"}
      </span>
      <span className={`${styles.pill} ${face.live.framing ? styles.pillGood : styles.pillWarn}`}>
        Framing: {face.live.framing ? "good" : "adjust"}
      </span>
      {face.live.hint && <span className={styles.hint}>{face.live.hint}</span>}
    </div>
  );

  if (stage === "setup") {
    return (
      <div className={styles.wrap}>
        <div className={styles.setupGrid}>
          <div className={styles.setupForm}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>1. Viva type</legend>
              <div className={styles.typeGrid}>
                {LIVE_VIVA_TYPES.map((t) => {
                  const meta = typeMeta[t.id] || {};
                  const active = t.id === vivaTypeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      className={`${styles.typeCard} ${active ? styles.typeCardActive : ""}`}
                      style={meta.color ? ({ "--accent": meta.color } as React.CSSProperties) : undefined}
                      onClick={() => {
                        setVivaTypeId(t.id);
                        setTopic(t.topics[0]);
                      }}
                    >
                      {meta.icon && <span className={styles.typeIcon} aria-hidden="true">{meta.icon}</span>}
                      <span className={styles.typeText}>
                        <span className={styles.typeLabel}>{t.label}</span>
                        <span className={styles.typeBlurb}>{t.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className={styles.row2}>
              <label className={styles.field}>
                <span className={styles.legend}>2. Focus</span>
                <select className={styles.select} value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {vivaType.topics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>3. Length</legend>
                <div className={styles.segment}>
                  {LIVE_VIVA_LENGTHS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={length === n}
                      className={`${styles.segBtn} ${length === n ? styles.segBtnActive : ""}`}
                      onClick={() => setLength(n)}
                    >
                      {n} questions <small>~{n === 6 ? "8" : "15"} min</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <p className={styles.privacy}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Video and audio stay in your browser; only the text of your answers is sent to generate questions and feedback.
            </p>
          </div>

          <div className={styles.setupDevice}>
            {cameraBox}
            {indicators}
            <ul className={styles.deviceList}>
              <li className={styles[`dev_${camState}`]}>
                <strong>Camera:</strong> {camState === "ready" ? "ready" : camState === "requesting" ? "requesting…" : camState === "denied" ? "unavailable" : "not checked"}
                {camMsg && <span className={styles.devMsg}>{camMsg}</span>}
              </li>
              <li className={styles[`dev_${micState}`]}>
                <strong>Microphone:</strong> {micState === "ready" ? "ready" : micState === "requesting" ? "requesting…" : micState === "denied" ? "unavailable" : "not checked"}
                {micMsg && <span className={styles.devMsg}>{micMsg}</span>}
              </li>
              {speech.supported === false && (
                <li className={styles.dev_denied}>
                  <strong>Voice answers:</strong> not supported in this browser (use Chrome or Edge). You can type your answers instead.
                </li>
              )}
              {voice.supported === false && (
                <li className={styles.dev_denied}>
                  <strong>Interviewer voice:</strong> not supported here; questions will be shown on screen.
                </li>
              )}
            </ul>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => void checkDevices()} disabled={camState === "requesting"}>
                {camState === "idle" ? "Check camera & mic" : "Check again"}
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={startSession}
                disabled={camState === "requesting" || micState === "requesting" || (camState === "idle" && micState === "idle")}
              >
                {camState === "ready" ? "Start live viva" : "Start without camera"}
              </button>
            </div>
            {camState === "idle" && micState === "idle" && <p className={styles.smallNote}>Check your devices first, then start.</p>}
          </div>
        </div>
      </div>
    );
  }

  // ---- live ----
  const stateLabel = phase === "thinking" ? "Thinking…" : phase === "speaking" ? "Speaking…" : "Listening…";
  return (
    <div className={styles.wrap}>
      <div className={styles.liveTop}>
        <span className={styles.liveTag}>
          <span className={styles.recDot} aria-hidden="true" /> Live viva · {vivaType.label}
        </span>
        <span className={styles.liveMeta}>
          Question {Math.max(questionNo, 1)} of {length} · <span aria-label="Elapsed time">{formatTime(elapsed)}</span>
          {liveWpm !== null && phase === "listening" && !typedMode && <> · {liveWpm} wpm</>}
        </span>
      </div>

      <div className={styles.liveGrid}>
        <div className={styles.livePanel}>
          <div className={`${styles.interviewer} ${styles[`ph_${phase}`]}`}>
            <div className={styles.avatar} aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.interviewerText}>
              <span className={styles.interviewerName}>AI Panelist</span>
              <span className={styles.stateLabel} role="status">{stateLabel}</span>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={voice.toggleMute}
              aria-pressed={voice.muted}
              aria-label={voice.muted ? "Unmute interviewer voice" : "Mute interviewer voice"}
              title={voice.muted ? "Unmute voice" : "Mute voice"}
            >
              {voice.muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
                </svg>
              )}
            </button>
          </div>

          <div className={styles.questionBox} aria-live="polite">
            {question ? <p className={styles.questionText}>{question}</p> : <p className={styles.questionWait}>Preparing your first question…</p>}
          </div>

          {notice && <p className={styles.notice}>{notice}</p>}
          {apiError && (
            <div className={styles.errorBox} role="alert">
              <span>{apiError}</span>
              <button type="button" className={styles.btnGhostSm} onClick={() => void askNext(lastAnswerRef.current)}>
                Retry
              </button>
            </div>
          )}

          {typedMode ? (
            <div className={styles.answerArea}>
              <label className={styles.captionLabel} htmlFor="live-viva-typed">
                {speech.error || "Voice answers aren't available here — type your answer."}
              </label>
              <textarea
                id="live-viva-typed"
                className={styles.textarea}
                rows={4}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={phase !== "listening"}
                placeholder={phase === "listening" ? "Type your answer…" : "Wait for the question…"}
              />
            </div>
          ) : (
            <div className={styles.answerArea}>
              <span className={styles.captionLabel}>
                {phase === "listening" ? (
                  <>
                    <span className={styles.micDot} aria-hidden="true" /> Your answer (live captions) — pauses of 4 s submit automatically
                  </>
                ) : (
                  "Your mic is paused while the panelist speaks."
                )}
              </span>
              <div className={styles.captions} aria-live="off">
                {caption || <span className={styles.captionHint}>{phase === "listening" ? "Start speaking…" : "…"}</span>}
              </div>
            </div>
          )}

          <div className={styles.controls}>
            {phase === "speaking" && (
              <button type="button" className={styles.btnGhost} onClick={voice.cancel}>
                Skip voice, answer now
              </button>
            )}
            <button type="button" className={styles.btnPrimary} onClick={() => submit(false)} disabled={phase !== "listening"}>
              Done answering
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => submit(true)} disabled={phase !== "listening"}>
              Skip question
            </button>
            {!typedMode && speech.supported && (
              <button
                type="button"
                className={styles.btnLink}
                onClick={() => {
                  speech.abort();
                  setTypedAnswer(answerRef.current);
                  setForceTyped(true);
                }}
              >
                Type instead
              </button>
            )}
            <button type="button" className={styles.btnDanger} onClick={() => finish(false)}>
              End session
            </button>
          </div>
        </div>

        <div className={styles.liveSide}>
          {cameraBox}
          {indicators}
          {camState === "ready" && face.status === "unavailable" && (
            <p className={styles.smallNote}>Face analysis couldn&apos;t load, so eye contact and framing won&apos;t be scored.</p>
          )}
          {camState !== "ready" && <p className={styles.smallNote}>{camMsg || "Camera is off — eye contact and framing won't be scored."}</p>}
          {turns.length > 0 && (
            <details className={styles.sofar}>
              <summary>Answered so far ({turns.length})</summary>
              <ol>
                {turns.map((t, i) => (
                  <li key={i}>
                    <strong>{t.question}</strong>
                    <span>{t.answer || "(skipped)"}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
