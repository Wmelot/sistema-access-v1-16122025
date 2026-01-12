-- 20260111163000_fix_rls_recursion.sql

-- 1. Create a secure function to get the current user's organization_id
-- SECURITY DEFINER allows this function to bypass RLS on profiles to read the user's own org_id
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles in same org OR Master" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 3. Create the optimized policy
-- Uses the secure function to avoid self-referencing RLS recursion
CREATE POLICY "Users can view profiles in same org OR Master"
ON public.profiles FOR SELECT
USING (
    -- Case 1: Convert User - can see own profile (Critical for getting org_id initially)
    id = auth.uid()
    OR
    -- Case 2: Org Match (using security definer function)
    organization_id = public.get_auth_user_org_id()
    OR
    -- Case 3: Master Admin (using security definer function to check if current user is master)
    (SELECT public.get_auth_user_org_id()) = '00000000-0000-0000-0000-000000000001'
);

-- Ensure Master Admin organization RLS is also robust
DROP POLICY IF EXISTS "Users can view their own organization OR Master can view all" ON public.organizations;
CREATE POLICY "Users can view their own organization OR Master can view all"
ON public.organizations FOR SELECT
USING (
    id = public.get_auth_user_org_id()
    OR
    (SELECT public.get_auth_user_org_id()) = '00000000-0000-0000-0000-000000000001'
);
