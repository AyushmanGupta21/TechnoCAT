<div align="center">


# 🎓 TechnoCAT — AI-Powered CAT Exam Preparation Platform

**India's most advanced, intelligent testing and analytics ecosystem designed specifically for serious CAT & OMET aspirants.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg--8.23-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

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
- [Repository Structure](#-repository-structure)
- [API Overview](#-api-overview)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Database changes](#database-changes)
  - [Production build](#production-build)
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
| **Framework** | [Next.js 16.3.4](https://nextjs.org/) | App Router, Route Handlers, Server Functions, Turbopack |
| **Library** | [React 19.2.8](https://react.dev/) | Client components, hooks, Context API |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Strict type checking |
| **Database** | [Supabase](https://supabase.com/) Postgres via `pg` | Server-side connection pool (transaction pooler); RLS locks the public Data API |
| **Auth** | Custom (bcrypt + signed session cookie) | `src/lib/auth/session.ts`, HMAC-signed `technocat_session` cookie, rate-limited login |
| **AI** | NVIDIA NIM | Lesson chat, AI Mentor, Speak & Assess feedback (with local fallbacks) |
| **Styling** | CSS Modules | Co-located with each page/component |
| **Charts** | [Recharts 3](https://recharts.org/) | Study performance and analytics charts |

---

## 📂 Repository Structure

```text
iQuanta-CAT-Mock/
├── db/
│   └── migrations/          # Versioned SQL schema (NNNN_name.sql), applied by scripts/migrate.mjs
├── scripts/
│   ├── migrate.mjs          # npm run db:migrate / db:status
│   ├── db-backup.mjs        # npm run db:backup  → backups/<timestamp>/*.json (git-ignored)
│   ├── db-introspect.mjs    # npm run db:introspect → regenerates the 0001 baseline from a live DB
│   └── lib/db-env.mjs       # shared env loading + connection config for scripts
├── public/
│   ├── brand/               # Official TechnoCAT logo, emblem and original artwork
│   ├── community/           # Community page illustrations
│   └── pyq/                 # CAT previous-year-paper assets
├── src/
│   ├── app/                 # App Router pages and API route handlers
│   │   ├── api/             # Backend endpoints (see API table below)
│   │   ├── dashboard/  analytics/  browse/  topics/  mock-viva-prep/
│   │   ├── intelligence/    # Intelligence Hub + ai-analysis, error-tracking, b-school-predictor,
│   │   │                    #   learning-community (server actions in actions.ts)
│   │   ├── profile/edit/  settings/
│   │   ├── icon.png  apple-icon.png   # favicon / app icon (Techno India Group emblem)
│   │   └── layout.tsx  page.tsx  globals.css
│   ├── components/          # Reusable UI (BrandLogo, Navbar, Footer, AuthModal, widgets, pyq/…)
│   ├── context/             # AuthContext (client session state + route guard)
│   ├── data/                # Static curriculum, question banks, PYQ data
│   ├── lib/
│   │   ├── auth/            # session.ts (signed cookies), rateLimit.ts
│   │   ├── db.ts            # pg pool + data-access helpers
│   │   ├── demo.ts          # DEMO_EMAIL / isDemoEmail(): the showcase account
│   │   └── …                # communityModeration.ts, nameUtils.ts
│   └── services/            # Client-side services (notifications, quiz cache)
├── .env.example             # Every environment variable the app needs
└── AGENTS.md                # Notes for AI coding agents (Next.js 16 specifics)
```

### The demo account
`student@technocat.edu` is a **showcase account**: it intentionally displays prefilled sample data so the
product can be demonstrated without weeks of real usage. Every other account only ever sees data derived
from its own activity. All demo checks go through `isDemoEmail()` in `src/lib/demo.ts`.

---

## 🔌 API Overview

All endpoints are Next.js Route Handlers under `src/app/api/*`. Every endpoint except login/signup
requires a valid session cookie and returns `401` otherwise.

| Endpoint | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/auth/[action]` | `POST` login, signup, logout, change-password, delete-account · `GET` me | Accounts and sessions |
| `/api/profile` | `GET`, `POST` | Profile details and preferences |
| `/api/dashboard` | `GET`, `POST`, `PATCH` | Dashboard aggregate; create / toggle study tasks |
| `/api/topics/enroll`, `/api/topics/progress` | `POST` · `GET`, `POST` | Topic enrollment and lesson progress |
| `/api/pyq/attempts` | `GET`, `POST`, `PATCH` | Previous-year-paper attempts and section locks |
| `/api/intelligence/*` | various | 7-day challenge, analysis views, error tracking, AI Mentor |
| `/api/ai-analysis` | `GET` | Mock analysis |
| `/api/chat` | `POST` | Lesson assistant |
| `/api/mock-viva` | `POST` | Speak & Assess answer feedback |

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ and npm
- Access to the Supabase project (or any PostgreSQL 15+ database)

### Setup
```bash
git clone https://github.com/AyushmanGupta21/TechnoCAT.git
cd TechnoCAT
npm install
cp .env.example .env.local   # then fill in the values (ask a maintainer for the secrets)
npm run dev                  # http://localhost:3001
```

`.env.local` needs exactly these variables (see `.env.example`):
`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `JWT_SECRET`, `NVIDIA_API_KEY`.
Never commit `.env.local` or share it through public channels.

### Database changes
Schema changes are made **only** through migrations:
```bash
npm run db:backup     # always snapshot first
# add db/migrations/NNNN_description.sql (next number, never edit an applied file)
npm run db:migrate    # applies pending migrations, each in its own transaction
npm run db:status     # shows applied / pending migrations
```
New tables must enable Row Level Security (see `0004_enable_rls_lockdown.sql`).

### End-to-end tests
With the server running (`npm run build && npm run start`), run `npm run test:e2e`. It creates throwaway
accounts against the configured database, checks recording, grading, metrics and the quiz generator, and deletes them.

### Publishing live classes & notices
`npm run announcements -- add-class --title "…" --starts "YYYY-MM-DD HH:MM" [--section QA] [--link https://…]`,
`add-notice`, `list`, `remove <id>` (times are IST). See `scripts/announcements.mjs`.

### Production build
```bash
npm run build && npm run start
```
Deployment (Vercel) needs the same seven environment variables, with its own `JWT_SECRET`.

---

## 📄 License

This project is proprietary and confidential. Developed by the **TechnoCAT Team** for CAT aspirants. All rights reserved.
