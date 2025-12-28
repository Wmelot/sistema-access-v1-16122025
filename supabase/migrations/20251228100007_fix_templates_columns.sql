-- Add missing columns to message_templates

ALTER TABLE public.message_templates
ADD COLUMN IF NOT EXISTS channel TEXT,
ADD COLUMN IF NOT EXISTS trigger_type TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content TEXT;

-- Reload Schema
NOTIFY pgrst, 'reload config';
