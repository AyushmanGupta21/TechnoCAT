"use client";

import React, { useState } from "react";
import styles from "./PYQMarkdownViewer.module.css";

interface PYQMarkdownViewerProps {
  content: string;
  className?: string;
}

export default function PYQMarkdownViewer({ content, className = "" }: PYQMarkdownViewerProps) {
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);

  if (!content) return null;

  // Split content into atomic block elements (paragraphs, tables, images, lists)
  const rawBlocks = content.split(/\n\s*\n/);
  const elements: React.ReactNode[] = [];

  const parseInline = (text: string): React.ReactNode => {
    // Basic inline bold formatting (**bold**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  rawBlocks.forEach((block, blockIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // 1. Check for Image Block: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1] || "Diagram";
      const src = imgMatch[2];
      elements.push(
        <div key={`img-${blockIdx}`} className={styles.imageWrapper}>
          <img
            src={src}
            alt={alt}
            className={styles.chartImage}
            onClick={() => setActiveImage({ src, alt })}
            title="Click to view full-resolution diagram"
            loading="lazy"
          />
          <span className={styles.imageCaption}>
            🔍 Click diagram to zoom in full resolution
          </span>
        </div>
      );
      return;
    }

    // 2. Check for Table Block
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const isTable = lines.length >= 2 && lines[0].startsWith("|") && lines[0].endsWith("|") && lines[1].includes("---");
    if (isTable) {
      const headerCells = lines[0]
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const bodyRows = lines.slice(2).map((row) =>
        row
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim())
      );

      elements.push(
        <div key={`tbl-${blockIdx}`} className={styles.tableContainer}>
          <table className={styles.mdTable}>
            <thead>
              <tr>
                {headerCells.map((h, hIdx) => (
                  <th key={hIdx}>{parseInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{parseInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      return;
    }

    // 3. Check for List Block (Numbered or Bullets)
    const isNumberedList = lines.every((l) => /^\d+[\.\)]\s+/.test(l));
    const isBulletList = lines.every((l) => /^[•\-\*]\s+/.test(l));

    if (isNumberedList) {
      elements.push(
        <ol key={`ol-${blockIdx}`} className={styles.mdList}>
          {lines.map((item, iIdx) => {
            const cleanText = item.replace(/^\d+[\.\)]\s+/, "");
            return (
              <li key={iIdx} className={styles.mdListItem}>
                {parseInline(cleanText)}
              </li>
            );
          })}
        </ol>
      );
      return;
    }

    if (isBulletList) {
      elements.push(
        <ul key={`ul-${blockIdx}`} className={styles.mdList}>
          {lines.map((item, iIdx) => {
            const cleanText = item.replace(/^[•\-\*]\s+/, "");
            return (
              <li key={iIdx} className={styles.mdListItem}>
                {parseInline(cleanText)}
              </li>
            );
          })}
        </ul>
      );
      return;
    }

    // 4. Regular Paragraph (may contain inline lists or sentences)
    elements.push(
      <p key={`p-${blockIdx}`} className={styles.mdPara}>
        {parseInline(trimmed)}
      </p>
    );
  });

  return (
    <div className={`${styles.mdContainer} ${className}`}>
      {elements}

      {/* Lightbox Modal for Full Resolution inspection */}
      {activeImage && (
        <div className={styles.lightboxOverlay} onClick={() => setActiveImage(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setActiveImage(null)}
              title="Close Zoom"
            >
              ✕
            </button>
            <img src={activeImage.src} alt={activeImage.alt} className={styles.lightboxImg} />
            <div className={styles.lightboxHint}>
              {activeImage.alt} • Click outside or ✕ to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
