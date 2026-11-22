"use client";

// Browser text-to-speech for the AI interviewer (speechSynthesis). Prefers an
// Indian or British English voice. speak() resolves when speech ends, fails or
// is cancelled, so callers can safely await it before listening.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const by = (pred: (v: SpeechSynthesisVoice) => boolean) => voices.find(pred) || null;
  return (
    by((v) => v.lang === "en-IN") ||
    by((v) => v.lang.replace("_", "-") === "en-IN") ||
    by((v) => v.lang === "en-GB" && /female|google|natural/i.test(v.name)) ||
    by((v) => v.lang === "en-GB") ||
    by((v) => v.lang.startsWith("en") && /natural|google/i.test(v.name)) ||
    by((v) => v.lang.startsWith("en")) ||
    null
  );
}

export function useInterviewerVoice() {
  const supported = useSyncExternalStore<boolean | null>(
    noopSubscribe,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => null
  );
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const mutedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const finishRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const update = () => {
      voiceRef.current = pickVoice();
    };
    update();
    synth.addEventListener?.("voiceschanged", update);
    return () => {
      synth.removeEventListener?.("voiceschanged", update);
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }
      finishRef.current?.();
    };
  }, []);

  const cancel = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    finishRef.current?.();
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis || mutedRef.current || !text.trim()) {
        resolve();
        return;
      }
      const synth = window.speechSynthesis;
      // Finish any previous utterance's promise first.
      finishRef.current?.();
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }

      let done = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const finish = () => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        if (finishRef.current === finish) finishRef.current = null;
        setSpeaking(false);
        resolve();
      };
      finishRef.current = finish;

      const u = new SpeechSynthesisUtterance(text);
      const voice = voiceRef.current || pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "en-IN";
      }
      u.rate = 0.98;
      u.pitch = 1;
      u.onend = finish;
      u.onerror = finish;
      // Safety net: some browsers never fire onend (e.g. tab hidden).
      const words = text.split(/\s+/).length;
      timer = setTimeout(finish, Math.min(30000, 2500 + words * 520));
      setSpeaking(true);
      try {
        synth.speak(u);
      } catch {
        finish();
      }
    });
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) cancel();
  }, [cancel]);

  return { supported, muted, speaking, speak, cancel, toggleMute };
}
