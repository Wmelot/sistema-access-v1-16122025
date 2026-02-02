
-- Add questionnaire_type column to message_templates
ALTER TABLE public.message_templates 
ADD COLUMN IF NOT EXISTS questionnaire_type TEXT;

COMMENT ON COLUMN public.message_templates.questionnaire_type IS 'Linked assessment type for this template (e.g. insoles_40d)';
