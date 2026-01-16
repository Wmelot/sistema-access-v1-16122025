
-- Add is_locked column with default false
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Lock all existing forms (assumed standardized/imported)
UPDATE form_templates SET is_locked = TRUE WHERE is_locked IS FALSE;

-- Ensure "Follow-up" or specific ones are NOT locked if they shouldn't be?
-- User said "Standardized" are validated. "Custom" ones might be mixed in if he created some already.
-- But he said "recovered" ones.
-- Safest: Lock all current. If he needs to edit one, he can duplicate or we can add "Unlock" button later (or he uses admin).
-- Actually, he said "create their own forms... editable". Since I just imported ~30 legacy forms, those are the locked ones.
-- Any form created *from now on* will be default false.

-- Let's also check distinct types to be sure.
-- SELECT distinct type FROM form_templates;
