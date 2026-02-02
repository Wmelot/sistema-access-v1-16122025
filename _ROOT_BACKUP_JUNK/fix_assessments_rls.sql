-- Fix Accessibility for Questionnaire History / Historical View
-- Run this in Supabase SQL Editor

ALTER TABLE public.patient_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Authenticated users can view assessments" ON public.patient_assessments;
DROP POLICY IF EXISTS "Authenticated users can insert assessments" ON public.patient_assessments;
DROP POLICY IF EXISTS "Authenticated users can update assessments" ON public.patient_assessments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patient_assessments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.patient_assessments;

-- Create permissive policies for Authenticated Users (All logged in staff)
CREATE POLICY "Authenticated users can view assessments"
ON public.patient_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert assessments"
ON public.patient_assessments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update assessments"
ON public.patient_assessments FOR UPDATE
TO authenticated
USING (true);

-- Also fix DELETE just in case
DROP POLICY IF EXISTS "Authenticated users can delete assessments" ON public.patient_assessments;
CREATE POLICY "Authenticated users can delete assessments"
ON public.patient_assessments FOR DELETE
TO authenticated
USING (true);
