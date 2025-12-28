-- Add message_template_id to assessment_follow_ups
ALTER TABLE assessment_follow_ups 
ADD COLUMN IF NOT EXISTS message_template_id UUID REFERENCES message_templates(id);

-- Make 'type' optional or general, as the template dictations the specifics now.
-- We can keep 'type' for categorization if we want, or default it.
ALTER TABLE assessment_follow_ups ALTER COLUMN type DROP NOT NULL;
