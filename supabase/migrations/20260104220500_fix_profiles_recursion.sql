-- Fix Infinite Recursion in Profiles Policy
-- The previous policy used a direct subquery which triggered RLS recursively.
-- We must use the SECURITY DEFINER function get_my_org_id() to bypass RLS for the lookup.

DROP POLICY IF EXISTS "Users can view colleagues" ON public.profiles;

CREATE POLICY "Users can view colleagues" 
ON public.profiles FOR SELECT 
USING (organization_id = get_my_org_id());

-- Reload Schema
NOTIFY pgrst, 'reload config';
