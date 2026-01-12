-- Add injury_region to appointments for automated questionnaire logic
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS injury_region TEXT;
