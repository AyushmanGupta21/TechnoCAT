-- 0005_flag_legacy_seed_community.sql
-- Older versions of the community code seeded example posts/comments under invented
-- author ids (e.g. 'aspirant-meera', 'mentor-rohan') that do not belong to any real
-- account. Mark everything not written by a real profile as showcase seed content so
-- it is only visible to the demo account.

UPDATE public.community_posts p
SET is_seed = TRUE
WHERE NOT p.is_seed
  AND NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id::text = p.author_id);

UPDATE public.community_comments c
SET is_seed = TRUE
WHERE NOT c.is_seed
  AND NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id::text = c.author_id);
