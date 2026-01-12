-- Add has_agenda to profiles to control visibility in online booking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_agenda BOOLEAN DEFAULT TRUE;

-- Add organization_id if it somehow missed (safety check, though 20251228 migration should have handled it)
-- We rely on the FK constraint from previous migration.
