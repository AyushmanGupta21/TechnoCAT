-- 0010_proctoring_events.sql
-- Webcam-proctoring event log for exams run in the quiz modal (PYQ, module quiz, grand quiz).
-- Detection runs on the student's device; only event labels are stored, never video/images.
-- attempt_key is a client-generated UUID per exam session.

CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_key  TEXT NOT NULL,
  kind         TEXT NOT NULL,
  event        TEXT NOT NULL CHECK (event IN (
                 'no_face', 'multiple_faces', 'phone', 'looking_away', 'camera_off', 'proctoring_declined'
               )),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS proctoring_events_user_created_idx
  ON public.proctoring_events (user_id, created_at);

ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.proctoring_events FROM anon, authenticated;
