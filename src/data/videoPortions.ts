export interface VideoChapter {
  startTime: number;
  endTime: number;
  displayTime: string;
  title: string;
  summary: string;
  keyConcepts: string[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // 0 = A, 1 = B, 2 = C, 3 = D
  explanation: string;
}

export interface LessonKnowledge {
  lessonCode: string;
  chapters: VideoChapter[];
  quiz: QuizQuestion[];
}

export const VIDEO_PORTIONS_MAP: Record<string, LessonKnowledge> = {
  "QA-0.1": {
    lessonCode: "QA-0.1",
    chapters: [
      {
        startTime: 0,
        endTime: 510,
        displayTime: "00:00 - 08:30",
        title: "Vedic Multiplication & Base Methods",
        summary: "High-speed mental multiplication techniques using base 10, 50, and 100.",
        keyConcepts: ["Base 100 cross-multiplication", "Deviations from base", "Left-to-right calculation mental flow"]
      },
      {
        startTime: 510,
        endTime: 1125,
        displayTime: "08:30 - 18:45",
        title: "Squaring & Square Root Heuristics",
        summary: "Finding squares of numbers near 50, 100, and ending in 5 in under 3 seconds.",
        keyConcepts: ["Ending in 5: n*(n+1) suffix 25", "Near 50: (25 + diff) | diff^2", "Prime factor root bounds"]
      },
      {
        startTime: 1125,
        endTime: 1750,
        displayTime: "18:45 - 29:10",
        title: "Fraction-to-Percentage Reciprocals",
        summary: "Memorizing reciprocals 1/2 through 1/20 and standard percentage multiples.",
        keyConcepts: ["1/7 = 14.28%", "1/8 = 12.5%", "1/11 = 9.09% vs 1/9 = 11.11%", "Equivalent fraction tables"]
      },
      {
        startTime: 1750,
        endTime: 2300,
        displayTime: "29:10 - 38:20",
        title: "Decimal Elimination & Division Approximations",
        summary: "Techniques to eliminate tedious long division in Data Interpretation sets.",
        keyConcepts: ["10% and 1% benchmark stepping", "Numerator/Denominator proportional adjusting", "Margin of error testing"]
      },
      {
        startTime: 2300,
        endTime: 2880,
        displayTime: "38:20 - 48:00",
        title: "Speed Drills & Exam-Hall Time Savers",
        summary: "Applying combined speed math principles to past CAT calculation questions.",
        keyConcepts: ["Option elimination through unit digits", "Digital root / Remainder checks", "Time management under pressure"]
      }
    ],
    quiz: [
      {
        q: "What is the decimal-to-percentage value of 1/7?",
        options: ["12.5%", "14.28%", "16.66%", "11.11%"],
        answer: 1,
        explanation: "1/7 is approximately 14.28% (or 14 2/7%). 1/6 is 16.66% and 1/8 is 12.5%."
      },
      {
        q: "Using the base 100 shortcut, what is 96 × 97?",
        options: ["9312", "9412", "9212", "9302"],
        answer: 0,
        explanation: "Deviations from 100: -4 and -3. Left part: 96 - 3 = 93. Right part: (-4) × (-3) = 12. Total = 9312."
      },
      {
        q: "If a quantity increases by 25%, what fraction multiplier represents the new quantity?",
        options: ["4/5", "5/4", "6/5", "3/4"],
        answer: 1,
        explanation: "A 25% increase corresponds to (1 + 25/100) = (1 + 1/4) = 5/4."
      },
      {
        q: "Which technique is most effective for estimating 478 / 1520 in CAT Data Interpretation?",
        options: [
          "Performing full long division to 4 decimals",
          "Rounding to 480 / 1500 = 16/50 = 32% (approx. 31.4%)",
          "Randomly selecting an option",
          "Inverting the numbers"
        ],
        answer: 1,
        explanation: "Benchmark rounding to 480/1500 gives an instant 32%, within 0.6% of the exact value (31.45%)."
      },
      {
        q: "What is the square of 75 using the speed math shortcut for numbers ending in 5?",
        options: ["5525", "5625", "5425", "5725"],
        answer: 1,
        explanation: "For 75: 7 × (7 + 1) = 56, followed by 25. Thus 75² = 5625."
      }
    ]
  },
  "QA-1.1": {
    lessonCode: "QA-1.1",
    chapters: [
      {
        startTime: 0,
        endTime: 860,
        displayTime: "00:00 - 14:20",
        title: "Percentage as a Comparative Fraction",
        summary: "Core definition of percentages, base reference identification, and ratio equivalents.",
        keyConcepts: ["Base of comparison ('than X', 'of Y')", "Fraction-to-percentage conversion", "Multiplying factors"]
      },
      {
        startTime: 860,
        endTime: 1960,
        displayTime: "14:20 - 32:40",
        title: "Percentage Increase & Decrease Framework",
        summary: "Formulas for percentage change and absolute vs. relative change calculations.",
        keyConcepts: ["Change / Initial Base × 100", "Multiplier (1 + x/100)", "Why (A is 20% more than B) != (B is 20% less than A)"]
      },
      {
        startTime: 1960,
        endTime: 3135,
        displayTime: "32:40 - 52:15",
        title: "Product Constancy Rule (A × B = Constant)",
        summary: "The fundamental rule governing Price × Consumption = Expenditure problems.",
        keyConcepts: ["Inverse proportionality", "If A increases by x/(x+y), B decreases by x/y", "Fixed budget word problems"]
      },
      {
        startTime: 3135,
        endTime: 4200,
        displayTime: "52:15 - 1:10:00",
        title: "Successive Percentage Changes & Multipliers",
        summary: "Net effect of multiple consecutive percentage increases or decreases.",
        keyConcepts: ["Net Change = a + b + (ab/100)", "Three successive changes", "Depreciation and compounding cycles"]
      },
      {
        startTime: 4200,
        endTime: 5100,
        displayTime: "1:10:00 - 1:25:00",
        title: "CAT Past Year PYQs & Advanced Traps",
        summary: "In-depth walkthrough of previous 5-year CAT percentage and commercial math questions.",
        keyConcepts: ["Variable base trap", "Complex wording deconstruction", "Elimination heuristics"]
      }
    ],
    quiz: [
      {
        q: "If the price of petrol increases by 20%, by what percent must a driver reduce consumption to keep expenditure unchanged?",
        options: ["20%", "16.66%", "25%", "15%"],
        answer: 1,
        explanation: "By Product Constancy: Price increases by 1/5, so consumption must decrease by 1/(5+1) = 1/6 = 16.66%."
      },
      {
        q: "Salary of Rohan is first increased by 20% and then decreased by 20%. What is the net percentage change in his salary?",
        options: ["No change", "4% increase", "4% decrease", "2% decrease"],
        answer: 2,
        explanation: "Net change = 20 - 20 - (20 × 20)/100 = -400/100 = -4% (4% decrease)."
      },
      {
        q: "If A is 25% taller than B, by what percentage is B shorter than A?",
        options: ["25%", "20%", "33.33%", "16.66%"],
        answer: 1,
        explanation: "A = 1.25 B = (5/4) B. Therefore, B = (4/5) A, which is 1/5 = 20% shorter than A."
      },
      {
        q: "A town's population increases by 10% in the first year and 10% in the second year. Total 2-year increase is:",
        options: ["20%", "21%", "22%", "19%"],
        answer: 1,
        explanation: "Successive change = 10 + 10 + (10 × 10)/100 = 20 + 1 = 21%."
      },
      {
        q: "In an election, Candidate A got 60% of valid votes. If total votes cast were 8000 and 10% were invalid, how many votes did A receive?",
        options: ["4800", "4320", "4500", "4120"],
        answer: 1,
        explanation: "Valid votes = 8000 × 0.90 = 7200. Votes for A = 7200 × 0.60 = 4320."
      }
    ]
  },
  "QA-1.2": {
    lessonCode: "QA-1.2",
    chapters: [
      {
        startTime: 0,
        endTime: 600,
        displayTime: "00:00 - 10:00",
        title: "Foundations of Successive Change",
        summary: "Understanding chaining multipliers (1 + a)(1 + b) vs additive changes.",
        keyConcepts: ["Compounded vs Simple changes", "Multiplicative factors", "Order independence: +20% then -10% == -10% then +20%"]
      },
      {
        startTime: 600,
        endTime: 1380,
        displayTime: "10:00 - 23:00",
        title: "Two-Step & Three-Step Shortcut Formulas",
        summary: "Mastery of the a + b + ab/100 formula and extending to 3 variables.",
        keyConcepts: ["Formula boundary cases", "Negative values for decreases", "3-variable grouping technique"]
      },
      {
        startTime: 1380,
        endTime: 2400,
        displayTime: "23:00 - 40:00",
        title: "CAT Examination Applications",
        summary: "Solving area, volume, revenue, and economic inflation problems.",
        keyConcepts: ["Area of rectangle when length and breadth change", "Volume of cylinder percentage shifts", "Revenue = Price × Quantity"]
      }
    ],
    quiz: [
      {
        q: "If the length of a rectangle increases by 30% and breadth decreases by 20%, what is the net effect on its area?",
        options: ["10% increase", "4% increase", "4% decrease", "6% increase"],
        answer: 1,
        explanation: "Net Change = 30 - 20 - (30 × 20)/100 = 10 - 6 = +4% increase."
      },
      {
        q: "The radius of a circle increases by 10%. By what percentage does its area increase?",
        options: ["10%", "20%", "21%", "25%"],
        answer: 2,
        explanation: "Area ∝ r². Two successive 10% increases: 10 + 10 + (100/100) = 21%."
      }
    ]
  }
};

/**
 * Fallback dynamic generator for any lesson not explicitly pre-mapped in the table
 */
export function getLessonKnowledge(lessonCode?: string, lessonTitle = "Lecture", coverage = ""): LessonKnowledge {
  if (lessonCode && VIDEO_PORTIONS_MAP[lessonCode]) {
    return VIDEO_PORTIONS_MAP[lessonCode];
  }

  // Derive dynamic chapters from coverage string
  const topics = coverage
    ? coverage.split(",").map(t => t.trim()).filter(Boolean)
    : ["Core Principles & Definitions", "Derivation & Shortcuts", "Solved CAT Examples", "Summary & Tips"];

  const numChapters = Math.max(3, Math.min(topics.length, 5));
  const chapterDuration = Math.floor(2700 / numChapters); // ~45 minutes default

  const chapters: VideoChapter[] = topics.slice(0, numChapters).map((topicName, idx) => {
    const start = idx * chapterDuration;
    const end = (idx + 1) * chapterDuration;
    const formatMin = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}`;
    };

    return {
      startTime: start,
      endTime: end,
      displayTime: `${formatMin(start)} - ${formatMin(end)}`,
      title: topicName,
      summary: `Detailed lecture coverage explaining ${topicName} with CAT-specific shortcuts and problem sets.`,
      keyConcepts: [topicName, "Speed shortcuts", "Eliminating examination traps"]
    };
  });

  const quiz: QuizQuestion[] = [
    {
      q: `What is the primary objective when approaching problems in ${lessonTitle}?`,
      options: [
        "Identifying boundary conditions and applying derived shortcut multipliers",
        "Writing lengthy manual algebra calculations",
        "Skipping variable identification",
        "Assuming answer options randomly"
      ],
      answer: 0,
      explanation: "In CAT, identifying the constraints and applying ratio/percentage multipliers saves critical minutes over manual equations."
    },
    {
      q: `Which parameter remains constant in standard inverse variation problems covered in ${lessonTitle}?`,
      options: [
        "The product of the two interacting variables",
        "The sum of the variables",
        "The difference between the variables",
        "None of the above"
      ],
      answer: 0,
      explanation: "When two variables are inversely proportional, their product (A × B) remains constant."
    },
    {
      q: "When a quantity increases by 20%, what is the equivalent fractional increase?",
      options: ["1/4", "1/5", "1/6", "1/3"],
      answer: 1,
      explanation: "20% is exactly equal to 20/100 = 1/5."
    }
  ];

  return {
    lessonCode: lessonCode || "CAT-LEC",
    chapters,
    quiz
  };
}
