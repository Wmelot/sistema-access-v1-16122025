-- Add max_professionals limit
ALTER TABLE public.plan_configs 
ADD COLUMN IF NOT EXISTS max_professionals INTEGER DEFAULT 1;

-- Update existing plans with limits
UPDATE public.plan_configs SET max_professionals = 1 WHERE slug = 'free';
UPDATE public.plan_configs SET max_professionals = 5 WHERE slug = 'clinic';
UPDATE public.plan_configs SET max_professionals = 999 WHERE slug = 'enterprise'; -- Effectively unlimited

-- Ensure future inserts default correctly if needed, but the column default handles it.
