// Estimated CAT percentile from a scaled-free raw score (CAT marking: +3 / -1 MCQ, TITA no
// negative), by linear interpolation over reference curves.
//
// IMPORTANT: the reference points are approximations of CAT 2024 score-vs-percentile figures
// as reported in public post-exam analyses. They are NOT official IIM data, real percentiles
// depend on the slot and on normalisation, and TechnoCAT does not have a national sample of
// test takers. Every value derived from here must be shown as "Estimated" together with
// PERCENTILE_DISCLAIMER. Recalibrate these points when a new CAT result cycle is published.

export const PERCENTILE_DISCLAIMER =
  "Estimated from approximate CAT 2024 score-vs-percentile trends. Not an official percentile; actual results depend on your slot and IIM normalisation.";

export type CurveSection = "VARC" | "DILR" | "QA" | "OVERALL";

type Curve = ReadonlyArray<readonly [score: number, percentile: number]>;

/** Full-section maximum marks in the current CAT pattern (24 / 22 / 22 questions × 3). */
export const SECTION_MAX_MARKS: Record<Exclude<CurveSection, "OVERALL">, number> = { VARC: 72, DILR: 66, QA: 66 };

const CURVES: Record<CurveSection, Curve> = {
  VARC: [[0, 0], [5, 30], [10, 50], [13, 60], [15, 70], [19, 80], [25, 90], [30, 95], [35, 98], [40, 99], [50, 99.9], [72, 99.99]],
  DILR: [[0, 0], [3, 30], [7, 50], [9, 60], [11, 70], [14, 80], [20, 90], [24, 95], [28, 98], [32, 99], [42, 99.9], [66, 99.99]],
  QA: [[0, 0], [3, 30], [7, 50], [9, 60], [11, 70], [15, 80], [20, 90], [26, 95], [31, 98], [35, 99], [45, 99.9], [66, 99.99]],
  OVERALL: [[0, 0], [10, 30], [22, 50], [27, 60], [33, 70], [42, 80], [48, 85], [56, 90], [70, 95], [85, 98], [95, 99], [105, 99.5], [135, 99.95], [198, 99.99]],
};

/** Estimated percentile for a score: one decimal (two above 99), never above 99.99. */
export function estimatePercentile(section: CurveSection, score: number): number {
  const curve = CURVES[section];
  if (score <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [s1, p1] = curve[i];
    if (score <= s1) {
      const [s0, p0] = curve[i - 1];
      const p = Math.min(99.99, p0 + ((score - s0) / (s1 - s0)) * (p1 - p0));
      return p > 99 ? Math.round(p * 100) / 100 : Math.round(p * 10) / 10;
    }
  }
  return curve[curve.length - 1][1];
}
