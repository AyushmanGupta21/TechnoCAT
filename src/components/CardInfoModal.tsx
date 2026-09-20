"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./CardInfoModal.module.css";

export interface CardInfoData {
  badge?: string;
  title: string;
  description: string;
  highlights?: string[];
  primaryBtnText?: string;
  onPrimaryClick?: () => void;
  secondaryBtnText?: string;
}

interface CardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CardInfoData | null;
}

export default function CardInfoModal({ isOpen, onClose, data }: CardInfoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !data) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className={styles.headerBand}>
          {data.badge && <span className={styles.badge}>{data.badge}</span>}
          <h3 className={styles.title}>{data.title}</h3>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.description}>{data.description}</p>

          {data.highlights && data.highlights.length > 0 && (
            <div className={styles.highlightsList}>
              {data.highlights.map((item, idx) => (
                <div key={idx} className={styles.highlightItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.checkIcon}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footerActions}>
          <button className={styles.secondaryButton} onClick={onClose}>
            {data.secondaryBtnText || "Dismiss"}
          </button>
          {data.onPrimaryClick && (
            <button
              className={styles.primaryButton}
              onClick={() => {
                onClose();
                data.onPrimaryClick?.();
              }}
            >
              <span>{data.primaryBtnText || "Get Started"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
