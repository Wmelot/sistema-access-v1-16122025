-- Add invoice_issued column to appointments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'invoice_issued') THEN
        ALTER TABLE appointments ADD COLUMN invoice_issued BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
