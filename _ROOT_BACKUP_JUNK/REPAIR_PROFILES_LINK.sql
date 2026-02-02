
-- REPAIR PROFILES LINK (FORCE)
-- The error confirms 'profiles' is linked to 'public.users' (Legacy) instead of 'auth.users' (Supabase).
-- This script FIXES the database structure first, then inserts the user.

BEGIN;

-- 1. Drop the incorrect constraint (which points to the dummy 'users' table)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Create the CORRECT constraint (Pointing to auth.users)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

COMMIT; 

-- 3. NOW Insert the Profile (Schema is fixed, so this must work)
INSERT INTO public.profiles (
    id, 
    email, 
    organization_id, 
    role, 
    full_name
)
VALUES (
    '980eac8e-a581-438e-b35c-b95f51761c5d', 
    'wmelot@gmail.com', 
    '00000000-0000-0000-0000-000000000001', 
    'admin',
    'Warley Admin (Fixed)'
)
ON CONFLICT (id) DO UPDATE
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin';

-- Verification
SELECT * FROM public.profiles WHERE id = '980eac8e-a581-438e-b35c-b95f51761c5d';
