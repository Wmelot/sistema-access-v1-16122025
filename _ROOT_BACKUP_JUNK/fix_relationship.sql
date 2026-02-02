
-- Fix missing relationship for patient_records -> profiles (professionals)
ALTER TABLE public.patient_records
DROP CONSTRAINT IF EXISTS patient_records_professional_id_fkey;

-- Ensure the column exists and has the correct type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_records' AND column_name = 'professional_id') THEN
        ALTER TABLE public.patient_records ADD COLUMN professional_id uuid;
    END IF;
END $$;

-- Add the correct constraint pointing to profiles
ALTER TABLE public.patient_records
ADD CONSTRAINT patient_records_professional_id_fkey
FOREIGN KEY (professional_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
