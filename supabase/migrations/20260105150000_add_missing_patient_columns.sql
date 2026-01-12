-- Add Missing Patient Columns
-- These columns are used in src/actions/patients.ts but were missing from the database.

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS marketing_source TEXT,
ADD COLUMN IF NOT EXISTS related_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS relationship_degree TEXT,
ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN DEFAULT false,

-- Invoice Fields
ADD COLUMN IF NOT EXISTS invoice_cpf TEXT,
ADD COLUMN IF NOT EXISTS invoice_name TEXT,
ADD COLUMN IF NOT EXISTS invoice_address_zip TEXT,
ADD COLUMN IF NOT EXISTS invoice_address TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS invoice_city TEXT,
ADD COLUMN IF NOT EXISTS invoice_state TEXT;

-- Force Schema Reload
NOTIFY pgrst, 'reload config';
