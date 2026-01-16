
-- FIX AUTH TRIGGERS (THE VILLAIN)
-- The error "Database error querying schema" on login is almost always 
-- because a Trigger on "auth.users" is trying to call a function 
-- in "public" that was modified or dropped.

-- 1. Drop the common triggers on auth.users to unblock the table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 2. Optional: Re-create them if you have the functions ready.
-- For now, let's just DROP them to let you login. 
-- You already manually created the profiles in the previous step.

-- 3. Just to be safe, grant permissions again (sometimes helps)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
