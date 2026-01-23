-- Multi-Tenant Data Migration Script
-- This script fixes existing data to ensure all records have organization_id

-- ============================================================================
-- STEP 1: Fix Appointments with NULL organization_id
-- ============================================================================

-- Update appointments based on patient's organization
UPDATE appointments 
SET organization_id = p.organization_id
FROM patients p
WHERE appointments.patient_id = p.id
  AND appointments.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Update appointments based on professional's organization (if patient link fails)
UPDATE appointments 
SET organization_id = prof.organization_id
FROM profiles prof
WHERE appointments.professional_id = prof.id
  AND appointments.organization_id IS NULL
  AND prof.organization_id IS NOT NULL;

-- Report any remaining appointments without organization_id
SELECT 
    id, 
    patient_id, 
    professional_id, 
    start_time,
    'Appointment without organization_id' as issue
FROM appointments 
WHERE organization_id IS NULL;

-- ============================================================================
-- STEP 2: Add organization_id to tables that don't have it
-- ============================================================================

-- Add organization_id to patient_assessments (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patient_assessments' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE patient_assessments 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_patient_assessments_org 
        ON patient_assessments(organization_id);
    END IF;
END $$;

-- Populate organization_id from patient
UPDATE patient_assessments 
SET organization_id = p.organization_id
FROM patients p
WHERE patient_assessments.patient_id = p.id
  AND patient_assessments.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Add organization_id to patient_records (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patient_records' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE patient_records 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_patient_records_org 
        ON patient_records(organization_id);
    END IF;
END $$;

-- Populate organization_id from patient
UPDATE patient_records 
SET organization_id = p.organization_id
FROM patients p
WHERE patient_records.patient_id = p.id
  AND patient_records.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Add organization_id to assessment_follow_ups (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessment_follow_ups' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE assessment_follow_ups 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_assessment_follow_ups_org 
        ON assessment_follow_ups(organization_id);
    END IF;
END $$;

-- Populate organization_id from patient
UPDATE assessment_follow_ups 
SET organization_id = p.organization_id
FROM patients p
WHERE assessment_follow_ups.patient_id = p.id
  AND assessment_follow_ups.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Verify patient_documents table exists
-- ============================================================================

-- Create patient_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size_bytes INTEGER,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for patient_documents
CREATE INDEX IF NOT EXISTS idx_patient_documents_org 
ON patient_documents(organization_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient 
ON patient_documents(patient_id);

-- ============================================================================
-- STEP 4: Verify Reminders have organization_id
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reminders' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE reminders 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_reminders_org 
        ON reminders(organization_id);
    END IF;
END $$;

-- Populate organization_id from user's profile
UPDATE reminders 
SET organization_id = p.organization_id
FROM profiles p
WHERE reminders.user_id = p.id
  AND reminders.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Verify Products have organization_id
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_products_org 
        ON products(organization_id);
    END IF;
END $$;

-- For products, we need to assign to the first/default organization
-- This is a one-time migration - adjust the organization_id as needed
UPDATE products 
SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- ============================================================================
-- STEP 6: Final Verification Report
-- ============================================================================

-- Report on data integrity
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_records,
    COUNT(organization_id) as with_org_id,
    COUNT(*) - COUNT(organization_id) as missing_org_id
FROM appointments
UNION ALL
SELECT 
    'patient_assessments',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM patient_assessments
UNION ALL
SELECT 
    'patient_records',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM patient_records
UNION ALL
SELECT 
    'assessment_follow_ups',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM assessment_follow_ups
UNION ALL
SELECT 
    'patient_documents',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM patient_documents
UNION ALL
SELECT 
    'reminders',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM reminders
UNION ALL
SELECT 
    'products',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM products;

-- ============================================================================
-- STEP 7: Enable RLS Policies (Optional - run after verification)
-- ============================================================================

-- This section should be run AFTER verifying all data has organization_id

-- Example RLS policy for appointments (if not exists)
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only see appointments from their organization"
-- ON appointments FOR SELECT
-- USING (organization_id IN (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
-- ));

-- Repeat similar policies for other tables...
