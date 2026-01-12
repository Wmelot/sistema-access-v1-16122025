-- Deduplicate Price Tables and Add Constraint
-- This migration removes duplicate entries for 'Particular (Padrão)' and ensures uniqueness.

-- 1. Remove duplicates, keeping the oldest one
DELETE FROM public.price_tables
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (partition BY name ORDER BY created_at ASC) as rnum
    FROM public.price_tables
  ) t
  WHERE t.rnum > 1
);

-- 2. Add Unique Constraint to name
ALTER TABLE public.price_tables 
ADD CONSTRAINT price_tables_name_key UNIQUE (name);

-- Reload Schema
NOTIFY pgrst, 'reload config';
