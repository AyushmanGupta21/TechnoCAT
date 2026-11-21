-- 0007_rate_limits.sql
-- Shared fixed-window rate-limit counters (login, signup, password change, AI endpoints).
-- Stored in Postgres so limits hold across all serverless instances, not per process.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL,
  reset_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON public.rate_limits (reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
