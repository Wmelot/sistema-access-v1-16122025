
-- FIX FK REAL (Schema Surgery)
-- The table 'profiles' is linked to the wrong 'users' table.
-- We will surgically remove that link and point it to the correct 'auth.users' table.

-- 1. Drop the bad constraint (Ignore errors if missing)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Create the correct constraint (Pointing to auth.users)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Now Insert the Profile (Should work now)
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
    'Warley Admin (Fixed)'
)
ON CONFLICT (id) DO UPDATE
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin';

-- 4. Verify
SELECT * FROM public.profiles WHERE id = '980eac8e-a581-438e-b35c-b95f51761c5d';
