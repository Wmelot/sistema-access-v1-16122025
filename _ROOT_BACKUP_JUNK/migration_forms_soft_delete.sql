-- Add deleted_at column to form_templates for soft delete support
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
