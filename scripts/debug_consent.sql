-- debug_consent_v2.sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'consent_tokens';

SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'consent_tokens';

-- Try a dummy insert
DO $$
DECLARE
    pid uuid;
    new_token text;
BEGIN
    SELECT id INTO pid FROM public.patients LIMIT 1;
    IF pid IS NOT NULL THEN
        new_token := 'debug-token-' || gen_random_uuid();
        INSERT INTO public.consent_tokens (patient_id, token) 
        VALUES (pid, new_token);
        RAISE NOTICE 'Insert successful for token: %', new_token;
    ELSE
        RAISE NOTICE 'No patient found to test insert';
    END IF;
END $$;
