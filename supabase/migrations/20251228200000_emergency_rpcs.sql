-- 20251228200000_emergency_rpcs.sql

-- 1. RPC for Creating Consent Token
CREATE OR REPLACE FUNCTION public.create_consent_token_rpc(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
    t_created_at TIMESTAMPTZ;
BEGIN
    new_token := uuid_generate_v4()::text;
    
    INSERT INTO public.consent_tokens (patient_id, token)
    VALUES (p_patient_id, new_token)
    RETURNING id, created_at INTO new_id, t_created_at;

    RETURN jsonb_build_object(
        'success', true,
        'token', new_token,
        'id', new_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_consent_token_rpc TO authenticated;

-- 2. RPC for Toggling Patient Status (Archiving)
CREATE OR REPLACE FUNCTION public.toggle_patient_status_rpc(p_patient_id UUID, p_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.patients
    SET status = p_status
    WHERE id = p_patient_id;

    IF NOT FOUND THEN
         RETURN jsonb_build_object('success', false, 'error', 'Patient not found');
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_patient_status_rpc TO authenticated;

-- 3. Notify Schema Reload (Just in case these functions need to be picked up)
NOTIFY pgrst, 'reload schema';
