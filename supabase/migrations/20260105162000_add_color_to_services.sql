-- Add color column to services
alter table public.services
add column if not exists color text default '#3b82f6'; -- Default blue

-- Reload schema cache
NOTIFY pgrst, 'reload config';
