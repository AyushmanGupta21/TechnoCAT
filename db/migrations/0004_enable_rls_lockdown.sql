-- 0004_enable_rls_lockdown.sql
-- Supabase exposes every table in the public schema through its REST/GraphQL API to the
-- `anon` and `authenticated` roles (using the public publishable/anon key). With Row Level
-- Security disabled, anyone holding that public key could read and write every row,
-- including profiles (emails + password hashes).
--
-- TechnoCAT never uses the Supabase Data API: all access goes through the server-side
-- `pg` pool as the table owner, which RLS does not restrict. Enabling RLS with NO
-- policies therefore blocks the public API completely without affecting the app.
-- Tables created later must also enable RLS (see the check at the end).

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- Defence in depth: the public API roles get no table privileges at all.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
