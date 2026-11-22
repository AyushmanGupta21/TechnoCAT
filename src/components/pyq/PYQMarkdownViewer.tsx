"use client";

import React, { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { X, ZoomIn } from "lucide-react";
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
    .replace(/â\x80\x90/g, "-")
    .replace(/â\x80\x91/g, "-")
    .replace(/â\x80\x92/g, "‒")
    .replace(/â\x98\x90/g, "–")
    .replace(/â\x96\xa1/g, "□")
    .replace(/â\x97\x8b/g, "○")
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

  // 2. Normalize {/frac} or /frac variants into \frac
  s = s.replace(/\{\s*\/frac\s*\}/g, "\\frac");
  s = s.replace(/(?<![a-zA-Z\\])\/frac\{/g, "\\frac{");

  // 3. Unescape double backslashes before common LaTeX keywords using callback
  s = s.replace(/\\\\([a-zA-Z]+)/g, (_m, g1) => "\\" + g1);

  // 4. Fix unicode square roots e.g. \√3 -> \sqrt{3}, √3 -> \sqrt{3}, √π -> \sqrt{\pi}
  s = s.replace(/\\?√\s*π/g, "\\sqrt{\\pi}");
  s = s.replace(/\\?√\s*\{([^}]+)\}/g, (_m, g1) => `\\sqrt{${g1}}`);
  s = s.replace(/\\?√\s*\((\d+)\)/g, (_m, g1) => `\\sqrt{${g1}}`);
  s = s.replace(/\\?√\s*(\d+)/g, (_m, g1) => `\\sqrt{${g1}}`);
  s = s.replace(/\\?√\s*([a-zA-Z])(?![a-zA-Z])/g, (_m, g1) => `\\sqrt{${g1}}`);

  // 5. Clean nested delimiters inside/around braces & parens
  s = s.replace(/(\{\s*)\\\(/g, "$1").replace(/\\\)(\s*\})/g, "$1");
  s = s.replace(/\(\s*\\\(\s*\\frac/g, "(\\frac");

  // 6. Strip stray closing parenthesis artifact after fractions
  s = s.replace(/(\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\)/g, (_m, g1) => g1);

  // 7. Ordinals in English prose: 24 ^{th} -> 24th, 20^{th} -> 20th
  s = s.replace(/(\d+)\s*\^\{\s*(st|nd|rd|th)\s*\}/gi, "$1$2");
  s = s.replace(/(\\\([^\)]*\\frac[^\)]*\\\))\s*\^\{\s*(st|nd|rd|th)\s*\}/gi, "$1$2");

  // 8. Units with powers: cm ^{3} -> cm³, m ^{2} -> m²
  s = s.replace(/\b(cm|m|mm|km)\s*\^\{\s*3\s*\}/g, "$1³");
  s = s.replace(/\b(cm|m|mm|km)\s*\^\{\s*2\s*\}/g, "$1²");

  // 9. Normalize spaces in raw subscripts and superscripts:
  // e.g. t _{1} -> t_{1}, 2n ^{2} -> 2n^{2}, (n-1) ^{2} -> (n-1)^{2}
  s = s.replace(/([a-zA-Z0-9\)\]])\s+_\{\s*([^{}]+)\s*\}/g, "$1_{$2}");
  s = s.replace(/([a-zA-Z0-9\)\]])\s+\^\{\s*([^{}]+)\s*\}/g, "$1^{$2}");

  // 10. Preserve existing math delimiters so we never inject \( inside existing math blocks
  const mathPlaceholders: string[] = [];
  s = s.replace(MATH_RE, (match) => {
    mathPlaceholders.push(match);
    return `___MTH_${mathPlaceholders.length - 1}___`;
  });

  // 11. Combinations outside math: ^{10} C _{2} -> \(^{10}\text{C}_{2}\)
  s = s.replace(/\^\{\s*(\w+)\s*\}\s*C\s*_\{\s*(\w+)\s*\}/g, "___COMB_$1_$2___");
  s = s.replace(/\b(\d+)\s*C\s*_\{\s*(\w+)\s*\}/g, "___COMB_$1_$2___");

  // 12. Wrap standalone \frac outside existing math safely
  s = s.replace(/\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, (m) => `\\(${m}\\)`);

  // 13. Wrap standalone subscript/superscript patterns outside math into \( ... \)
  // E.g. t_{1}, S_{n-1}, 2n^{2}, (n-1)^{2}, (5.55)^{x}, (-1)^{n-1}
  s = s.replace(/((?:\([a-zA-Z0-9\+\-\s\.]+\)|\[[a-zA-Z0-9\+\-\s\.]+\]|[a-zA-Z0-9]+)(?:_\{[^{}]+\}|\^\{[^{}]+\})+)/g, (m) => `\\(${m}\\)`);

  // 14. Restore combinations as LaTeX
  s = s.replace(/___COMB_(\w+)_(\w+)___/g, "\\(^{$1}\\text{C}_{$2}\\)");

  // 15. Restore existing math blocks
  s = s.replace(/___MTH_(\d+)___/g, (_m, idx) => mathPlaceholders[Number(idx)]);

  // 16. Ensure diagram images are separated into their own blocks so they render as full diagrams
  s = s.replace(/([^\n])\s*(!\[[^\n\]]*\]\s*\([^\n\)]+\))/g, "$1\n\n$2")
       .replace(/(!\[[^\n\]]*\]\s*\([^\n\)]+\))\s*([^\n])/g, "$1\n\n$2");

  return s;
}

/** Cleans LaTeX math strings before feeding to KaTeX */
function cleanLatexMath(tex: string): string {
  let t = tex.trim();
  // Strip stray trailing parenthesis artifact on fraction expressions e.g. \frac{a}{b})
  t = t.replace(/(\\frac\{[^{}]*\}\{[^{}]*\})\)+$/g, "$1");
  // Strip nested \( and \) inside math mode
  t = t.replace(/\\\(|\\\)/g, " ");
  // Fix common typo \pir -> \pi r
  t = t.replace(/\\pi([a-zA-Z])/g, "\\pi $1");
  return t;
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    const cleaned = cleanLatexMath(tex);
    return katex.renderToString(cleaned, { displayMode, throwOnError: false, strict: "ignore", output: "html" });
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
    // 1. Split on markdown images (supporting inline formula images and diagrams)
    const imgParts = text.split(/(!\[[^\n\]]*\]\s*\([^\n\)]+\))/g);
    return imgParts.map((part, pIdx) => {
      const inlineImgMatch = part.match(/^!\[(.*?)\]\s*\((.*?)\)$/);
      if (inlineImgMatch) {
        const alt = inlineImgMatch[1] || "Diagram";
        const src = inlineImgMatch[2];
        const isInlineFormula = src.includes("image0") || src.includes("figa_img") || src.includes("wiz");
        return (
          <img
            key={`inline-img-${pIdx}`}
            src={src}
            alt={alt}
            className={isInlineFormula ? styles.inlineFormulaImg : styles.inlineChartImage}
            onClick={() => setActiveImage({ src, alt })}
            title="Click to view full diagram"
            loading="lazy"
          />
        );
      }

      // 2. Inline bold (**bold**) + rendered maths
      const parts = part.split(/(\*\*.*?\*\*)/g);
      return parts.map((subpart, i) => {
        if (subpart.startsWith("**") && subpart.endsWith("**")) {
          return <strong key={`b-${pIdx}-${i}`}>{withMath(subpart.slice(2, -2), math.html, `b${pIdx}-${i}`)}</strong>;
        }
        return <React.Fragment key={`p-${pIdx}-${i}`}>{withMath(subpart, math.html, `p${pIdx}-${i}`)}</React.Fragment>;
      });
    });
  };

  rawBlocks.forEach((block, blockIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // 1. Check for Image Block: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\s*\((.*?)\)$/);
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
            <ZoomIn size={13} aria-hidden="true" />
            Click the diagram to zoom
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
              <X size={16} aria-hidden="true" />
            </button>
            <img src={activeImage.src} alt={activeImage.alt} className={styles.lightboxImg} />
            <div className={styles.lightboxHint}>
              {activeImage.alt} · Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
