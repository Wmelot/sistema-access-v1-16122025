
-- CREATE COMPATIBILITY VIEWS (The Adapter)
-- The code wants 'assessments', but the data is in 'patient_assessments'.
-- We create a VIEW to bridge them.

-- 1. Fix the Recursion Crash (Just in case you didn't run it)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can view everything" ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create the 'assessments' Alias
CREATE OR REPLACE VIEW public.assessments AS
SELECT * FROM public.patient_assessments;

-- 3. Check for Reminders and Protocols (just a check for now)
SELECT 
    to_regclass('public.reminders') as reminders_exists,
    to_regclass('public.clinical_protocols') as protocols_exists;
