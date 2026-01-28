-- Add google_review_url to clinic_settings
ALTER TABLE public.clinic_settings 
ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- Update existing records with the hardcoded fallback for Access Fisioterapia
UPDATE public.clinic_settings 
SET google_review_url = 'https://g.page/r/CZFUQUQVoZs8JEBM/review' 
WHERE id = '9571532e-fdf8-4aaa-b236-416fd6459566';

-- Reload schema
NOTIFY pgrst, 'reload config';
