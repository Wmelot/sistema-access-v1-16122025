-- Add PIX key to clinic settings

ALTER TABLE public.clinic_settings
ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Reload Schema
NOTIFY pgrst, 'reload config';
