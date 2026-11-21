-- 0008_activity_tracking.sql
-- Phase 1: record what students actually do, so every metric can be computed from real data.
--   quiz_attempts / quiz_responses : every quiz of every kind, with per-question answers
--   study_activity                 : real time spent studying, per day and activity
--   points_ledger                  : single, idempotent source of truth for points / XP
--   study_tasks.template_code      : curriculum tasks scheduled relative to enrollment

-- ── Quiz attempts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('pyq', 'module_quiz', 'grand_quiz', 'lesson_practice', 'topic_drill')),
  topic_id         TEXT,             -- e.g. 'qa-quantitative-ability'
  module_key       TEXT,             -- module title for module quizzes
  lesson_id        TEXT,             -- lesson for lesson practice
  source_ref       TEXT,             -- e.g. 'CAT-2024-Slot1-VARC' for a PYQ section
  section          TEXT CHECK (section IS NULL OR section IN ('VARC', 'DILR', 'QA')),
  scoring_scheme   TEXT NOT NULL DEFAULT 'standard' CHECK (scoring_scheme IN ('cat', 'standard')),
  question_count   INTEGER NOT NULL CHECK (question_count >= 0),
  attempted_count  INTEGER NOT NULL DEFAULT 0,
  correct_count    INTEGER NOT NULL DEFAULT 0,
  wrong_count      INTEGER NOT NULL DEFAULT 0,
  raw_score        NUMERIC(8,2) NOT NULL DEFAULT 0,  -- before integrity penalties
  penalty          NUMERIC(8,2) NOT NULL DEFAULT 0,  -- e.g. tab-switch strikes
  final_score      NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_score        NUMERIC(8,2) NOT NULL DEFAULT 0,
  percentage       NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed           BOOLEAN,
  strikes          INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  pyq_attempt_id   UUID REFERENCES public.pyq_attempts(id) ON DELETE SET NULL,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_time_idx  ON public.quiz_attempts (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_kind_idx  ON public.quiz_attempts (user_id, kind, topic_id, module_key);

CREATE TABLE IF NOT EXISTS public.quiz_responses (
  attempt_id            UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  position              INTEGER NOT NULL,           -- order the question was served in
  question_id           TEXT NOT NULL,
  question_type         TEXT NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'TITA')),
  section               TEXT,
  concept               TEXT,                       -- topic / concept tag when known
  recommended_lesson_id TEXT,
  selected_option       INTEGER,                    -- MCQ answer (0-based), NULL if unanswered
  tita_answer           TEXT,                       -- TITA answer as typed
  correct_option        INTEGER,
  correct_tita          TEXT,
  is_attempted          BOOLEAN NOT NULL,
  is_correct            BOOLEAN NOT NULL,
  marks                 NUMERIC(6,2) NOT NULL DEFAULT 0,
  time_spent_seconds    INTEGER,                    -- per-question time when the UI tracks it
  PRIMARY KEY (attempt_id, position)
);
CREATE INDEX IF NOT EXISTS quiz_responses_question_idx ON public.quiz_responses (question_id);

-- ── Study time ─────────────────────────────────────────────────────────────────────
-- One row per student, day (Asia/Kolkata), activity and reference; seconds accumulate.
CREATE TABLE IF NOT EXISTS public.study_activity (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('lesson', 'quiz', 'pyq', 'practice')),
  ref           TEXT NOT NULL DEFAULT '',          -- lesson id / quiz source
  topic_id      TEXT,
  seconds       INTEGER NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_date, kind, ref)
);
CREATE INDEX IF NOT EXISTS study_activity_user_date_idx ON public.study_activity (user_id, activity_date DESC);

-- ── Points ─────────────────────────────────────────────────────────────────────────
-- Every award is a row; (user, reason, ref) is unique so the same achievement can never
-- be credited twice. A user's points = SUM(points).
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points     INTEGER NOT NULL,
  reason     TEXT NOT NULL,       -- 'lesson_completed', 'module_quiz_passed', 'grand_quiz_passed', 'pyq_attempt', 'legacy_balance'
  ref        TEXT NOT NULL,       -- idempotency key, e.g. 'qa-1-1'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reason, ref)
);
CREATE INDEX IF NOT EXISTS points_ledger_user_idx ON public.points_ledger (user_id, created_at DESC);

-- Carry existing balances over so nobody's points drop when the ledger becomes the source.
INSERT INTO public.points_ledger (user_id, points, reason, ref)
SELECT user_id, SUM(points_earned)::int, 'legacy_balance', 'topic_progress'
FROM public.topic_progress
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING SUM(points_earned) > 0
ON CONFLICT (user_id, reason, ref) DO NOTHING;

-- ── Curriculum tasks ───────────────────────────────────────────────────────────────
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS template_code TEXT;
UPDATE public.study_tasks SET template_code = code WHERE template_code IS NULL AND code LIKE 'CAT-%';

-- The old calendar-based scheduler re-inserted the same template task on different dates.
-- Keep one row per (user, template): prefer a completed one, then the most recent date.
DELETE FROM public.study_tasks t
USING (
  SELECT id, ROW_NUMBER() OVER (
           PARTITION BY user_id, template_code
           ORDER BY is_completed DESC, task_date DESC, created_at DESC
         ) AS rn
  FROM public.study_tasks
  WHERE template_code IS NOT NULL
) d
WHERE t.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS study_tasks_user_template_uidx
  ON public.study_tasks (user_id, template_code) WHERE template_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS study_tasks_user_date_idx ON public.study_tasks (user_id, task_date);

-- ── Row Level Security (public Data API stays locked) ──────────────────────────────
ALTER TABLE public.quiz_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quiz_attempts, public.quiz_responses, public.study_activity, public.points_ledger FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.points_ledger_id_seq FROM anon, authenticated;
