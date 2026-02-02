-- Add color column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS color text DEFAULT '#64748b'; -- Default Slate-500
