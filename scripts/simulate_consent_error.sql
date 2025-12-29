-- simulate_consent_error.sql
DO $$
DECLARE
    pid uuid;
    new_id uuid;
BEGIN
    SELECT id INTO pid FROM public.patients LIMIT 1;
    
    INSERT INTO public.consent_tokens (patient_id, token)
    VALUES (pid, 'simulated-token-1')
    RETURNING id INTO new_id;

    RAISE NOTICE 'Created token: %', new_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating token: %', SQLERRM;
END $$;
