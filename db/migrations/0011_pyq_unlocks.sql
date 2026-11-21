-- 0011_pyq_unlocks.sql
-- PYQ section locking is enforced on the server. A section locks after 3 attempts made since
-- the section was last unlocked, and only when the student has weak-area lessons to revise.
-- Each unlock is recorded here so the next 3-attempt cycle starts from that moment.

CREATE TABLE IF NOT EXISTS public.pyq_unlocks (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section     TEXT NOT NULL CHECK (section IN ('VARC', 'DILR', 'QUANT')),
  reason      TEXT NOT NULL CHECK (reason IN ('checklist_completed', 'no_checklist', 'migration')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pyq_unlocks_user_section_idx ON public.pyq_unlocks (user_id, section, unlocked_at DESC);

-- Release every section that is currently locked without any checklist to complete
-- (the old client-side rule could lock a section with an empty checklist forever).
INSERT INTO public.pyq_unlocks (user_id, section, reason)
SELECT DISTINCT a.user_id, UPPER(a.section), 'migration'
FROM public.pyq_attempts a
WHERE a.is_locked
  AND UPPER(a.section) IN ('VARC', 'DILR', 'QUANT')
  AND NOT EXISTS (
    SELECT 1 FROM public.pyq_attempts b
    WHERE b.user_id = a.user_id AND UPPER(b.section) = UPPER(a.section)
      AND b.is_locked AND jsonb_array_length(COALESCE(b.weak_areas, '[]'::jsonb)) > 0
  );
UPDATE public.pyq_attempts a SET is_locked = FALSE
WHERE a.is_locked AND NOT EXISTS (
  SELECT 1 FROM public.pyq_attempts b
  WHERE b.user_id = a.user_id AND UPPER(b.section) = UPPER(a.section)
    AND b.is_locked AND jsonb_array_length(COALESCE(b.weak_areas, '[]'::jsonb)) > 0
);

ALTER TABLE public.pyq_unlocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pyq_unlocks FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.pyq_unlocks_id_seq FROM anon, authenticated;
