"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import styles from "./mock-viva-prep.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";

interface VivaQuestion {
  tag: string;
  question: string;
  tips: string[];
}

interface VivaCategory {
  id: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  chip: string;
  chipColor: string;
  chipBg: string;
  icon: React.ReactNode;
  questions: VivaQuestion[];
}

interface InterviewRound {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  questionCount: number;
  color: string;
  bg: string;
  badgeBg: string;
  badgeColor: string;
  markerColor: string;
  categoryId: string;
  evaluates: string[];
  tips: string[];
  icon: React.ReactNode;
}

const CATEGORIES: VivaCategory[] = [
  {
    id: "personal-hr",
    title: "Personal & HR",
    desc: "Questions about you, your background, strengths, weaknesses and career goals that open almost every IIM interview.",
    color: "#2563EB",
    bg: "linear-gradient(135deg, #2563EB, #3B82F6)",
    chip: "18 Questions",
    chipColor: "#1D4ED8",
    chipBg: "#EFF6FF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    questions: [
      {
        tag: "Icebreaker",
        question: "Walk me through your journey so far. Why did you choose to pursue an MBA at this stage of your career?",
        tips: [
          "Keep it under 90 seconds — academics, work, and a clear MBA trigger.",
          "End with why now, not just why MBA.",
          "Avoid repeating your resume line by line; add a narrative thread.",
        ],
      },
      {
        tag: "Self-awareness",
        question: "What is your single biggest weakness, and what specific steps are you taking to address it?",
        tips: [
          "Pick a real weakness, never a disguised strength like 'I work too hard'.",
          "Show a concrete corrective action and measurable progress.",
          "Do not pick a weakness that is core to your target role.",
        ],
      },
      {
        tag: "Motivation",
        question: "Where do you see yourself five years after completing this program?",
        tips: [
          "Connect the role to specific skills the MBA will build.",
          "Be ambitious but realistic; avoid vague 'leadership position' answers.",
          "Tie it back to your pre-MBA experience for continuity.",
        ],
      },
      {
        tag: "Personal",
        question: "Tell me about yourself beyond what is already written on your CV.",
        tips: [
          "Highlight your personality, values, formative experiences, or unique hobbies.",
          "Keep it authentic and engaging without sounding rehearsed.",
          "Briefly connect one personal trait to how you approach challenges.",
        ],
      },
      {
        tag: "Strengths",
        question: "What are your top three core strengths, and how have they helped you in real life?",
        tips: [
          "Give specific traits (e.g. analytical rigor, empathy, resilience).",
          "Back each strength with a brief one-line proof from real experience.",
          "Explain how these strengths will benefit your MBA peer group.",
        ],
      },
      {
        tag: "Value Proposition",
        question: "Why should our institute choose you over other candidates with higher percentiles or better academic scores?",
        tips: [
          "Highlight holistic diversity: unique work experience, leadership, or grit.",
          "Show humility alongside confidence; don't put other applicants down.",
          "Demonstrate strong cultural fit and commitment to contributing to campus life.",
        ],
      },
      {
        tag: "Leadership",
        question: "Describe your leadership style with an example of when you led a team through a challenge.",
        tips: [
          "Define your leadership philosophy (servant, transformational, collaborative).",
          "Use a structured STAR example with tangible outcomes.",
          "Mention how you empowered teammates rather than claiming solo glory.",
        ],
      },
      {
        tag: "Values",
        question: "What is your definition of success, and how do you measure personal failure?",
        tips: [
          "Provide a thoughtful, multi-dimensional definition beyond money and title.",
          "Frame failure as an essential feedback loop for growth and iteration.",
          "Share a real instance where failure taught you a permanent lesson.",
        ],
      },
      {
        tag: "Conflict Resolution",
        question: "How do you handle conflict with peers or team members who strongly disagree with your approach?",
        tips: [
          "Focus on active listening, understanding root motives, and depersonalizing issues.",
          "Show that you use data and objective criteria to reach consensus.",
          "Emphasize maintaining strong professional relationships after disagreements.",
        ],
      },
      {
        tag: "Personality",
        question: "Tell me about a hobby or interest you are deeply passionate about and what it taught you.",
        tips: [
          "Demonstrate dedication, depth of knowledge, and genuine enthusiasm.",
          "Explain cognitive or character benefits (discipline, patience, creative thinking).",
          "Be prepared for spontaneous deep-dive follow-ups on this hobby.",
        ],
      },
      {
        tag: "Resilience",
        question: "If you do not convert any top B-school this year, what is your Plan B?",
        tips: [
          "Show clarity, resilience, and actionable commitment to professional growth.",
          "Explain how you will enhance your profile at work and re-attempt.",
          "Reaffirm that an MBA remains a key strategic milestone for your career.",
        ],
      },
      {
        tag: "Self-reflection",
        question: "What is one mistake you made in college or work that you genuinely regret, and how did you resolve it?",
        tips: [
          "Take full personal ownership without pointing fingers at others.",
          "Explain immediate corrective steps and subsequent behavioral change.",
          "Show mature introspection and emotional quotient.",
        ],
      },
      {
        tag: "Perception",
        question: "How do your closest friends or colleagues describe you in three words, and why?",
        tips: [
          "Pick three distinct, complementary words (e.g. dependable, curious, calm).",
          "Provide a quick real-life anecdote validating each descriptor.",
          "Ensure the traits harmonize with your overall interview narrative.",
        ],
      },
      {
        tag: "Drive",
        question: "What motivates you to wake up and perform at your highest level every single day?",
        tips: [
          "Express intrinsic motivations (problem-solving, continuous learning, impact).",
          "Connect your daily drive to your long-term vision.",
          "Avoid purely extrinsic answers like compensation or social status.",
        ],
      },
      {
        tag: "Adaptability",
        question: "Can you tell me about a time when you had to work under a difficult manager or demanding client?",
        tips: [
          "Stay professional and never vent or speak disparagingly about superiors.",
          "Focus on how you adapted your communication style to manage expectations.",
          "Highlight delivering results despite ambiguity and pressure.",
        ],
      },
      {
        tag: "Ethics",
        question: "What does integrity mean to you in a business context? Have you ever had your ethics tested?",
        tips: [
          "Articulate a firm moral compass that balances compliance with doing what's right.",
          "Describe a situation where you chose long-term ethics over short-term expediency.",
          "Emphasize transparency and courage under scrutiny.",
        ],
      },
      {
        tag: "Introspection",
        question: "If given an opportunity to change one decision in your past academic or career path, what would it be?",
        tips: [
          "Choose a constructive decision, such as exploring an earlier interest or taking more calculated risks.",
          "Explain what insights you gained that shape your current outlook.",
          "Conclude on a positive note of embracing your overall journey.",
        ],
      },
      {
        tag: "Engagement",
        question: "Do you have any questions for the interview panel today?",
        tips: [
          "Always ask 1-2 thoughtful, institute-specific questions.",
          "Inquire about emerging curriculum initiatives, faculty research, or student-run funds.",
          "Never ask basic administrative questions answered on the website.",
        ],
      },
    ],
  },
  {
    id: "academics",
    title: "Academics & Subject",
    desc: "Depth questions on your graduation stream, favourite subjects, and core concepts you claim to know.",
    color: "#7C3AED",
    bg: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
    chip: "20 Questions",
    chipColor: "#6D28D9",
    chipBg: "#F5F3FF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    questions: [
      {
        tag: "Core concept",
        question: "You mentioned your favourite subject was Economics. Explain the difference between fiscal and monetary policy with a current example.",
        tips: [
          "Define both crisply before comparing.",
          "Use one recent real-world example (e.g. an RBI repo rate decision vs Union Budget).",
          "Never claim a favourite subject you cannot defend in depth.",
        ],
      },
      {
        tag: "Application",
        question: "How does your engineering background give you an edge in a general management role?",
        tips: [
          "Translate technical skills into business value (structured thinking, data, systems).",
          "Give one concrete project or problem-solving example.",
          "Avoid dismissing your own degree as irrelevant.",
        ],
      },
      {
        tag: "Undergrad Project",
        question: "What was your final year engineering or graduation thesis/project, and what was your individual contribution?",
        tips: [
          "Summarize the problem statement in simple, layman business terms.",
          "Clearly distinguish your individual work from the team's contributions.",
          "Discuss challenges faced and how you overcame technical hurdles.",
        ],
      },
      {
        tag: "Microeconomics",
        question: "Explain the concept of Opportunity Cost and how it influences strategic capital allocation decisions in corporate management.",
        tips: [
          "Define opportunity cost as foregone benefits of the next best alternative.",
          "Give a real corporate finance example (e.g. R&D spending vs share buyback).",
          "Mention how implicit costs are often ignored by non-managers.",
        ],
      },
      {
        tag: "Finance & Accounting",
        question: "What is the difference between Working Capital and Fixed Capital? Why do profitable companies sometimes go bankrupt from poor cash flow?",
        tips: [
          "Define net working capital as current assets minus current liabilities.",
          "Explain the cash conversion cycle and working capital lockup.",
          "Emphasize the golden rule: profit is an opinion, cash is a fact.",
        ],
      },
      {
        tag: "Economics",
        question: "Explain the Law of Diminishing Marginal Returns with a practical manufacturing or software service example.",
        tips: [
          "State the assumptions: one variable factor, other factors fixed.",
          "Give an intuitive software or factory floor example.",
          "Explain how firms identify their profit-maximizing input level.",
        ],
      },
      {
        tag: "Statistics",
        question: "What is a Normal Distribution, and how is the 68-95-99.7 empirical rule applied in Six Sigma quality control?",
        tips: [
          "Explain mean, standard deviation, and bell curve symmetry.",
          "Define the empirical rule percentages clearly.",
          "Connect 3.4 defects per million opportunities to Six Sigma standard deviations.",
        ],
      },
      {
        tag: "Computer Science",
        question: "Explain the fundamental principles of Object-Oriented Programming (OOP) and why they matter in scalable software design.",
        tips: [
          "Briefly define Encapsulation, Abstraction, Inheritance, and Polymorphism.",
          "Explain code reusability, modularity, and maintainability in enterprise systems.",
          "Provide a simple real-world modeling analogy (e.g. Vehicle / Car).",
        ],
      },
      {
        tag: "Technology",
        question: "What is the difference between Supervised, Unsupervised, and Reinforcement Learning in modern AI systems?",
        tips: [
          "Compare labeled data vs unlabeled clustering vs reward-based optimization.",
          "Cite practical business applications for each (churn prediction, customer segmentation, automated trading).",
          "Mention the paradigm shift introduced by large language models.",
        ],
      },
      {
        tag: "Engineering / Physics",
        question: "How does Newton's Third Law or the concept of Entropy apply metaphorically to organizational change and culture?",
        tips: [
          "Show creative lateral thinking connecting scientific principles to management.",
          "Explain that pushback is a natural reaction to top-down organizational mandates.",
          "Discuss how intentional leadership energy is required to prevent organizational entropy.",
        ],
      },
      {
        tag: "Corporate Finance",
        question: "Explain the difference between Debt Financing and Equity Financing. Which is riskier for a high-growth startup?",
        tips: [
          "Contrast mandatory interest obligations against dilution of equity ownership.",
          "Explain financial distress and leverage risks for volatile startups.",
          "Mention the pecking order theory of capital structure.",
        ],
      },
      {
        tag: "Accounting",
        question: "What are the three core financial statements, and how do changes in depreciation flow through all three?",
        tips: [
          "Name P&L, Balance Sheet, and Cash Flow Statement.",
          "Trace depreciation: lower net income on P&L, added back in operating cash flow, reduced PPE on balance sheet.",
          "Demonstrate thorough financial fluency.",
        ],
      },
      {
        tag: "Microeconomics",
        question: "What is Price Elasticity of Demand, and how does elasticity determine optimal pricing strategy for a luxury brand vs essential utility?",
        tips: [
          "Define percentage change in quantity demanded over percentage change in price.",
          "Contrast inelastic demand (utilities) with elastic or Veblen goods (luxury).",
          "Explain how total revenue responds when price changes under different elasticities.",
        ],
      },
      {
        tag: "Data Analytics",
        question: "What is Regression Analysis, and how do you interpret the R-squared value in a predictive marketing mix model?",
        tips: [
          "Explain independent vs dependent variables and finding line of best fit.",
          "Define R-squared as proportion of variance in dependent variable explained by model.",
          "Warn against confusing high correlation with genuine causation.",
        ],
      },
      {
        tag: "Operations",
        question: "Explain Amdahl's Law or the Theory of Constraints (bottlenecks) in operations and process optimization.",
        tips: [
          "Explain that total system throughput is governed by the single slowest process constraint.",
          "Give a clear assembly line or software deployment pipeline analogy.",
          "Highlight that optimizing non-bottlenecks produces zero overall system gains.",
        ],
      },
      {
        tag: "Finance",
        question: "What is the Capital Asset Pricing Model (CAPM), and what does a stock's Beta signify?",
        tips: [
          "State formula: Expected Return = Risk-Free Rate + Beta * (Market Return - Risk-Free Rate).",
          "Explain Beta as systematic, non-diversifiable market risk.",
          "Interpret Beta > 1 (high volatility) vs Beta < 1 (defensive stocks).",
        ],
      },
      {
        tag: "Supply Chain",
        question: "What is the Bullwhip Effect in supply chains, and what modern technologies mitigate it?",
        tips: [
          "Explain how small consumer demand fluctuations amplify upstream to suppliers.",
          "Identify root causes: order batching, price fluctuations, lack of visibility.",
          "Mention solutions like RFID, vendor-managed inventory (VMI), and shared real-time data.",
        ],
      },
      {
        tag: "IT Systems",
        question: "What is the difference between SQL and NoSQL databases, and when would an enterprise architect choose one over the other?",
        tips: [
          "Compare relational structured tables (ACID compliance) with document/key-value stores (horizontal scaling).",
          "Cite financial transaction systems (SQL) vs high-throughput real-time social feeds (NoSQL).",
          "Mention hybrid polyglot persistence approaches in modern architectures.",
        ],
      },
      {
        tag: "Indian Economy",
        question: "How is inflation measured in India (CPI vs WPI), and why did the RBI transition to targeting CPI headline inflation?",
        tips: [
          "Differentiate Consumer Price Index (retail basket, services) from Wholesale Price Index (bulk commodities).",
          "Explain that CPI reflects real household cost-of-living impacts.",
          "Mention the Urjit Patel committee recommendations and the 4% +/- 2% flexible inflation targeting band.",
        ],
      },
      {
        tag: "Learning Agility",
        question: "Which academic subject did you find most challenging during your graduation, and what disciplined approach helped you conquer it?",
        tips: [
          "Be candid about a genuine academic difficulty rather than faking perfection.",
          "Outline structured study habits, peer collaboration, and professor mentorship.",
          "Demonstrate high learning agility and perseverance under pressure.",
        ],
      },
    ],
  },
  {
    id: "current-affairs",
    title: "Current Affairs & GK",
    desc: "Economy, policy, business news and general awareness questions that test how informed you are.",
    color: "#0284C7",
    bg: "linear-gradient(135deg, #0284C7, #0EA5E9)",
    chip: "12 Questions",
    chipColor: "#0369A1",
    chipBg: "#F0F9FF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    questions: [
      {
        tag: "Indian Economy",
        question: "What is your view on India's push toward becoming a $5 trillion economy? What are the biggest structural bottlenecks?",
        tips: [
          "Present a balanced view with 2 drivers and 2 challenges.",
          "Back claims with a rough figure or trend, not just opinion.",
          "Stay factual and neutral on politically sensitive points.",
        ],
      },
      {
        tag: "Global Trade",
        question: "Analyze the impact of geopolitical trade tensions and de-risking on global supply chains and India's 'China+1' opportunity.",
        tips: [
          "Discuss manufacturing shifting toward Vietnam, India, and Mexico.",
          "Highlight sectors benefiting like electronics and specialty chemicals.",
          "Address infrastructure, tariff, and labor productivity hurdles.",
        ],
      },
      {
        tag: "Fintech & Policy",
        question: "Explain Central Bank Digital Currency (CBDC / Digital Rupee) and how it fundamentally differs from private decentralized cryptocurrencies.",
        tips: [
          "Clarify sovereign legal tender status issued by the RBI vs speculative tokens.",
          "Discuss wholesale (interbank settlement) and retail CBDC offline capabilities.",
          "Explain reduction in physical cash printing costs and cross-border remittance efficiency.",
        ],
      },
      {
        tag: "Energy & ESG",
        question: "What are the primary drivers and critical grid challenges of India's target to achieve 500 GW renewable energy capacity by 2030?",
        tips: [
          "Highlight massive solar and wind auctions, green hydrogen mission, and battery storage.",
          "Discuss financial health of state DISCOMs and grid stabilization issues.",
          "Mention transmission infrastructure expansion (Green Energy Corridors).",
        ],
      },
      {
        tag: "Markets",
        question: "Evaluate the recent performance, profitability metrics, and valuation multiples of new-age tech IPOs in India.",
        tips: [
          "Contrast the 2021 market exuberance with current focus on EBITDA profitability.",
          "Discuss path to positive unit economics and cash flow generation.",
          "Cite examples from consumer tech, fintech, or logistics.",
        ],
      },
      {
        tag: "Digital Public Infrastructure",
        question: "Why is India's Digital Public Infrastructure (DPI) — Aadhaar, UPI, Account Aggregator, ONDC — considered a global benchmark?",
        tips: [
          "Explain open-protocol public rails enabling private enterprise innovation.",
          "Highlight financial inclusion and drastic reduction in digital customer acquisition costs.",
          "Discuss internationalization of UPI across Southeast Asia, Europe, and Middle East.",
        ],
      },
      {
        tag: "Emerging Tech",
        question: "How will Generative AI and agentic automation reshape entry-level white-collar jobs across IT services, consulting, and finance?",
        tips: [
          "Analyze the shift from routine execution to synthesis, judgment, and orchestration.",
          "Discuss Indian IT industry margin pressures and the need to reskill workforce.",
          "Emphasize the human-in-the-loop imperative for strategic decision-making.",
        ],
      },
      {
        tag: "Geopolitics",
        question: "Analyze the strategic and economic significance of the India-Middle East-Europe Economic Corridor (IMEC).",
        tips: [
          "Explain multi-modal rail-ship transit cutting transit time by 40%.",
          "Highlight regional integration, clean hydrogen pipelines, and digital cables.",
          "Discuss geopolitical balancing amidst regional instability.",
        ],
      },
      {
        tag: "Industrial Policy",
        question: "What is the Production Linked Incentive (PLI) scheme, and how effective has it been in expanding India's domestic manufacturing?",
        tips: [
          "Define incentive structure tied to incremental production over base year.",
          "Highlight standout success in smartphone assembly (Apple, Foxconn).",
          "Discuss the need to deepen value addition beyond simple assembly into component manufacturing.",
        ],
      },
      {
        tag: "Macroeconomics",
        question: "What are the main causes and policy trade-offs involved in managing retail food inflation in emerging economies like India?",
        tips: [
          "Discuss supply shocks, climate volatility (El Niño), and storage infrastructure gaps.",
          "Analyze RBI interest rate policy limits against supply-side food spikes.",
          "Explain government interventions: export bans, stocking limits, and open market sales.",
        ],
      },
      {
        tag: "Retail Disruption",
        question: "Evaluate the rapid rise of Quick Commerce (Blinkit, Zepto, Instamart) versus traditional kirana stores and modern supermarkets.",
        tips: [
          "Examine dark store network unit economics, delivery fees, and advertising revenue.",
          "Analyze consumer willingness to pay a premium for 10-minute convenience.",
          "Discuss pressure on FMCG distributor margins and kirana store livelihoods.",
        ],
      },
      {
        tag: "Governance & Tech",
        question: "What is your stance on the regulation of Big Tech monopolies and consumer data privacy laws under India's DPDP Act?",
        tips: [
          "Balance consumer protection, consent architecture, and penalties with startup ease of doing business.",
          "Discuss anti-competitive app store commission fees and self-preferencing practices.",
          "Highlight cross-border data transfer guidelines and national sovereignty.",
        ],
      },
    ],
  },
  {
    id: "gd-stress",
    title: "GD-PI & Stress Round",
    desc: "Tricky curveball questions, GD discussion topics, and high-pressure challenges to test your emotional composure.",
    color: "#DC2626",
    bg: "linear-gradient(135deg, #DC2626, #EF4444)",
    chip: "18 Questions",
    chipColor: "#B91C1C",
    chipBg: "#FEF2F2",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    questions: [
      {
        tag: "GD Topic",
        question: "Group discussion: 'AI will create more opportunities than it destroys' — state your opening stance and structured arguments.",
        tips: [
          "Take a nuanced position acknowledging short-term displacement vs long-term productivity.",
          "Use historical parallels (industrial revolution, computing boom).",
          "Recommend workforce upskilling policies and safety nets.",
        ],
      },
      {
        tag: "Stress Interview",
        question: "Convince me in exactly 60 seconds why we should NOT offer you admission to this program today.",
        tips: [
          "Stay composed; the panel is evaluating your emotional reaction and poise.",
          "Identify an honest area of growth, then immediately pivot to your learning intent.",
          "Never freeze, panic, or get defensive; treat it as an objective scenario.",
        ],
      },
      {
        tag: "Pressure Testing",
        question: "Your CAT percentile is below our incoming class median. Why should the interview panel take a gamble on you?",
        tips: [
          "Acknowledge the test score factually without making excuses.",
          "Direct attention to multi-faceted achievements, work impact, and consistency.",
          "Show self-belief backed by demonstrated past execution.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Privatization of public sector banks — boon or bane for financial inclusion in India?'",
        tips: [
          "Define efficiency, NPA management, and competition (pros).",
          "Contrast against priority sector lending, rural branches, and public trust (cons).",
          "Propose a balanced divestment roadmap rather than binary privatization.",
        ],
      },
      {
        tag: "Verification Stress",
        question: "Everything you stated on your CV sounds exaggerated. Can you verify even one claim with precise metrics right now?",
        tips: [
          "Keep your voice measured, calm, and grounded.",
          "Pick your most rigorous project and walk through baseline, action, and verified delta.",
          "Offer to show documentation or references if requested.",
        ],
      },
      {
        tag: "GD Dynamics",
        question: "If two aggressive candidates in a GD are shouting and monopolizing airtime, how do you intervene constructively?",
        tips: [
          "Do not shout louder; lower your pitch and speak with firm, calm authority.",
          "Acknowledge both viewpoints briefly to disarm tension.",
          "Pivot to invite input from quieter group members to advance the group goal.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Work-from-home vs return-to-office — what is the sustainable workplace model for Indian enterprises?'",
        tips: [
          "Analyze productivity vs company culture, mentorship, and spontaneous innovation.",
          "Address tier-2/3 city talent retention and urban infrastructure strain.",
          "Conclude with role-specific hybrid models based on task nature.",
        ],
      },
      {
        tag: "Career Gap Stress",
        question: "You spent an extra year preparing for CAT instead of working. Didn't you waste a productive year of your prime youth?",
        tips: [
          "Own your career choice with pride and mature accountability.",
          "Detail how you utilized that time constructively (upskilling, courses, volunteering).",
          "Emphasize the focus and dedication demonstrated toward achieving your goal.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Corporate Social Responsibility (CSR): Genuine social impact or corporate PR greenwashing?'",
        tips: [
          "Discuss mandatory 2% CSR spend under Companies Act 2013.",
          "Cite genuine long-term rural health and education initiatives.",
          "Critique short-term PR publicity stunts and call for independent impact audits.",
        ],
      },
      {
        tag: "Composure Stress",
        question: "If we tell you right now that your interview performance so far has been subpar, what is your reaction?",
        tips: [
          "Smile politely, take a deep breath, and do not show irritation.",
          "Politely ask which aspect was unclear and offer to clarify or expand.",
          "Demonstrate high coachability, mental resilience, and emotional maturity.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Should real-money online gaming and sports fantasy platforms be strictly regulated or completely banned?'",
        tips: [
          "Differentiate skill-based games from games of chance.",
          "Discuss taxation (28% GST), consumer addiction, and financial ruin safeguards.",
          "Compare outright prohibition (driving users offshore) with stringent regulatory licensing.",
        ],
      },
      {
        tag: "Academic Stress",
        question: "Your undergraduate semester grades dropped sharply in your second year. Were you simply not smart enough or unfocused?",
        tips: [
          "Never blame difficult professors or tough grading curves.",
          "Briefly explain the underlying cause (health, extracurricular overload, misjudgment).",
          "Highlight how you corrected your course in subsequent semesters.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Universal Basic Income (UBI) in developing nations: An economic necessity or a fiscal disaster?'",
        tips: [
          "Discuss extreme poverty eradication and safety nets against AI disruption.",
          "Address massive fiscal cost, inflation risks, and potential labor disincentives.",
          "Debate whether targeted welfare cash transfers are superior to blanket UBI.",
        ],
      },
      {
        tag: "Creativity Stress",
        question: "Sell this ordinary plastic marker pen to me in two minutes, but you are not allowed to mention writing or drawing.",
        tips: [
          "Pause for 5 seconds to think creatively before launching.",
          "Repurpose the object (stress reliever, pointer, measuring benchmark, emergency stylus).",
          "Demonstrate lateral thinking, sales enthusiasm, and persuasiveness under constraint.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Moonlighting among tech professionals: Individual freedom during off-hours or breach of employment contract?'",
        tips: [
          "Debate intellectual property leakage, fatigue, and conflict of interest.",
          "Discuss gig economy freedom, economic aspirations, and non-compete clauses.",
          "Propose clear dual-employment policy frameworks with transparent disclosure.",
        ],
      },
      {
        tag: "Pushback Stress",
        question: "I disagree completely with your viewpoint on this economic topic. Argue why my counter-view is wrong.",
        tips: [
          "Show intellectual respect: 'I appreciate that perspective, sir/ma'am.'",
          "Do not become stubborn; acknowledge any valid points in the panel's argument.",
          "Present your supporting evidence with polite, reasoned logic.",
        ],
      },
      {
        tag: "GD Topic",
        question: "Group discussion: 'Should top educational institutions prioritize academic research output over corporate placement statistics?'",
        tips: [
          "Discuss global QS ranking weightings and intellectual property creation.",
          "Acknowledge student ROI expectations in high-tuition MBA programs.",
          "Argue that cutting-edge research fundamentally elevates classroom learning and recruiter interest.",
        ],
      },
      {
        tag: "Situational Ethics",
        question: "If a peer in your MBA study group plagiarized a significant portion of an assignment due tomorrow, what exact steps would you take?",
        tips: [
          "Refuse to be an accomplice to academic dishonesty.",
          "First confront the peer directly and insist on rewriting with proper citations.",
          "If the peer refuses, escalate to the professor to protect the group's integrity.",
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Career Goals & Motivation",
    desc: "Why this B-school, short vs long-term goals and how the program connects to your plan.",
    color: "#059669",
    bg: "linear-gradient(135deg, #059669, #10B981)",
    chip: "14 Questions",
    chipColor: "#047857",
    chipBg: "#F0FDF4",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    questions: [
      {
        tag: "Short-term goal",
        question: "What role and industry do you want to target immediately after your MBA, and why?",
        tips: [
          "Be specific about function and sector.",
          "Show the logical link from past experience to future goal.",
          "Keep it coherent with your long-term vision.",
        ],
      },
      {
        tag: "School fit",
        question: "Why this institute specifically, and not any other top tier-1 B-school you have converted?",
        tips: [
          "Reference specific programs, clubs, or faculty — show you did homework.",
          "Connect the school's strengths to your goals.",
          "Avoid generic praise that could apply to any school.",
        ],
      },
      {
        tag: "Long-term vision",
        question: "Where do you see yourself 10 years down the line — corporate leadership or entrepreneurship?",
        tips: [
          "Paint an ambitious yet grounded picture of leadership impact.",
          "Describe the kind of problems you want to solve, not just titles.",
          "Explain how your short-term post-MBA roles will build foundation for this.",
        ],
      },
      {
        tag: "Contingency Plan",
        question: "If you do not get your dream consulting or investment banking placement, what is your fallback career trajectory?",
        tips: [
          "Show pragmatic self-awareness and industry breadth.",
          "Name viable adjacent sectors (corporate strategy, product management, VC).",
          "Demonstrate that your long-term ambition doesn't depend on one single recruiter.",
        ],
      },
      {
        tag: "Skill Gap",
        question: "How does an MBA bridge the specific skill gap between your current profile and your desired future role?",
        tips: [
          "Be granular about gaps in finance, marketing, team leadership, and strategy.",
          "Explain why on-the-job learning alone is insufficient for rapid transition.",
          "Mention case-study pedagogy and peer cohort learning.",
        ],
      },
      {
        tag: "Career Pivot",
        question: "Why do you want to transition from a technical software or engineering role into general management?",
        tips: [
          "Frame the move as expanding from micro-implementation to macro-business strategy.",
          "Highlight how technical depth combined with business acumen is an asset.",
          "Avoid saying you dislike coding or engineering; appreciate your foundation.",
        ],
      },
      {
        tag: "Curriculum Alignment",
        question: "Which specific electives, centers of excellence, or professors at our institute align with your career ambitions?",
        tips: [
          "Name 2 specific electives and 1 research center unique to the institute.",
          "Explain how these courses will directly prepare you for your target role.",
          "Prove you have thoroughly researched the curriculum brochure.",
        ],
      },
      {
        tag: "Peer Contribution",
        question: "What will you contribute to your peer group and study cohort at our business school?",
        tips: [
          "Highlight diversity of thought, domain expertise, and campus club leadership.",
          "Offer examples of mentoring peers in quantitative or technical areas.",
          "Commit to actively participating in case competitions and student bodies.",
        ],
      },
      {
        tag: "First-Year Pressures",
        question: "How will you handle the intense academic pressure, sleep deprivation, and committee selections during your first year?",
        tips: [
          "Demonstrate time management, prioritization, and mental stamina.",
          "Share a past experience of juggling tight academic and extra-curricular demands.",
          "Emphasize support systems and maintaining personal balance.",
        ],
      },
      {
        tag: "Inspiration",
        question: "Tell me about an Indian or global business leader whose leadership philosophy you admire and why.",
        tips: [
          "Pick a leader whose specific values or strategy decisions resonate with you.",
          "Analyze their strategic acumen, not just popular media soundbites.",
          "Relate one of their leadership principles to your own aspirations.",
        ],
      },
      {
        tag: "Proactive Research",
        question: "Have you spoken to any alumni or current students of our institute? What key insights did you gain from them?",
        tips: [
          "Mention 1-2 real interactions and their batches/roles.",
          "Share concrete takeaways regarding campus culture, faculty, and student committees.",
          "Show initiative and genuine enthusiasm for the community.",
        ],
      },
      {
        tag: "Industry Knowledge",
        question: "What are the biggest misconceptions young aspirants have about management consulting or product management?",
        tips: [
          "Deconstruct glamorous stereotypes (pure travel, visionary roadmaps).",
          "Highlight grounded realities (rigorous data hygiene, stakeholder alignment, trade-offs).",
          "Show deep, mature domain comprehension.",
        ],
      },
      {
        tag: "Entrepreneurial Mindset",
        question: "If you had 10 million rupees in venture capital funding today, what business problem in India would you solve?",
        tips: [
          "Identify an unaddressed, high-friction pain point in Indian market.",
          "Outline the value proposition, target customer, and unit economics.",
          "Demonstrate strategic business instinct and problem-solving flair.",
        ],
      },
      {
        tag: "Purpose & Values",
        question: "How do you plan to balance return on investment (ROI) against pursuing a career with high social and environmental impact?",
        tips: [
          "Discuss sustainable capitalism and creating shared stakeholder value.",
          "Explain that long-term business viability requires ethical responsibility.",
          "Articulate your personal North Star with balance and clarity.",
        ],
      },
    ],
  },
  {
    id: "situational",
    title: "Situational & Behavioral",
    desc: "STAR-format scenarios on leadership, conflict, failure and ethics that reveal how you actually behave.",
    color: "#D97706",
    bg: "linear-gradient(135deg, #D97706, #F59E0B)",
    chip: "15 Questions",
    chipColor: "#B45309",
    chipBg: "#FFFBEB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    ),
    questions: [
      {
        tag: "Leadership",
        question: "Describe a time you led a team through a difficult situation. What was the outcome?",
        tips: [
          "Use the STAR format: Situation, Task, Action, Result.",
          "Quantify the result wherever possible.",
          "Keep the focus on your actions, not the whole team's.",
        ],
      },
      {
        tag: "Failure",
        question: "Tell me about a significant failure and what you learned from it.",
        tips: [
          "Own the failure fully; do not shift blame.",
          "Spend most of the answer on the learning and change.",
          "Avoid trivial failures that sound rehearsed.",
        ],
      },
      {
        tag: "Influence",
        question: "Describe an instance where you had to persuade senior stakeholders to accept an unconventional idea.",
        tips: [
          "Explain how you prepared data, anticipated objections, and built alignment.",
          "Highlight a pilot or proof-of-concept strategy to de-risk the proposal.",
          "Emphasize the business impact and relationship capital preserved.",
        ],
      },
      {
        tag: "Decision Making",
        question: "Give an example of a situation where you had to make a high-stakes decision with incomplete or ambiguous data.",
        tips: [
          "Detail your mental framework for evaluating trade-offs under uncertainty.",
          "Discuss mitigating worst-case downside while moving fast.",
          "Show courage to make the call and iterate as new facts emerged.",
        ],
      },
      {
        tag: "Coachability",
        question: "Describe a time when you received harsh critical feedback. How did you react and what changes did you implement?",
        tips: [
          "Show emotional maturity by not getting defensive or dismissive.",
          "Explain how you processed the critique and solicited actionable milestones.",
          "Share the measurable improvement verified in subsequent reviews.",
        ],
      },
      {
        tag: "Team Management",
        question: "Tell me about a situation where you had to manage an underperforming or demotivated team member.",
        tips: [
          "Demonstrate empathy by first diagnosing the root cause (skills, personal issues, burnout).",
          "Outline a clear, mutually agreed support and performance plan.",
          "Explain how the outcome improved both individual and team morale.",
        ],
      },
      {
        tag: "Ethics & Integrity",
        question: "Describe an ethical dilemma you faced in college or at work. How did you resolve it?",
        tips: [
          "Highlight a genuine conflict between competing priorities or rules.",
          "Demonstrate an unwavering commitment to honesty and fair play.",
          "Explain the courage required to uphold values despite pressure.",
        ],
      },
      {
        tag: "Agility",
        question: "Give an example of a project where your initial strategy failed completely, and you had to pivot quickly.",
        tips: [
          "Acknowledge early warning signals without denying reality.",
          "Describe rapid cross-functional re-alignment and resource redeployment.",
          "Quantify how the pivot rescued the project timeline and deliverables.",
        ],
      },
      {
        tag: "Interpersonal Skills",
        question: "Describe a time when you had to work with someone whose working style or personality clashed sharply with yours.",
        tips: [
          "Focus on mutual respect and establishing clear working norms.",
          "Highlight separating personal friction from shared objective deliverables.",
          "Show adaptability and emotional intelligence.",
        ],
      },
      {
        tag: "Initiative",
        question: "Tell me about a time when you went above and beyond your defined job description or role to deliver impact.",
        tips: [
          "Highlight proactivity in identifying an overlooked gap or inefficiency.",
          "Show hands-on execution without waiting for formal instructions.",
          "Connect the outcome to business bottom line or team productivity.",
        ],
      },
      {
        tag: "Poise under pressure",
        question: "Describe a high-stakes presentation or viva where you felt nervous. How did you compose yourself and deliver?",
        tips: [
          "Acknowledge natural nervous energy and physiological grounding techniques.",
          "Highlight thorough preparation and focusing on audience value.",
          "Describe how positive engagement replaced initial anxiety.",
        ],
      },
      {
        tag: "Time Management",
        question: "Give an example of how you prioritized multiple competing, high-urgency deadlines without compromising quality.",
        tips: [
          "Explain your prioritization framework (Eisenhower matrix, stakeholder impact).",
          "Discuss proactive expectation setting and transparent communication.",
          "Highlight delivering all commitments on schedule.",
        ],
      },
      {
        tag: "Problem Solving",
        question: "Tell me about a time you noticed an inefficiency in an existing process and took the lead to re-engineer it.",
        tips: [
          "Quantify the baseline friction (hours wasted, error rates).",
          "Describe the simplified workflow or automation implemented.",
          "Highlight long-term adoption and sustained time savings.",
        ],
      },
      {
        tag: "Negotiation",
        question: "Describe a scenario where a client or teammate made unreasonable demands. How did you set boundaries constructively?",
        tips: [
          "Focus on preserving relationship while holding firm on feasibility.",
          "Offer alternative solutions and realistic trade-offs.",
          "Emphasize mutual win-win alignment over confrontation.",
        ],
      },
      {
        tag: "Grit",
        question: "Tell me about a proud accomplishment where you overcame significant personal, academic, or financial odds.",
        tips: [
          "Share an authentic story of perseverance, discipline, and grit.",
          "Focus on your internal locus of control and steady progress.",
          "Explain how that experience built permanent inner resilience.",
        ],
      },
    ],
  },
];

const INTERVIEW_ROUNDS: InterviewRound[] = [
  {
    id: "round-pi",
    num: 1,
    title: "Personal Interview (PI)",
    subtitle: "Know yourself, your background, strengths, weaknesses and goals.",
    questionCount: 18,
    color: "#2563EB",
    bg: "#EFF6FF",
    badgeBg: "#EFF6FF",
    badgeColor: "#1D4ED8",
    markerColor: "#2563EB",
    categoryId: "personal-hr",
    evaluates: [
      "Self-awareness, authenticity, and personal integrity",
      "Clarity and coherence of career trajectory and MBA rationale",
      "Communication poise, articulation, and active listening",
      "Values, cultural fit, and collaborative leadership instincts",
    ],
    tips: [
      "Prepare a crisp, chronological 90-second 'walk me through your CV' pitch.",
      "Never disguise strengths as weaknesses; show genuine ongoing corrective effort.",
      "Know your graduation college, hometown history, and career decisions inside out.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "round-academic",
    num: 2,
    title: "Academic Round",
    subtitle: "Subject-specific questions from your graduation stream.",
    questionCount: 20,
    color: "#7C3AED",
    bg: "#F5F3FF",
    badgeBg: "#F5F3FF",
    badgeColor: "#6D28D9",
    markerColor: "#8B5CF6",
    categoryId: "academics",
    evaluates: [
      "Conceptual depth and intellectual curiosity in undergraduate subjects",
      "Ability to translate technical theories into business applications",
      "Individual ownership and understanding of final year project/thesis",
      "Learning agility and response when challenged on academic gaps",
    ],
    tips: [
      "Revisit at least 2-3 core subjects from your graduation that you claim to like.",
      "Be prepared to defend every acronym and technical term mentioned on your CV.",
      "If you do not know a formula or theorem, admit it gracefully rather than bluffing.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    id: "round-ca",
    num: 3,
    title: "Current Affairs Round",
    subtitle: "Questions on national, international events, economy and more.",
    questionCount: 12,
    color: "#059669",
    bg: "#F0FDF4",
    badgeBg: "#F0FDF4",
    badgeColor: "#047857",
    markerColor: "#10B981",
    categoryId: "current-affairs",
    evaluates: [
      "Awareness of macro-economic indicators, monetary policy, and fiscal trends",
      "Ability to present balanced, objective views on contentious policies",
      "Understanding of geopolitical shifts and international trade dynamics",
      "Curiosity about technology disruption and emerging business models",
    ],
    tips: [
      "Read the editorial and opinion pages of top financial dailies every day.",
      "Back claims with 2-3 verifiable figures (e.g. GDP growth, inflation rate).",
      "Adopt a neutral, managerial perspective instead of extreme political opinions.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "round-gd",
    num: 4,
    title: "GD Round",
    subtitle: "Group discussion topics and structured arguments.",
    questionCount: 10,
    color: "#D97706",
    bg: "#FFFBEB",
    badgeBg: "#FFFBEB",
    badgeColor: "#B45309",
    markerColor: "#F59E0B",
    categoryId: "gd-stress",
    evaluates: [
      "Collaborative teamwork and active listening in unstructured groups",
      "Ability to initiate, structure, and steer chaotic discussions forward",
      "Argument richness using PESTLE or stakeholder impact frameworks",
      "Assertive communication without aggression, shouting, or interruptions",
    ],
    tips: [
      "Aim for 3-4 impactful, high-content entries rather than speaking continuously.",
      "Acknowledge prior speakers' valid points before presenting counter-arguments.",
      "Help bring quiet or hesitant group members into the conversation.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "round-stress",
    num: 5,
    title: "Stress Interview Round",
    subtitle: "Tricky, situational and pressure handling questions.",
    questionCount: 8,
    color: "#DC2626",
    bg: "#FEF2F2",
    badgeBg: "#FEF2F2",
    badgeColor: "#B91C1C",
    markerColor: "#EF4444",
    categoryId: "gd-stress",
    evaluates: [
      "Emotional quotient and composure under hostile or dismissive questioning",
      "Grace and resilience when panel deliberately contradicts or doubts claims",
      "Non-defensive, structured reasoning under time-bounded constraints",
      "Consistency in values and truthfulness when placed in stressful dilemmas",
    ],
    tips: [
      "Remember that the panel is evaluating your reaction and poise, not just facts.",
      "Pause for 2-3 seconds to take a breath before speaking; never interrupt the panel.",
      "Maintain respectful eye contact, smile, and defend your logic cordially.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "round-behavioral",
    num: 6,
    title: "Behavioral Round",
    subtitle: "Real-life scenarios, leadership and decision making.",
    questionCount: 10,
    color: "#0891B2",
    bg: "#ECFEFF",
    badgeBg: "#ECFEFF",
    badgeColor: "#0E7490",
    markerColor: "#06B6D4",
    categoryId: "situational",
    evaluates: [
      "Past demonstrated behavior as the best predictor of future leadership",
      "Execution of the STAR framework (Situation, Task, Action, Result)",
      "Accountability for failures and capacity to implement feedback",
      "Interpersonal empathy and capability to resolve team conflict",
    ],
    tips: [
      "Prepare 4-5 versatile, verified stories from college, internships, or work.",
      "Quantify your results wherever possible (hours saved, revenue boosted, metrics).",
      "Emphasize your individual contributions while appreciating team support.",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
];

const CHECKLIST = {
  before: {
    title: "Before the Interview",
    color: "#2563EB",
    bg: "#EFF6FF",
    items: [
      "Research the institute's flagship programs, clubs and recent achievements",
      "Prepare a crisp 60-second 'tell me about yourself' pitch",
      "Revise your graduation subjects and projects in depth",
      "Read the last 2 months of business and economy news",
      "Prepare 2-3 genuine questions to ask the panel",
    ],
  },
  during: {
    title: "During the Interview",
    color: "#059669",
    bg: "#F0FDF4",
    items: [
      "Maintain eye contact and sit with confident, open posture",
      "Pause briefly to structure your answer before speaking",
      "Use the STAR format for any experience-based question",
      "Stay honest — never bluff on topics you don't know",
      "Keep answers focused; stop when you've made your point",
    ],
  },
};

interface VivaFeedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  source?: string;
}

type AnswerMode = "audio" | "text";
type ActiveDrawer = "questions" | "rounds" | "timed" | null;

export default function MockVivaPrepPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Answer + feedback state
  const [answerMode, setAnswerMode] = useState<AnswerMode>("audio");
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<VivaFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // ===== NEW INTERACTIVE DRAWERS STATE =====
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  // Drawer 1 (Curated Questions) state
  const [selectedQuestionCatId, setSelectedQuestionCatId] = useState<string>("personal-hr");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterChip, setActiveFilterChip] = useState<string>("All");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Drawer 2 (Interview Round Categories) state
  const [selectedRoundDetailId, setSelectedRoundDetailId] = useState<string | null>(null);

  // Drawer 3 (Timed Response Practice) state
  const [timedSelectedCategory, setTimedSelectedCategory] = useState<string>("personal-hr");
  const [timedDuration, setTimedDuration] = useState<number>(60); // 30, 60, or 120 seconds
  const [activeTimedLimit, setActiveTimedLimit] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId) || null;
  const currentQuestion = activeCategory?.questions[questionIndex] || null;

  // Body scroll locking when any drawer is open
  useEffect(() => {
    if (activeDrawer) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeDrawer]);

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDrawer) {
        setActiveDrawer(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDrawer]);

  // Timer runner
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Clean up any live recording resources
  const cleanupRecorder = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Reset the answer/feedback area
  const resetAnswerArea = () => {
    cleanupRecorder();
    setIsRecording(false);
    setRecordSeconds(0);
    setTextAnswer("");
    setFeedback(null);
    setEvalError(null);
    setRecorderError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      cleanupRecorder();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startPractice = (catId: string, qIndex = 0, timedSecs: number | null = null) => {
    setActiveCategoryId(catId);
    setQuestionIndex(qIndex);
    setElapsed(0);
    setTimerRunning(true);
    setActiveTimedLimit(timedSecs);
    resetAnswerArea();
    setActiveDrawer(null);
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const nextQuestion = () => {
    if (!activeCategory) return;
    if (questionIndex < activeCategory.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setQuestionIndex(0);
    }
    setElapsed(0);
    setTimerRunning(true);
    resetAnswerArea();
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
      setElapsed(0);
      setTimerRunning(true);
      resetAnswerArea();
    }
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== AUDIO RECORDING =====
  const startRecording = async () => {
    setRecorderError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecorderError("Audio recording isn't supported in this browser. You can type your answer instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setRecorderError("Microphone access was blocked. Allow mic permission or type your answer instead.");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // ===== AI EVALUATION =====
  const evaluateAnswer = async () => {
    if (!currentQuestion || !activeCategory) return;
    const answerText = textAnswer.trim();
    if (!answerText) {
      setEvalError("Type your answer in the box below to get AI feedback.");
      return;
    }
    setIsEvaluating(true);
    setEvalError(null);
    setFeedback(null);
    setTimerRunning(false);
    try {
      const res = await fetch("/api/mock-viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answerText,
          category: activeCategory.title,
          tips: currentQuestion.tips,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalError(data?.error || "Could not evaluate your answer. Please try again.");
      } else {
        setFeedback(data as VivaFeedback);
      }
    } catch {
      setEvalError("Network error while evaluating. Check your connection and try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const answerWordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;

  // ===== DRAWER 1 FILTERING LOGIC =====
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      // Filter chip matching
      if (activeFilterChip !== "All") {
        if (activeFilterChip === "Personal & HR" && cat.id !== "personal-hr") return false;
        if (activeFilterChip === "Academics" && cat.id !== "academics") return false;
        if (activeFilterChip === "Current Affairs" && cat.id !== "current-affairs") return false;
        if (activeFilterChip === "GD-PI" && cat.id !== "gd-stress") return false;
        if (activeFilterChip === "Behavioral" && cat.id !== "situational") return false;
      }
      // Search matching across questions or category title
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCat = cat.title.toLowerCase().includes(query);
        const matchesQuestions = cat.questions.some((q) => q.question.toLowerCase().includes(query) || q.tag.toLowerCase().includes(query));
        return matchesCat || matchesQuestions;
      }
      return true;
    });
  }, [activeFilterChip, searchQuery]);

  // Selected category in Drawer 1
  const activeDrawer1Category = useMemo(() => {
    const found = filteredCategories.find((c) => c.id === selectedQuestionCatId);
    return found || filteredCategories[0] || CATEGORIES[0];
  }, [filteredCategories, selectedQuestionCatId]);

  // Displayed questions for selected category in Drawer 1
  const displayedDrawer1Questions = useMemo(() => {
    if (!activeDrawer1Category) return [];
    let list = activeDrawer1Category.questions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.question.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q));
    }
    const isExpanded = expandedCategories[activeDrawer1Category.id] || searchQuery.trim().length > 0;
    return isExpanded ? list : list.slice(0, 5);
  }, [activeDrawer1Category, searchQuery, expandedCategories]);

  // Selected round for Drawer 2 details
  const activeRoundDetail = useMemo(() => {
    if (!selectedRoundDetailId) return null;
    return INTERVIEW_ROUNDS.find((r) => r.id === selectedRoundDetailId) || null;
  }, [selectedRoundDetailId]);

  return (
    <div className={styles.pageWrapper}>
      {/* ===== STICKY NAV ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Mock Viva Prep Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={styles.navLink}>Intelligence Hub</Link>
              <Link href="/mock-viva-prep" className={`${styles.navLink} ${styles.navLinkActive}`}>Mock Viva Prep</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== BREADCRUMB ===== */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <Link href="/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSep}>&gt;</span>
          <span className={styles.breadcrumbCurrent}>Mock Viva Prep</span>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className={styles.heroSection}>
        <div className={styles.heroCircleDecor1} aria-hidden="true" />
        <div className={styles.heroCircleDecor2} aria-hidden="true" />
        <div className={styles.heroDotsDecor} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              ✦ GD-PI &amp; INTERVIEW PREP
            </div>
            <h1 className={styles.heroTitle}>
              Crack the<br />
              <span className={styles.heroHighlight}>Mock Viva,</span><br />
              Walk in Confident.
            </h1>
            <p className={styles.heroSubtitle}>
              Practice real IIM-style personal interview questions across HR, academics, current affairs and stress rounds — with timers, expert pointers and a prep checklist all in one place.
            </p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => startPractice("personal-hr")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                <span>Start a Mock Session &rarr;</span>
              </button>
              <a
                href="#checklist"
                className={styles.btnSecondary}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>View Prep Checklist</span>
              </a>
            </div>
          </div>

          {/* ===== YOUR PREP AT A GLANCE PANEL ===== */}
          <div className={styles.prepGlancePanel}>
            {/* Panel Header */}
            <div className={styles.glanceHeader}>
              <div className={styles.glanceHeaderLeft}>
                <div className={styles.glanceHeaderIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className={styles.glanceHeaderTitles}>
                  <h3 className={styles.glanceTitle}>YOUR PREP AT A GLANCE</h3>
                  <p className={styles.glanceSubtitle}>Everything you need for interview readiness.</p>
                </div>
              </div>
              <div className={styles.glanceHeaderAccent} aria-hidden="true">
                <span className={styles.glanceAccentBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
                  </svg>
                  PREP HUB
                </span>
              </div>
            </div>

            {/* Three Feature Cards */}
            <div className={styles.glanceCardsList}>
              {/* Card 1: 68+ Curated viva questions */}
              <button
                type="button"
                className={`${styles.statCard} ${styles.statCardInteractive} ${activeDrawer === "questions" ? styles.statCardActiveBlue : ""}`}
                onClick={() => setActiveDrawer("questions")}
                title="Explore 68+ Curated Viva Questions"
              >
                <div className={styles.statCardLeft}>
                  <div className={styles.statIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v4M16 2v4M3 10h18" />
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <div className={styles.statTextCol}>
                    <span className={styles.statValue}>68+</span>
                    <span className={styles.statLabel}>Curated viva questions</span>
                  </div>
                </div>
                <div className={styles.statChevron}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>

              {/* Card 2: 6 Interview round categories */}
              <button
                type="button"
                className={`${styles.statCard} ${styles.statCardInteractive} ${activeDrawer === "rounds" ? styles.statCardActiveGreen : ""}`}
                onClick={() => {
                  setSelectedRoundDetailId(null);
                  setActiveDrawer("rounds");
                }}
                title="Explore 6 Interview Round Categories"
              >
                <div className={styles.statCardLeft}>
                  <div className={styles.statIcon} style={{ background: "#F0FDF4", color: "#059669" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className={styles.statTextCol}>
                    <span className={styles.statValue}>6</span>
                    <span className={styles.statLabel}>Interview round categories</span>
                  </div>
                </div>
                <div className={styles.statChevron}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>

              {/* Card 3: Timed Response practice mode */}
              <button
                type="button"
                className={`${styles.statCard} ${styles.statCardInteractive} ${activeDrawer === "timed" ? styles.statCardActiveOrange : ""}`}
                onClick={() => setActiveDrawer("timed")}
                title="Start Timed Response Practice Mode"
              >
                <div className={styles.statCardLeft}>
                  <div className={styles.statIcon} style={{ background: "#FFFBEB", color: "#D97706" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className={styles.statTextCol}>
                    <span className={styles.statValue}>Timed</span>
                    <span className={styles.statLabel}>Response practice mode</span>
                  </div>
                </div>
                <div className={styles.statChevron}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Practice → Review → Improve Visual Learning Flow */}
            <div className={styles.flowContainer}>
              <div className={styles.flowTrack}>
                <svg className={styles.flowLineSvg} viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M 32 12 C 90 4, 210 20, 276 12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                </svg>

                <div className={styles.flowStep}>
                  <div className={styles.flowStepCircle} title="Step 1: Practice real viva questions">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <span className={styles.flowStepText}>Practice</span>
                </div>

                <div className={styles.flowStep}>
                  <div className={styles.flowStepCircle} title="Step 2: Review tips and feedback">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <span className={styles.flowStepText}>Review</span>
                </div>

                <div className={styles.flowStep}>
                  <div className={styles.flowStepCircle} title="Step 3: Improve with AI analysis">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <span className={styles.flowStepText}>Improve</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      <div className={styles.contentWrapper}>
        {/* CATEGORIES */}
        <section id="interview-rounds">
          <div className={styles.roundSectionHead}>
            <div className={styles.roundHeadLeft}>
              <div className={styles.roundTitleRow}>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h2 className={styles.sectionTitle}>Choose an Interview Round</h2>
              </div>
              <p className={styles.sectionSubtitle}>
                Pick a category to start a timed practice session with sample questions and expert pointers.
              </p>
            </div>
            <button
              type="button"
              className={styles.btnViewAllRounds}
              onClick={() => {
                setSelectedRoundDetailId(null);
                setActiveDrawer("rounds");
              }}
              title="Explore all 6 interview round categories in detail"
            >
              <span>View All Rounds</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catCard} ${activeCategoryId === cat.id ? styles.catCardActive : ""}`}
                onClick={() => startPractice(cat.id)}
                title={`Practice ${cat.title}`}
              >
                <div className={styles.catCardTop}>
                  <div className={styles.catIcon} style={{ background: cat.chipBg, color: cat.color }}>
                    {cat.icon}
                  </div>
                  <h3 className={styles.catTitle}>{cat.title}</h3>
                  <p className={styles.catDesc}>{cat.desc}</p>
                </div>
                
                <div className={styles.catFooter}>
                  <span className={styles.catQuestionBadge} style={{ color: cat.chipColor, background: cat.chipBg }}>
                    {cat.chip}
                  </span>
                  <div className={styles.catArrowCircle} aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* PRACTICE PANEL */}
        <section ref={panelRef}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Practice Session</h2>
            <p className={styles.sectionSubtitle}>
              Read the question, start speaking out loud, and keep an eye on your response time.
            </p>
          </div>

          <div className={styles.qaPanel}>
            {activeCategory && currentQuestion ? (
              <>
                <div className={styles.qaHeader}>
                  <div className={styles.qaHeaderLeft}>
                    <div className={styles.qaHeaderIcon}>{activeCategory.icon}</div>
                    <div>
                      <div className={styles.qaHeaderTitle}>{activeCategory.title}</div>
                      <div className={styles.qaHeaderSub}>Mock personal interview round</div>
                    </div>
                  </div>
                  <div className={styles.qaTimerWrapper}>
                    {activeTimedLimit && (
                      <span className={styles.qaTimedModeBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {activeTimedLimit}s Timed Mode
                      </span>
                    )}
                    <div className={`${styles.qaTimer} ${timerRunning ? styles.qaTimerRunning : ""} ${activeTimedLimit && elapsed >= activeTimedLimit ? styles.qaTimedWarning : ""}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatTime(elapsed)} {activeTimedLimit ? `/ ${formatTime(activeTimedLimit)}` : ""}
                    </div>
                  </div>
                </div>

                <div className={styles.qaBody}>
                  <div className={styles.qaProgress}>
                    <div className={styles.qaProgressBar}>
                      <div
                        className={styles.qaProgressFill}
                        style={{ width: `${((questionIndex + 1) / activeCategory.questions.length) * 100}%` }}
                      />
                    </div>
                    <span className={styles.qaProgressLabel}>
                      Q{questionIndex + 1} of {activeCategory.questions.length}
                    </span>
                  </div>

                  <div className={styles.qaQuestionCard}>
                    <span className={styles.qaQuestionTag}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {currentQuestion.tag}
                    </span>
                    <p className={styles.qaQuestionText}>{currentQuestion.question}</p>
                  </div>

                  <div className={styles.qaTips}>
                    <div className={styles.qaTipsTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                      </svg>
                      How to answer this well
                    </div>
                    <ul className={styles.qaTipsList}>
                      {currentQuestion.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ===== ANSWER AREA ===== */}
                  <div className={styles.answerBlock}>
                    <div className={styles.answerHead}>
                      <div className={styles.answerTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                        </svg>
                        Your Answer
                      </div>
                      <div className={styles.answerModeToggle}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${answerMode === "audio" ? styles.modeBtnActive : ""}`}
                          onClick={() => setAnswerMode("audio")}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          </svg>
                          Record Audio
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${answerMode === "text" ? styles.modeBtnActive : ""}`}
                          onClick={() => setAnswerMode("text")}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Type Answer
                        </button>
                      </div>
                    </div>

                    {answerMode === "audio" ? (
                      <div className={styles.recorder}>
                        <div className={`${styles.recordTime} ${isRecording ? styles.recordTimeLive : ""}`}>
                          {formatTime(recordSeconds)}
                        </div>
                        <button
                          type="button"
                          className={`${styles.recordBtn} ${isRecording ? styles.recordBtnActive : ""}`}
                          onClick={isRecording ? stopRecording : startRecording}
                          aria-label={isRecording ? "Stop recording" : "Start recording"}
                        >
                          {isRecording ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
                            </svg>
                          )}
                        </button>
                        <div className={styles.recordHint}>
                          {isRecording ? "Recording… tap to stop" : audioUrl ? "Recorded — play it back below" : "Tap the mic and answer out loud"}
                        </div>
                        {audioUrl && (
                          <div className={styles.audioPlayback}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <audio controls src={audioUrl} />
                          </div>
                        )}
                        {recorderError && <div className={styles.recorderError}>{recorderError}</div>}
                        <p className={styles.recorderNote}>
                          Recording lets you rehearse speaking aloud. For AI scoring, switch to &ldquo;Type Answer&rdquo; and paste or type what you said.
                        </p>
                      </div>
                    ) : (
                      <>
                        <textarea
                          className={styles.answerTextarea}
                          placeholder="Type your answer here as you would speak it in the interview…"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                        />
                        <div className={styles.answerFootRow}>
                          <span className={styles.wordCounter}>{answerWordCount} words</span>
                          <button
                            type="button"
                            className={styles.btnEvaluate}
                            onClick={evaluateAnswer}
                            disabled={isEvaluating || !textAnswer.trim()}
                          >
                            {isEvaluating ? (
                              <>
                                <span className={styles.spinner} />
                                Evaluating…
                              </>
                            ) : (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
                                </svg>
                                Get AI Feedback
                              </>
                            )}
                          </button>
                        </div>
                        {evalError && <div className={styles.recorderError}>{evalError}</div>}
                      </>
                    )}
                  </div>

                  {/* ===== FEEDBACK ===== */}
                  {feedback && (
                    <div className={styles.feedbackCard}>
                      <div className={styles.feedbackTop}>
                        <div className={styles.scoreRing}>
                          <svg width="72" height="72" viewBox="0 0 72 72">
                            <circle cx="36" cy="36" r="30" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                            <circle
                              cx="36"
                              cy="36"
                              r="30"
                              fill="none"
                              stroke={feedback.score >= 80 ? "#10B981" : feedback.score >= 65 ? "#2563EB" : "#F59E0B"}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 30}
                              strokeDashoffset={2 * Math.PI * 30 * (1 - feedback.score / 100)}
                            />
                          </svg>
                          <div className={styles.scoreRingVal}>{feedback.score}</div>
                        </div>
                        <div className={styles.feedbackVerdict}>
                          <span className={styles.feedbackVerdictLabel}>AI Panel Verdict</span>
                          <span className={styles.feedbackVerdictText}>{feedback.verdict}</span>
                          <span
                            className={styles.feedbackSourceTag}
                            style={
                              feedback.source === "ai"
                                ? { background: "#EEF2FF", color: "#4F46E5" }
                                : { background: "#F1F5F9", color: "#64748B" }
                            }
                          >
                            {feedback.source === "ai" ? "AI-evaluated" : "Rule-based estimate"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.feedbackBody}>
                        <div>
                          <div className={styles.feedbackColTitle} style={{ color: "#059669" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            What worked
                          </div>
                          <ul className={`${styles.feedbackList} ${styles.strengthList}`}>
                            {feedback.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className={styles.feedbackColTitle} style={{ color: "#D97706" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="20" x2="12" y2="10" />
                              <polyline points="7 15 12 20 17 15" />
                            </svg>
                            How to improve
                          </div>
                          <ul className={`${styles.feedbackList} ${styles.improveList}`}>
                            {feedback.improvements.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        {feedback.modelAnswer && (
                          <div className={styles.modelAnswerBox}>
                            <div className={styles.modelAnswerTitle}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              Sample strong answer
                            </div>
                            <p className={styles.modelAnswerText}>{feedback.modelAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.qaActions}>
                    <div className={styles.qaActionsLeft}>
                      <button
                        className={styles.btnGhost}
                        onClick={() => setTimerRunning((r) => !r)}
                      >
                        {timerRunning ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                            Pause Timer
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
                            Resume Timer
                          </>
                        )}
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={prevQuestion}
                        disabled={questionIndex === 0}
                      >
                        &larr; Previous
                      </button>
                    </div>
                    <button className={styles.btnNext} onClick={nextQuestion}>
                      {questionIndex < activeCategory.questions.length - 1 ? "Next Question" : "Restart Round"} &rarr;
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.qaEmpty}>
                <div className={styles.qaEmptyIcon}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-6 0v4" />
                    <rect x="5" y="9" width="14" height="11" rx="2" />
                    <circle cx="12" cy="14" r="1.5" />
                  </svg>
                </div>
                <div className={styles.qaEmptyTitle}>No active session yet</div>
                <p className={styles.qaEmptyDesc}>
                  Select an interview round above or hit &ldquo;Start a Mock Session&rdquo; to begin practicing with timed questions and expert tips.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CHECKLIST */}
        <section id="checklist">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Your Viva Readiness Checklist</h2>
            <p className={styles.sectionSubtitle}>
              Tick these off as you prepare — a solid process beats last-minute cramming.
            </p>
          </div>
          <div className={styles.checklistGrid}>
            {Object.entries(CHECKLIST).map(([groupKey, group]) => (
              <div key={groupKey} className={styles.checkCard}>
                <div className={styles.checkHead}>
                  <div className={styles.checkHeadIcon} style={{ background: group.bg, color: group.color }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <span className={styles.checkHeadTitle}>{group.title}</span>
                </div>
                {group.items.map((item, i) => {
                  const key = `${groupKey}-${i}`;
                  const done = checkedItems[key];
                  return (
                    <div key={key} className={styles.checkItem} onClick={() => toggleCheck(key)}>
                      <div className={`${styles.checkBox} ${done ? styles.checkBoxChecked : ""}`}>
                        {done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`${styles.checkText} ${done ? styles.checkTextDone : ""}`}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =========================================================================
          DRAWER 1: CURATED VIVA QUESTIONS (Question Explorer)
          ========================================================================= */}
      {activeDrawer === "questions" && (
        <div className={styles.drawerBackdrop} onClick={() => setActiveDrawer(null)}>
          <div
            className={`${styles.drawerContainer} ${styles.drawerQuestions}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Curated Viva Questions Explorer"
          >
            {/* Fixed Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <div className={styles.drawerHeaderIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4M16 2v4M3 10h18" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.drawerHeaderTitle}>Curated Viva Questions</h3>
                  <p className={styles.drawerHeaderSub}>Practice handpicked interview questions from multiple categories.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setActiveDrawer(null)}
                aria-label="Close drawer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className={styles.drawerSearchBar}>
              <div className={styles.searchWrapper}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search questions (e.g. tell me about yourself, inflation, OOP...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Filter Chips */}
            <div className={styles.filterChipsRow}>
              {["All", "Personal & HR", "Academics", "Current Affairs", "GD-PI", "Behavioral"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`${styles.filterChip} ${activeFilterChip === chip ? styles.filterChipActive : ""}`}
                  onClick={() => setActiveFilterChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Two-Column Explorer */}
            <div className={styles.explorerContent}>
              {/* Left Column: Categories List */}
              <div className={styles.explorerLeftCol}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => {
                    const isSelected = activeDrawer1Category?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.explorerCatItem} ${isSelected ? styles.explorerCatItemActive : ""}`}
                        onClick={() => setSelectedQuestionCatId(cat.id)}
                      >
                        <div className={styles.explorerCatItemLeft}>
                          <div className={styles.explorerCatIcon} style={{ background: cat.bg, color: "#FFF" }}>
                            {cat.icon}
                          </div>
                          <span className={styles.explorerCatName}>{cat.title}</span>
                        </div>
                        <span className={styles.explorerCatBadge}>{cat.questions.length}</span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "20px 10px", fontSize: "13px", color: "#94A3B8", textAlign: "center" }}>
                    No matching categories found
                  </div>
                )}
              </div>

              {/* Right Column: Question Preview */}
              <div className={styles.explorerRightCol}>
                {activeDrawer1Category ? (
                  <>
                    <div className={styles.rightColHeader}>
                      <h4 className={styles.rightColTitle}>{activeDrawer1Category.title}</h4>
                      <span className={styles.rightColCountPill}>
                        {activeDrawer1Category.questions.length} questions
                      </span>
                    </div>
                    <p className={styles.rightColDesc}>{activeDrawer1Category.desc}</p>

                    <div className={styles.questionsList}>
                      {displayedDrawer1Questions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.questionRow}
                          onClick={() => {
                            const originalIndex = activeDrawer1Category.questions.findIndex((item) => item.question === q.question);
                            startPractice(activeDrawer1Category.id, originalIndex >= 0 ? originalIndex : idx);
                          }}
                          title="Click to practice this question"
                        >
                          <div className={styles.questionRowLeft}>
                            <span className={styles.questionNum}>{idx + 1}.</span>
                            <span className={styles.questionText}>{q.question}</span>
                          </div>
                          <span className={styles.questionChevron}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* View all toggle */}
                    {activeDrawer1Category.questions.length > 5 && !searchQuery && (
                      <button
                        type="button"
                        className={styles.viewAllBtn}
                        onClick={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [activeDrawer1Category.id]: !prev[activeDrawer1Category.id],
                          }))
                        }
                      >
                        {expandedCategories[activeDrawer1Category.id]
                          ? "− Show less questions"
                          : `+ View all ${activeDrawer1Category.questions.length} questions`}
                      </button>
                    )}

                    {/* Tip card */}
                    <div className={styles.tipCard}>
                      <div className={styles.tipCardIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                        </svg>
                      </div>
                      <div>
                        <strong>Tip:</strong> Practice your answers out loud and focus on clear structure and real examples.
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                    Select a category to view questions.
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer CTA */}
            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerPrimaryBtn}
                onClick={() => startPractice(activeDrawer1Category ? activeDrawer1Category.id : "personal-hr")}
              >
                Start Practicing {activeDrawer1Category ? activeDrawer1Category.title : "Personal & HR"} &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER 2: INTERVIEW ROUND CATEGORIES (Vertical Timeline)
          ========================================================================= */}
      {activeDrawer === "rounds" && (
        <div className={styles.drawerBackdrop} onClick={() => setActiveDrawer(null)}>
          <div
            className={`${styles.drawerContainer} ${styles.drawerRounds}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Interview Round Categories"
          >
            {/* Fixed Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <div className={styles.drawerHeaderIcon} style={{ background: "#F0FDF4", color: "#10B981" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.drawerHeaderTitle}>Interview Round Categories</h3>
                  <p className={styles.drawerHeaderSub}>Explore different interview rounds, understand their structure and practice questions.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setActiveDrawer(null)}
                aria-label="Close drawer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content: Timeline or Focused Detail */}
            {activeRoundDetail ? (
              <div className={styles.roundDetailView}>
                <button
                  type="button"
                  className={styles.backToRoundsBtn}
                  onClick={() => setSelectedRoundDetailId(null)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to all interview rounds
                </button>

                <div className={styles.roundDetailCard}>
                  <div className={styles.roundDetailHead}>
                    <div className={styles.timelineCardIcon} style={{ background: activeRoundDetail.bg }}>
                      {activeRoundDetail.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                        {activeRoundDetail.title}
                      </h4>
                      <span
                        className={styles.timelineCardPill}
                        style={{ background: activeRoundDetail.badgeBg, color: activeRoundDetail.badgeColor, marginTop: "4px", display: "inline-block" }}
                      >
                        {activeRoundDetail.questionCount} questions
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.55, margin: 0 }}>
                    {activeRoundDetail.subtitle}
                  </p>
                </div>

                <div className={styles.roundDetailCard}>
                  <div className={styles.roundDetailSectionTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    What the Interviewer Evaluates
                  </div>
                  <ul className={styles.roundDetailBulletList}>
                    {activeRoundDetail.evaluates.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.roundDetailCard}>
                  <div className={styles.roundDetailSectionTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                    </svg>
                    Preparation Tips &amp; Strategy
                  </div>
                  <ul className={styles.roundDetailBulletList}>
                    {activeRoundDetail.tips.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={styles.drawerPrimaryBtn}
                  style={{ marginTop: "10px" }}
                  onClick={() => startPractice(activeRoundDetail.categoryId)}
                >
                  Practice This Round &rarr;
                </button>
              </div>
            ) : (
              <div className={styles.timelineScrollArea}>
                <div className={styles.timelineContainer}>
                  <div className={styles.timelineLine} />

                  {INTERVIEW_ROUNDS.map((round) => (
                    <div key={round.id} className={styles.timelineCardRow}>
                      <div className={styles.timelineMarker} style={{ background: round.markerColor }}>
                        {round.num}
                      </div>
                      <button
                        type="button"
                        className={styles.timelineCard}
                        onClick={() => setSelectedRoundDetailId(round.id)}
                      >
                        <div className={styles.timelineCardLeft}>
                          <div className={styles.timelineCardIcon} style={{ background: round.bg }}>
                            {round.icon}
                          </div>
                          <div className={styles.timelineCardInfo}>
                            <div className={styles.timelineCardTitleRow}>
                              <span className={styles.timelineCardTitle}>{round.title}</span>
                              <span
                                className={styles.timelineCardPill}
                                style={{ background: round.badgeBg, color: round.badgeColor }}
                              >
                                {round.questionCount} questions
                              </span>
                            </div>
                            <span className={styles.timelineCardDesc}>{round.subtitle}</span>
                          </div>
                        </div>
                        <span className={styles.questionChevron}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bottom Helper Card */}
                <div
                  className={styles.timelineHelperCard}
                  onClick={() => setSelectedRoundDetailId("round-pi")}
                  title="Explore recommended starting round"
                >
                  <div className={styles.timelineHelperLeft}>
                    <div className={styles.timelineHelperIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.timelineHelperTitle}>Not sure which round to start?</div>
                      <div className={styles.timelineHelperSub}>Explore round-wise tips, sample questions and strategies.</div>
                    </div>
                  </div>
                  <span className={styles.questionChevron}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER 3: TIMED RESPONSE PRACTICE MODE (Step-Based Setup)
          ========================================================================= */}
      {activeDrawer === "timed" && (
        <div className={styles.drawerBackdrop} onClick={() => setActiveDrawer(null)}>
          <div
            className={`${styles.drawerContainer} ${styles.drawerTimed}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Timed Response Practice"
          >
            {/* Fixed Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <div className={styles.drawerHeaderIcon} style={{ background: "#FFFBEB", color: "#D97706" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.drawerHeaderTitle}>Timed Response Practice</h3>
                  <p className={styles.drawerHeaderSub}>Simulate real interview environment and practice answering with a timer.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setActiveDrawer(null)}
                aria-label="Close drawer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className={styles.timedFormScroll}>
              {/* Step 1: Select Interview Category */}
              <div className={styles.stepBlock}>
                <div className={styles.stepHead}>
                  <div className={styles.stepBadge}>1</div>
                  <div className={styles.stepTitle}>Select Interview Category</div>
                </div>
                <div className={styles.stepSubtitle}>Choose a category to practice timed responses.</div>

                <select
                  className={styles.categorySelect}
                  value={timedSelectedCategory}
                  onChange={(e) => setTimedSelectedCategory(e.target.value)}
                  aria-label="Select interview category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} ({cat.questions.length} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Choose Response Duration */}
              <div className={styles.stepBlock}>
                <div className={styles.stepHead}>
                  <div className={styles.stepBadge}>2</div>
                  <div className={styles.stepTitle}>Choose Response Duration</div>
                </div>
                <div className={styles.stepSubtitle}>Select how much time you want per question.</div>

                <div className={styles.durationGrid}>
                  {[30, 60, 120].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      className={`${styles.durationCard} ${timedDuration === secs ? styles.durationCardActive : ""}`}
                      onClick={() => setTimedDuration(secs)}
                    >
                      <span className={styles.durationNumber}>{secs}</span>
                      <span className={styles.durationUnit}>seconds</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* How it works section */}
              <div className={styles.howItWorksBox}>
                <div className={styles.howItWorksHead}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <span>How it works?</span>
                </div>

                <div className={styles.howItWorksContent}>
                  <ul className={styles.howItWorksList}>
                    <li>
                      <span className={styles.howItWorksCheck}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>You will get one question at a time</span>
                    </li>
                    <li>
                      <span className={styles.howItWorksCheck}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>Timer will start automatically</span>
                    </li>
                    <li>
                      <span className={styles.howItWorksCheck}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>Speak your answer before time ends</span>
                    </li>
                    <li>
                      <span className={styles.howItWorksCheck}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>You can move to the next question or retry</span>
                    </li>
                    <li>
                      <span className={styles.howItWorksCheck}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>Helps improve clarity, confidence and time management</span>
                    </li>
                  </ul>

                  {/* Stopwatch Illustration Graphic */}
                  <div className={styles.howItWorksGraphic}>
                    <svg width="86" height="86" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="56" r="34" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="4" />
                      <circle cx="50" cy="56" r="28" fill="#FFFFFF" />
                      <line x1="50" y1="22" x2="50" y2="15" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                      <line x1="42" y1="15" x2="58" y2="15" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                      <line x1="72" y1="30" x2="78" y2="24" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
                      {/* Clock ticks */}
                      <circle cx="50" cy="34" r="2" fill="#93C5FD" />
                      <circle cx="72" cy="56" r="2" fill="#93C5FD" />
                      <circle cx="50" cy="78" r="2" fill="#93C5FD" />
                      <circle cx="28" cy="56" r="2" fill="#93C5FD" />
                      {/* Clock hands */}
                      <line x1="50" y1="56" x2="50" y2="40" stroke="#1D4ED8" strokeWidth="3.5" strokeLinecap="round" />
                      <line x1="50" y1="56" x2="62" y2="56" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="56" r="4" fill="#1D4ED8" />
                      {/* Sparkles / dots */}
                      <circle cx="16" cy="38" r="2.5" fill="#60A5FA" opacity="0.6" />
                      <circle cx="84" cy="44" r="2.5" fill="#60A5FA" opacity="0.6" />
                      <circle cx="24" cy="74" r="2" fill="#93C5FD" opacity="0.5" />
                      <circle cx="78" cy="76" r="2.5" fill="#60A5FA" opacity="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer CTA */}
            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerPrimaryBtn}
                onClick={() => startPractice(timedSelectedCategory, 0, timedDuration)}
              >
                Start Timed Practice &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
