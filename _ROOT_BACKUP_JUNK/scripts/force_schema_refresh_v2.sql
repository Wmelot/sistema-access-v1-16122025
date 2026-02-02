-- force_schema_refresh_v2.sql

-- 1. Force Refresh for Consent Tokens
ALTER TABLE public.consent_tokens ADD COLUMN IF NOT EXISTS _refresh_placeholder text;
ALTER TABLE public.consent_tokens DROP COLUMN IF EXISTS _refresh_placeholder;

-- 2. Force Refresh for Patients (for status column)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS _refresh_placeholder text;
ALTER TABLE public.patients DROP COLUMN IF EXISTS _refresh_placeholder;

-- 3. Force Refresh for Follow-ups
ALTER TABLE public.assessment_follow_ups ADD COLUMN IF NOT EXISTS _refresh_placeholder text;
ALTER TABLE public.assessment_follow_ups DROP COLUMN IF EXISTS _refresh_placeholder;

-- 4. Send the signal explicitly
NOTIFY pgrst, 'reload schema';

-- 5. Debug: Check Message Logs for today to see if anything was attempted
SELECT * FROM public.message_logs 
WHERE created_at > CURRENT_DATE 
ORDER BY created_at DESC;
