-- ============================================================================
-- Add organization_id to invoices table
-- ============================================================================

-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'organization_id'
    ) THEN
        -- Add the column
        ALTER TABLE invoices 
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        
        -- Create index for performance
        CREATE INDEX idx_invoices_org ON invoices(organization_id);
        
        RAISE NOTICE 'Column organization_id added to invoices table';
    ELSE
        RAISE NOTICE 'Column organization_id already exists in invoices table';
    END IF;
END $$;

-- Populate organization_id from patient
UPDATE invoices 
SET organization_id = p.organization_id
FROM patients p
WHERE invoices.patient_id = p.id
  AND invoices.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Verify
SELECT 
    COUNT(*) as total_invoices,
    COUNT(organization_id) as with_org_id,
    COUNT(*) - COUNT(organization_id) as missing_org_id
FROM invoices;
