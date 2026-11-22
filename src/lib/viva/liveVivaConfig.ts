// Shared (client + server) configuration for the live camera + voice AI viva.
// Viva type ids match the CATEGORIES ids on /mock-viva-prep so the page can reuse
// its icons and colours. Kept free of React so the API route can import it.

export type LiveVivaMode = "pi" | "academic" | "ca" | "stress";

export interface LiveVivaType {
  id: string;
  label: string;
  blurb: string;
  mode: LiveVivaMode;
  topics: string[];
}

export const LIVE_VIVA_TYPES: LiveVivaType[] = [
  {
    id: "personal-hr",
    label: "Personal Interview (PI)",
    blurb: "A B-school PI panel on your background, CV, strengths and values.",
    mode: "pi",
    topics: [
      "Mixed PI round",
      "Walk me through your CV",
      "Strengths, weaknesses & values",
      "Work experience & internships",
      "Hobbies & extracurriculars",
      "Graduation subject & college",
    ],
  },
  {
    id: "goals",
    label: "Why MBA & Career Goals",
    blurb: "Why MBA, why now, why this B-school, and where you see yourself.",
    mode: "pi",
    topics: ["Why MBA, why now", "Short- and long-term goals", "Why this B-school", "Specialisation choice"],
  },
  {
    id: "academics",
    label: "Academic CAT Concept Viva",
    blurb: "Conceptual questions and follow-ups on CAT QA, DILR and VARC.",
    mode: "academic",
    topics: [
      "Mixed QA / DILR / VARC",
      "Quantitative Aptitude (QA)",
      "Data Interpretation & Logical Reasoning (DILR)",
      "Verbal Ability & Reading Comprehension (VARC)",
    ],
  },
  {
    id: "current-affairs",
    label: "Current Affairs & Business",
    blurb: "Your views on the economy, business, technology and policy.",
    mode: "ca",
    topics: ["Mixed current affairs", "Indian economy & policy", "Business & startups", "Technology & AI", "Global affairs"],
  },
  {
    id: "situational",
    label: "Situational & Behavioural",
    blurb: "Leadership, teamwork, conflict and ethical dilemmas.",
    mode: "pi",
    topics: ["Leadership & teamwork", "Conflict & failure", "Ethical dilemmas"],
  },
  {
    id: "gd-stress",
    label: "Stress Interview",
    blurb: "A polite but challenging panel that pushes back on your answers.",
    mode: "stress",
    topics: ["Stress PI round", "Challenge my career choices"],
  },
];

export const LIVE_VIVA_LENGTHS = [6, 10] as const;

export function findLiveVivaType(id: unknown): LiveVivaType {
  return LIVE_VIVA_TYPES.find((t) => t.id === id) ?? LIVE_VIVA_TYPES[0];
}

/** Behavioural metrics measured in the browser and sent (as numbers only) with the report request. */
export interface LiveVivaMetrics {
  /** Percent of analysed frames; null when the camera/model was unavailable. */
  eyeContactPct: number | null;
  faceInFramePct: number | null;
  framingPct: number | null;
  avgWpm: number | null;
  fillerCount: number;
  questionsAnswered: number;
  questionsAsked: number;
  durationSeconds: number;
}

export interface LiveVivaTurn {
  question: string;
  answer: string;
  skipped?: boolean;
}

export interface LiveVivaAssessment {
  overallScore: number;
  contentScore: number;
  deliveryScore: number | null;
  verdict: string;
  strengths: string[];
  improvements: string[];
  topicsToRevise: string[];
  nextSteps: string[];
  perAnswer: { question: string; feedback: string }[];
  source: "ai" | "local";
}

export const FILLER_RE = /\b(?:u+m+|u+h+|like|basically|actually|you know|so)\b/gi;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countFillers(text: string): number {
  return (text.match(FILLER_RE) || []).length;
}
