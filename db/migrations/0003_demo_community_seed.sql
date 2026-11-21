-- 0003_demo_community_seed.sql
-- Example discussions shown ONLY to the demo showcase account (is_seed = TRUE).
-- Real accounts never see these rows; see getCommunityDataAction().

INSERT INTO public.community_posts (id, author_id, author_name, author_role, author_avatar, title, content, category, upvotes_count, created_at, is_seed) VALUES
  ('post-ref-1', 'user-aditi', 'aditi_sharma', 'CAT 2026 Aspirant • Target: IIM-A', NULL, 'How to approach DILR sets effectively?', 'I am able to solve individual questions but struggle with selecting the right set in mocks.
How do you all decide which set to attempt first? Any tips or strategies would be helpful!', 'Doubt Solving', 12, NOW() - INTERVAL '120 minutes', TRUE),
  ('post-ref-2', 'user-rahul', 'rahul_k', 'CAT 2026 • 99%ile Target', NULL, 'My 3-month CAT preparation plan (Feedback Needed)', 'Sharing my plan for the next 3 months. Please suggest what I can improve or add.
Is 2 mocks per week enough at this stage?', 'CAT Strategy', 25, NOW() - INTERVAL '300 minutes', TRUE),
  ('post-ref-3', 'user-megha', 'megha_17', 'VARC Enthusiast • Target: FMS', NULL, 'Best resources for VARC RC practice?', 'I am looking for good RC practice sources (PYQs, sectional tests, or any other platform).
Which resources helped you the most? Please share your suggestions.', 'Study Resources', 18, NOW() - INTERVAL '1440 minutes', TRUE),
  ('post-ref-4', 'user-priya', 'priya_singh', '99.4%ile Mentor • Top Contributor', NULL, 'Mock Analysis Checklist: Converting silly errors into +15 marks', 'Most aspirants spend 2 hours taking a mock and only 30 minutes analyzing it. Flip that ratio! Track every single mistake across 4 buckets: Calculation Slip, Concept Gap, Misread Constraint, and Ego Time-Trap.', 'Mocks & Analysis', 31, NOW() - INTERVAL '2100 minutes', TRUE),
  ('post-ref-5', 'user-aniket', 'aniket_verma', 'Working Professional • 24m Work-Ex', NULL, 'Staying consistent with a full-time job: My 90-day streak reflection', 'Completed 90 consecutive days of solving 2 DILR sets and 15 QA questions before 8:30 AM. Even on hectic sprint days, showing up for 90 minutes keeps momentum alive!', 'Motivation & Journey', 22, NOW() - INTERVAL '2800 minutes', TRUE),
  ('post-ref-6', 'user-shruti', 'shruti_agarwal', 'Target: SPJIMR & IIM Mumbai', NULL, 'Profile-based calls vs High CAT Percentile: Non-Engineer perspective', 'For candidates with 8/8/8 academics, how should we prioritize profile-cum-score institutes like SPJIMR and MDI Gurgaon alongside BLACKI?', 'College Discussions', 14, NOW() - INTERVAL '3400 minutes', TRUE)
ON CONFLICT (id) DO UPDATE SET is_seed = TRUE;

INSERT INTO public.community_comments (id, post_id, parent_comment_id, author_id, author_name, author_role, content, upvotes_count, created_at, is_seed) VALUES
  ('cmt-ref-1', 'post-ref-1', NULL, 'user-priya', 'priya_singh', '99.4%ile Mentor', 'Spend the first 5 minutes scanning all 4 sets without picking up the pen. Look for sets with direct tabular data or <= 5 entities first, and avoid games/tournaments with conditional branching in Round 1.', 9, NOW() - INTERVAL '95 minutes', TRUE),
  ('cmt-ref-2', 'post-ref-1', 'cmt-ref-1', 'user-aditi', 'aditi_sharma', 'CAT 2026 Aspirant', 'Thank you Priya! That 5-minute no-pen scanning rule makes a lot of sense—I usually jump straight into Set 1.', 4, NOW() - INTERVAL '80 minutes', TRUE),
  ('cmt-ref-3', 'post-ref-2', NULL, 'user-aniket', 'aniket_verma', 'Working Professional', '2 full mocks per week + 3 sectional tests is the sweet spot right now. Make sure you spend at least 3 hours analyzing each mock before taking the next one!', 7, NOW() - INTERVAL '240 minutes', TRUE),
  ('cmt-ref-4', 'post-ref-3', NULL, 'user-karthik', 'karthik_r', 'CAT 2026 Aspirant', 'CAT 2017–2024 Official PYQ RC passages are unmatched for understanding actual CAT inference traps. Pair them with 1 daily Aeon Philosophy/Sociology article.', 6, NOW() - INTERVAL '1100 minutes', TRUE)
ON CONFLICT (id) DO UPDATE SET is_seed = TRUE;
