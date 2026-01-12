-- Add status column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Migrate existing 'active' boolean to status
-- If active is true -> 'active', if false -> 'suspended'
UPDATE public.organizations
SET status = CASE 
    WHEN active = true THEN 'active'
    WHEN active = false THEN 'suspended'
    ELSE 'active'
END;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Optional: Drop active column if we are fully switching (Keeping it for now to avoid breaking existing code immediately, but marking deprecated)
-- ALTER TABLE public.organizations DROP COLUMN active;
