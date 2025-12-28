-- Add pix_key column to clinic_settings table if it doesn't exist
ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS pix_key text;
