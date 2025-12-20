-- Add 'type' to form_templates to distinguish between 'assessment' and 'evolution'
ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'assessment' CHECK (type IN ('assessment', 'evolution'));

-- Add 'record_type' to patient_records to distinguish between 'assessment' and 'evolution'
-- defaulting to 'assessment' for existing records
ALTER TABLE patient_records 
ADD COLUMN IF NOT EXISTS record_type text DEFAULT 'assessment' CHECK (record_type IN ('assessment', 'evolution'));

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(type);
CREATE INDEX IF NOT EXISTS idx_patient_records_type ON patient_records(record_type);
