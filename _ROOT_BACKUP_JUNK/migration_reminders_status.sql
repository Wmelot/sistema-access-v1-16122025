-- Add status column to reminders if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'status') THEN
        ALTER TABLE reminders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Drop is_read if exists as status replaces it (or keep for back-compat until migrated)
-- For now, let's keep is_read but maybe assume status='read' implies is_read=true.
-- Actually, let's migrate data:
UPDATE reminders SET status = 'read' WHERE is_read = TRUE AND status = 'pending';

-- Add check constraint for valid statuses
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_status_check;
ALTER TABLE reminders ADD CONSTRAINT reminders_status_check CHECK (status IN ('pending', 'read', 'resolved', 'snoozed'));
