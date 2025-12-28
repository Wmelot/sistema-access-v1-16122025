-- Create table if it doesn't exist (Fix for missing initial migration)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add delay_days column to message_templates
ALTER TABLE message_templates 
ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 0;

-- Update check constraint for trigger_type to include new types
-- Postgres doesn't easily allow adding to check constraints without dropping/re-adding or recreating enum.
-- Assuming it's a text column with check constraint or just text.
-- Let's check the current definition or just try to drop constraint if it exists.

DO $$ 
BEGIN
    -- Try to drop constraint if it exists (generic name assumption)
    ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_trigger_type_check;
    
    -- Re-add constraint with new values
    ALTER TABLE message_templates 
    ADD CONSTRAINT message_templates_trigger_type_check 
    CHECK (trigger_type IN (
        'manual', 
        'appointment_confirmation', 
        'appointment_reminder', 
        'birthday', 
        'post_attendance', 
        'insole_delivery' -- New general trigger for insole delivery event
    ));
END $$;
