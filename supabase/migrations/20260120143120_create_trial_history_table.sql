-- Create table to track trial usage and prevent abuse
CREATE TABLE IF NOT EXISTS public.trial_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text,
    phone text,
    fingerprint text, -- Future use for device fingerprinting
    ip_address text,  -- Future use
    created_at timestamptz DEFAULT now(),
    trial_start_date timestamptz DEFAULT now(),
    organization_id uuid -- Link to the org created (even if deleted later, we keep this record)
);

-- Enable RLS but keep it open for service role (admin) usage mainly
ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;

-- Allow read/write only for service role (functions/actions)
-- Users should NOT be able to access this table directly
CREATE POLICY "Service role can do everything on trial_history"
    ON public.trial_history
    FOR ALL
    USING ( auth.role() = 'service_role' )
    WITH CHECK ( auth.role() = 'service_role' );

-- Index for fast lookup during signup
CREATE INDEX idx_trial_history_email ON public.trial_history(email);
CREATE INDEX idx_trial_history_phone ON public.trial_history(phone);
