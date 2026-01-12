-- Migration to add status column to patient_records if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'patient_records' AND column_name = 'status'
    ) THEN
        ALTER TABLE patient_records ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;
