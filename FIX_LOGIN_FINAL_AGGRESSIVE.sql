
-- NUCLEAR FIX FOR LOGIN (Aggressive Clean-up)

BEGIN;

-- 1. DROP ALL TRIGGERS ON auth.users that might be broken
-- We wrap in dynamic SQL to avoid errors if they don't exist
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || t || ' ON auth.users';
    END LOOP;
END $$;

-- 2. ENSURE EXTENSIONS EXIST (In public AND extensions schema to be safe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "public";

-- 3. RESET PERMISSIONS (The most common cause of "Database error querying schema")
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. FORCE SEARCH PATH
ALTER ROLE postgres SET search_path = "$user", public, auth, extensions;
ALTER ROLE service_role SET search_path = "$user", public, auth, extensions;
ALTER ROLE authenticated SET search_path = "$user", public, auth, extensions;
ALTER ROLE anon SET search_path = "$user", public, auth, extensions;

-- 5. RELOAD CONFIG
NOTIFY pgrst, 'reload config';

COMMIT;
