-- 20251228143000_remote_consent.sql

-- 1. Table to store generated links
CREATE TABLE IF NOT EXISTS public.consent_tokens (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.profiles(id), -- Optional: Link to creating professional/org for improved tenancy
    token text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT now() + interval '7 days',
    used_at timestamptz,
    ip_address text,
    user_agent text
);

-- RLS: Only authenticated users (physios) can create tokens.
-- Anon users cannot see this table directly.
ALTER TABLE public.consent_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Physios can manage consent tokens" 
ON public.consent_tokens 
USING (auth.role() = 'authenticated');


-- 2. Secure Function for Public Page to Fetch Details
-- Returns patient name ONLY if token is valid and unused.
CREATE OR REPLACE FUNCTION public.get_consent_details(token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to bypass RLS for the anonymous patient
AS $$
DECLARE
    token_record record;
    patient_name text;
BEGIN
    -- Find valid token
    SELECT * INTO token_record
    FROM public.consent_tokens
    WHERE token = token_input
      AND used_at IS NULL
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Link inválido ou expirado.');
    END IF;

    -- Get Patient Name
    SELECT name INTO patient_name
    FROM public.patients
    WHERE id = token_record.patient_id;

    RETURN jsonb_build_object(
        'valid', true, 
        'patient_name', patient_name,
        'patient_id', token_record.patient_id
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_consent_details TO anon, authenticated;


-- 3. Secure Function to Sign (Confirm)
CREATE OR REPLACE FUNCTION public.sign_consent(token_input text, ip_input text, ua_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_record record;
BEGIN
    -- Verify again
    SELECT * INTO token_record
    FROM public.consent_tokens
    WHERE token = token_input
      AND used_at IS NULL
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Link inválido.');
    END IF;

    -- 1. Mark Token as Used
    UPDATE public.consent_tokens
    SET used_at = now(),
        ip_address = ip_input,
        user_agent = ua_input
    WHERE id = token_record.id;

    -- 2. Update Patient Consent
    UPDATE public.patients
    SET health_data_consent = TRUE
    WHERE id = token_record.patient_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.sign_consent TO anon, authenticated;
