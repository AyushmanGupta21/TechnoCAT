<div align="center">

# 🎓 TechnoCAT — AI-Powered CAT Exam Preparation Platform

**India's most advanced, intelligent testing and analytics ecosystem designed specifically for serious CAT & OMET aspirants.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg--8.23-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Intelligent Backlog Scheduler](#1-intelligent-backlog-scheduler)
  - [2. Central Intelligence Hub](#2-central-intelligence-hub)
  - [3. Dual Exam Simulation Modes](#3-dual-exam-simulation-modes)
  - [4. Dynamic Readiness Meter & Analytics](#4-dynamic-readiness-meter--analytics)
  - [5. Interactive Video Solutions & Topic Drills](#5-interactive-video-solutions--topic-drills)
  - [6. B-School & IIM Call Predictor](#6-b-school--iim-call-predictor)
- [Technology Stack](#-technology-stack)
- [Repository & File Structure](#-repository--file-structure)
- [Application Routes](#-application-routes)
- [API Architecture](#-api-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation & Development](#installation--development)
  - [Building for Production](#building-for-production)
- [License](#-license)

---

## 🚀 Overview

**TechnoCAT** is a next-generation CAT (Common Admission Test) and MBA entrance examination prep suite. It bridges the gap between passive mock testing and active score acceleration through:
- Realistic exam simulations with All-India live percentile rankings.
- Cognitive workload management with an **AI Intelligent Backlog Scheduler**.
- Section-wise video solutions across Quantitative Ability (QA), Data Interpretation & Logical Reasoning (DILR), and Verbal Ability & Reading Comprehension (VARC).
- A unified **Intelligence Hub** for error tracking, score diagnosis, and B-school conversion forecasting.

---

## ✨ Key Features

### 1. Intelligent Backlog Scheduler
- **Cognitive Load Balancing**: Overdue tasks from missed study sessions are not dumped into a single day. The scheduler paces them alongside today's new curriculum topics.
- **Student Quota Controls**: Aspirants can configure how many overdue review tasks to tackle today (`0`, `1`, `2 (Recommended)`, `3`, or `All`), with preferences persisted in `localStorage`.
- **Strict Priority Ordering**:
  - **1st Priority**: Assigned overdue backlog tasks are scheduled in the morning and early afternoon slots.
  - **Next Priority**: Today's new syllabus topics follow in the afternoon and evening.
- **Conflict-Free Chronological Slotting**: Automatically sequences all assigned tasks across ascending, realistic study blocks (e.g., `09:00 AM → 11:30 AM → 02:30 PM → 05:00 PM`) without backwards time jumps or duplicate slots.
- **Queued Backlog Drawer**: Unassigned past tasks are securely stored in a collapsible drawer with a 1-click `+ Assign to Today` button.

### 2. Central Intelligence Hub (`/intelligence`)
- **AI Performance Diagnosis**: Granular question-level breakdown of time-sink patterns, accuracy pitfalls, and topic masteries.
- **Error Tracking Engine**: Automatically categorizes errors (Conceptual Flaw, Calculation Slip, Reading Trap, Guesswork) so students eliminate recurring mistakes.
- **Strategy Builder**: Custom study pace recommendations based on target percentile and exam date proximity.
- **Community Hub**: Collaborative doubt solving with 580+ 99%ilers and peer aspirants.

### 3. Dual Exam Simulation Modes
- **Classic Mode** (`/browse`): Exact 1:1 replica of the official TCS iON CAT testing console (palette, timer, question states) for true exam acclimatization.
- **Modern Mode** (`/intelligence`): Distraction-free, responsive UI with real-time AI assistance, bookmarking, and post-test analytics.

### 4. Dynamic Readiness Meter & Analytics (`/analytics`, `/dashboard`)
- **Holistic Score Algorithm**: Calculates overall exam readiness (0–100%) synthesized from:
  - **Concepts**: Completed lecture modules & video portions.
  - **Speed**: Challenge hours and time-to-solve benchmarks.
  - **Consistency**: 7-day rolling study hours and task streak.
  - **Accuracy**: Points earned across practice drills and mocks.
- **Performance Charting**: Visualized dual-axis breakdown of Learning Hours vs. Challenge Hours using Recharts.

### 5. Interactive Video Solutions & Topic Drills (`/topics`)
- Sectional modular courses for **QA**, **DILR**, and **VARC**.
- Timestamped video segments synchronized with practice quizzes.
- AI Video RAG and instant doubt solver chat panel.

### 6. B-School & IIM Call Predictor
- Algorithmically predicts composite scores and shortlist probabilities for IIM Ahmedabad, Bangalore, Calcutta, Lucknow, Kozhikode, Indore, and top non-IIMs (FMS, XLRI, SPJIMR).
- Factors in 10th, 12th, Graduation scores, academic diversity, and projected mock percentiles.

---

## 🛠 Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.3.4](https://nextjs.org/) | App Router, Server Components, Turbopack Bundler |
| **Library** | [React 19.2.8](https://react.dev/) | Client & Server Components, Hooks, Context API |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Strict type checking, interface contracts |
| **Database** | [PostgreSQL](https://www.postgresql.org/) & `pg` | Connection pooling with self-healing pooler support |
| **Auth & Cloud** | [Supabase](https://supabase.com/) | Authentication, Row-Level Security, Managed Database |
| **Styling** | CSS Modules | Light blue & white theme, responsive flex/grid layouts |
| **Charts** | [Recharts 3.10.1](https://recharts.org/) | Study performance charts, bar charts, circular progress |
| **Icons** | Clean Inline SVGs | Zero external icon bundle bloat; fast rendering |

---

## 📂 Repository & File Structure

```text
TechnoCat/
├── public/                          # Static assets (logos, illustrations, mockups)
│   ├── logo.jpg                     # Brand logo
│   └── ...
├── src/
│   ├── app/                         # Next.js App Router (Pages & API Handlers)
│   │   ├── layout.tsx               # Root application layout with AuthProvider
│   │   ├── page.tsx                 # High-conversion landing page
│   │   ├── globals.css              # Global tokens, color variables, typography
│   │   ├── analytics/               # Performance analytics & score diagnostics
│   │   │   ├── page.tsx
│   │   │   └── analytics.module.css
│   │   ├── browse/                  # Past year papers (PYQs) & full mock catalog
│   │   │   ├── page.tsx
│   │   │   └── browse.module.css
│   │   ├── dashboard/               # Core student study hub & planner
│   │   │   ├── page.tsx             # Interactive dashboard with 30-day curriculum
│   │   │   └── dashboard.module.css
│   │   ├── intelligence/            # Central AI Intelligence Hub
│   │   │   ├── page.tsx             # Hero, Readiness Meter, Improvement Loop
│   │   │   ├── intelligence.module.css
│   │   │   ├── ai-analysis/         # Detailed AI mock analysis view
│   │   │   ├── b-school-predictor/  # Detailed IIM & B-school predictor tool
│   │   │   ├── community/           # Aspirant discussion group
│   │   │   └── error-tracking/      # Mistake pattern diagnosis
│   │   ├── profile/edit/            # User account settings & target percentile
│   │   ├── settings/                # Preferences & notifications
│   │   ├── topics/                  # Modular topic syllabus (QA, DILR, VARC)
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx        # Dynamic topic page with video & quiz
│   │   └── api/                     # Backend Serverless API Handlers
│   │       ├── ai-analysis/         # AI diagnostic mock endpoints
│   │       ├── auth/[action]/       # Signin, signup, guest authentication
│   │       ├── chat/                # AI mentor doubt-solver integration
│   │       ├── dashboard/           # Metrics, tasks, study hours database API
│   │       ├── generate-quiz/       # Dynamic topic quiz generation
│   │       └── topics/progress/     # Video portion and quiz progress updates
│   ├── components/                  # Modular, Reusable UI Components
│   │   ├── AuthModal.tsx            # Login & registration modal with guest pass
│   │   ├── CardInfoModal.tsx        # Lightweight informational modal for features
│   │   ├── DailyStudySchedule.tsx   # Intelligent Backlog Scheduler & daily tasks
│   │   ├── StudyCalendarWidget.tsx  # Dynamic calendar with topic dots
│   │   ├── StudyPerformanceChart.tsx# Recharts bar visualizer for learning hours
│   │   ├── CatReadinessWidget.tsx   # Circular readiness score meter
│   │   ├── FeaturesSection.tsx      # Landing key features with auth guard
│   │   ├── HeroSection.tsx          # Landing hero banner with quick CTA buttons
│   │   ├── IimPredictor.tsx         # Interactive IIM call predictor form
│   │   ├── Navbar.tsx               # Global responsive navigation & drawer
│   │   ├── PostLoginNavActions.tsx  # Notification bell & user profile dropdown
│   │   ├── PricingSection.tsx       # Basic, Pro, and Premium subscription plans
│   │   ├── TwoModesSection.tsx      # Classic Mode vs Modern Mode comparative UI
│   │   ├── WhatYouGetSection.tsx    # 35 Mocks, 45 Sectionals, OMET deliverables
│   │   ├── WhyStandOutSection.tsx   # Unique value propositions & video solutions
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx          # Global authentication state, modal controls
│   ├── data/
│   │   ├── analyticsData.ts         # Mock score benchmarks and percentiles
│   │   ├── moduleQuizData.ts        # Comprehensive quiz question banks
│   │   ├── topicsData.ts            # QA, DILR, and VARC course curriculum
│   │   └── videoPortions.ts         # Video chapter timestamps and solutions
│   ├── lib/
│   │   ├── db.ts                    # Resilient PostgreSQL connection pooler
│   │   └── supabase.ts              # Supabase client initialization
│   └── services/
│       └── quizCacheService.ts      # Local/session caching for quiz states
├── package.json                     # Project scripts and dependencies
├── tsconfig.json                    # TypeScript compiler configuration
├── next.config.ts                   # Next.js runtime & bundler configuration
└── README.md                        # Documentation
```

---

## 🗺 Application Routes

| Route | Type | Description |
| :--- | :--- | :--- |
| `/` | Static | Landing page with feature showcases, pricing, and demo tools |
| `/dashboard` | Static | Student command center: Study Scheduler, Calendar, Readiness |
| `/intelligence` | Static | Central Intelligence Hub: Readiness Meter, AI Flow, Tool directory |
| `/intelligence/ai-analysis` | Static | Granular mock performance diagnostics and time-loss charts |
| `/intelligence/b-school-predictor` | Static | Profile diversity and percentile conversion calculator |
| `/intelligence/error-tracking` | Static | Automated categorization of wrong answers & conceptual traps |
| `/intelligence/community` | Static | Peer discussion forums and doubt exchanges |
| `/topics` | Static | Syllabus directory for QA, DILR, and VARC modules |
| `/topics/[id]` | Dynamic | Interactive topic player with video solutions and module tests |
| `/browse` | Static | Classic Mode catalog & previous year papers (2022–2024 slots) |
| `/analytics` | Static | Comprehensive longitudinal progress reports and accuracy trends |
| `/profile/edit` | Static | Student profile, academic history, and target colleges |
| `/settings` | Static | Platform preferences, daily reminder alerts, and study pacing |

---

## 🔌 API Architecture

All endpoints are built using Next.js Route Handlers (`src/app/api/*`):

| Endpoint | Method | Functionality |
| :--- | :--- | :--- |
| `/api/auth/[action]` | `POST` | Authenticates users (`signin`, `signup`, `guest`), manages JWT sessions |
| `/api/dashboard` | `GET` | Aggregates user metrics, weekly study hours, and active daily tasks |
| `/api/ai-analysis` | `GET`, `POST` | Fetches mock diagnostics or generates AI question insights |
| `/api/topics/progress` | `POST` | Updates completed video segments and quiz scores in PostgreSQL |
| `/api/chat` | `POST` | Dispatches student queries to the 24x7 AI Doubt Solver tutor |
| `/api/generate-quiz` | `POST` | Generates targeted practice sets for weak topics on demand |

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version `18.18.0` or higher recommended)
- `npm`, `pnpm`, or `yarn`
- A PostgreSQL database instance or [Supabase](https://supabase.com/) project

### Environment Setup
Create a `.env.local` file in the project root directory:

```env
# Database Connection (PostgreSQL Pooler)
PGHOST=aws-0-ap-southeast-1.pooler.supabase.com
PGPORT=6543
PGUSER=postgres.your-project-ref
PGPASSWORD=your-database-password
PGDATABASE=postgres

# Supabase Auth & Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Installation & Development
1. Clone the repository:
   ```bash
   git clone https://github.com/AyushmanGupta21/TechnoCAT.git
   cd TechnoCAT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Access the application in your browser:
   ```text
   http://localhost:3001
   ```

### Building for Production
Verify TypeScript compilation and produce an optimized Turbopack build:

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📄 License

This project is proprietary and confidential. Developed by the **TechnoCAT Team** for CAT aspirants. All rights reserved.
