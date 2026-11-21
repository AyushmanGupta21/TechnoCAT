-- 0009_leaderboard_announcements_generated_questions.sql
-- Phase 4: back the remaining showcase-only features with real data.

-- ── Leaderboard privacy ────────────────────────────────────────────────────────────
-- Students appear on the points leaderboard (first name + last initial) unless they opt out.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_out BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Agenda & notices ───────────────────────────────────────────────────────────────
-- Published by staff with `npm run announcements -- …` (scripts/announcements.mjs).
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('live_class', 'notice')),
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  body        TEXT,
  section     TEXT CHECK (section IS NULL OR section IN ('VARC', 'DILR', 'QA', 'GENERAL')),
  host        TEXT,                     -- faculty name for live classes
  link_url    TEXT,                     -- join link / details page
  starts_at   TIMESTAMPTZ,              -- live class start (required for live_class)
  ends_at     TIMESTAMPTZ,
  publish_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,              -- hidden after this moment
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (kind <> 'live_class' OR starts_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS announcements_visible_idx ON public.announcements (publish_at, expires_at);

-- ── AI-generated practice questions ────────────────────────────────────────────────
-- Generated questions are stored with their answer so attempts can be graded server-side
-- (question ids are 'gen:<uuid>'); the client only ever receives the question and options.
CREATE TABLE IF NOT EXISTS public.generated_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id       TEXT NOT NULL,
  concept        TEXT,
  question       TEXT NOT NULL,
  options        JSONB NOT NULL,         -- array of 4 strings
  correct_option INTEGER NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
  explanation    TEXT,
  source         TEXT NOT NULL CHECK (source IN ('llm', 'bank')),
  model          TEXT,
  created_for    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS generated_questions_topic_idx ON public.generated_questions (topic_id, created_at DESC);

ALTER TABLE public.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.announcements, public.generated_questions FROM anon, authenticated;
