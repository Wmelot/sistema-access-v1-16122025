-- 20251228140000_lgpd_consent.sql

-- 1. Consent tracking for System Users (Profiles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.0';

-- 2. Sensitive Data Consent for Patients (Health Data)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN DEFAULT FALSE;

-- 3. Comment for documentation
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when the user accepted the Terms of Service';
COMMENT ON COLUMN public.patients.health_data_consent IS 'Explicit consent for processing sensitive health data (Art. 11 LGPD)';
