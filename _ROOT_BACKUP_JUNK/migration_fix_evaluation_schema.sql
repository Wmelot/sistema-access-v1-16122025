-- Ensuring patient_records has all necessary columns for the Evaluation workflow

-- 1. Add 'status' column (draft, finalized)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_records' AND column_name = 'status') THEN
        ALTER TABLE patient_records ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
END $$;

-- 2. Add 'template_snapshot' column (versioning)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_records' AND column_name = 'template_snapshot') THEN
        ALTER TABLE patient_records ADD COLUMN template_snapshot JSONB;
        COMMENT ON COLUMN patient_records.template_snapshot IS 'Copy of form_template.fields at time of creation';
    END IF;
END $$;

-- 3. Ensure 'professional_id' is mandatory or at least references auth.users correctly
-- (This column should already exist from initial creation, but ensuring FK is good practice)
-- ALTER TABLE patient_records DROP CONSTRAINT IF EXISTS patient_records_professional_id_fkey;
-- ALTER TABLE patient_records ADD CONSTRAINT patient_records_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES auth.users(id);

-- 4. Enable RLS and Policies generally (Idempotent checks)
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_records' AND policyname = 'Authenticated users can insert records') THEN
        CREATE POLICY "Authenticated users can insert records" ON patient_records FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_records' AND policyname = 'Authenticated users can update records') THEN
        CREATE POLICY "Authenticated users can update records" ON patient_records FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_records' AND policyname = 'Authenticated users can view records') THEN
        CREATE POLICY "Authenticated users can view records" ON patient_records FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_patient_records_modtime ON patient_records;
CREATE TRIGGER update_patient_records_modtime
    BEFORE UPDATE ON patient_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
