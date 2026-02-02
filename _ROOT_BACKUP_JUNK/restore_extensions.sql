
-- RESTORE EXTENSIONS & PERMISSIONS
-- Ensures the "tools" needed by the schema are available and accessible.

-- 1. Create Extensions Schema
CREATE SCHEMA IF NOT EXISTS "extensions";

-- 2. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "extensions";

-- 3. Grant Permissions to Extensions
GRANT USAGE ON SCHEMA "extensions" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "extensions" TO postgres, anon, authenticated, service_role;

-- 4. Grant Permissions to Public (Again, just to be sure)
GRANT USAGE ON SCHEMA "public" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "public" TO postgres, anon, authenticated, service_role;
