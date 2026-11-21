-- 0006_hash_plaintext_passwords.sql
-- Early accounts stored passwords in plain text. Hash every remaining non-bcrypt value
-- in place with bcrypt (cost 12) via pgcrypto; the app's bcryptjs verifies these $2a$
-- hashes, so users keep their current passwords. After this, the app no longer accepts
-- plaintext comparisons at all.
--
-- pgcrypto lives in the `extensions` schema on Supabase (public on plain Postgres).
SET LOCAL search_path = public, extensions;

UPDATE public.profiles
SET password_hash = crypt(password_hash, gen_salt('bf', 12))
WHERE password_hash !~ '^\$2[aby]\$';
