-- Add template_snapshot column to patient_records for versioning
ALTER TABLE patient_records 
ADD COLUMN IF NOT EXISTS template_snapshot JSONB;

-- Comment
COMMENT ON COLUMN patient_records.template_snapshot IS 'Copy of the form_template at the time of record creation (Versioning)';
