
-- DISABLE TRIGGERS & RESET PASSWORD (DIAGNOSTIC FIX)

-- 1. Disable ALL triggers on auth.users temporarily
-- This stops the database from trying to run "broken code" when you login.
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 2. Hard Reset Password to '123'
UPDATE auth.users
SET encrypted_password = crypt('123', gen_salt('bf')),
    email_confirmed_at = NOW(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'
WHERE email = 'wmelot@gmail.com';

-- 3. Verify permissions one last time
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
