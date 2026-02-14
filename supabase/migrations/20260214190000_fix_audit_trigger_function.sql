-- Fix: Audit trigger function had INSERT and DELETE branches swapped.
-- INSERT was logging as 'DELETE' with OLD data (which doesn't exist on INSERT, causing errors).
-- DELETE was missing entirely.

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

    -- UPDATE: Log changes (diff between OLD and NEW)
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
            (NEW.id)::text,
            to_jsonb(OLD),
            to_jsonb(NEW),
            v_details
        );
        RETURN NEW;

    -- INSERT: Log new record creation
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (
            user_id, organization_id, action, table_name, resource_id, new_data, details
        ) VALUES (
            v_user_id, v_organization_id, 'INSERT', TG_TABLE_NAME, 
            (NEW.id)::text,
            to_jsonb(NEW),
            jsonb_build_object('message', 'Novo registro criado')
        );
        RETURN NEW;

    -- DELETE: Log record removal
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_id, organization_id, action, table_name, resource_id, old_data, details
        ) VALUES (
            v_user_id, v_organization_id, 'DELETE', TG_TABLE_NAME, 
            (OLD.id)::text,
            to_jsonb(OLD),
            jsonb_build_object('message', 'Registro excluído')
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure INSERT policy exists for the trigger (runs as SECURITY DEFINER, but belt-and-suspenders)
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.audit_logs;
CREATE POLICY "Anyone can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
