-- Force add delay_days column to message_templates
-- We use DO block to check column existence safely or just plain ALTER TABLE with IF NOT EXISTS (Postgres 9.6+ supports IF NOT EXISTS for columns)

ALTER TABLE public.message_templates 
ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 0;

-- Also ensure trigger_type is TEXT (it seems it is, based on schema output)
-- Verify schema output: trigger_type is present.
