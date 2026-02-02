-- Add date_of_birth to profiles so professionals can be in the birthday widget
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Notify user to fill this data later
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User birthday for dashboard widget';
