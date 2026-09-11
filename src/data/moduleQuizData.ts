// Module Quiz & Grand Quiz Dataset for TechnoCAT
// 80% grounded in video lesson context, 20% applied CAT problem solving
// Supports multi-set unique questions per attempt and dedicated Grand Quiz pool

export interface ModuleQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number; // 0 = A, 1 = B, 2 = C, 3 = D
  explanation: string;
  concept: string;
  recommendedLessonId?: string;
  recommendedLessonTitle?: string;
  isOutsideContext?: boolean;
}

export interface QuizAnalysis {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  rawScore?: number;
  strikes?: number;
  penaltyMarks?: number;
  selectedAnswers?: Record<number, number>;
  questions?: ModuleQuestion[];
  missedConcepts: Array<{
    questionId: string;
    question: string;
    concept: string;
    explanation: string;
    lessonId?: string;
    lessonTitle?: string;
  }>;
  recommendedLessons: Array<{
    lessonId: string;
    lessonTitle: string;
    reason: string;
  }>;
}

// Multi-Set Question Pool per Module (Set 1 = Attempt 1, Set 2 = Attempt 2, Set 3 = Attempt 3)
export const MODULE_QUIZZES: Record<string, Record<string, ModuleQuestion[]>> = {
  "qa-quantitative-ability": {
    "QA-0: Mathematical Foundation": [
      // SET 1 (Attempt 1)
      {
        id: "qa0-s1-1",
        q: "What is the decimal-to-percentage value of 1/7?",
        options: ["12.5%", "14.28%", "16.66%", "11.11%"],
        answer: 1,
        explanation: "1/7 is approximately 14.28% (or 14 2/7%). 1/6 is 16.66% and 1/8 is 12.5%.",
        concept: "Fraction-to-Percentage Reciprocals",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s1-2",
        q: "Using the base 100 shortcut, what is 96 × 97?",
        options: ["9312", "9412", "9212", "9302"],
        answer: 0,
        explanation: "Deviations from 100: -4 and -3. Left part: 96 - 3 = 93. Right part: (-4) × (-3) = 12. Total = 9312.",
        concept: "Vedic Multiplication Base 100",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s1-3",
        q: "What is the square of 75 using the shortcut for numbers ending in 5?",
        options: ["5525", "5625", "5425", "5725"],
        answer: 1,
        explanation: "Rule: 7 × (7 + 1) = 56, followed by 25. Thus, 75² = 5625.",
        concept: "Squaring Numbers Ending in 5",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s1-4",
        q: "Which fraction is equivalent to 37.5%?",
        options: ["3/8", "5/8", "3/7", "7/16"],
        answer: 0,
        explanation: "Since 1/8 = 12.5%, 3/8 = 3 × 12.5% = 37.5%.",
        concept: "Common Fraction Multiples",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s1-5",
        q: "How would you quickly approximate 478 / 1520 in CAT Data Interpretation?",
        options: ["Exact division to 4 places", "Round to 480 / 1500 = 16/50 = 32%", "Assume 25%", "Invert ratio"],
        answer: 1,
        explanation: "Rounding 478/1520 to 480/1500 gives an instant 32% (exact is 31.45%), saving 2 minutes in DI.",
        concept: "Approximation & Estimation in DI",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s1-6",
        q: "What is the square of 48 using base 50 deviation heuristic?",
        options: ["2304", "2404", "2204", "2314"],
        answer: 0,
        explanation: "Deviation from 50 is -2. Left part: 25 - 2 = 23. Right part: (-2)² = 04. Combined = 2304.",
        concept: "Base 50 Squaring Shortcut",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s1-7",
        q: "Express 5/6 as a percentage:",
        options: ["83.33%", "81.66%", "85.25%", "80.00%"],
        answer: 0,
        explanation: "1 - 1/6 = 100% - 16.66% = 83.33%.",
        concept: "Complementary Fraction Conversions",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s1-8",
        q: "To estimate 18.2% of 450, which breakdown is quickest mentally?",
        options: ["10% (45) + 8 × 4.5", "20% (90) - 2% (9) = 81 approx", "Multiply 182 × 45 / 1000", "Guess between 70 and 100"],
        answer: 1,
        explanation: "20% of 450 is 90; 2% is 9; 90 - 9 = 81 (exact is 81.9), which takes under 3 seconds.",
        concept: "Percentage Stepping Method",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s1-9",
        q: "[CAT Application] A trader estimates sales growth as 14.28% in Q1 and 12.5% in Q2. If initial sales were 560 units, what are sales after Q2?",
        options: ["720", "640", "700", "750"],
        answer: 0,
        explanation: "14.28% = 1/7, so Q1 = 560 × 8/7 = 640. 12.5% = 1/8, so Q2 = 640 × 9/8 = 720.",
        concept: "Fraction Multiplier Chaining",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
        isOutsideContext: true,
      },
      {
        id: "qa0-s1-10",
        q: "[CAT Application] If N = 104 × 108, find N without manual vertical multiplication:",
        options: ["11232", "11132", "11332", "11242"],
        answer: 0,
        explanation: "Base 100 deviations: +4, +8. Left part: 104 + 8 = 112. Right part: 4 × 8 = 32. Total = 11232.",
        concept: "Base 100 Surplus Multiplication",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
        isOutsideContext: true,
      },

      // SET 2 (Attempt 2 - Fresh Unseen Questions)
      {
        id: "qa0-s2-1",
        q: "What is the decimal-to-percentage value of 1/9?",
        options: ["11.11%", "9.09%", "12.25%", "8.33%"],
        answer: 0,
        explanation: "1/9 = 11.11% (whereas 1/11 = 9.09% and 1/12 = 8.33%).",
        concept: "Fraction-to-Percentage Reciprocals",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s2-2",
        q: "Using the base 100 shortcut, what is 94 × 98?",
        options: ["9212", "9112", "9312", "9012"],
        answer: 0,
        explanation: "Deviations from 100: -6 and -2. Left part: 94 - 2 = 92. Right part: (-6) × (-2) = 12. Total = 9212.",
        concept: "Vedic Multiplication Base 100",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s2-3",
        q: "What is the square of 85 using the shortcut for numbers ending in 5?",
        options: ["7225", "7125", "7325", "6825"],
        answer: 0,
        explanation: "Rule: 8 × (8 + 1) = 72, followed by 25. Thus, 85² = 7225.",
        concept: "Squaring Numbers Ending in 5",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s2-4",
        q: "Which fraction is equivalent to 62.5%?",
        options: ["5/8", "7/8", "3/5", "4/7"],
        answer: 0,
        explanation: "Since 1/8 = 12.5%, 5/8 = 5 × 12.5% = 62.5%.",
        concept: "Common Fraction Multiples",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s2-5",
        q: "How would you mentally estimate 358 / 1190 in CAT DI?",
        options: ["360 / 1200 = 30%", "25%", "35%", "40%"],
        answer: 0,
        explanation: "358 / 1190 ≈ 360 / 1200 = 3/10 = 30% (exact value is 30.08%).",
        concept: "Approximation & Estimation in DI",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s2-6",
        q: "What is the square of 53 using base 50 surplus shortcut?",
        options: ["2809", "2709", "2909", "2819"],
        answer: 0,
        explanation: "Deviation from 50 is +3. Left part: 25 + 3 = 28. Right part: 3² = 09. Combined = 2809.",
        concept: "Base 50 Squaring Shortcut",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s2-7",
        q: "Express 7/12 as a percentage:",
        options: ["58.33%", "54.16%", "62.50%", "56.66%"],
        answer: 0,
        explanation: "7/12 = 1/2 + 1/12 = 50% + 8.33% = 58.33%.",
        concept: "Complementary Fraction Conversions",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s2-8",
        q: "To estimate 29.5% of 640 mentally, which benchmark technique is optimal?",
        options: ["30% (192) - 0.5% (3.2) = 188.8", "25% of 640 + 5%", "Multiply 295 × 64 / 100", "Round to 35%"],
        answer: 0,
        explanation: "30% of 640 is 192; 0.5% of 640 is 3.2. 192 - 3.2 = 188.8.",
        concept: "Percentage Stepping Method",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s2-9",
        q: "[CAT Application] A portfolio grows by 16.66% in Year 1 and decreases by 14.28% in Year 2. If principal was ₹42,000, final value is:",
        options: ["₹42,000", "₹45,000", "₹40,000", "₹44,100"],
        answer: 0,
        explanation: "16.66% = +1/6 (multiplier 7/6); 14.28% = -1/7 (multiplier 6/7). Net multiplier = 7/6 × 6/7 = 1.0 (unchanged at ₹42,000).",
        concept: "Fraction Multiplier Chaining",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
        isOutsideContext: true,
      },
      {
        id: "qa0-s2-10",
        q: "[CAT Application] Calculate 106 × 107 mentally using Vedic base 100:",
        options: ["11342", "11242", "11442", "11332"],
        answer: 0,
        explanation: "Deviations: +6, +7. Left: 106 + 7 = 113. Right: 6 × 7 = 42. Total = 11342.",
        concept: "Base 100 Surplus Multiplication",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
        isOutsideContext: true,
      },

      // SET 3 (Attempt 3 - Fresh Unseen Questions)
      {
        id: "qa0-s3-1",
        q: "What is the decimal-to-percentage equivalent of 1/11?",
        options: ["9.09%", "11.11%", "8.33%", "10.00%"],
        answer: 0,
        explanation: "1/11 = 9.09% (or 9 1/11%).",
        concept: "Fraction-to-Percentage Reciprocals",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s3-2",
        q: "Calculate 93 × 95 using base 100 shortcut:",
        options: ["8835", "8735", "8935", "8825"],
        answer: 0,
        explanation: "Deviations: -7 and -5. Left: 93 - 5 = 88. Right: (-7) × (-5) = 35. Total = 8835.",
        concept: "Vedic Multiplication Base 100",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s3-3",
        q: "What is 65² using the end-in-5 squaring heuristic?",
        options: ["4225", "4125", "4325", "4025"],
        answer: 0,
        explanation: "6 × 7 = 42, followed by 25 = 4225.",
        concept: "Squaring Numbers Ending in 5",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s3-4",
        q: "Which percentage corresponds to the fraction 7/8?",
        options: ["87.5%", "85.0%", "89.2%", "91.5%"],
        answer: 0,
        explanation: "1 - 1/8 = 100% - 12.5% = 87.5%.",
        concept: "Common Fraction Multiples",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s3-5",
        q: "In CAT DI, which benchmark represents 5/16?",
        options: ["31.25%", "33.33%", "28.75%", "35.00%"],
        answer: 0,
        explanation: "1/16 = 6.25%. 5 × 6.25% = 31.25%.",
        concept: "Approximation & Estimation in DI",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s3-6",
        q: "What is the square of 46 using base 50 deficit heuristic?",
        options: ["2116", "2216", "2016", "2126"],
        answer: 0,
        explanation: "Deficit is -4. Left: 25 - 4 = 21. Right: (-4)² = 16. Result = 2116.",
        concept: "Base 50 Squaring Shortcut",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
      },
      {
        id: "qa0-s3-7",
        q: "Express 11/12 as a percentage:",
        options: ["91.66%", "89.33%", "93.25%", "90.00%"],
        answer: 0,
        explanation: "1 - 1/12 = 100% - 8.33% = 91.66%.",
        concept: "Complementary Fraction Conversions",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
      },
      {
        id: "qa0-s3-8",
        q: "Estimate 49% of 780 in 2 seconds:",
        options: ["382.2 (50% minus 1%)", "390.0", "375.0", "365.5"],
        answer: 0,
        explanation: "50% of 780 = 390. 1% = 7.8. 390 - 7.8 = 382.2.",
        concept: "Percentage Stepping Method",
        recommendedLessonId: "qa-0-3",
        recommendedLessonTitle: "Approximation & Estimation",
      },
      {
        id: "qa0-s3-9",
        q: "[CAT Application] A quantity increases by 9.09% then decreases by 10%. What is net percentage change?",
        options: ["Decreases by ~1.8%", "Increases by 1%", "No net change", "Increases by 2%"],
        answer: 0,
        explanation: "+9.09% = +1/11 (multiplier 12/11); -10% = -1/10 (multiplier 9/10). 12/11 × 9/10 = 108/110 = 54/55 ≈ 0.9818 (-1.82%).",
        concept: "Fraction Multiplier Chaining",
        recommendedLessonId: "qa-0-2",
        recommendedLessonTitle: "Fractions–Decimals–Percentages",
        isOutsideContext: true,
      },
      {
        id: "qa0-s3-10",
        q: "[CAT Application] Calculate 103 × 109 without pen & paper:",
        options: ["11227", "11127", "11327", "11237"],
        answer: 0,
        explanation: "Left: 103 + 9 = 112. Right: 3 × 9 = 27. Result = 11227.",
        concept: "Base 100 Surplus Multiplication",
        recommendedLessonId: "qa-0-1",
        recommendedLessonTitle: "Speed Mathematics",
        isOutsideContext: true,
      },
    ],

    "QA-1: Percentages and Commercial Mathematics": [
      // SET 1 (Attempt 1)
      {
        id: "qa1-s1-1",
        q: "If the price of petrol increases by 25%, by what percentage must consumption decrease so expenditure remains constant?",
        options: ["20%", "25%", "16.66%", "30%"],
        answer: 0,
        explanation: "When price becomes 5/4, consumption must become 4/5, which is a 1/5 = 20% reduction.",
        concept: "Expenditure = Price × Consumption Inverse Law",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s1-2",
        q: "Successive discounts of 20% and 10% are equivalent to a single discount of:",
        options: ["28%", "30%", "25%", "26%"],
        answer: 0,
        explanation: "Equivalent discount = a + b - (ab/100) = 20 + 10 - 2 = 28%.",
        concept: "Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s1-3",
        q: "A shopkeeper marks goods 40% above CP and offers a discount of 25%. What is the profit percentage?",
        options: ["5%", "10%", "15%", "12%"],
        answer: 0,
        explanation: "Let CP = 100. MP = 140. SP = 140 × 0.75 = 105. Profit = 5%.",
        concept: "CP-MP-SP Relationship",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s1-4",
        q: "If length of a rectangle increases by 20% and breadth decreases by 10%, what is the net change in area?",
        options: ["8% increase", "10% increase", "2% increase", "8% decrease"],
        answer: 0,
        explanation: "Net Change = 20 - 10 - (20 × 10)/100 = 10 - 2 = +8% increase.",
        concept: "Successive Percentage Change",
        recommendedLessonId: "qa-1-2",
        recommendedLessonTitle: "Successive Percentage Change",
      },
      {
        id: "qa1-s1-5",
        q: "Selling an article at ₹720 results in a 20% loss. At what price must it be sold to earn 20% profit?",
        options: ["₹1080", "₹960", "₹1000", "₹1120"],
        answer: 0,
        explanation: "SP1 = 0.8 CP = 720 => CP = 900. Required SP2 = 1.2 × 900 = ₹1080.",
        concept: "Cost Price Recovery and Profit Margin",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s1-6",
        q: "If A's salary is 20% more than B's salary, then B's salary is how much percentage less than A's salary?",
        options: ["16.66%", "20%", "25%", "15%"],
        answer: 0,
        explanation: "Difference = 20 / 120 = 1/6 = 16.66%.",
        concept: "Reverse Percentage Comparison",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s1-7",
        q: "A dishonest dealer uses a false weight of 900 grams for a kg. What is his real gain percentage?",
        options: ["11.11%", "10%", "12.5%", "9.09%"],
        answer: 0,
        explanation: "Gain% = (Error / True Value - Error) × 100 = (100 / 900) × 100 = 11.11%.",
        concept: "Faulty Balances & Weights",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s1-8",
        q: "Three successive discounts of 10%, 20%, and 25% are equivalent to:",
        options: ["46%", "45%", "44%", "50%"],
        answer: 0,
        explanation: "SP = MP × 0.9 × 0.8 × 0.75 = MP × 0.54. Discount = 1 - 0.54 = 46%.",
        concept: "Three-Stage Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s1-9",
        q: "[CAT Application] Due to a 20% reduction in sugar price, a customer can buy 4 kg more sugar for ₹160. What was original price per kg?",
        options: ["₹10/kg", "₹8/kg", "₹12/kg", "₹9/kg"],
        answer: 0,
        explanation: "20% of 160 = ₹32 for 4 kg => reduced price = ₹8/kg. Original price = 8 / 0.8 = ₹10/kg.",
        concept: "Price-Quantity Dynamic Variations",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
        isOutsideContext: true,
      },
      {
        id: "qa1-s1-10",
        q: "[CAT Application] A trader sells 2 articles for ₹990 each, one at 10% profit and other at 10% loss. Overall transaction result is:",
        options: ["1% loss", "1% profit", "No profit no loss", "2% loss"],
        answer: 0,
        explanation: "When selling prices are equal and % gain = % loss = x, result is always loss of (x/10)²% = 1% loss.",
        concept: "Symmetric SP Gain-Loss Theorem",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
        isOutsideContext: true,
      },

      // SET 2 (Attempt 2 - Fresh Unseen Questions)
      {
        id: "qa1-s2-1",
        q: "If price of sugar rises by 33.33%, by what percentage must consumption drop to keep expenditure unchanged?",
        options: ["25%", "20%", "30%", "33.33%"],
        answer: 0,
        explanation: "Price multiplier = 4/3. Consumption must become 3/4, which is a 1/4 = 25% reduction.",
        concept: "Expenditure = Price × Consumption Inverse Law",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s2-2",
        q: "Successive discounts of 30% and 20% are equivalent to a single discount of:",
        options: ["44%", "50%", "46%", "42%"],
        answer: 0,
        explanation: "Discount = 30 + 20 - (30 × 20)/100 = 50 - 6 = 44%.",
        concept: "Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s2-3",
        q: "A merchant marks goods 50% above CP and allows a discount of 20%. Find his profit percentage:",
        options: ["20%", "25%", "30%", "15%"],
        answer: 0,
        explanation: "Let CP = 100. MP = 150. SP = 150 × 0.8 = 120. Profit = 20%.",
        concept: "CP-MP-SP Relationship",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s2-4",
        q: "If radius of a circle increases by 10%, by what percentage does its area increase?",
        options: ["21%", "20%", "19%", "25%"],
        answer: 0,
        explanation: "Area ∝ r². Net change = 10 + 10 + (10 × 10)/100 = 21% increase.",
        concept: "Successive Percentage Change",
        recommendedLessonId: "qa-1-2",
        recommendedLessonTitle: "Successive Percentage Change",
      },
      {
        id: "qa1-s2-5",
        q: "By selling a watch for ₹1440, a man loses 10%. At what price should he sell it to gain 15%?",
        options: ["₹1840", "₹1800", "₹1900", "₹1750"],
        answer: 0,
        explanation: "0.9 CP = 1440 => CP = 1600. Required SP = 1.15 × 1600 = ₹1840.",
        concept: "Cost Price Recovery and Profit Margin",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s2-6",
        q: "If X is 25% less than Y, then Y is what percentage more than X?",
        options: ["33.33%", "25.00%", "20.00%", "50.00%"],
        answer: 0,
        explanation: "Difference = 25 / (100 - 25) = 25/75 = 1/3 = 33.33%.",
        concept: "Reverse Percentage Comparison",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s2-7",
        q: "A grocer sells rice at cost price but uses an 800g weight instead of 1kg. His profit percentage is:",
        options: ["25%", "20%", "15%", "30%"],
        answer: 0,
        explanation: "Gain% = (200 / 800) × 100 = 25%.",
        concept: "Faulty Balances & Weights",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s2-8",
        q: "A product is marked at ₹2000 and sold after successive discounts of 10% and 15%. The selling price is:",
        options: ["₹1530", "₹1500", "₹1600", "₹1480"],
        answer: 0,
        explanation: "SP = 2000 × 0.9 × 0.85 = 2000 × 0.765 = ₹1530.",
        concept: "Three-Stage Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s2-9",
        q: "[CAT Application] A man buys 2 pens for ₹120 total. One sold at 20% profit, other at 10% loss. If no net profit/loss, find CP of 1st pen:",
        options: ["₹40", "₹60", "₹50", "₹80"],
        answer: 0,
        explanation: "0.20 CP1 = 0.10 CP2 => CP1 / CP2 = 1/2. Total parts = 3. CP1 = (1/3) × 120 = ₹40.",
        concept: "Price-Quantity Dynamic Variations",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
        isOutsideContext: true,
      },
      {
        id: "qa1-s2-10",
        q: "[CAT Application] Two items sold for ₹2400 each. One at 20% gain, other at 20% loss. The overall loss in rupees is:",
        options: ["₹200", "₹150", "₹100", "₹250"],
        answer: 0,
        explanation: "Net loss% = 4%. Total SP = ₹4800 = 0.96 Total CP => CP = 5000. Loss = 5000 - 4800 = ₹200.",
        concept: "Symmetric SP Gain-Loss Theorem",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
        isOutsideContext: true,
      },

      // SET 3 (Attempt 3 - Fresh Unseen Questions)
      {
        id: "qa1-s3-1",
        q: "If price of coffee falls by 20%, how much more coffee can be bought with unchanged budget?",
        options: ["25%", "20%", "30%", "16.66%"],
        answer: 0,
        explanation: "Price becomes 4/5, so consumption can become 5/4 (+25% increase).",
        concept: "Expenditure = Price × Consumption Inverse Law",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s3-2",
        q: "Buy 3 Get 1 Free is equivalent to an effective discount of:",
        options: ["25%", "33.33%", "20%", "30%"],
        answer: 0,
        explanation: "Free items = 1, Total items received = 4. Discount = 1/4 = 25%.",
        concept: "Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s3-3",
        q: "A retailer marks an article 25% above CP and sells at a 10% discount. Find his profit percentage:",
        options: ["12.5%", "15.0%", "10.0%", "11.11%"],
        answer: 0,
        explanation: "SP = 1.25 × 0.9 = 1.125 CP => 12.5% profit.",
        concept: "CP-MP-SP Relationship",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s3-4",
        q: "The side of a square is increased by 30%. What is the percentage increase in its area?",
        options: ["69%", "60%", "72%", "65%"],
        answer: 0,
        explanation: "30 + 30 + (30 × 30)/100 = 69% increase.",
        concept: "Successive Percentage Change",
        recommendedLessonId: "qa-1-2",
        recommendedLessonTitle: "Successive Percentage Change",
      },
      {
        id: "qa1-s3-5",
        q: "If selling price is doubled, the profit triples. What is the original profit percentage?",
        options: ["100%", "50%", "150%", "75%"],
        answer: 0,
        explanation: "Let CP = c, SP = s. Profit = s - c. New profit = 2s - c = 3(s - c) => 2s - c = 3s - 3c => s = 2c. Profit% = (2c - c)/c = 100%.",
        concept: "Cost Price Recovery and Profit Margin",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s3-6",
        q: "In an exam, 40% failed in Math, 30% failed in English, and 15% failed in both. What percentage passed both?",
        options: ["45%", "50%", "40%", "55%"],
        answer: 0,
        explanation: "Failed at least one = 40 + 30 - 15 = 55%. Passed both = 100 - 55 = 45%.",
        concept: "Reverse Percentage Comparison",
        recommendedLessonId: "qa-1-1",
        recommendedLessonTitle: "Percentages",
      },
      {
        id: "qa1-s3-7",
        q: "A dishonest trader professes to sell at 10% loss on CP, but uses a 750g weight instead of 1000g. What is his net profit/loss?",
        options: ["20% profit", "10% profit", "5% loss", "15% profit"],
        answer: 0,
        explanation: "Multiplier for loss = 900/1000. Multiplier for weight = 1000/750. Combined = 900/750 = 6/5 = +20% profit.",
        concept: "Faulty Balances & Weights",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
      },
      {
        id: "qa1-s3-8",
        q: "A cycle marked ₹3000 is given two successive discounts of 20% and 5%. The customer pays:",
        options: ["₹2280", "₹2250", "₹2300", "₹2350"],
        answer: 0,
        explanation: "SP = 3000 × 0.80 × 0.95 = 2400 × 0.95 = ₹2280.",
        concept: "Three-Stage Successive Discounts",
        recommendedLessonId: "qa-1-4",
        recommendedLessonTitle: "Discount & Marked Price",
      },
      {
        id: "qa1-s3-9",
        q: "[CAT Application] A trader marks up by 50%, then offers a discount of d%. If he still makes 20% profit, find d:",
        options: ["20%", "25%", "15%", "18%"],
        answer: 0,
        explanation: "1.50 × (1 - d/100) = 1.20 => 1 - d/100 = 1.20 / 1.50 = 0.80 => d = 20%.",
        concept: "CP-MP-SP Relationship",
        recommendedLessonId: "qa-1-3",
        recommendedLessonTitle: "Profit & Loss",
        isOutsideContext: true,
      },
      {
        id: "qa1-s3-10",
        q: "[CAT Application] If tax on a commodity is reduced by 15% and consumption increases by 10%, what is the net impact on revenue?",
        options: ["6.5% decrease", "5.0% decrease", "7.5% decrease", "No change"],
        answer: 0,
        explanation: "Net change = -15 + 10 - (15 × 10)/100 = -5 - 1.5 = -6.5% decrease.",
        concept: "Successive Percentage Change",
        recommendedLessonId: "qa-1-2",
        recommendedLessonTitle: "Successive Percentage Change",
        isOutsideContext: true,
      },
    ],
  },

  "dilr-data-interpretation": {
    "DILR-1: Data Interpretation": [
      // SET 1 (Attempt 1)
      {
        id: "dilr1-s1-1",
        q: "In a 4-year multi-line graph comparing company profits, what indicates the steepest rate of growth?",
        options: ["The line segment with the highest positive slope", "The highest point on the graph", "The largest gap between two lines", "The longest line segment"],
        answer: 0,
        explanation: "Rate of growth is represented by the slope (change in y / change in x). The steepest positive slope indicates the highest growth rate.",
        concept: "Slope Analysis in Line Graphs",
        recommendedLessonId: "dilr-1-3",
        recommendedLessonTitle: "Line Graphs",
      },
      {
        id: "dilr1-s1-2",
        q: "In a pie chart, if the central angle for Section 'A' is 72°, what percentage of the total does Section 'A' represent?",
        options: ["20%", "25%", "18%", "15%"],
        answer: 0,
        explanation: "Total degrees = 360°. Percentage = (72 / 360) × 100 = 1/5 × 100 = 20%.",
        concept: "Pie Chart Degree-to-Percentage Conversion",
        recommendedLessonId: "dilr-1-2",
        recommendedLessonTitle: "Pie Charts",
      },
      {
        id: "dilr1-s1-3",
        q: "Which technique prevents calculation traps when finding the percentage contribution of a sector in a table?",
        options: ["Calculating row totals first and applying benchmark approximation (10% and 1%)", "Dividing all terms by their unit digits", "Guessing from highest row", "Multiplying by 360"],
        answer: 0,
        explanation: "Benchmark stepping (10% and 1%) against column totals prevents long division errors under timed exam pressure.",
        concept: "Table Calculation & Ratio Benchmarking",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
      },
      {
        id: "dilr1-s1-4",
        q: "In a cumulative bar chart showing production, the production of year 3 is obtained by:",
        options: ["Subtracting cumulative total of year 2 from cumulative total of year 3", "Adding year 1 and year 2", "Dividing by 3", "Reading height of bar 3 directly as raw value"],
        answer: 0,
        explanation: "In cumulative series, the marginal value for period n equals Total(n) - Total(n-1).",
        concept: "Cumulative Data & Marginal Increments",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
      },
      {
        id: "dilr1-s1-5",
        q: "When comparing two ratios A/B and C/D where A > C and B < D, which is definitely true?",
        options: ["A/B > C/D", "A/B < C/D", "A/B = C/D", "Cannot be determined"],
        answer: 0,
        explanation: "Higher numerator and smaller denominator strictly guarantee a larger ratio.",
        concept: "Ratio Comparison Rules in DI",
        recommendedLessonId: "dilr-1-4",
        recommendedLessonTitle: "Bar Charts",
      },
      {
        id: "dilr1-s1-6",
        q: "In a radar (spider) chart with 5 evaluation axes, what does the enclosed polygon area represent?",
        options: ["Aggregate performance profile across all 5 dimensions", "Average score across parameters", "Only the maximum attribute", "Variance among axes"],
        answer: 0,
        explanation: "The polygon area and shape visually profile how balanced or skewed an entity performs across all multi-dimensional criteria.",
        concept: "Radar & Spider Graph Profiling",
        recommendedLessonId: "dilr-1-5",
        recommendedLessonTitle: "Spider & Radar Charts",
      },
      {
        id: "dilr1-s1-7",
        q: "What is the primary indicator of a correlation between two variables in a scatter plot?",
        options: ["Points clustered along a linear trendline", "Points evenly distributed throughout all 4 corners", "A single outlier", "Total number of points"],
        answer: 0,
        explanation: "Clustering along an upward or downward slope indicates positive or negative correlation respectively.",
        concept: "Scatter Plots & Trend Analysis",
        recommendedLessonId: "dilr-1-6",
        recommendedLessonTitle: "Scatter Plots",
      },
      {
        id: "dilr1-s1-8",
        q: "In missing data DI tables, what is the most reliable first step?",
        options: ["Set up row and column sum constraint equations to solve for unknowns", "Assume missing values are zero", "Ignore rows with blanks", "Estimate through averages"],
        answer: 0,
        explanation: "Missing data sets in CAT are mathematical constraint puzzles: row sums, column sums, and given ratios must be formulated algebraically first.",
        concept: "Missing Data Table Restoration",
        recommendedLessonId: "dilr-1-7",
        recommendedLessonTitle: "Missing Data Tables",
      },
      {
        id: "dilr1-s1-9",
        q: "[CAT Application] A company's revenue grew by 15% while expenditure grew by 20%. If initial profit was positive, what happens to profit margin (Profit/Revenue)?",
        options: ["Depends on initial revenue/expenditure ratio", "It definitely decreased", "It definitely increased", "Remained constant"],
        answer: 0,
        explanation: "Since profit = Revenue - Expenditure, the effect on (R-E)/R depends on the initial ratio of R to E.",
        concept: "Revenue vs Expenditure Compounded Ratios",
        recommendedLessonId: "dilr-1-3",
        recommendedLessonTitle: "Line Graphs",
        isOutsideContext: true,
      },
      {
        id: "dilr1-s1-10",
        q: "[CAT Application] In an election between 2 candidates, 10% did not vote and 60 votes were invalid. Winner got 47% of total eligible voters and won by 308 votes. Total voters:",
        options: ["6200", "6000", "5800", "6400"],
        answer: 0,
        explanation: "Let total voters = 100x. Voted = 90x. Winner got 47x. Loser got (90x - 60) - 47x = 43x - 60. Difference = 47x - (43x - 60) = 4x + 60 = 308 => 4x = 248 => x = 62. Total = 6200.",
        concept: "Voter Data Set Formulation",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
        isOutsideContext: true,
      },

      // SET 2 (Attempt 2 - Fresh Unseen Questions)
      {
        id: "dilr1-s2-1",
        q: "In a pie chart, if Section B represents 35% of total, what is its central angle?",
        options: ["126°", "120°", "130°", "135°"],
        answer: 0,
        explanation: "Central angle = 35% of 360° = 0.35 × 360 = 126°.",
        concept: "Pie Chart Degree-to-Percentage Conversion",
        recommendedLessonId: "dilr-1-2",
        recommendedLessonTitle: "Pie Charts",
      },
      {
        id: "dilr1-s2-2",
        q: "In a clustered bar chart comparing exports and imports, a trade surplus in year T exists when:",
        options: ["Export bar is taller than import bar in year T", "Import bar is taller than export bar", "Total height is maximized", "Average of 3 years is positive"],
        answer: 0,
        explanation: "Trade surplus strictly means Exports > Imports.",
        concept: "Ratio Comparison Rules in DI",
        recommendedLessonId: "dilr-1-4",
        recommendedLessonTitle: "Bar Charts",
      },
      {
        id: "dilr1-s2-3",
        q: "What does the slope of a line connecting Year 1 and Year 5 in a sales graph represent?",
        options: ["Average annual sales change rate over the 4-year span", "Total sales in Year 5", "Median sales", "Standard deviation of sales"],
        answer: 0,
        explanation: "Slope between endpoints = (Y5 - Y1) / 4, which is the average rate of change per year.",
        concept: "Slope Analysis in Line Graphs",
        recommendedLessonId: "dilr-1-3",
        recommendedLessonTitle: "Line Graphs",
      },
      {
        id: "dilr1-s2-4",
        q: "When calculating market share from a table of 10 competitors, the quickest benchmark for Top 3 is:",
        options: ["Sum Top 3 revenues and benchmark against Total Revenue", "Divide each competitor manually by 100", "Find the median revenue", "Square the market leader's share"],
        answer: 0,
        explanation: "Concentration ratio CR3 = Sum(Top 3) / Total Revenue.",
        concept: "Table Calculation & Ratio Benchmarking",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
      },
      {
        id: "dilr1-s2-5",
        q: "In a scatter plot of Advertising Spend vs Units Sold, a negative slope indicates:",
        options: ["Higher ad spend is associated with lower units sold", "Ad spend has zero impact", "Ad spend doubled sales", "Linear growth with zero intercept"],
        answer: 0,
        explanation: "A negative slope indicates inverse correlation between the two plotted variables.",
        concept: "Scatter Plots & Trend Analysis",
        recommendedLessonId: "dilr-1-6",
        recommendedLessonTitle: "Scatter Plots",
      },
      {
        id: "dilr1-s2-6",
        q: "In a spider chart evaluated on 6 skills, a candidate with an equilateral hexagonal profile possesses:",
        options: ["Equally balanced competence across all 6 skills", "Extreme strength in one single skill", "Zero competence", "A declining learning curve"],
        answer: 0,
        explanation: "Symmetric polygon profiles signify balanced scoring across all evaluation axes.",
        concept: "Radar & Spider Graph Profiling",
        recommendedLessonId: "dilr-1-5",
        recommendedLessonTitle: "Spider & Radar Charts",
      },
      {
        id: "dilr1-s2-7",
        q: "If Cumulative Frequency of Class 4 is 85 and Class 3 is 58, the frequency of Class 4 is:",
        options: ["27", "143", "42", "30"],
        answer: 0,
        explanation: "Marginal frequency = CF4 - CF3 = 85 - 58 = 27.",
        concept: "Cumulative Data & Marginal Increments",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
      },
      {
        id: "dilr1-s2-8",
        q: "In a 3×3 missing data table with given row and column totals, if 1 cell is blank in Row 1, it can be found by:",
        options: ["Row 1 Total minus the sum of known cells in Row 1", "Taking the column average", "Guessing from cell 1,1", "Multiplying Row 1 by 3"],
        answer: 0,
        explanation: "In single-degree-of-freedom rows, Blank = Row Sum - Knowns.",
        concept: "Missing Data Table Restoration",
        recommendedLessonId: "dilr-1-7",
        recommendedLessonTitle: "Missing Data Tables",
      },
      {
        id: "dilr1-s2-9",
        q: "[CAT Application] Two states X and Y have populations in ratio 3:5. Literacy rates are 80% and 60% respectively. Combined literacy rate is:",
        options: ["67.5%", "70.0%", "65.0%", "72.5%"],
        answer: 0,
        explanation: "Weighted average = (3 × 80 + 5 × 60) / 8 = (240 + 300) / 8 = 540 / 8 = 67.5%.",
        concept: "Ratio Comparison Rules in DI",
        recommendedLessonId: "dilr-1-1",
        recommendedLessonTitle: "Tables & Data Formatting",
        isOutsideContext: true,
      },
      {
        id: "dilr1-s2-10",
        q: "[CAT Application] If revenue increases by 25% while profit increases by 50%, the new profit-to-revenue ratio compared to old is:",
        options: ["1.2 times (20% increase)", "1.5 times", "1.1 times", "Unchanged"],
        answer: 0,
        explanation: "New ratio = (1.5 P) / (1.25 R) = (1.5 / 1.25) × (P/R) = 1.2 × (P/R).",
        concept: "Revenue vs Expenditure Compounded Ratios",
        recommendedLessonId: "dilr-1-3",
        recommendedLessonTitle: "Line Graphs",
        isOutsideContext: true,
      },
    ],
  },
};

// DEDICATED GRAND QUIZ QUESTION POOL (30 Comprehensive CAT Questions completely distinct from module questions)
export const GRAND_QUIZ_BANK: ModuleQuestion[] = [
  {
    id: "cat-grand-1",
    q: "A container holds 80 litres of pure milk. 8 litres are drawn out and replaced with water. This process is repeated twice more. How much pure milk remains?",
    options: ["58.32 litres", "56.40 litres", "60.00 litres", "54.80 litres"],
    answer: 0,
    explanation: "Formula: Initial × (1 - x/C)^n = 80 × (1 - 8/80)³ = 80 × (0.9)³ = 80 × 0.729 = 58.32 litres.",
    concept: "Repeated Dilution & Replacement",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-2",
    q: "Two trains leave stations A and B simultaneously towards each other at 50 km/h and 60 km/h. When they meet, the second train has traveled 120 km more than the first. The distance between A and B is:",
    options: ["1320 km", "1200 km", "1440 km", "1100 km"],
    answer: 0,
    explanation: "Difference in speed = 10 km/h. To gain 120 km: Time = 120 / 10 = 12 hours. Distance = (50 + 60) × 12 = 110 × 12 = 1320 km.",
    concept: "Relative Speed & Simultaneous Movement",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-3",
    q: "If log₂ x + log₄ x + log₁₆ x = 21/4, find the value of x:",
    options: ["8", "16", "4", "32"],
    answer: 0,
    explanation: "Change bases to 2: log₂ x + 0.5 log₂ x + 0.25 log₂ x = 1.75 log₂ x = 7/4 log₂ x = 21/4 ⇒ log₂ x = 3 ⇒ x = 2³ = 8.",
    concept: "Logarithmic Properties & Base Change",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-4",
    q: "In a triangle ABC, sides are AB = 7, BC = 8, and CA = 9. Find the length of the median drawn from A to BC:",
    options: ["7", "6.5", "8", "7.5"],
    answer: 0,
    explanation: "By Apollonius Theorem: AB² + AC² = 2(AD² + BD²). 7² + 9² = 2(AD² + 4²). 49 + 81 = 2(AD² + 16) ⇒ 130 = 2(AD² + 16) ⇒ AD² + 16 = 65 ⇒ AD² = 49 ⇒ AD = 7.",
    concept: "Apollonius Theorem & Triangle Medians",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-5",
    q: "A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times at the same interest rate?",
    options: ["12 years", "16 years", "8 years", "10 years"],
    answer: 0,
    explanation: "8 times is 2³. Since 2^1 takes 4 years, 2³ takes 3 × 4 = 12 years.",
    concept: "Compound Interest Exponential Doubling",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-6",
    q: "How many positive integer solutions exist for the equation 1/x + 1/y = 1/12 where x ≤ y?",
    options: ["8", "7", "9", "15"],
    answer: 0,
    explanation: "(x - 12)(y - 12) = 144. 144 = 2⁴ × 3² has (4+1)(2+1) = 15 divisors. For x ≤ y, number of pairs = (15 + 1)/2 = 8.",
    concept: "Hyperbolic Diophantine Equations",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-7",
    q: "In how many ways can 5 letters be put into 5 addressed envelopes such that no letter goes into its correct envelope (Derangement D₅)?",
    options: ["44", "45", "120", "24"],
    answer: 0,
    explanation: "D₅ = 5! × (1 - 1/1! + 1/2! - 1/3! + 1/4! - 1/5!) = 120 × (1/2 - 1/6 + 1/24 - 1/120) = 60 - 20 + 5 - 1 = 44.",
    concept: "Permutations & Derangements",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-8",
    q: "Find the remainder when 3²⁰²⁴ is divided by 100:",
    options: ["81", "01", "21", "41"],
    answer: 0,
    explanation: "3⁴ = 81, 3⁸ ≡ 61, 3¹² ≡ 41, 3¹⁶ ≡ 21, 3²⁰ ≡ 01 (mod 100). Thus 3²⁰²⁴ = (3²⁰)¹⁰¹ × 3⁴ ≡ 1 × 81 = 81.",
    concept: "Number Theory & Modulo Arithmetic",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-9",
    q: "Pipe A can fill a tank in 12 hours, Pipe B in 15 hours. Both opened together, but Pipe A closed 3 hours before filling. Total time taken to fill is:",
    options: ["8 hours 20 mins", "9 hours", "7 hours 30 mins", "8 hours"],
    answer: 0,
    explanation: "Let total time be T. T/15 + (T - 3)/12 = 1. 4T + 5(T - 3) = 60 ⇒ 9T - 15 = 60 ⇒ 9T = 75 ⇒ T = 75/9 = 8 1/3 hours = 8 hrs 20 mins.",
    concept: "Pipes & Cisterns Work Scheduling",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-10",
    q: "What is the area of the region bounded by |x| + |y| ≤ 4 in the Cartesian plane?",
    options: ["32 sq units", "16 sq units", "64 sq units", "24 sq units"],
    answer: 0,
    explanation: "This is a square with vertices at (4,0), (0,4), (-4,0), (0,-4). Diagonal d = 8. Area = d² / 2 = 64 / 2 = 32 sq units.",
    concept: "Coordinate Geometry & Absolute Value Regions",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-11",
    q: "If roots of x² - bx + c = 0 are two consecutive integers, then b² - 4c equals:",
    options: ["1", "2", "0", "4"],
    answer: 0,
    explanation: "Let roots be r and r + 1. Difference = 1. Difference of roots = √(b² - 4c) / a = √(b² - 4c) = 1 ⇒ b² - 4c = 1.",
    concept: "Quadratic Equations Discriminant Relations",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-12",
    q: "The average of 5 consecutive odd numbers is 27. What is the product of the smallest and largest numbers?",
    options: ["713", "725", "693", "735"],
    answer: 0,
    explanation: "Numbers are 23, 25, 27, 29, 31. Smallest = 23, largest = 31. Product = 23 × 31 = 713.",
    concept: "Averages & Symmetric Progression Properties",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-13",
    q: "A solid metallic sphere of radius 6 cm is melted and recast into small spheres of radius 2 cm each. How many small spheres are formed?",
    options: ["27", "9", "18", "36"],
    answer: 0,
    explanation: "Number of spheres = (R / r)³ = (6 / 2)³ = 3³ = 27.",
    concept: "Mensuration 3D Volume Conservation",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-14",
    q: "Find the maximum value of f(x) = 12 sin x - 5 cos x + 7:",
    options: ["20", "19", "13", "14"],
    answer: 0,
    explanation: "Maximum of a sin x + b cos x is √(a² + b²) = √(12² + 5²) = 13. Max f(x) = 13 + 7 = 20.",
    concept: "Trigonometric Bounds & Extrema",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-15",
    q: "If a + b + c = 0, find the value of (a² / bc) + (b² / ca) + (c² / ab):",
    options: ["3", "1", "0", "-3"],
    answer: 0,
    explanation: "Sum = (a³ + b³ + c³) / abc. When a + b + c = 0, a³ + b³ + c³ = 3abc. Hence 3abc / abc = 3.",
    concept: "Symmetric Algebraic Identities",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-16",
    q: "In a race of 1000m, A beats B by 100m and B beats C by 100m. By how many metres does A beat C in the same race?",
    options: ["190m", "200m", "180m", "210m"],
    answer: 0,
    explanation: "A : B = 1000 : 900. B : C = 1000 : 900. A : C = 1000 : 810. Thus in 1000m race, A beats C by 190m.",
    concept: "Races & Games Linear Ratio Scaling",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-17",
    q: "A bag contains 5 red, 4 blue, and 3 green marbles. If 2 marbles are drawn at random without replacement, what is the probability that both are of the same color?",
    options: ["19/66", "17/66", "23/66", "1/3"],
    answer: 0,
    explanation: "Total pairs = ¹²C₂ = 66. Same color = ⁵C₂ + ⁴C₂ + ³C₂ = 10 + 6 + 3 = 19. P = 19/66.",
    concept: "Probability Combinatorics Combinations",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-18",
    q: "What is the total number of integer factors of 3600 that are perfect squares?",
    options: ["12", "9", "6", "16"],
    answer: 0,
    explanation: "3600 = 2⁴ × 3² × 5². Square factors use even exponents: 2^{0,2,4} (3), 3^{0,2} (2), 5^{0,2} (2). Total = 3 × 2 × 2 = 12.",
    concept: "Factors & Perfect Squares Counting",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-19",
    q: "If x = 2 + √3, find the value of x⁴ + 1/x⁴:",
    options: ["194", "196", "192", "198"],
    answer: 0,
    explanation: "1/x = 2 - √3. x + 1/x = 4. x² + 1/x² = 4² - 2 = 14. x⁴ + 1/x⁴ = 14² - 2 = 194.",
    concept: "Surds & Conjugate Reciprocals",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-20",
    q: "A sum of ₹12,500 becomes ₹15,500 in 4 years at simple interest. What is the annual interest rate?",
    options: ["6%", "5.5%", "6.5%", "7%"],
    answer: 0,
    explanation: "SI = 15500 - 12500 = ₹3000 in 4 years ⇒ ₹750/year. Rate = (750 / 12500) × 100 = 6%.",
    concept: "Simple Interest Proportions",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-21",
    q: "In a class of 60 students, 35 study Physics, 30 study Chemistry, and 10 study neither. How many students study BOTH Physics and Chemistry?",
    options: ["15", "10", "20", "25"],
    answer: 0,
    explanation: "Total studying at least one = 60 - 10 = 50. P(A ∪ B) = n(P) + n(C) - n(P ∩ C) ⇒ 50 = 35 + 30 - Both ⇒ Both = 65 - 50 = 15.",
    concept: "Set Theory & Venn Diagrams",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-22",
    q: "A worker increases his speed by 25%. By what percentage is the time taken reduced?",
    options: ["20%", "25%", "15%", "16.66%"],
    answer: 0,
    explanation: "Speed ratio = 1 to 5/4. Time ratio = 1 to 4/5. Reduction = 1/5 = 20%.",
    concept: "Time-Speed-Distance Reciprocal Law",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-23",
    q: "The sum of the first n terms of an arithmetic progression is given by Sₙ = 3n² + 5n. What is the 10th term?",
    options: ["62", "60", "64", "58"],
    answer: 0,
    explanation: "T₁₀ = S₁₀ - S₉ = [3(100) + 50] - [3(81) + 45] = 350 - 288 = 62.",
    concept: "Arithmetic Progression Sum Formulae",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-24",
    q: "A circle is inscribed in an equilateral triangle of side 12 cm. What is the area of the inscribed circle?",
    options: ["12π cm²", "16π cm²", "9π cm²", "24π cm²"],
    answer: 0,
    explanation: "Inradius r = a / (2√3) = 12 / (2√3) = 2√3 cm. Area = π r² = π(2√3)² = 12π cm².",
    concept: "Geometry Equilateral Triangle Incircle",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-25",
    q: "A number when divided by 14 leaves remainder 9, and when divided by 17 leaves remainder 12. What is the remainder when divided by 238 (14 × 17)?",
    options: ["233", "221", "205", "215"],
    answer: 0,
    explanation: "N = 14k - 5 = 17m - 5. Since remainder is negative 5 for both, N ≡ -5 mod 238 = 238 - 5 = 233.",
    concept: "Chinese Remainder Theorem & Negative Remainders",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-26",
    q: "If 2ˣ = 3ʸ = 6⁻ᶻ, what is the value of 1/x + 1/y + 1/z?",
    options: ["0", "1", "-1", "2"],
    answer: 0,
    explanation: "Let 2ˣ = 3ʸ = 6⁻ᶻ = k. 2 = k^(1/x), 3 = k^(1/y), 6 = k^(-1/z). Since 2 × 3 = 6, k^(1/x + 1/y) = k^(-1/z) ⇒ 1/x + 1/y + 1/z = 0.",
    concept: "Exponents & Power Equations",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-27",
    q: "Find the coordinates of the centroid of a triangle whose vertices are (2, 4), (4, 6), and (6, 2):",
    options: ["(4, 4)", "(4, 3)", "(3, 4)", "(5, 4)"],
    answer: 0,
    explanation: "Centroid G = ((x1+x2+x3)/3, (y1+y2+y3)/3) = ((2+4+6)/3, (4+6+2)/3) = (12/3, 12/3) = (4, 4).",
    concept: "Coordinate Geometry Centroid Formula",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-28",
    q: "In an election between 2 candidates, 75% of voters cast their votes, out of which 2% were invalid. Winner got 9261 votes (75% of valid votes). Total voters were:",
    options: ["16,800", "16,400", "17,200", "15,600"],
    answer: 0,
    explanation: "Let total = V. Cast = 0.75V. Valid = 0.75V × 0.98 = 0.735V. Winner = 0.75 × 0.735V = 0.55125V = 9261 ⇒ V = 9261 / 0.55125 = 16,800.",
    concept: "Percentages Election Multipliers",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-29",
    q: "A can do a piece of work in 20 days and B in 30 days. They work together for 5 days, then B leaves. In how many more days will A finish the remaining work?",
    options: ["11.66 days", "12 days", "10 days", "15 days"],
    answer: 0,
    explanation: "1/20 + 1/30 = 5/60 = 1/12 per day. In 5 days: 5/12 done. Remaining = 7/12. Time for A = (7/12) / (1/20) = 140 / 12 = 11 2/3 = 11.66 days.",
    concept: "Work & Time Combined Effort",
    isOutsideContext: true,
  },
  {
    id: "cat-grand-30",
    q: "What is the highest power of 7 that divides 100! (Legendre's Formula)?",
    options: ["16", "14", "18", "12"],
    answer: 0,
    explanation: "[100/7] + [100/49] = 14 + 2 = 16.",
    concept: "Number Theory Legendre Factorial Formula",
    isOutsideContext: true,
  },
];

/**
 * Retrieves 10 UNIQUE questions for a module, excluding any question IDs in `usedQuestionIds`.
 * If pool runs low, generates fresh parameterized variations.
 */
export function getUniqueModuleQuiz(
  topicId: string,
  moduleTitle: string,
  usedQuestionIds: string[] = []
): ModuleQuestion[] {
  const cleanTitle = moduleTitle.replace(/&amp;/g, "&");
  const topicMap = MODULE_QUIZZES[topicId];
  let availableQuestions: ModuleQuestion[] = [];

  if (topicMap) {
    for (const [key, qList] of Object.entries(topicMap)) {
      if (key.replace(/&amp;/g, "&") === cleanTitle) {
        availableQuestions = qList;
        break;
      }
    }
  }

  // Filter out any questions already used
  const unused = availableQuestions.filter((q) => !usedQuestionIds.includes(q.id));

  // If we have at least 10 unused questions, return top 10
  if (unused.length >= 10) {
    return unused.slice(0, 10);
  }

  // Otherwise, take whatever unused exist, and dynamically synthesize fresh variations
  const result: ModuleQuestion[] = [...unused];
  const needed = 10 - result.length;
  const moduleTag = cleanTitle.split(":")[0] || "CAT";

  for (let i = 0; i < needed; i++) {
    const seed = Date.now() + i * 37;
    const valA = 20 + ((seed % 7) * 5);
    const valB = 10 + ((seed % 5) * 4);
    const newId = `${moduleTag}-dyn-${seed}-${i}`;

    result.push({
      id: newId,
      q: `[CAT Dynamic Concept Variation #${i + 1}] If a parameter in ${cleanTitle} shifts by ${valA}% and subsequently is compensated by ${valB}%, what is the net operational multiplier?`,
      options: [
        `${(((100 + valA) * (100 - valB)) / 10000).toFixed(4)}`,
        `${(((100 - valA) * (100 + valB)) / 10000).toFixed(4)}`,
        "1.0000 (Exact parity)",
        `${(((100 + valA + valB)) / 100).toFixed(2)}`
      ],
      answer: 0,
      explanation: `Compounded operations multiply: (1 + ${valA}/100) × (1 - ${valB}/100) = ${(((100 + valA) * (100 - valB)) / 10000).toFixed(4)}.`,
      concept: `${cleanTitle} Dynamic Constraint Modeling`,
      isOutsideContext: true,
    });
  }

  return result.slice(0, 10);
}

/**
 * Backward-compatible wrapper for getModuleQuiz
 */
export function getModuleQuiz(topicId: string, moduleTitle: string): ModuleQuestion[] {
  return getUniqueModuleQuiz(topicId, moduleTitle, []);
}

/**
 * Retrieves 30 UNIQUE questions for the Grand Comprehensive Assessment,
 * completely distinct from any module questions and excluding any previously used grand questions.
 */
export function getUniqueGrandQuiz(
  topicId: string,
  topicTitle = "Course",
  modulesList: string[] = [],
  usedQuestionIds: string[] = []
): ModuleQuestion[] {
  // Filter grand bank questions to exclude already used
  const unusedGrand = GRAND_QUIZ_BANK.filter((q) => !usedQuestionIds.includes(q.id));

  if (unusedGrand.length >= 30) {
    return unusedGrand.slice(0, 30);
  }

  const result: ModuleQuestion[] = [...unusedGrand];
  const needed = 30 - result.length;

  for (let i = 0; i < needed; i++) {
    const seed = 1000 + i * 19;
    result.push({
      id: `grand-dyn-${seed}`,
      q: `[CAT Comprehensive High-Percentile Drill #${i + 1}] In advanced quantitative problem sets for ${topicTitle}, two variables x and y satisfy (x + ${i + 2})(y + ${i + 3}) = ${((i + 2) * (i + 3) * 2)}. What is the minimum positive integer value of x + y?`,
      options: [
        `${(i + 2) + (i + 3)}`,
        `${2 * (i + 2)}`,
        `${(i + 2) * 2 + 1}`,
        "Cannot be uniquely determined"
      ],
      answer: 0,
      explanation: "By factoring constraints and minimizing sum when factors are closest together, we obtain the minimum bound.",
      concept: "Comprehensive CAT Synthesis & Optimization",
      isOutsideContext: true,
    });
  }

  return result.slice(0, 30);
}

/**
 * Backward-compatible wrapper for getGrandQuiz
 */
export function getGrandQuiz(topicId: string, topicTitle = "Course", modulesList: string[] = []): ModuleQuestion[] {
  return getUniqueGrandQuiz(topicId, topicTitle, modulesList, []);
}

/**
 * Evaluates quiz results, calculates cutoff (70%), pinpointing missed concepts and recommended lessons
 */
export function evaluateQuiz(
  questions: ModuleQuestion[],
  selectedAnswers: Record<number, number>
): QuizAnalysis {
  let score = 0;
  const missedConcepts: QuizAnalysis["missedConcepts"] = [];
  const lessonsToReviewMap: Record<string, { lessonId: string; lessonTitle: string; reasons: string[] }> = {};

  questions.forEach((q, idx) => {
    const userAns = selectedAnswers[idx];
    if (userAns !== undefined && userAns === q.answer) {
      score++;
    } else {
      missedConcepts.push({
        questionId: q.id,
        question: q.q,
        concept: q.concept,
        explanation: q.explanation,
        lessonId: q.recommendedLessonId,
        lessonTitle: q.recommendedLessonTitle,
      });

      if (q.recommendedLessonId && q.recommendedLessonTitle) {
        if (!lessonsToReviewMap[q.recommendedLessonId]) {
          lessonsToReviewMap[q.recommendedLessonId] = {
            lessonId: q.recommendedLessonId,
            lessonTitle: q.recommendedLessonTitle,
            reasons: [],
          };
        }
        lessonsToReviewMap[q.recommendedLessonId].reasons.push(q.concept);
      }
    }
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 70;

  const recommendedLessons = Object.values(lessonsToReviewMap).map((item) => ({
    lessonId: item.lessonId,
    lessonTitle: item.lessonTitle,
    reason: `Review required for: ${item.reasons.join(", ")}`,
  }));

  return {
    score,
    total,
    percentage,
    passed,
    selectedAnswers,
    questions,
    missedConcepts,
    recommendedLessons,
  };
}
