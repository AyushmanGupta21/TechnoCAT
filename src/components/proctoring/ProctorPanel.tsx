"use client";

import React from "react";
import styles from "./Proctoring.module.css";
import type { ProctorStatus } from "./useProctoring";
import { CircleAlert, Cpu, ScanFace, TriangleAlert, Video } from "lucide-react";

const STATUS_LABEL: Record<ProctorStatus, string> = {
  idle: "Proctoring off",
  requesting: "Requesting camera...",
  ready: "Camera ready",
  loading: "Starting proctoring...",
  active: "Proctoring active",
  denied: "Proctoring off",
  unavailable: "Proctoring unavailable",
  camera_off: "Camera off",
  off: "Proctoring off",
};

interface ProctorPanelProps {
  status: ProctorStatus;
  liveHint: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** True when the student chose (or had) to start without the camera. */
  proctored: boolean;
}

/** Small live camera preview in the corner of the exam with the current proctoring status. */
export default function ProctorPanel({ status, liveHint, videoRef, proctored }: ProctorPanelProps) {
  const showVideo = proctored && (status === "loading" || status === "active" || status === "ready");
  const tone =
    status === "active" ? (liveHint ? styles.toneWarn : styles.toneOk) : status === "loading" ? styles.toneInfo : styles.toneOff;

  return (
    <div
      className={styles.panel}
      title="Camera frames are analysed on this device only; no video is uploaded. Automatic detection reduces cheating but is not perfect."
      aria-live="polite"
    >
      {proctored && (
        <video
          ref={videoRef}
          className={styles.preview}
          style={{ display: showVideo ? "block" : "none" }}
          muted
          playsInline
          autoPlay
        />
      )}
      <div className={styles.statusRow}>
        <span className={`${styles.dot} ${tone}`} />
        <span className={styles.statusText}>{STATUS_LABEL[status]}</span>
      </div>
      {status === "active" && liveHint && <div className={styles.hint}>{liveHint}</div>}
    </div>
  );
}

interface ProctorConsentProps {
  status: ProctorStatus;
  onEnable: () => void;
  onStartWithout: () => void;
  onCancel: () => void;
}

/** Pre-exam consent step shown before the timer starts. */
export function ProctorConsent({ status, onEnable, onStartWithout, onCancel }: ProctorConsentProps) {
  const denied = status === "denied";
  const requesting = status === "requesting";
  return (
    <div className={styles.consentOverlay}>
      <div className={styles.consentCard} role="dialog" aria-modal="true" aria-labelledby="proctor-consent-title">
        <div className={styles.consentHead}>
          <span className={styles.consentIcon} aria-hidden="true">
            <Video size={20} />
          </span>
          <div>
            <span className={styles.consentKicker}>Before you begin</span>
            <h3 id="proctor-consent-title" className={styles.consentTitle}>
              Webcam proctoring
            </h3>
          </div>
        </div>
        <ul className={styles.consentList}>
          <li>
            <ScanFace size={17} className={styles.consentLiIcon} aria-hidden="true" />
            <span>Your camera is used to check that you are alone, facing the screen and not using a phone.</span>
          </li>
          <li>
            <Cpu size={17} className={styles.consentLiIcon} aria-hidden="true" />
            <span>
              <strong>Video is processed on this device only.</strong> No video or images are uploaded; only short
              event labels (e.g. &ldquo;no face detected&rdquo;) are recorded with your attempt.
            </span>
          </li>
          <li>
            <TriangleAlert size={17} className={`${styles.consentLiIcon} ${styles.consentLiWarn}`} aria-hidden="true" />
            <span>
              Each confirmed violation counts as a proctoring strike (<b className={styles.mono}>-1</b> mark), the same
              as switching tabs. <b className={styles.mono}>3</b> strikes auto-submit the exam.
            </span>
          </li>
          <li className={styles.consentMuted}>
            <CircleAlert size={17} className={styles.consentLiIcon} aria-hidden="true" />
            <span>
              Automatic detection reduces cheating but is not perfect: it can miss things or occasionally misread
              lighting and posture. Keep your face well lit and centred.
            </span>
          </li>
        </ul>

        {denied && (
          <div className={styles.consentWarn}>
            Camera access was denied or no camera is available. You can still take the exam without proctoring;
            this will be recorded as an unproctored attempt.
          </div>
        )}

        <div className={styles.consentActions}>
          <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={requesting}>
            Not now
          </button>
          {denied ? (
            <>
              <button type="button" className={styles.btnGhost} onClick={onEnable}>
                Try camera again
              </button>
              <button type="button" className={styles.btnPrimary} onClick={onStartWithout}>
                Start without proctoring
              </button>
            </>
          ) : (
            <button type="button" className={styles.btnPrimary} onClick={onEnable} disabled={requesting}>
              {requesting ? "Waiting for camera..." : "Enable camera & start"}
            </button>
          )}
        </div>
        <p className={styles.consentFoot}>The timer starts only after you begin.</p>
      </div>
    </div>
  );
}
