-- ============================================================================
-- Row Level Security (RLS) Policies for Multi-Tenant SaaS
-- ============================================================================
-- This script enables RLS and creates policies to ensure data isolation
-- between organizations. Run this AFTER the migration script.
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all multi-tenant tables
-- ============================================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create helper function to get user's organization
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT organization_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 3: Create policies for APPOINTMENTS
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view appointments from their organization" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments in their organization" ON appointments;

-- SELECT: Users can only see appointments from their organization
CREATE POLICY "Users can view appointments from their organization"
ON appointments FOR SELECT
USING (organization_id = auth.user_organization_id());

-- INSERT: Users can only create appointments in their organization
CREATE POLICY "Users can create appointments in their organization"
ON appointments FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

-- UPDATE: Users can only update appointments in their organization
CREATE POLICY "Users can update appointments in their organization"
ON appointments FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

-- DELETE: Users can only delete appointments in their organization
CREATE POLICY "Users can delete appointments in their organization"
ON appointments FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 4: Create policies for PATIENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view patients from their organization" ON patients;
DROP POLICY IF EXISTS "Users can create patients in their organization" ON patients;
DROP POLICY IF EXISTS "Users can update patients in their organization" ON patients;
DROP POLICY IF EXISTS "Users can delete patients in their organization" ON patients;

CREATE POLICY "Users can view patients from their organization"
ON patients FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create patients in their organization"
ON patients FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update patients in their organization"
ON patients FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete patients in their organization"
ON patients FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 5: Create policies for PATIENT_RECORDS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view records from their organization" ON patient_records;
DROP POLICY IF EXISTS "Users can create records in their organization" ON patient_records;
DROP POLICY IF EXISTS "Users can update records in their organization" ON patient_records;
DROP POLICY IF EXISTS "Users can delete records in their organization" ON patient_records;

CREATE POLICY "Users can view records from their organization"
ON patient_records FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create records in their organization"
ON patient_records FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update records in their organization"
ON patient_records FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete records in their organization"
ON patient_records FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 6: Create policies for PATIENT_ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view assessments from their organization" ON patient_assessments;
DROP POLICY IF EXISTS "Users can create assessments in their organization" ON patient_assessments;
DROP POLICY IF EXISTS "Users can update assessments in their organization" ON patient_assessments;
DROP POLICY IF EXISTS "Users can delete assessments in their organization" ON patient_assessments;

CREATE POLICY "Users can view assessments from their organization"
ON patient_assessments FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create assessments in their organization"
ON patient_assessments FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update assessments in their organization"
ON patient_assessments FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete assessments in their organization"
ON patient_assessments FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 7: Create policies for PATIENT_DOCUMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view documents from their organization" ON patient_documents;
DROP POLICY IF EXISTS "Users can create documents in their organization" ON patient_documents;
DROP POLICY IF EXISTS "Users can update documents in their organization" ON patient_documents;
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON patient_documents;

CREATE POLICY "Users can view documents from their organization"
ON patient_documents FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create documents in their organization"
ON patient_documents FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update documents in their organization"
ON patient_documents FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete documents in their organization"
ON patient_documents FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 8: Create policies for REMINDERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view reminders from their organization" ON reminders;
DROP POLICY IF EXISTS "Users can create reminders in their organization" ON reminders;
DROP POLICY IF EXISTS "Users can update reminders in their organization" ON reminders;
DROP POLICY IF EXISTS "Users can delete reminders in their organization" ON reminders;

CREATE POLICY "Users can view reminders from their organization"
ON reminders FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create reminders in their organization"
ON reminders FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update reminders in their organization"
ON reminders FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete reminders in their organization"
ON reminders FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 9: Create policies for PRODUCTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view products from their organization" ON products;
DROP POLICY IF EXISTS "Users can create products in their organization" ON products;
DROP POLICY IF EXISTS "Users can update products in their organization" ON products;
DROP POLICY IF EXISTS "Users can delete products in their organization" ON products;

CREATE POLICY "Users can view products from their organization"
ON products FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create products in their organization"
ON products FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update products in their organization"
ON products FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete products in their organization"
ON products FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 10: Create policies for SERVICES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view services from their organization" ON services;
DROP POLICY IF EXISTS "Users can create services in their organization" ON services;
DROP POLICY IF EXISTS "Users can update services in their organization" ON services;
DROP POLICY IF EXISTS "Users can delete services in their organization" ON services;

CREATE POLICY "Users can view services from their organization"
ON services FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create services in their organization"
ON services FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update services in their organization"
ON services FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete services in their organization"
ON services FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 11: Create policies for LOCATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view locations from their organization" ON locations;
DROP POLICY IF EXISTS "Users can create locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can update locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can delete locations in their organization" ON locations;

CREATE POLICY "Users can view locations from their organization"
ON locations FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create locations in their organization"
ON locations FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update locations in their organization"
ON locations FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete locations in their organization"
ON locations FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 12: Create policies for INVOICES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view invoices from their organization" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices in their organization" ON invoices;

CREATE POLICY "Users can view invoices from their organization"
ON invoices FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create invoices in their organization"
ON invoices FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update invoices in their organization"
ON invoices FOR UPDATE
USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete invoices in their organization"
ON invoices FOR DELETE
USING (organization_id = auth.user_organization_id());

-- ============================================================================
-- STEP 13: Verification Query
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'appointments', 'patients', 'patient_records', 'patient_assessments',
        'patient_documents', 'reminders', 'products', 'services', 'locations',
        'invoices', 'transactions', 'form_templates'
    )
ORDER BY tablename;

-- Check policies created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
