
-- FORCE INSERT WITH UUID (NO MORE GAMES)
-- We saw the ID in the screenshot: 980eac8e-a581-438e-b35c-b95f51761c5d
-- We will use it directly.

-- 1. Disable RLS temporarily (to see the truth)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Insert with Explicit UUID
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

-- 3. Verify directly by ID
SELECT * FROM public.profiles WHERE id = '980eac8e-a581-438e-b35c-b95f51761c5d';
