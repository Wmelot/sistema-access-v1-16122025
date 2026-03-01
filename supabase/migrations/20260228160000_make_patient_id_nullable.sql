-- Allow null patient_id in patient_records for Quick Attendance (Drafts)
-- Also ensuring appointments table has nullable patient_id if not already done.

DO $$ 
BEGIN
    -- 1. Allow null in patient_records (or clinical_records if that's the base name)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_records' AND column_name = 'patient_id') THEN
        ALTER TABLE public.patient_records ALTER COLUMN patient_id DROP NOT NULL;
    END IF;

    -- 2. Allow null in appointments (just in case, though it usually is)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id') THEN
        ALTER TABLE public.appointments ALTER COLUMN patient_id DROP NOT NULL;
    END IF;

    -- 3. Reload schema cache
    NOTIFY pgrst, 'reload config';
END $$;
