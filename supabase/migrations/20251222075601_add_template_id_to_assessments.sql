-- Add template_id and title columns to patient_assessments table
-- This enables the follow-up scheduling feature

-- Add template_id column (stores the assessment type for follow-up scheduling)
ALTER TABLE patient_assessments 
ADD COLUMN IF NOT EXISTS template_id TEXT;

-- Add title column (stores the human-readable title for display)
ALTER TABLE patient_assessments 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to have template_id = type for backward compatibility
UPDATE patient_assessments 
SET template_id = type 
WHERE template_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_assessments_template_id 
ON patient_assessments(template_id);
