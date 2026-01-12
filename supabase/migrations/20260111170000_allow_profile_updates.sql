-- 20260111170000_allow_profile_updates.sql

-- Enable UPDATE for users on their own profile
-- This is required for:
-- 1. Switching Organizations (updates organization_id)
-- 2. Updating Profile Info (name, photo)

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master Admin can update any profile" ON public.profiles;

CREATE POLICY "Users can update own profile 20260111"
ON public.profiles FOR UPDATE
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);

CREATE POLICY "Master Admin can update any profile 20260111"
ON public.profiles FOR UPDATE
USING (
    (SELECT public.get_auth_user_org_id()) = '00000000-0000-0000-0000-000000000001'
);
