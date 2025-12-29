-- 20251228000007_fix_rls_tenancy.sql

-- 1. Helper Function to get current user's organization
-- Use SECURITY DEFINER to ensure we can read the profiles table even if RLS is tight
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 1.1 Trigger to ensure organization_id exists on create
CREATE OR REPLACE FUNCTION public.handle_new_profile_org() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  IF new.organization_id IS NULL THEN
    new.organization_id := uuid_generate_v4();
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS ensure_profile_org ON public.profiles;
CREATE TRIGGER ensure_profile_org
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile_org();

-- 2. PROFILES
-- Drop existing lax policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create strict policies
-- A user can see their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- A user can see profiles of colleagues in the same organization
CREATE POLICY "Users can view colleagues" 
ON public.profiles FOR SELECT 
USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- A user can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);


-- 3. PATIENTS
-- Drop existing lax policies
DROP POLICY IF EXISTS "Auth users can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Auth users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Auth users can update patients" ON public.patients;

-- Secure Policies
CREATE POLICY "Tenant: View Patients" 
ON public.patients FOR SELECT 
USING (organization_id = get_my_org_id());

CREATE POLICY "Tenant: Insert Patients" 
ON public.patients FOR INSERT 
WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "Tenant: Update Patients" 
ON public.patients FOR UPDATE 
USING (organization_id = get_my_org_id());

CREATE POLICY "Tenant: Delete Patients" 
ON public.patients FOR DELETE 
USING (organization_id = get_my_org_id());


-- 4. APPOINTMENTS
-- Drop existing
DROP POLICY IF EXISTS "Auth users can manage appointments" ON public.appointments;

-- Secure Policies
-- Note: Appointments refer to patients AND professionals.
-- Checking organization via the linked Professional (profile) is safest.
-- OR check if the appointment itself has an organization_id? 
-- Base schema didn't seem to have organization_id on appointments, but it links to profiles.
-- Let's check if appointments has organization_id. If not, we SHOULD add it for performance, 
-- but for now we filter by: "Appt belongs to a professional in my org" OR "Appt belongs to a patient in my org".
-- Simplest is: The professional_id on the appointment must belong to my org.

CREATE POLICY "Tenant: View Appointments" 
ON public.appointments FOR SELECT 
USING (
  exists (
    select 1 from public.profiles p
    where p.id = public.appointments.professional_id
    and p.organization_id = get_my_org_id()
  )
);

CREATE POLICY "Tenant: Manage Appointments" 
ON public.appointments FOR ALL 
USING (
  exists (
    select 1 from public.profiles p
    where p.id = public.appointments.professional_id
    and p.organization_id = get_my_org_id()
  )
);


-- 5. CLINICAL RECORDS
-- Drop existing
DROP POLICY IF EXISTS "Auth users can view records" ON public.clinical_records;
DROP POLICY IF EXISTS "Auth users can insert records" ON public.clinical_records;

-- Secure Policies
-- Records link to patients. So we check if the patient belongs to my org.
CREATE POLICY "Tenant: View Records" 
ON public.clinical_records FOR SELECT 
USING (
  exists (
    select 1 from public.patients pat
    where pat.id = public.clinical_records.patient_id
    and pat.organization_id = get_my_org_id()
  )
);

CREATE POLICY "Tenant: Insert Records" 
ON public.clinical_records FOR INSERT 
WITH CHECK (
  exists (
    select 1 from public.patients pat
    where pat.id = public.clinical_records.patient_id
    and pat.organization_id = get_my_org_id()
  )
);

CREATE POLICY "Tenant: Update Records" 
ON public.clinical_records FOR UPDATE 
USING (
  exists (
    select 1 from public.patients pat
    where pat.id = public.clinical_records.patient_id
    and pat.organization_id = get_my_org_id()
  )
);
