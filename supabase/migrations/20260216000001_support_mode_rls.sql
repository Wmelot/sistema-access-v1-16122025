-- 20260216000001_support_mode_rls.sql
-- Enables support mode across the system by updating RLS policies

-- 1. Ensure columns exist on organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS support_access_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS support_access_until TIMESTAMPTZ;

-- 2. Update get_my_org_id to handle Master impersonation (not easily possible via RLS alone without current_setting)
-- Instead, we will update the individual policies to allow Master access when support mode is active.

-- 3. Update PATIENTS policies
DROP POLICY IF EXISTS "Tenant: View Patients" ON public.patients;
CREATE POLICY "Tenant: View Patients" 
ON public.patients FOR SELECT 
USING (
    organization_id = get_my_org_id() 
    OR 
    (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Master')
        AND EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = public.patients.organization_id 
            AND support_access_active = true 
            AND support_access_until > now()
        )
    )
);

-- 4. Update CLINICAL RECORDS policies
DROP POLICY IF EXISTS "Tenant: View Records" ON public.clinical_records;
CREATE POLICY "Tenant: View Records" 
ON public.clinical_records FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.patients pat
        WHERE pat.id = public.clinical_records.patient_id
        AND pat.organization_id = get_my_org_id()
    )
    OR
    (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Master')
        AND EXISTS (
            SELECT 1 FROM public.patients pat
            JOIN public.organizations org ON pat.organization_id = org.id
            WHERE pat.id = public.clinical_records.patient_id
            AND org.support_access_active = true 
            AND org.support_access_until > now()
        )
    )
);

-- 5. Update APPOINTMENTS policies
DROP POLICY IF EXISTS "Tenant: View Appointments" ON public.appointments;
CREATE POLICY "Tenant: View Appointments" 
ON public.appointments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = public.appointments.professional_id
        AND p.organization_id = get_my_org_id()
    )
    OR
    (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Master')
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.organizations org ON p.organization_id = org.id
            WHERE p.id = public.appointments.professional_id
            AND org.support_access_active = true 
            AND org.support_access_until > now()
        )
    )
);
