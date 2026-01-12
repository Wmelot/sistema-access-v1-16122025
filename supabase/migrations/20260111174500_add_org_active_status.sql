-- Add active status to organizations for SaaS management
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Update RLS to potentially restrict access if inactive (Optional for now, but good practice)
-- For now, just adding the column so the Admin Panel works.
