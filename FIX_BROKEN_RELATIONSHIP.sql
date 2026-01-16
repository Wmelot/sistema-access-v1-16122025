
-- FIX BROKEN RELATIONSHIP (ROOT CAUSE FOUND)
-- The error "not present in table 'users'" confirms the Profile is linked to the WRONG table ('public.users' instead of 'auth.users').
-- We must repoint the Foreign Key to the correct Authentication table.

BEGIN;

-- 1. Remove the BAD constraint (pointing to public.users)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Add the GOOD constraint (pointing to auth.users)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Now we can finally Insert the Profile
INSERT INTO public.profiles (
    id, 
    email, 
    organization_id, 
    role, 
    full_name
)
VALUES (
    '980eac8e-a581-438e-b35c-b95f51761c5d', -- WMELO ID
    'wmelot@gmail.com', 
    '00000000-0000-0000-0000-000000000001', 
    'admin',
    'Warley Admin'
)
ON CONFLICT (id) DO UPDATE
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin';

COMMIT;

-- 4. Verify
SELECT * FROM public.profiles WHERE id = '980eac8e-a581-438e-b35c-b95f51761c5d';
