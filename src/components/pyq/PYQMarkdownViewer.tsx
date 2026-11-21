"use client";

import React, { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import styles from "./PYQMarkdownViewer.module.css";

// ── Math (LaTeX) support ───────────────────────────────────────────────────────────
// Question banks (e.g. CAT PYQs) write maths as \( … \), \[ … \], $$ … $$ or $ … $.
// Invalid notation falls back to original text instead of throwing.
const MATH_RE = /\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)|(?<=(?:^|[^\w\$]))\$([^\$\n]+?)\$(?=(?:[^\w\$]|$))/g;
const TOKEN_RE = /\u0000M(\d+)\u0000/g;

/** Preprocesses markdown and math content, normalizing mojibake, unescaping double backslashes, and repairing roots/fractions. */
export function preprocessMathAndText(raw: string): string {
  if (!raw) return "";
  let s = raw;

  // 1. Repair Mojibake artifacts dynamically
  s = s
    .replace(/â\x80\x93/g, "–")
    .replace(/â\x80\x94/g, "—")
    .replace(/â\x80\x98/g, "‘")
    .replace(/â\x80\x99/g, "’")
    .replace(/â\x80\x9c/g, "“")
    .replace(/â\x80\x9d/g, "”")
    .replace(/â\x80\xa6/g, "…")
    .replace(/â\x80\xa2/g, "•")
    .replace(/â\x86\x92/g, "→")
    .replace(/â\x86\x93/g, "↓")
    .replace(/â\x86\x90/g, "←")
    .replace(/â\x86\x94/g, "↔")
    .replace(/â\s*\x93/g, "⅓")
    .replace(/â\s*\x94/g, "⅔")
    .replace(/Â\xa0/g, " ")
    .replace(/Â/g, "")
    .replace(/Ã—/g, "×")
    .replace(/Ã·/g, "÷");

  // 2. Unescape double backslashes before common LaTeX keywords
  s = s.replace(/\\\\([a-zA-Z]+)/g, "\\$1");

  // 3. Fix unicode square roots e.g. \√3 -> \sqrt{3}, √3 -> \sqrt{3}, √π -> \sqrt{\pi}
  s = s.replace(/\\?√\s*π/g, "\\sqrt{\\pi}");
  s = s.replace(/\\?√\s*\{([^}]+)\}/g, "\\sqrt{$1}");
  s = s.replace(/\\?√\s*\((\d+)\)/g, "\\sqrt{$1}");
  s = s.replace(/\\?√\s*(\d+)/g, "\\sqrt{$1}");
  s = s.replace(/\\?√\s*([a-zA-Z])(?![a-zA-Z])/g, "\\sqrt{$1}");

  // 4. Strip stray closing parenthesis artifact after fractions
  s = s.replace(/(\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\)/g, "$1");

  // 5. Wrap raw standalone \frac expressions not already inside math delimiters
  s = s.replace(/(?<!\\\(|\$|\\\[)\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}(?!\\\))/g, (m) => `\\(${m}\\)`);

  return s;
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false, strict: "ignore", output: "html" });
  } catch {
    return tex.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  }
}

/** Replaces every math segment with a placeholder token and returns the rendered HTML list. */
function extractMath(content: string): { text: string; html: string[] } {
  const html: string[] = [];
  const preprocessed = preprocessMathAndText(content);
  const text = preprocessed.replace(MATH_RE, (_m, display?: string, dollars?: string, inline?: string, singleDollar?: string) => {
    const isDisplay = display !== undefined || dollars !== undefined;
    const tex = display ?? dollars ?? inline ?? singleDollar ?? "";
    html.push(renderMath(tex.trim(), isDisplay));
    return `\u0000M${html.length - 1}\u0000`;
  });
  return { text, html };
}

/** Splits text on math placeholders, emitting rendered math spans between plain text. */
function withMath(text: string, html: string[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m.index! > last) out.push(<React.Fragment key={`${keyPrefix}-t${i}`}>{text.slice(last, m.index)}</React.Fragment>);
    out.push(<span key={`${keyPrefix}-m${i}`} dangerouslySetInnerHTML={{ __html: html[Number(m[1])] ?? "" }} />);
    last = m.index! + m[0].length;
    i++;
  }
  if (last < text.length) out.push(<React.Fragment key={`${keyPrefix}-t${i}`}>{text.slice(last)}</React.Fragment>);
  return out;
}

/** Single-line text that may contain maths, e.g. answer options. */
export function MathText({ text }: { text: string }) {
  if (!text) return null;
  let cleanText = preprocessMathAndText(text);

  // If the option has LaTeX tokens or symbols and isn't enclosed in \( ... \) or $$ or \[,
  // wrap the whole option so KaTeX renders it cleanly.
  const hasLatex = /\\(frac|sqrt|pi|log|le|ge|times|pm|left|right|sin|cos|tan|theta|neq|leq|geq)|[≤≥≠]/.test(cleanText);
  const alreadyDelimited = /\\\(|\\\[|\$\$|\$/.test(cleanText);
  if (hasLatex && !alreadyDelimited) {
    cleanText = `\\(${cleanText}\\)`;
  }

  const { text: t, html } = extractMath(cleanText);
  return <>{withMath(t, html, "mt")}</>;
}

interface PYQMarkdownViewerProps {
  content: string;
  className?: string;
}

export default function PYQMarkdownViewer({ content, className = "" }: PYQMarkdownViewerProps) {
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);

  if (!content) return null;

  // Pull maths out first so paragraph/table splitting cannot break LaTeX apart.
  const math = extractMath(content);

  // Split content into atomic block elements (paragraphs, tables, images, lists)
  const rawBlocks = math.text.split(/\n\s*\n/);
  const elements: React.ReactNode[] = [];

  const parseInline = (text: string): React.ReactNode => {
    // Inline bold (**bold**) + rendered maths
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{withMath(part.slice(2, -2), math.html, `b${i}`)}</strong>;
      }
      return <React.Fragment key={i}>{withMath(part, math.html, `p${i}`)}</React.Fragment>;
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "5px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Click diagram to zoom in full resolution
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={activeImage.src} alt={activeImage.alt} className={styles.lightboxImg} />
            <div className={styles.lightboxHint}>
              {activeImage.alt} • Click outside or close button to dismiss
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
