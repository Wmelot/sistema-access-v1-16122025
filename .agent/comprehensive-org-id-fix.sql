-- ============================================================================
-- COMPREHENSIVE FIX: Add organization_id to ALL tables that need it
-- ============================================================================
-- This script checks and adds organization_id to all tables that should have it
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Function to add organization_id to a table if it doesn't exist
CREATE OR REPLACE FUNCTION add_org_id_to_table(
    table_name_param TEXT,
    populate_from_patient BOOLEAN DEFAULT FALSE,
    populate_from_profile BOOLEAN DEFAULT FALSE
) RETURNS TEXT AS $$
DECLARE
    result_message TEXT;
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = table_name_param
        AND column_name = 'organization_id'
    ) THEN
        -- Add the column
        EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id UUID REFERENCES organizations(id)', table_name_param);
        
        -- Create index
        EXECUTE format('CREATE INDEX idx_%I_org ON %I(organization_id)', table_name_param, table_name_param);
        
        result_message := format('✅ Added organization_id to %s', table_name_param);
        
        -- Populate from patient if requested
        IF populate_from_patient THEN
            EXECUTE format('
                UPDATE %I 
                SET organization_id = p.organization_id
                FROM patients p
                WHERE %I.patient_id = p.id
                  AND %I.organization_id IS NULL
                  AND p.organization_id IS NOT NULL
            ', table_name_param, table_name_param, table_name_param);
            result_message := result_message || ' and populated from patients';
        END IF;
        
        -- Populate from profile if requested
        IF populate_from_profile THEN
            EXECUTE format('
                UPDATE %I 
                SET organization_id = prof.organization_id
                FROM profiles prof
                WHERE %I.professional_id = prof.id
                  AND %I.organization_id IS NULL
                  AND prof.organization_id IS NOT NULL
            ', table_name_param, table_name_param, table_name_param);
            result_message := result_message || ' and populated from profiles';
        END IF;
    ELSE
        result_message := format('ℹ️  organization_id already exists in %s', table_name_param);
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add organization_id to all tables
-- ============================================================================

-- Tables with patient_id
SELECT add_org_id_to_table('invoices', TRUE, FALSE);
SELECT add_org_id_to_table('patient_assessments', TRUE, FALSE);
SELECT add_org_id_to_table('patient_records', TRUE, FALSE);
SELECT add_org_id_to_table('patient_documents', TRUE, FALSE);
SELECT add_org_id_to_table('assessment_follow_ups', TRUE, FALSE);
SELECT add_org_id_to_table('consent_tokens', TRUE, FALSE);

-- Tables with professional_id or user_id
SELECT add_org_id_to_table('reminders', FALSE, FALSE);

-- Update reminders from user profile
UPDATE reminders 
SET organization_id = p.organization_id
FROM profiles p
WHERE reminders.user_id = p.id
  AND reminders.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Tables that need organization_id but don't have patient_id
SELECT add_org_id_to_table('products', FALSE, FALSE);
SELECT add_org_id_to_table('invoice_items', FALSE, FALSE);
SELECT add_org_id_to_table('financial_commissions', FALSE, FALSE);

-- Update products, invoice_items, and commissions to first organization (one-time migration)
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get the first organization (Access Fisioterapia)
    SELECT id INTO default_org_id FROM organizations ORDER BY created_at LIMIT 1;
    
    -- Update products
    UPDATE products SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Update invoice_items from invoice
    UPDATE invoice_items ii
    SET organization_id = i.organization_id
    FROM invoices i
    WHERE ii.invoice_id = i.id
      AND ii.organization_id IS NULL
      AND i.organization_id IS NOT NULL;
    
    -- Update financial_commissions from appointment
    UPDATE financial_commissions fc
    SET organization_id = a.organization_id
    FROM appointments a
    WHERE fc.appointment_id = a.id
      AND fc.organization_id IS NULL
      AND a.organization_id IS NOT NULL;
END $$;

-- ============================================================================
-- Verification Report
-- ============================================================================

SELECT 
    'invoices' as table_name,
    COUNT(*) as total_records,
    COUNT(organization_id) as with_org_id,
    COUNT(*) - COUNT(organization_id) as missing_org_id
FROM invoices
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
    'patient_documents',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM patient_documents
UNION ALL
SELECT 
    'assessment_follow_ups',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM assessment_follow_ups
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
FROM products
UNION ALL
SELECT 
    'invoice_items',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM invoice_items
UNION ALL
SELECT 
    'financial_commissions',
    COUNT(*),
    COUNT(organization_id),
    COUNT(*) - COUNT(organization_id)
FROM financial_commissions;

-- ============================================================================
-- List all tables with organization_id
-- ============================================================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'organization_id'
ORDER BY table_name;

-- Clean up helper function
DROP FUNCTION IF EXISTS add_org_id_to_table(TEXT, BOOLEAN, BOOLEAN);
