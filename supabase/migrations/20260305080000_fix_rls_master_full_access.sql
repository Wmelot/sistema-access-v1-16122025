-- Migration: fix_rls_master_full_access.sql
-- Description: Updates RLS policies to allow Master users to INSERT, UPDATE, and DELETE in any organization.

-- PATIENTS
DROP POLICY IF EXISTS "Tenant: Insert Patients" ON public.patients;
CREATE POLICY "Tenant: Insert Patients" 
ON public.patients FOR INSERT 
WITH CHECK (
    organization_id = get_my_org_id() 
    OR 
    public.is_master_user(auth.uid())
);

DROP POLICY IF EXISTS "Tenant: Update Patients" ON public.patients;
CREATE POLICY "Tenant: Update Patients" 
ON public.patients FOR UPDATE 
USING (
    organization_id = get_my_org_id() 
    OR 
    public.is_master_user(auth.uid())
);

DROP POLICY IF EXISTS "Tenant: Delete Patients" ON public.patients;
CREATE POLICY "Tenant: Delete Patients" 
ON public.patients FOR DELETE 
USING (
    organization_id = get_my_org_id() 
    OR 
    public.is_master_user(auth.uid())
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Tenant: Manage Appointments" ON public.appointments;
CREATE POLICY "Tenant: Manage Appointments" 
ON public.appointments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = public.appointments.professional_id
        AND p.organization_id = get_my_org_id()
    )
    OR
    public.is_master_user(auth.uid())
);

-- CLINICAL RECORDS
DROP POLICY IF EXISTS "Tenant: Insert Records" ON public.clinical_records;
CREATE POLICY "Tenant: Insert Records" 
ON public.clinical_records FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.patients pat
        WHERE pat.id = public.clinical_records.patient_id
        AND pat.organization_id = get_my_org_id()
    )
    OR
    public.is_master_user(auth.uid())
);

DROP POLICY IF EXISTS "Tenant: Update Records" ON public.clinical_records;
CREATE POLICY "Tenant: Update Records" 
ON public.clinical_records FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.patients pat
        WHERE pat.id = public.clinical_records.patient_id
        AND pat.organization_id = get_my_org_id()
    )
    OR
    public.is_master_user(auth.uid())
);
