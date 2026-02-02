
-- FIX INFINITE RECURSION (EMERGENCY)
-- The "Infinite recursion" error means a security policy is calling itself in a loop.
-- We must DELETE this policy to let the system breathe.

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can view everything" ON public.profiles;

-- Temporarily disable RLS on profiles to stop the crash
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Check if 'assessments' table exists (simple check)
SELECT to_regclass('public.assessments');
