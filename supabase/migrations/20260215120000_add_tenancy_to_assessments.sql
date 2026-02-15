-- Migration to add organization_id to patient records and assessments for multi-tenancy support
-- This fixes the error: "column organization_id does not exist"

-- 1. FIX patient_assessments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_assessments' AND column_name = 'organization_id') THEN
        ALTER TABLE public.patient_assessments ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_patient_assessments_organization ON public.patient_assessments(organization_id);
    END IF;
END $$;

-- Update existing assessments to have the same organization as the patient
UPDATE public.patient_assessments pa
SET organization_id = p.organization_id
FROM public.patients p
WHERE pa.patient_id = p.id
AND pa.organization_id IS NULL;

-- 2. FIX patient_records
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_records' AND column_name = 'organization_id') THEN
        ALTER TABLE public.patient_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_patient_records_organization ON public.patient_records(organization_id);
    END IF;
END $$;

-- Update existing records to have the same organization as the patient
UPDATE public.patient_records pr
SET organization_id = p.organization_id
FROM public.patients p
WHERE pr.patient_id = p.id
AND pr.organization_id IS NULL;

-- 3. Update RLS Policies to use organization_id for better performance

-- Patient Assessments
DROP POLICY IF EXISTS "Users can view assessments from their organization" ON public.patient_assessments;
CREATE POLICY "Users can view assessments from their organization"
ON public.patient_assessments FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create assessments for patients in their organization" ON public.patient_assessments;
CREATE POLICY "Users can create assessments for patients in their organization"
ON public.patient_assessments FOR INSERT
WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Patient Records
DROP POLICY IF EXISTS "Users can view records from their organization" ON public.patient_records;
CREATE POLICY "Users can view records from their organization"
ON public.patient_records FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create records for patients in their organization" ON public.patient_records;
CREATE POLICY "Users can create records for patients in their organization"
ON public.patient_records FOR INSERT
WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
