-- Fix missing RPC for consent token generation
-- 20251229204000_fix_consent_rpc.sql

CREATE OR REPLACE FUNCTION public.create_consent_token_rpc(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token text;
    new_id uuid;
BEGIN
    -- Check if patient exists
    IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_patient_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Paciente não encontrado.');
    END IF;

    -- Generate Token (simple random hex)
    new_token := encode(gen_random_bytes(32), 'hex');

    -- Insert into tokens table
    INSERT INTO public.consent_tokens (patient_id, token)
    VALUES (p_patient_id, new_token)
    RETURNING id INTO new_id;

    RETURN jsonb_build_object('success', true, 'token', new_token);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant permission to authenticated users (staff)
GRANT EXECUTE ON FUNCTION public.create_consent_token_rpc TO authenticated;
