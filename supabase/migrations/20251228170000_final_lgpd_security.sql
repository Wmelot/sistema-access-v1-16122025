-- 20251228170000_final_lgpd_security.sql

-- 1. FIX CRON: Add template_id to assessment_follow_ups
ALTER TABLE public.assessment_follow_ups 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.message_templates(id);

-- 2. AUDIT: Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'LOGIN', 'VIEW_RECORD', 'EXPORT_DATA', 'UPDATE_RECORD'
    table_name TEXT,
    record_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Logs (Only Admin can view, everyone can insert via server action)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON public.system_logs 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Allow Server Actions (Service Role) to insert. authenticated users shouldn't insert directly usually, 
-- but for simplicity of client-side logging we might allow insert with 'authenticated' role?
-- Better: Only allow INSERT via Security Definer function or Service Role. 
-- For now, let's allow authenticated to INSERT their own actions? No, we want server-side logging mostly.
-- Let's leave INSERT policy empty (Service Role only) to enforce logging via reliable Server Actions.


-- 3. RLS: Restrict Clinical Records (Block Reception)
-- First drop existing policies
DROP POLICY IF EXISTS "Tenant: View Records" ON public.clinical_records;
DROP POLICY IF EXISTS "Tenant: Insert Records" ON public.clinical_records;
DROP POLICY IF EXISTS "Tenant: Update Records" ON public.clinical_records;

-- Helper to check if user is allowed (Physio or Admin)
CREATE OR REPLACE FUNCTION public.is_allowed_clinical()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'physio') 
    -- And match organization? Assuming strict tenancy is handled by the AND below
  );
$$;

-- View Policy: Must be (Admin/Physio) AND (Same Org)
CREATE POLICY "Tenant: View Records (Strict)" 
ON public.clinical_records FOR SELECT 
USING (
  public.is_allowed_clinical() 
  AND 
  exists (
    select 1 from public.patients pat
    where pat.id = public.clinical_records.patient_id
    and pat.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Insert/Update Policy: Must be (Admin/Physio)
CREATE POLICY "Tenant: Modify Records (Strict)" 
ON public.clinical_records FOR ALL
USING (
  public.is_allowed_clinical() 
  AND 
  exists (
    select 1 from public.patients pat
    where pat.id = public.clinical_records.patient_id
    and pat.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);


-- 4. IMMUTABILITY: 24h Lock
CREATE OR REPLACE FUNCTION public.prevent_clinical_update_after_24h()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow Admins to bypass? Maybe not even admins for legal reasons.
    -- But for valid corrections, maybe. Let's enforce strictly as requested.
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
            RAISE EXCEPTION 'Registro clínico bloqueado para edição após 24 horas (Lei do Prontuário). Faça um novo registro de correção.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clinical_lock_24h ON public.clinical_records;
CREATE TRIGGER trg_clinical_lock_24h
BEFORE UPDATE OR DELETE ON public.clinical_records
FOR EACH ROW
EXECUTE FUNCTION public.prevent_clinical_update_after_24h();
