-- First, update any existing rows with invalid trigger_types to 'manual'
-- This prevents the constraint violation when we tighten the check constraint
UPDATE message_templates
SET trigger_type = 'manual'
WHERE trigger_type NOT IN (
    'manual',
    'appointment_confirmation',
    'appointment_reminder',
    'birthday',
    'post_attendance',
    'insole_delivery',
    'insole_maintenance'
);

-- Then apply the constraint update (re-running the logic from the failed migration)
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_trigger_type_check;

ALTER TABLE message_templates
ADD CONSTRAINT message_templates_trigger_type_check
CHECK (trigger_type IN (
    'manual',
    'appointment_confirmation',
    'appointment_reminder',
    'birthday',
    'post_attendance',
    'insole_delivery',
    'insole_maintenance'
));
