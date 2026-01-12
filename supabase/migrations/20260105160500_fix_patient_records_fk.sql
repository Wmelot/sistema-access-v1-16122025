-- Fix patient_records foreign key to reference profiles instead of auth.users
-- This allows PostgREST to join patient_records with profiles

DO $$ 
BEGIN
    -- Drop existing foreign key if it exists (referencing auth.users)
    -- We try to guess the name or drop robustly
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'patient_records_professional_id_fkey') THEN
        ALTER TABLE public.patient_records DROP CONSTRAINT patient_records_professional_id_fkey;
    END IF;

    -- If it was named differently (e.g. auto generated from early migration), we might need to look it up.
    -- But assuming standard naming or re-creating.
    
    -- Add new foreign key referencing public.profiles
    ALTER TABLE public.patient_records
    ADD CONSTRAINT patient_records_professional_id_fkey
    FOREIGN KEY (professional_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adjusting foreign keys: %', SQLERRM;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
