"use client";

// Live speech-to-text using the browser's Web Speech API (SpeechRecognition /
// webkitSpeechRecognition). No audio is uploaded by this app; the browser's own
// speech service does the recognition. Also counts long pauses cheaply by timing
// the gaps between recognition results.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typings — the Web Speech API is not consistently present in lib.dom.
interface SpeechAlternativeLike {
  transcript: string;
}
interface SpeechResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
}
interface SpeechResultEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultLike };
}
interface SpeechErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEventLike) => void) | null;
  onerror: ((e: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const noopSubscribe = () => () => {};

/** A gap of this many ms between recognised phrases counts as a long pause. */
const LONG_PAUSE_MS = 3000;

function errorMessage(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone/speech permission was denied, so live transcription is off — type your answer instead.";
    case "audio-capture":
      return "No microphone was found for live transcription — type your answer instead.";
    case "network":
      return "Live transcription needs an internet connection in this browser — type or edit your answer instead.";
    case "language-not-supported":
      return "English (India) transcription isn't available in this browser — type your answer instead.";
    case "no-speech":
    case "aborted":
      return null; // benign; we simply keep listening / were stopped on purpose
    default:
      return "Live transcription stopped unexpectedly — you can edit or type your answer below.";
  }
}

export interface SpeechTranscriptionResult {
  /** null until mounted (avoids hydration mismatch), then true/false. */
  supported: boolean | null;
  listening: boolean;
  error: string | null;
  /** Number of gaps >= 3 s between recognised phrases in the last session. */
  longPauses: number;
  /** Start listening; onText receives the full transcript (final + interim) on every update. */
  start: (onText: (text: string, finalText: string) => void) => void;
  stop: () => void;
  /** Stop immediately and discard any pending results. */
  abort: () => void;
}

export function useSpeechTranscription(lang = "en-IN"): SpeechTranscriptionResult {
  // Feature detection on the client only; null during SSR/hydration.
  const supported = useSyncExternalStore<boolean | null>(
    noopSubscribe,
    () => getRecognitionCtor() !== null,
    () => null
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [longPauses, setLongPauses] = useState(0);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false); // user still wants to listen (auto-restart on silence end)
  const finalRef = useRef(""); // finalised text from previous recognition sessions + this one
  const sessionFinalRef = useRef(""); // finalised text within the current recognition session
  const lastResultAtRef = useRef<number | null>(null);
  const pausesRef = useRef(0);
  const onTextRef = useRef<((text: string, finalText: string) => void) | null>(null);

  useEffect(() => {
    return () => {
      wantRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, []);

  const startSession = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    sessionFinalRef.current = "";

    rec.onresult = (e) => {
      if (recRef.current !== rec) return;
      const now = Date.now();
      if (lastResultAtRef.current !== null && now - lastResultAtRef.current >= LONG_PAUSE_MS) {
        pausesRef.current += 1;
        setLongPauses(pausesRef.current);
      }
      lastResultAtRef.current = now;

      let sessionFinal = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) sessionFinal += t + " ";
        else interim += t + " ";
      }
      sessionFinalRef.current = sessionFinal;
      const finalText = (finalRef.current + " " + sessionFinal).replace(/\s+/g, " ").trim();
      const full = (finalText + " " + interim).replace(/\s+/g, " ").trim();
      onTextRef.current?.(full, finalText);
    };

    rec.onerror = (e) => {
      if (recRef.current !== rec) return;
      const msg = errorMessage(e.error);
      if (msg) {
        setError(msg);
        wantRef.current = false; // fatal for this attempt; don't loop restarts
      }
    };

    rec.onend = () => {
      if (recRef.current !== rec) return; // superseded or aborted
      // Commit this session's final text before possibly restarting.
      finalRef.current = (finalRef.current + " " + sessionFinalRef.current).replace(/\s+/g, " ").trim();
      sessionFinalRef.current = "";
      if (wantRef.current) {
        // Chrome ends continuous sessions after silence; resume transparently.
        try {
          startSession();
          return;
        } catch {
          wantRef.current = false;
        }
      }
      recRef.current = null;
      setListening(false);
      // Emit the committed transcript once more so callers get the final text.
      onTextRef.current?.(finalRef.current, finalRef.current);
    };

    recRef.current = rec;
    rec.start();
  }, [lang]);

  const start = useCallback(
    (onText: (text: string, finalText: string) => void) => {
      if (!getRecognitionCtor()) return;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      onTextRef.current = onText;
      finalRef.current = "";
      sessionFinalRef.current = "";
      lastResultAtRef.current = null;
      pausesRef.current = 0;
      setLongPauses(0);
      setError(null);
      wantRef.current = true;
      try {
        startSession();
        setListening(true);
      } catch {
        wantRef.current = false;
        setError("Live transcription couldn't start — type your answer instead.");
      }
    },
    [startSession]
  );

  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop(); // pending final results still arrive before onend
    } catch {
      /* ignore */
    }
  }, []);

  const abort = useCallback(() => {
    wantRef.current = false;
    onTextRef.current = null;
    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  return { supported, listening, error, longPauses, start, stop, abort };
}
