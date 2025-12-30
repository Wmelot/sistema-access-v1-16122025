
-- Add ai_generation_script column to form_templates
ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS ai_generation_script TEXT;
