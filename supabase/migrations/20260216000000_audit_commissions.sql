-- Add metadata and notes to financial_commissions to support audit of deleted appointments
ALTER TABLE public.financial_commissions 
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update RLS for safety (even though it's already ENABLED)
NOTIFY pgrst, 'reload config';
