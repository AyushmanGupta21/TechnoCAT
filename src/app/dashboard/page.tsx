"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import AiMotivationWidget from "@/components/AiMotivationWidget";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import ContinueLearningWidget from "@/components/ContinueLearningWidget";
import StudyPerformanceChart from "@/components/StudyPerformanceChart";
import DailyStudySchedule, { ScheduleItem } from "@/components/DailyStudySchedule";
import StudyCalendarWidget from "@/components/StudyCalendarWidget";
import CatReadinessWidget from "@/components/CatReadinessWidget";
import { useAuth } from "@/context/AuthContext";
import styles from "./dashboard.module.css";

interface WeeklyStat {
  day: string;
  learning: number;
  challenge: number;
  rawLearning?: number;
  rawChallenge?: number;
}

interface StudyTask {
  id: string;
  title: string;
  task_date: string;
  is_completed: boolean;
}

interface DashboardData {
  metrics: {
    inProgressCourses: number;
    completedCourses: number;
    watchingTime: string;
    pointsEarned: number;
  };
  weeklyStats: WeeklyStat[];
  summary: {
    totalHoursWeek: number;
    avgHoursDay: number;
    courseHoursWeek: number;
    challengeHoursWeek: number;
  };
  tasks: StudyTask[];
  detailed?: {
    inProgressTopics: any[];
    completedTopics: any[];
    watchingHistory: any[];
    pointsHistory: any[];
  };
}

const defaultWeeklyStats: WeeklyStat[] = [
  { day: "Sun", learning: 50, challenge: 40, rawLearning: 2.5, rawChallenge: 1.8 },
  { day: "Mon", learning: 75, challenge: 60, rawLearning: 4.2, rawChallenge: 2.9 },
  { day: "Tue", learning: 50, challenge: 42, rawLearning: 3.1, rawChallenge: 2.0 },
  { day: "Wed", learning: 60, challenge: 50, rawLearning: 3.8, rawChallenge: 2.6 },
  { day: "Thu", learning: 60, challenge: 52, rawLearning: 4.0, rawChallenge: 3.1 },
  { day: "Fri", learning: 38, challenge: 32, rawLearning: 2.2, rawChallenge: 1.5 },
  { day: "Sat", learning: 28, challenge: 22, rawLearning: 1.8, rawChallenge: 1.0 },
];

const initialCurriculumTasks: ScheduleItem[] = [
  {
    id: "d1-1",
    day: 1,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-01",
    title: "Percentages & Fraction Conversion Fundamentals",
    subtitle: "Module 1.1 • Basic Arithmetic Foundations",
    isCompleted: true,
  },
  {
    id: "d1-2",
    day: 1,
    timeRange: "02:00 PM",
    duration: "40 min",
    category: "VARC",
    code: "CAT-VARC-01",
    title: "Daily Editorial Analysis & Vocabulary Builder",
    subtitle: "The Hindu Editorial • 25 New Academic Words",
    isCompleted: true,
  },
  {
    id: "d2-1",
    day: 2,
    timeRange: "11:00 AM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-01",
    title: "Data Interpretation: Tables & Bar Charts",
    subtitle: "Module 2.1 • Multi-column percentage calculations",
    isCompleted: true,
  },
  {
    id: "d3-1",
    day: 3,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-02",
    title: "Profit, Loss, Discount & Marked Price",
    subtitle: "Module 1.2 • Advanced Formula Drills",
    isCompleted: true,
  },
  {
    id: "d3-2",
    day: 3,
    timeRange: "04:30 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-02",
    title: "Reading Comprehension: Central Idea Identification",
    subtitle: "Social Sciences Passages • 12 Questions",
    isCompleted: false,
  },
  {
    id: "d4-1",
    day: 4,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-01",
    title: "CAT Diagnostic Full Mock 01",
    subtitle: "National Benchmark • 66 Questions Timed",
    isCompleted: true,
  },
  {
    id: "d6-1",
    day: 6,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-03",
    title: "Simple & Compound Interest Compounding Rules",
    subtitle: "Module 1.3 • Half-yearly & Quarterly Rates",
    isCompleted: true,
  },
  {
    id: "d7-1",
    day: 7,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-04",
    title: "Ratio, Proportion & Variations Advanced Sets",
    subtitle: "Module 1.4 • Direct & Inverse Proportion",
    isCompleted: true,
  },
  {
    id: "d7-2",
    day: 7,
    timeRange: "03:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-02",
    title: "Arrangements: Linear & Circular Seating",
    subtitle: "Module 2.2 • Blood Relations & Constrained Seating",
    isCompleted: true,
  },
  {
    id: "d8-1",
    day: 8,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-03",
    title: "Tone & Author Attitude in Philosophy Passages",
    subtitle: "Module 3.1 • Critical Inference Questions",
    isCompleted: true,
  },
  {
    id: "d9-1",
    day: 9,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-05",
    title: "Averages, Mixtures & Alligation Weighted Problems",
    subtitle: "Module 1.5 • Replacement of Liquids Rules",
    isCompleted: false,
  },
  {
    id: "d9-2",
    day: 9,
    timeRange: "02:00 PM",
    duration: "90 min",
    category: "Mock",
    code: "SEC-MOCK-01",
    title: "Quant Sectional Speed Test 01",
    subtitle: "22 Questions • 40 min Timed Assessment",
    isCompleted: true,
  },
  {
    id: "d10-1",
    day: 10,
    timeRange: "09:30 AM",
    duration: "90 min",
    category: "QA",
    code: "CAT-QA-06",
    title: "Time & Work, Men-Days & Negative Work (Pipes)",
    subtitle: "Module 1.6 • Efficiency Drills & Alternating Days",
    isCompleted: false,
  },
  {
    id: "d10-2",
    day: 10,
    timeRange: "02:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-03",
    title: "Games & Tournaments: Knockout & Round Robin",
    subtitle: "Module 2.3 • Seedings & Point Tables",
    isCompleted: false,
  },
  {
    id: "d10-3",
    day: 10,
    timeRange: "05:00 PM",
    duration: "45 min",
    category: "VARC",
    code: "CAT-VARC-04",
    title: "Para Jumbles & Odd Sentence Out Strategy",
    subtitle: "Module 3.2 • TITA Question Solving Techniques",
    isCompleted: false,
  },
  {
    id: "d11-1",
    day: 11,
    timeRange: "10:30 AM",
    duration: "75 min",
    category: "DILR",
    code: "CAT-DILR-04",
    title: "Selection & Grouping Logic Puzzles",
    subtitle: "Module 2.4 • Conditional Constraints Matrix",
    isCompleted: false,
  },
  {
    id: "d11-2",
    day: 11,
    timeRange: "03:30 PM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-07",
    title: "Linear Equations & Special Word Problems",
    subtitle: "Module 1.7 • Advanced Variables & Integer Solutions",
    isCompleted: false,
  },
  {
    id: "d12-1",
    day: 12,
    timeRange: "10:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-02",
    title: "National Sectional CAT Mock 02",
    subtitle: "DILR & QA Intensive 2-hour Window",
    isCompleted: false,
  },
  {
    id: "d14-1",
    day: 14,
    timeRange: "09:30 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-06",
    title: "Time & Work, Men-Days & Efficiency Drills",
    subtitle: "Negative Work & Pipe Filling Rates",
    isCompleted: false,
  },
  {
    id: "d15-1",
    day: 15,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-07",
    title: "Pipes, Cisterns & Leakage Rates",
    subtitle: "Module 1.6 • Past 5 Years PYQs",
    isCompleted: false,
  },
  {
    id: "d15-2",
    day: 15,
    timeRange: "04:00 PM",
    duration: "50 min",
    category: "VARC",
    code: "CAT-VARC-04",
    title: "Para Jumbles & Mandatory Pair Identification",
    subtitle: "TITA Strategy & Eliminating Options",
    isCompleted: false,
  },
  {
    id: "d16-1",
    day: 16,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-08",
    title: "Time, Speed & Distance: Relative Speed & Trains",
    subtitle: "Module 1.7 • Escalators & Circular Tracks",
    isCompleted: false,
  },
  {
    id: "d16-2",
    day: 16,
    timeRange: "02:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-05",
    title: "Venn Diagrams: 3-Set and 4-Set Maxima/Minima",
    subtitle: "Module 2.5 • Set Theory Formulae & Drills",
    isCompleted: false,
  },
  {
    id: "d16-3",
    day: 16,
    timeRange: "06:00 PM",
    duration: "45 min",
    category: "VARC",
    code: "CAT-VARC-05",
    title: "Critical Reasoning: Assumption & Flaw Questions",
    subtitle: "Module 3.3 • Identifying Logical Leaps",
    isCompleted: false,
  },
  {
    id: "d17-1",
    day: 17,
    timeRange: "10:00 AM",
    duration: "90 min",
    category: "QA",
    code: "CAT-QA-09",
    title: "Geometry: Lines, Angles & Triangle Properties",
    subtitle: "Module 4.1 • Similarity & Congruence Rules",
    isCompleted: false,
  },
  {
    id: "d17-2",
    day: 17,
    timeRange: "03:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-06",
    title: "Binary Logic: Truth-Tellers, Liars & Alternators",
    subtitle: "Module 2.6 • Case Building & Elimination",
    isCompleted: false,
  },
  {
    id: "d18-1",
    day: 18,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-03",
    title: "All-India Proctored CAT Full Mock 03",
    subtitle: "Live National Percentile Ranking Test",
    isCompleted: false,
  },
  {
    id: "d20-1",
    day: 20,
    timeRange: "04:30 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-06",
    title: "Para Summary: Eliminating Redundant Details",
    subtitle: "Module 3.4 • Short Paragraph Drills",
    isCompleted: false,
  },
  {
    id: "d21-1",
    day: 21,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-10",
    title: "Circles, Tangents, Secants & Cyclic Quadrilaterals",
    subtitle: "Module 4.2 • High-yield CAT Geometry Set",
    isCompleted: false,
  },
  {
    id: "d22-1",
    day: 22,
    timeRange: "02:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-07",
    title: "Networks, Paths & Flow Diagrams",
    subtitle: "Module 2.7 • Maximum Flow Algorithms",
    isCompleted: false,
  },
  {
    id: "d23-1",
    day: 23,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-11",
    title: "Mensuration 2D & 3D Solids Volume/Surface Area",
    subtitle: "Module 4.3 • Prisms, Pyramids & Cones",
    isCompleted: false,
  },
  {
    id: "d23-2",
    day: 23,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-07",
    title: "Tone Analysis & Author Purpose Drills",
    subtitle: "Module 3.5 • Science & Technology RC Sets",
    isCompleted: false,
  },
  {
    id: "d24-1",
    day: 24,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-12",
    title: "Linear & Quadratic Equations Theory",
    subtitle: "Module 5.1 • Roots, Discriminant & Coefficients",
    isCompleted: false,
  },
  {
    id: "d24-2",
    day: 24,
    timeRange: "02:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-08",
    title: "Cubes & Dice Visual Reasoning",
    subtitle: "Module 2.8 • Painted Faces & Unfolding",
    isCompleted: false,
  },
  {
    id: "d24-3",
    day: 24,
    timeRange: "05:00 PM",
    duration: "40 min",
    category: "Mock",
    code: "SEC-MOCK-02",
    title: "VARC Sectional Speed Blitz 02",
    subtitle: "24 Questions • 40 min Timed Challenge",
    isCompleted: false,
  },
  {
    id: "d25-1",
    day: 25,
    timeRange: "10:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-04",
    title: "TechnoCAT National Benchmark Mock 04",
    subtitle: "Full-length 3-Section Simulated Exam",
    isCompleted: false,
  },
  {
    id: "d27-1",
    day: 27,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-13",
    title: "Logarithms & Indices: Properties & PYQs",
    subtitle: "Module 5.2 • Base Changing Rules & Inequalities",
    isCompleted: false,
  },
  {
    id: "d28-1",
    day: 28,
    timeRange: "02:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-09",
    title: "Missing Data DI Tables & Caselets",
    subtitle: "Module 2.9 • Equations from Table Conditions",
    isCompleted: false,
  },
  {
    id: "d29-1",
    day: 29,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-08",
    title: "Full RC Passage Marathon (4 Passages)",
    subtitle: "Module 3.6 • Economics & Sociology Topics",
    isCompleted: false,
  },
  {
    id: "d30-1",
    day: 30,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-05",
    title: "End-of-Month Benchmark Full CAT Mock 05",
    subtitle: "Comprehensive Progress Review & Percentile Tracker",
    isCompleted: false,
  },
  // --- OCTOBER 2026 (Rolling 1-month active window through October 10) ---
  {
    id: "oct1-1",
    day: 1,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:30 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-14",
    title: "Permutations & Combinations: Fundamental Counting Principle",
    subtitle: "Module 6.1 • Multiplication Rule & Factorials",
    isCompleted: false,
  },
  {
    id: "oct1-2",
    day: 1,
    monthIndex: 9,
    year: 2026,
    timeRange: "02:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-10",
    title: "Games & Tournaments: Knockout & Round Robin Formats",
    subtitle: "Module 2.10 • Seeding & Ranking Tables",
    isCompleted: false,
  },
  {
    id: "oct2-1",
    day: 2,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-09",
    title: "Reading Comprehension: Tone & Style Analysis",
    subtitle: "Literary & Philosophy Passages • 14 Questions",
    isCompleted: false,
  },
  {
    id: "oct2-2",
    day: 2,
    monthIndex: 9,
    year: 2026,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-15",
    title: "Circular Permutations & Grouping Theorem",
    subtitle: "Module 6.2 • Division into Groups & Necklaces",
    isCompleted: false,
  },
  {
    id: "oct3-1",
    day: 3,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:30 AM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-11",
    title: "Complex Grid Logic & Multi-Variable Seating",
    subtitle: "Module 2.11 • Case Analysis & Deduction",
    isCompleted: false,
  },
  {
    id: "oct3-2",
    day: 3,
    monthIndex: 9,
    year: 2026,
    timeRange: "05:00 PM",
    duration: "40 min",
    category: "Mock",
    code: "SEC-MOCK-03",
    title: "DILR Sectional Speed Test 03",
    subtitle: "4 Advanced Sets • 40 min Timed Challenge",
    isCompleted: false,
  },
  {
    id: "oct4-1",
    day: 4,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:30 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-16",
    title: "Probability: Independent Events & Conditional Probability",
    subtitle: "Module 6.3 • Bayes Theorem & Dice Problems",
    isCompleted: false,
  },
  {
    id: "oct4-2",
    day: 4,
    monthIndex: 9,
    year: 2026,
    timeRange: "03:30 PM",
    duration: "50 min",
    category: "VARC",
    code: "CAT-VARC-10",
    title: "Para Jumbles & Odd Sentence Elimination",
    subtitle: "Module 3.7 • 20 High-Difficulty TITA Drills",
    isCompleted: false,
  },
  {
    id: "oct5-1",
    day: 5,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-17",
    title: "Number Systems: Divisibility Rules & Remainder Theorems",
    subtitle: "Module 7.1 • Wilson's & Euler's Totient Theorem",
    isCompleted: false,
  },
  {
    id: "oct5-2",
    day: 5,
    monthIndex: 9,
    year: 2026,
    timeRange: "03:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-12",
    title: "Truth-Tellers, Liars & Alternator Puzzles",
    subtitle: "Module 2.12 • Contradiction Mapping Drills",
    isCompleted: false,
  },
  {
    id: "oct6-1",
    day: 6,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-18",
    title: "Highest Common Factor (HCF) & LCM Models",
    subtitle: "Module 7.2 • Bells Ringing & Step Stepping Problems",
    isCompleted: false,
  },
  {
    id: "oct6-2",
    day: 6,
    monthIndex: 9,
    year: 2026,
    timeRange: "04:30 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-11",
    title: "Critical Reasoning: Assumptions & Inferences",
    subtitle: "Module 3.8 • Argument Breakdown & Strengthen/Weaken",
    isCompleted: false,
  },
  {
    id: "oct7-1",
    day: 7,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-06",
    title: "All-India Proctored CAT Full Mock 06",
    subtitle: "Simulated Testing Interface • 66 Questions",
    isCompleted: false,
  },
  {
    id: "oct8-1",
    day: 8,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:30 AM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-13",
    title: "Networks, Paths & Flow Minimization",
    subtitle: "Module 2.13 • Pipeline Flow Optimization",
    isCompleted: false,
  },
  {
    id: "oct8-2",
    day: 8,
    monthIndex: 9,
    year: 2026,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-12",
    title: "Philosophy & Economics RC Passage Marathon",
    subtitle: "Module 3.9 • Abstract Ideas & Complex Arguments",
    isCompleted: false,
  },
  {
    id: "oct9-1",
    day: 9,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-20",
    title: "Base System & Cyclicity of Unit Digits",
    subtitle: "Module 7.3 • Base Conversion & Last 2 Digits",
    isCompleted: false,
  },
  {
    id: "oct9-2",
    day: 9,
    monthIndex: 9,
    year: 2026,
    timeRange: "02:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-14",
    title: "Missing Data DI Tables & Caselet Solutions",
    subtitle: "Module 2.14 • Ratio-Based Data Restoration",
    isCompleted: false,
  },
  {
    id: "oct10-1",
    day: 10,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-21",
    title: "Quadratic Inequalities & Modulus Equations",
    subtitle: "Module 5.3 • Wavy Curve Method & Domain Checks",
    isCompleted: false,
  },
  {
    id: "oct10-2",
    day: 10,
    monthIndex: 9,
    year: 2026,
    timeRange: "04:00 PM",
    duration: "50 min",
    category: "VARC",
    code: "CAT-VARC-13",
    title: "Summary Writing & Sentence Insertion Drills",
    subtitle: "Module 3.10 • Speed Reading & Coherence Matching",
    isCompleted: false,
  },
  {
    id: "oct11-1",
    day: 11,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-22",
    title: "Higher Degree Polynomials & Roots Theorem",
    subtitle: "Module 5.4 • Remainder Theorem & Descarte's Rule",
    isCompleted: false,
  },
  {
    id: "oct11-2",
    day: 11,
    monthIndex: 9,
    year: 2026,
    timeRange: "02:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-15",
    title: "Venn Diagrams: 4-Set Overlaps & Bound Conditions",
    subtitle: "Module 2.15 • Complex Inclusion-Exclusion",
    isCompleted: false,
  },
  {
    id: "oct12-1",
    day: 12,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-07",
    title: "All-India Proctored CAT Full Mock 07",
    subtitle: "Timed National Simulation • In-depth Analysis",
    isCompleted: false,
  },
  {
    id: "oct13-1",
    day: 13,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:30 AM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-14",
    title: "Critical Reasoning: Fallacies & Parallel Reasoning",
    subtitle: "Module 3.11 • Logical Fallacy Identification",
    isCompleted: false,
  },
  {
    id: "oct13-2",
    day: 13,
    monthIndex: 9,
    year: 2026,
    timeRange: "03:30 PM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-23",
    title: "Sequence & Series: AP, GP, HP & Special Series",
    subtitle: "Module 5.5 • Telescoping Sums & Sigma Operations",
    isCompleted: false,
  },
  {
    id: "oct14-1",
    day: 14,
    monthIndex: 9,
    year: 2026,
    timeRange: "11:00 AM",
    duration: "75 min",
    category: "DILR",
    code: "CAT-DILR-16",
    title: "Scheduling & Resource Allocation Caselets",
    subtitle: "Module 2.16 • Project Timelines & Critical Paths",
    isCompleted: false,
  },
  {
    id: "oct15-1",
    day: 15,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-24",
    title: "Functions & Graphs: Transformations & Max/Min",
    subtitle: "Module 5.6 • Even/Odd Functions & Symmetry",
    isCompleted: false,
  },
  {
    id: "oct15-2",
    day: 15,
    monthIndex: 9,
    year: 2026,
    timeRange: "04:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-15",
    title: "Advanced RC: Sociology & Anthropology Passages",
    subtitle: "Module 3.12 • Structural Mapping & Inference Drills",
    isCompleted: false,
  },
  {
    id: "oct16-1",
    day: 16,
    monthIndex: 9,
    year: 2026,
    timeRange: "02:00 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-17",
    title: "Scatter Plots & Bubble Charts Interpretation",
    subtitle: "Module 2.17 • Multi-variate Trend Analysis",
    isCompleted: false,
  },
  {
    id: "oct17-1",
    day: 17,
    monthIndex: 9,
    year: 2026,
    timeRange: "10:00 AM",
    duration: "75 min",
    category: "QA",
    code: "CAT-QA-25",
    title: "Coordinate Geometry: Lines, Slopes & Distances",
    subtitle: "Module 4.4 • Area of Triangles & Collinearity",
    isCompleted: false,
  },
  {
    id: "oct18-1",
    day: 18,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:00 AM",
    duration: "120 min",
    category: "Mock",
    code: "MOCK-08",
    title: "TechnoCAT National Benchmark Mock 08",
    subtitle: "Full-Length 3-Section Simulated Exam",
    isCompleted: false,
  },
  {
    id: "oct19-1",
    day: 19,
    monthIndex: 9,
    year: 2026,
    timeRange: "03:00 PM",
    duration: "60 min",
    category: "VARC",
    code: "CAT-VARC-16",
    title: "Para Completion & Paragraph Jumbles Mastery",
    subtitle: "Module 3.13 • 25 High-Accuracy Benchmark Drills",
    isCompleted: false,
  },
  {
    id: "oct20-1",
    day: 20,
    monthIndex: 9,
    year: 2026,
    timeRange: "09:30 AM",
    duration: "60 min",
    category: "QA",
    code: "CAT-QA-26",
    title: "Trigonometry & Heights and Distances",
    subtitle: "Module 4.5 • Standard Angles & Elevation Problems",
    isCompleted: false,
  },
  {
    id: "oct20-2",
    day: 20,
    monthIndex: 9,
    year: 2026,
    timeRange: "02:30 PM",
    duration: "60 min",
    category: "DILR",
    code: "CAT-DILR-18",
    title: "Spider Charts & Radar Graphs Interpretation",
    subtitle: "Module 2.18 • High Density Data Comparison",
    isCompleted: false,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState("Dashboard");

  // Dynamic Planner & Calendar State - automatically derived from current date
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleItem[]>(initialCurriculumTasks);

  useEffect(() => {
    const now = new Date();
    setSelectedMonthIndex(now.getMonth());
    setSelectedYear(now.getFullYear());
    setSelectedDay(now.getDate());
  }, []);

  // Dynamic taskCategoryMap for the calendar indicator dots
  const taskCategoryMap = useMemo(() => {
    const map: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">> = {};
    scheduleTasks.forEach((t) => {
      const taskMonth = t.monthIndex !== undefined ? t.monthIndex : 8;
      const taskYear = t.year !== undefined ? t.year : 2026;
      if (taskMonth === selectedMonthIndex && taskYear === selectedYear) {
        if (!map[t.day]) {
          map[t.day] = [];
        }
        if (!map[t.day].includes(t.category)) {
          map[t.day].push(t.category);
        }
      }
    });
    return map;
  }, [scheduleTasks, selectedMonthIndex, selectedYear]);

  const handleToggleTask = (id: string) => {
    // Only allow toggling tasks for today
    const now = new Date();
    const isToday =
      selectedMonthIndex === now.getMonth() &&
      selectedYear === now.getFullYear() &&
      selectedDay === now.getDate();
    if (!isToday) {
      return;
    }
    setScheduleTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleAutoAssignDay = (day: number) => {
    const newItems: ScheduleItem[] = [
      {
        id: "auto-" + day + "-1",
        day,
        monthIndex: selectedMonthIndex,
        year: selectedYear,
        timeRange: "10:00 AM",
        duration: "60 min",
        category: "QA",
        code: "CAT-QA-S" + day,
        title: "Arithmetic & Percentage Foundations Problem Set",
        subtitle: "Auto-assigned from Enrolled QA Course",
        isCompleted: false,
      },
      {
        id: "auto-" + day + "-2",
        day,
        monthIndex: selectedMonthIndex,
        year: selectedYear,
        timeRange: "03:00 PM",
        duration: "45 min",
        category: "DILR",
        code: "CAT-LR-S" + day,
        title: "Matrix & Grid Logic Practice Set",
        subtitle: "Auto-assigned from Enrolled DILR Course",
        isCompleted: false,
      },
    ];
    setScheduleTasks((prev) => [...prev, ...newItems]);
  };

  // Live Supabase Dashboard Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Detailed Metric Modal State
  const [activeModal, setActiveModal] = useState<"inProgress" | "completed" | "watching" | "points" | null>(null);

  // Fetch live dashboard analytics from Supabase
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          setDashboardData(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const openAddTaskModal = () => {
    const y = selectedYear;
    const m = String(selectedMonthIndex + 1).padStart(2, "0");
    const d = String(selectedDay).padStart(2, "0");
    setTaskDate(`${y}-${m}-${d}`);
    setIsTaskModalOpen(true);
  };

  // Handle adding new task to Supabase & local schedule state
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      const [yearStr, monthStr, dayStr] = taskDate.split("-");
      const targetYear = parseInt(yearStr, 10) || selectedYear;
      const targetMonthIndex = parseInt(monthStr, 10) - 1;
      const targetDay = parseInt(dayStr, 10) || selectedDay;

      const newTask: ScheduleItem = {
        id: "custom-" + Date.now(),
        day: targetDay,
        monthIndex: targetMonthIndex,
        year: targetYear,
        timeRange: "Flexible",
        duration: "45 min",
        category: "QA",
        code: "CUSTOM",
        title: taskTitle.trim(),
        subtitle: "Personal Target Task",
        isCompleted: false,
      };

      setScheduleTasks((prev) => [...prev, newTask]);

      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          taskDate: taskDate,
        }),
      });

      if (res.ok) {
        setTaskTitle("");
        setIsTaskModalOpen(false);
        await fetchDashboard();
      } else {
        setTaskTitle("");
        setIsTaskModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      setIsTaskModalOpen(false);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const displayName = user?.fullName || "Sabrina Gomez";
  const firstName = displayName.split(" ")[0];

  const metrics = dashboardData?.metrics || {
    inProgressCourses: 4,
    completedCourses: 23,
    watchingTime: "12h 10 min",
    pointsEarned: 40,
  };

  const currentWeeklyStats = dashboardData?.weeklyStats && dashboardData.weeklyStats.length === 7
    ? dashboardData.weeklyStats
    : defaultWeeklyStats;

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== HEADER SECTION ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation */}
          <nav className={styles.topNav} aria-label="Dashboard Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <span className={styles.logoTechno}>Techno</span>
              <span className={styles.logoCAT}>CAT</span>
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse", hasDropdown: true },
                { name: "My Topics", href: "/topics" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") {
                      e.preventDefault();
                    }
                    setActiveNav(item.name);
                  }}
                  className={`${styles.navLink} ${activeNav === item.name ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg
                      className={styles.dropdownChevron}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile Dropdown */}
            <PostLoginNavActions />
          </nav>

          {/* Welcome Row */}
          <div className={styles.welcomeRow}>
            <div>
              <h1 className={styles.welcomeHeading}>Welcome back, {firstName}</h1>
              <p className={styles.welcomeSubtitle}>Here&apos;s a report on your study progress this week.</p>
            </div>
            <div className={styles.welcomeActions}>
              <Link href="/browse" className={styles.addCourseBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Browse Topics
              </Link>
            </div>
          </div>

          {/* AI Motivation Widget */}
          <AiMotivationWidget firstName={firstName} streak={7} points={metrics.pointsEarned} />

          {/* 4 Metric Cards Row */}
          <div className={styles.metricCardsRow}>
            {/* Card 1: In Progress */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderLeft: '4px solid #8b5cf6' }}
              onClick={() => setActiveModal("inProgress")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.inProgressCourses} Topics</span>
                <span className={styles.metricLabel}>In Progress</span>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderLeft: '4px solid #10b981' }}
              onClick={() => setActiveModal("completed")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.completedCourses} Topics</span>
                <span className={styles.metricLabel}>Completed</span>
              </div>
            </div>

            {/* Card 3: Watching Time */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderLeft: '4px solid #2563EB' }}
              onClick={() => setActiveModal("watching")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconOrange}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.watchingTime}</span>
                <span className={styles.metricLabel}>Watching Time</span>
              </div>
            </div>

            {/* Card 4: Total Points */}
            <div
              className={styles.metricCard}
              style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderLeft: '4px solid #f59e0b' }}
              onClick={() => setActiveModal("points")}
            >
              <div className={`${styles.metricIconBox} ${styles.iconPink}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{isLoading ? "—" : metrics.pointsEarned} Points</span>
                <span className={styles.metricLabel}>Total Points</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN DASHBOARD CONTENT AREA ===== */}
      <main className={styles.mainContent}>
        {/* Full Width Spotlight: Continue Learning Widget */}
        <div style={{ marginBottom: "28px" }}>
          <ContinueLearningWidget />
        </div>

        {/* 2-Column Responsive Dashboard Grid (65% / 35%) */}
        <div className={styles.dashboardGrid}>
          {/* LEFT COLUMN: Study Planner, Performance Chart & Notices (65%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Daily Study Schedule & Tasks */}
            <DailyStudySchedule
              selectedMonthIndex={selectedMonthIndex}
              selectedYear={selectedYear}
              selectedDay={selectedDay}
              tasks={scheduleTasks}
              onToggleTask={handleToggleTask}
              onAddTask={openAddTaskModal}
              onAutoAssignDay={handleAutoAssignDay}
            />

            {/* 2. Study Performance Chart with Side-by-Side AI Performance Analysis */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Study Performance</h2>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.dotLearning} />
                    <span>Learning</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dotChallenge} />
                    <span>Challenge</span>
                  </div>
                </div>
              </div>

              <div className={styles.studyStatBody}>
                <div style={{ flex: 1.25, minWidth: 0, width: "100%" }}>
                  <StudyPerformanceChart data={currentWeeklyStats} />
                </div>

                {/* AI Performance Analysis inside Study Performance card */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", borderLeft: "1px solid #F1F5F9", paddingLeft: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ padding: "6px", background: "#EFF6FF", borderRadius: "8px", color: "#2563EB" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1E293B", margin: 0 }}>AI Performance Analysis</h3>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                    Your learning hours are <strong>up 16%</strong> this week. You are spending disproportionately more time on Quantitative Ability compared to VARC.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#F8FAFC", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Quant Progress</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#10B981", background: "#D1FAE5", padding: "2px 8px", borderRadius: "6px" }}>Good Pace</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>VARC Progress</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#EF4444", background: "#FEE2E2", padding: "2px 8px", borderRadius: "6px" }}>Needs Attention</span>
                    </div>
                  </div>

                  <div style={{ background: "#EFF6FF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "700", color: "#1E3A8A", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommended Next Step</h4>
                    <p style={{ fontSize: "12px", color: "#1E40AF", margin: 0, fontWeight: "500", lineHeight: "1.4" }}>Take a Reading Comprehension sectional mock today to identify weak spots.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Upcoming Agenda (Full Column Width) */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Upcoming Agenda</h2>
              </div>
              <div className={styles.agendaList}>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <div className={styles.agendaIconBox} style={{ background: "#ED1C24" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <div>
                      <h3 className={styles.agendaTitle}>CAT QA: Geometry & Mensuration Masterclass</h3>
                      <p className={styles.agendaMeta}>Faculty Live Session • 27 May, 7am-10am</p>
                    </div>
                  </div>
                  <div className={styles.agendaRight}>
                    <div className={styles.agendaMetaCol}>
                      <span className={styles.agendaMetaLabel}>Duration</span>
                      <span className={styles.agendaMetaVal}>90 min</span>
                    </div>
                    <div className={styles.agendaMetaCol}>
                      <span className={styles.agendaMetaLabel}>Activity</span>
                      <span className={styles.agendaMetaVal}>Live Class</span>
                    </div>
                  </div>
                </div>
                <div className={styles.agendaItem}>
                  <div className={styles.agendaLeft}>
                    <div className={styles.agendaIconBox} style={{ background: "#10B981" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                    </div>
                    <div>
                      <h3 className={styles.agendaTitle}>CAT DILR: Arrangements & Matrix Sets Workshop</h3>
                      <p className={styles.agendaMeta}>Mock Workshop • 28 May, 9am-11.30am</p>
                    </div>
                  </div>
                  <div className={styles.agendaRight}>
                    <div className={styles.agendaMetaCol}>
                      <span className={styles.agendaMetaLabel}>Duration</span>
                      <span className={styles.agendaMetaVal}>120 min</span>
                    </div>
                    <div className={styles.agendaMetaCol}>
                      <span className={styles.agendaMetaLabel}>Activity</span>
                      <span className={styles.agendaMetaVal}>Workshop</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. CAT Prep Notices (Full Column Width) */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>CAT Prep Notices</h2>
              </div>
              <div className={styles.noticeList}>
                <div className={styles.noticeItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=160&auto=format&fit=crop&q=80" alt="CAT Mock Series" className={styles.noticeThumb} />
                  <div className={styles.noticeContent}>
                    <h3 className={styles.noticeTitle}>All-India National CAT Mock 07 Registration Open</h3>
                    <span className={styles.noticeDate}>Registration closes 28 May</span>
                  </div>
                </div>
                <div className={styles.noticeItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80" alt="IIM Interview Prep" className={styles.noticeThumb} />
                  <div className={styles.noticeContent}>
                    <h3 className={styles.noticeTitle}>IIM Mock Viva & GD-PI Preparation Schedules Released</h3>
                    <span className={styles.noticeDate}>Slot bookings open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Calendar, Readiness & Leaderboard (35%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Interactive Study Calendar */}
            <StudyCalendarWidget
              selectedMonthIndex={selectedMonthIndex}
              onSelectMonthIndex={setSelectedMonthIndex}
              selectedYear={selectedYear}
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay(day)}
              taskCategoryMap={taskCategoryMap}
            />

            {/* 2. CAT 2026 Readiness & Weak Area Diagnostic */}
            <CatReadinessWidget />

            {/* 3. Weekly Leaderboard */}
            <LeaderboardWidget />
          </div>
        </div>
      </main>

      {/* ===== DETAILED METRIC MODAL ===== */}
      {activeModal && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
            <div className={styles.modalHeader} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <h3 className={styles.modalTitle} style={{ fontSize: '20px', fontWeight: '700' }}>
                  {activeModal === "inProgress" && "Topics In Progress"}
                  {activeModal === "completed" && "Completed Topics"}
                  {activeModal === "watching" && "Watching Time"}
                  {activeModal === "points" && "Total Points"}
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  {activeModal === "inProgress" && `You have ${metrics.inProgressCourses} topics currently in progress.`}
                  {activeModal === "completed" && `You have completed ${metrics.completedCourses} topics so far.`}
                  {activeModal === "watching" && `You have spent ${metrics.watchingTime} watching video lessons.`}
                  {activeModal === "points" && `You have earned ${metrics.pointsEarned} points across all activities.`}
                </p>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* In Progress */}
              {activeModal === "inProgress" && (!dashboardData?.detailed?.inProgressTopics || dashboardData.detailed.inProgressTopics.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  No topics currently in progress. Browse topics and start learning.
                </div>
              )}
              {activeModal === "inProgress" && dashboardData?.detailed?.inProgressTopics?.map((topic: any) => (
                <div key={topic.topic_id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6' }}>{topic.progress_percent}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      Lessons: {topic.completed_lessons?.length || 0} completed<br/>
                      Last accessed: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </div>
                    <Link href="/browse" onClick={() => setActiveModal(null)} style={{ background: '#2563EB', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}

              {/* Completed Topics */}
              {activeModal === "completed" && (!dashboardData?.detailed?.completedTopics || dashboardData.detailed.completedTopics.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  You haven&apos;t completed any topics yet.
                </div>
              )}
              {activeModal === "completed" && dashboardData?.detailed?.completedTopics?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #D1FAE5', background: '#F0FDF4' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Completed on: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>+{topic.points_earned || 0} pts</span>
                  </div>
                </div>
              ))}

              {/* Watching Time */}
              {activeModal === "watching" && (!dashboardData?.detailed?.watchingHistory || dashboardData.detailed.watchingHistory.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  No watching activity yet.
                </div>
              )}
              {activeModal === "watching" && dashboardData?.detailed?.watchingHistory?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #DBEAFE', background: '#EFF6FF' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Last watched: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#2563EB' }}>
                      {Math.floor(topic.watching_time_minutes / 60) > 0 && `${Math.floor(topic.watching_time_minutes / 60)}h `}
                      {topic.watching_time_minutes % 60}m
                    </span>
                  </div>
                </div>
              ))}

              {/* Total Points */}
              {activeModal === "points" && (!dashboardData?.detailed?.pointsHistory || dashboardData.detailed.pointsHistory.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: '14px' }}>
                  Start learning and completing activities to earn points.
                </div>
              )}
              {activeModal === "points" && dashboardData?.detailed?.pointsHistory?.map((topic: any) => (
                <div key={topic.topic_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #FEF3C7', background: '#FFFBEB' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                      {topic.topic_id.replace(/-/g, ' ')}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Earned on: {new Date(topic.updated_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#F59E0B' }}>+{topic.points_earned || 0} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD STUDY TASK MODAL ===== */}
      {isTaskModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsTaskModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Study Task</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsTaskModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask}>
              <div className={styles.formGroup}>
                <label htmlFor="task-title-input" className={styles.formLabel}>Task Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="e.g. Finish Geometry Circles & Triangles"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={styles.formInput}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="task-date-input" className={styles.formLabel}>Target Date</label>
                <input
                  id="task-date-input"
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  id="create-task-submit-btn"
                  type="submit"
                  disabled={isSubmittingTask}
                  className={styles.submitBtn}
                >
                  {isSubmittingTask ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
