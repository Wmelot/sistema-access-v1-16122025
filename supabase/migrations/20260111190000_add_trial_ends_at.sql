-- Add trial_ends_at column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.organizations.trial_ends_at IS 'Date when the trial period ends. Access should be restricted after this date if no subscription is active.';
