-- 20260111151500_normalize_schema.sql

-- 1. Add type to form_templates
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

-- Backfill types based on Title
UPDATE public.form_templates
SET type = 'evolution'
WHERE title ILIKE '%evolução%';

UPDATE public.form_templates
SET type = 'physical_assessment'
WHERE title ILIKE '%avaliação%' OR title ILIKE '%physical%';

UPDATE public.form_templates
SET type = 'questionnaire'
WHERE title ILIKE '%questionário%';

-- 2. Ensure Appointments Columns
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS injury_region TEXT; -- Mentioned in previous task

-- 3. Ensure Patients Columns
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN DEFAULT FALSE;

-- 4. RLS: Update Organization View Policy for Master
-- Ensure Master can view everything in switched orgs
DROP POLICY IF EXISTS "Master can view all organizations" ON public.organizations;
CREATE POLICY "Master can view all organizations"
ON public.organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (
            role = 'admin' OR 
            email = 'accessfisio@gmail.com' -- Safety net
        )
    )
);

-- 5. RLS: Broad Access for Master on Data Tables
-- If I am Master Admin, I should see data for ANY organization I am currently switched to.
-- The standard policy "Users can view their own organization" usually checks:
-- organization_id = (select organization_id from profiles where id = auth.uid())
-- Since switchOrganization UPDATES the profile, this standard policy SHOULD work automatically.
-- However, we verify if 'profiles' has RLS that allows reading own profile.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view profiles in same org OR Master"
ON public.profiles FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR
    EXISTS ( -- Master User can view ALL profiles
        SELECT 1 FROM public.profiles me
        WHERE me.id = auth.uid()
        AND me.email = 'accessfisio@gmail.com'
    )
);
