-- ============================================================================
-- SAFE FIX: Add organization_id only to tables that exist
-- ============================================================================
-- This script safely checks if tables exist before adding organization_id
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add organization_id to INVOICES
-- ============================================================================

DO $$ 
BEGIN
    -- Check if invoices table exists and doesn't have organization_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'invoices' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_invoices_org ON invoices(organization_id);
        RAISE NOTICE '✅ Added organization_id to invoices';
    ELSE
        RAISE NOTICE 'ℹ️  invoices already has organization_id or table does not exist';
    END IF;
END $$;

-- Populate invoices.organization_id from patients
UPDATE invoices 
SET organization_id = p.organization_id
FROM patients p
WHERE invoices.patient_id = p.id
  AND invoices.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Add organization_id to PATIENT_ASSESSMENTS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_assessments')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'patient_assessments' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE patient_assessments ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_patient_assessments_org ON patient_assessments(organization_id);
        RAISE NOTICE '✅ Added organization_id to patient_assessments';
    ELSE
        RAISE NOTICE 'ℹ️  patient_assessments already has organization_id or table does not exist';
    END IF;
END $$;

UPDATE patient_assessments 
SET organization_id = p.organization_id
FROM patients p
WHERE patient_assessments.patient_id = p.id
  AND patient_assessments.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Add organization_id to PATIENT_RECORDS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_records')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'patient_records' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE patient_records ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_patient_records_org ON patient_records(organization_id);
        RAISE NOTICE '✅ Added organization_id to patient_records';
    ELSE
        RAISE NOTICE 'ℹ️  patient_records already has organization_id or table does not exist';
    END IF;
END $$;

UPDATE patient_records 
SET organization_id = p.organization_id
FROM patients p
WHERE patient_records.patient_id = p.id
  AND patient_records.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Add organization_id to PATIENT_DOCUMENTS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_documents')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'patient_documents' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE patient_documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_patient_documents_org ON patient_documents(organization_id);
        RAISE NOTICE '✅ Added organization_id to patient_documents';
    ELSE
        RAISE NOTICE 'ℹ️  patient_documents already has organization_id or table does not exist';
    END IF;
END $$;

UPDATE patient_documents 
SET organization_id = p.organization_id
FROM patients p
WHERE patient_documents.patient_id = p.id
  AND patient_documents.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Add organization_id to ASSESSMENT_FOLLOW_UPS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_follow_ups')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'assessment_follow_ups' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_assessment_follow_ups_org ON assessment_follow_ups(organization_id);
        RAISE NOTICE '✅ Added organization_id to assessment_follow_ups';
    ELSE
        RAISE NOTICE 'ℹ️  assessment_follow_ups already has organization_id or table does not exist';
    END IF;
END $$;

UPDATE assessment_follow_ups 
SET organization_id = p.organization_id
FROM patients p
WHERE assessment_follow_ups.patient_id = p.id
  AND assessment_follow_ups.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Add organization_id to REMINDERS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminders')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'reminders' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE reminders ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_reminders_org ON reminders(organization_id);
        RAISE NOTICE '✅ Added organization_id to reminders';
    ELSE
        RAISE NOTICE 'ℹ️  reminders already has organization_id or table does not exist';
    END IF;
END $$;

UPDATE reminders 
SET organization_id = p.organization_id
FROM profiles p
WHERE reminders.user_id = p.id
  AND reminders.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================================
-- STEP 7: Add organization_id to PRODUCTS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'products' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_products_org ON products(organization_id);
        RAISE NOTICE '✅ Added organization_id to products';
    ELSE
        RAISE NOTICE 'ℹ️  products already has organization_id or table does not exist';
    END IF;
END $$;

-- Assign products to first organization (one-time migration)
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations ORDER BY created_at LIMIT 1;
    UPDATE products SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- ============================================================================
-- STEP 8: Add organization_id to FINANCIAL_COMMISSIONS (if exists)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_commissions')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'financial_commissions' AND column_name = 'organization_id'
       ) THEN
        ALTER TABLE financial_commissions ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_financial_commissions_org ON financial_commissions(organization_id);
        RAISE NOTICE '✅ Added organization_id to financial_commissions';
        
        -- Populate from appointments
        UPDATE financial_commissions fc
        SET organization_id = a.organization_id
        FROM appointments a
        WHERE fc.appointment_id = a.id
          AND fc.organization_id IS NULL
          AND a.organization_id IS NOT NULL;
    ELSE
        RAISE NOTICE 'ℹ️  financial_commissions already has organization_id or table does not exist';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================

-- Show all tables with organization_id
SELECT 
    table_name,
    'Has organization_id' as status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'organization_id'
ORDER BY table_name;

-- Count records per table
DO $$
DECLARE
    table_rec RECORD;
    total_count INTEGER;
    org_count INTEGER;
    missing_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION REPORT';
    RAISE NOTICE '========================================';
    
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND column_name = 'organization_id'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_rec.table_name) INTO total_count;
        EXECUTE format('SELECT COUNT(organization_id) FROM %I', table_rec.table_name) INTO org_count;
        missing_count := total_count - org_count;
        
        RAISE NOTICE '% - Total: %, With org_id: %, Missing: %', 
            table_rec.table_name, total_count, org_count, missing_count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;
