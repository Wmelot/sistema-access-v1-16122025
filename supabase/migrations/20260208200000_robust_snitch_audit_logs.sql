-- Robust Snitch Audit System (Dedo Duro LGPD)
-- This migration ensures that every major modification in the system is logged automatically via database triggers.

-- 1. Ensure audit_logs table has all necessary columns
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name TEXT;

-- 2. Audit Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_organization_id UUID;
    v_details JSONB := '{}'::jsonb;
BEGIN
    -- Get current user ID from Supabase Auth
    v_user_id := auth.uid();
    
    -- Attempt to find organization_id
    -- Strategy: Check if the table has organization_id, otherwise get from profile
    IF (TG_OP = 'DELETE') THEN
        BEGIN
            v_organization_id := OLD.organization_id;
        EXCEPTION WHEN OTHERS THEN
            SELECT organization_id INTO v_organization_id FROM public.profiles WHERE id = v_user_id;
        END;
    ELSE
        BEGIN
            v_organization_id := NEW.organization_id;
        EXCEPTION WHEN OTHERS THEN
            SELECT organization_id INTO v_organization_id FROM public.profiles WHERE id = v_user_id;
        END;
    END IF;

    -- CALCULATE DIFF FOR UPDATE
    IF (TG_OP = 'UPDATE') THEN
        v_details := jsonb_build_object(
            'message', 'Registro atualizado',
            'changes', (
                SELECT jsonb_object_agg(key, value)
                FROM (
                    SELECT key, value
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE to_jsonb(NEW) -> key <> to_jsonb(OLD) -> key
                ) s
            )
        );
        
        INSERT INTO public.audit_logs (
            user_id, organization_id, action, table_name, resource_id, old_data, new_data, details
        ) VALUES (
            v_user_id, v_organization_id, 'UPDATE', TG_TABLE_NAME, 
            CASE WHEN TG_TABLE_NAME = 'profiles' THEN NEW.id::text ELSE (NEW.id)::text END,
            to_jsonb(OLD),
            to_jsonb(NEW),
            v_details
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (
            user_id, organization_id, action, table_name, resource_id, old_data, details
        ) VALUES (
            v_user_id, v_organization_id, 'DELETE', TG_TABLE_NAME, 
            CASE WHEN TG_TABLE_NAME = 'profiles' THEN OLD.id::text ELSE (OLD.id)::text END,
            to_jsonb(OLD),
            jsonb_build_object('message', 'Registro excluído')
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply Triggers to Critical Tables
-- Use a loop or helper if possible, but explicit is safer for migrations

-- Patients
DROP TRIGGER IF EXISTS audit_patients_trigger ON public.patients;
CREATE TRIGGER audit_patients_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Appointments
DROP TRIGGER IF EXISTS audit_appointments_trigger ON public.appointments;
CREATE TRIGGER audit_appointments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Services
DROP TRIGGER IF EXISTS audit_services_trigger ON public.services;
CREATE TRIGGER audit_services_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Invoices (Financial)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.invoices;
CREATE TRIGGER audit_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Products
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Profiles (User roles and status)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Organization Settings / Organizations
DROP TRIGGER IF EXISTS audit_organizations_trigger ON public.organizations;
CREATE TRIGGER audit_organizations_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Payment Method Fees (Crucial for financial auditing)
DROP TRIGGER IF EXISTS audit_payment_method_fees_trigger ON public.payment_method_fees;
CREATE TRIGGER audit_payment_method_fees_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payment_method_fees
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();


-- 4. Update Policies for Multi-Tenancy and Master Role
DROP POLICY IF EXISTS "Admins can view logs" ON public.audit_logs;

CREATE POLICY "Axiom Master can view all logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name = 'Master'
        )
    );

CREATE POLICY "Clinic Admins can view their own logs"
    ON public.audit_logs FOR SELECT
    USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
             SELECT 1 FROM public.profiles p
             JOIN public.roles r ON p.role_id = r.id
             WHERE p.id = auth.uid() AND r.name = 'Administrador'
        )
    );

-- 5. Helper Function for Axiom Master Trends (Anonymized)
CREATE OR REPLACE FUNCTION public.get_system_growth_stats()
RETURNS TABLE (
    org_name TEXT,
    org_slug TEXT,
    patient_count BIGINT,
    appointment_count BIGINT,
    invoice_total NUMERIC
) AS $$
BEGIN
    -- Check if user is Master
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name = 'Master'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Somente Master pode ver estatísticas globais.';
    END IF;

    RETURN QUERY
    SELECT 
        o.name as org_name,
        o.slug as org_slug,
        (SELECT COUNT(*) FROM public.patients WHERE organization_id = o.id) as patient_count,
        (SELECT COUNT(*) FROM public.appointments WHERE organization_id = o.id) as appointment_count,
        (SELECT COALESCE(SUM(total), 0) FROM public.invoices WHERE organization_id = o.id AND status = 'paid') as invoice_total
    FROM public.organizations o;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
