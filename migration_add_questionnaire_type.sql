-- Add questionnaire_type column to support legacy hardcoded questionnaires (like 'spadi')
ALTER TABLE public.assessment_follow_ups 
ADD COLUMN IF NOT EXISTS questionnaire_type TEXT;

COMMENT ON COLUMN public.assessment_follow_ups.questionnaire_type IS 'Legacy/Hardcoded questionnaire type (e.g. spadi)';
