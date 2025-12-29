-- 20251228153000_add_patient_status.sql

-- 1. Create Status Enum Type (if using postgres types, or just check constraint)
-- Let's use check constraint for simplicity in existing table.

ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased'));

-- 2. Index for filtering active patients
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);

-- 3. Update existing rows (already defaults to active, but explicit update if needed)
UPDATE public.patients SET status = 'active' WHERE status IS NULL;
