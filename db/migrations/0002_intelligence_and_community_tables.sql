-- 0002_intelligence_and_community_tables.sql
-- Tables that used to be created at request time (CREATE TABLE IF NOT EXISTS inside route
-- handlers / server actions). Definitions match what already exists in the live database,
-- so this is a no-op there apart from the new columns and indexes below.

-- ── Intelligence Hub: 7-day challenge ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analysis_views (
  id        SERIAL PRIMARY KEY,
  user_id   UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS analysis_views_user_viewed_idx ON public.analysis_views (user_id, viewed_at);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  user_id              UUID PRIMARY KEY,
  challenge_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Learning community ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id            TEXT PRIMARY KEY,
  author_id     TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_role   TEXT DEFAULT 'CAT 2026 Aspirant',
  author_avatar TEXT,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT NOT NULL,
  image_url     TEXT,
  upvotes_count INTEGER DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id                TEXT PRIMARY KEY,
  post_id           TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  parent_comment_id TEXT,
  author_id         TEXT NOT NULL,
  author_name       TEXT NOT NULL,
  author_role       TEXT DEFAULT 'CAT 2026 Aspirant',
  author_avatar     TEXT,
  content           TEXT NOT NULL,
  upvotes_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_post_upvotes (
  post_id    TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_saved_posts (
  post_id    TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_comment_upvotes (
  comment_id TEXT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_reports (
  id         SERIAL PRIMARY KEY,
  post_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  reason     TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_moderation_logs (
  id                SERIAL PRIMARY KEY,
  post_id           TEXT,
  author_id         TEXT,
  reason            TEXT NOT NULL,
  violating_snippet TEXT,
  action_taken      TEXT DEFAULT 'rejected_at_submit',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Showcase content flag: seeded example discussions are only visible to the demo account.
ALTER TABLE public.community_posts    ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.community_comments ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE public.community_posts    SET is_seed = TRUE WHERE id LIKE 'post-ref-%';
UPDATE public.community_comments SET is_seed = TRUE WHERE id LIKE 'cmt-ref-%';

CREATE INDEX IF NOT EXISTS community_posts_created_idx      ON public.community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS community_comments_post_idx      ON public.community_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS community_post_upvotes_user_idx  ON public.community_post_upvotes (user_id);
CREATE INDEX IF NOT EXISTS community_saved_posts_user_idx   ON public.community_saved_posts (user_id);
CREATE INDEX IF NOT EXISTS community_comment_upvotes_user_idx ON public.community_comment_upvotes (user_id);
CREATE INDEX IF NOT EXISTS community_reports_post_idx       ON public.community_reports (post_id);
