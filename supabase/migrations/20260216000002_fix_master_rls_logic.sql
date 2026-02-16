-- 20260216000002_fix_master_rls_logic.sql
-- Fixes Master access logic to use role_id join and hardcoded admin emails

-- 1. Helper Function to check if a user is Master
CREATE OR REPLACE FUNCTION public.is_master_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u_email text;
BEGIN
    SELECT email INTO u_email FROM auth.users WHERE id = user_id;
    
    RETURN (
        u_email IN ('wmelot@gmail.com', 'warley@gmail.com', 'accessfisio@gmail.com', 'wmelot@icloud.com')
        OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = user_id AND r.name = 'Master'
        )
    );
END;
$$;

-- 2. Update PATIENTS policies
DROP POLICY IF EXISTS "Tenant: View Patients" ON public.patients;
CREATE POLICY "Tenant: View Patients" 
ON public.patients FOR SELECT 
USING (
    organization_id = get_my_org_id() 
    OR 
    public.is_master_user(auth.uid())
);

-- 3. Update APPOINTMENTS policies
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
    public.is_master_user(auth.uid())
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
    public.is_master_user(auth.uid())
);

-- 5. Update ORGANIZATIONS policies
-- Allow Masters to see all organizations (needed for settings page)
DROP POLICY IF EXISTS "Enable support access for Master users and organization members" ON public.organizations;
CREATE POLICY "Allow members and Masters to view organizations"
ON public.organizations FOR SELECT
USING (
    (auth.uid() IN (SELECT id FROM profiles WHERE organization_id = organizations.id))
    OR
    public.is_master_user(auth.uid())
);
