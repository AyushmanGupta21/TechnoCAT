-- 0012_sessions_and_notification_state.sql

-- Session revocation: every session token carries the profile's session_version. Changing the
-- password increments it, so sessions on other devices stop being accepted.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;

-- Notification read / dismissed state, so it follows the student across devices.
CREATE TABLE IF NOT EXISTS public.notification_states (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL CHECK (char_length(notification_id) <= 200),
  read_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, notification_id)
);

ALTER TABLE public.notification_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_states FROM anon, authenticated;
