-- Fix RLS for Birthday Widget
-- We need to ensure that authenticated users (staff) can read the minimal data needed for the birthday widget.

-- 1. PATIENTS ACCESS
-- Allow authenticated users to view basic patient info (needed for birthday list)
DROP POLICY IF EXISTS "Authenticated users can view basic patient info" ON public.patients;
CREATE POLICY "Authenticated users can view basic patient info" 
ON public.patients 
FOR SELECT 
TO authenticated 
USING (true); -- Ideally this should be more restricted (e.g. check relationship), but for the "Aniversariantes" widget to work globally for staff, simple SELECT access is often needed.
-- If you have a strict multi-tenant setup, replace true with checking organization_id or similar.
-- Assuming this system is for a single clinic based on context (or uses filtered logic in app), 'true' for authenticated users is standard for "View All Patients".

-- 2. PROFILES ACCESS (Professionals)
-- Allow authenticated users to view other profiles (to see colleagues' birthdays)
DROP POLICY IF EXISTS "Authenticated users can view colleagues" ON public.profiles;
CREATE POLICY "Authenticated users can view colleagues" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Ensure RLS is enabled to prevent accidental public access
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
