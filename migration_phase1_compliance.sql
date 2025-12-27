-- ==============================================================================
-- PHASE 1: FOUNDATION & COMPLIANCE MIGRATION
-- Includes: Audit Logs, Imutability Logic, and Scalability Indexes
-- ==============================================================================

-- 0. EXTENSIONS
-- Ensure pg_trgm exists BEFORE using it in indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. AUDIT LOGS TABLE
-- Stores detailed access logs for compliance (Who, What, When, IP, Context)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Nullable for system actions or unauth attempts
    action TEXT NOT NULL, -- e.g., 'VIEW_PATIENT', 'UPDATE_PRONTUARIO'
    resource TEXT, -- e.g., 'patients', 'appointments'
    resource_id TEXT, -- ID of the target resource
    details JSONB DEFAULT '{}'::JSONB, -- Context details (diffs, snapshots)
    ip_address TEXT,
    user_agent TEXT
);

-- RLS for Audit Logs (Strict Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view logs (Adjust 'admin' check based on your App's Role system)
-- Assuming a simple check or generic admin access for now. 
-- STARTUP POLICY: Allow insert by authenticated users (for logging their own actions)
CREATE POLICY "Allow authenticated insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- POLICY: Admins can view all (Placeholder for Role Check)
-- Modify this if you have a specific 'is_admin()' function or roles table
-- For now, we restrict SELECT to service_role (Admin SQL Editor) or specific users
CREATE POLICY "Service role only select" ON audit_logs FOR SELECT TO service_role USING (true);


-- 2. IMUTABILITY TRIGGER (24 Hours)
-- Prevents UPDATE or DELETE on checking 'created_at'
CREATE OR REPLACE FUNCTION check_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow updates only within 24 hours of creation
    IF (OLD.created_at < NOW() - INTERVAL '24 hours') THEN
        RAISE EXCEPTION 'Registro imutável: Prontuários e Evoluções não podem ser alterados após 24 horas.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to 'patient_records' (Prontuário / Evoluções)
-- DROP TRIGGER IF EXISTS trg_freeze_records ON patient_records;
-- CREATE TRIGGER trg_freeze_records
-- BEFORE UPDATE OR DELETE ON patient_records
-- FOR EACH ROW EXECUTE FUNCTION check_record_immutability();


-- 3. SCALABILITY INDEXES
-- Critical indexes for performance on frequently accessed columns

-- Patients: Search by Name and CPF
CREATE INDEX IF NOT EXISTS idx_patients_name_trigram ON patients USING gin (name gin_trgm_ops); -- Requires pg_trgm extension
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);

-- Appointments: Range queries on start_time are frequent
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);

-- Transactions: Financial reports filter by date
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Audit Logs: Frequent filtering by user or resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Anonymization section follows...

-- 4. ANONYMIZATION (Right to be Forgotten)
-- Function to hard-delete sensitive data while keeping ID for referential integrity
CREATE OR REPLACE FUNCTION anonymize_patient(target_patient_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE patients
    SET 
        name = 'Anonimo ' || substr(md5(random()::text), 1, 8),
        cpf = NULL,
        email = NULL,
        phone = NULL,
        address = NULL, -- Assuming address is a simple column or JSON
        active = false
    WHERE id = target_patient_id;

    -- Log the action
    INSERT INTO audit_logs (action, resource, resource_id, details)
    VALUES ('ANONYMIZE_PATIENT', 'patients', target_patient_id::text, '{"reason": "LGPD Request"}'::jsonb);
END;
$$ LANGUAGE plpgsql;
