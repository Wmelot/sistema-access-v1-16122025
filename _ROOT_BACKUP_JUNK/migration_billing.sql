-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'paid', -- 'pending', 'paid'
    payment_method TEXT, -- 'pix', 'credit_card', 'cash', etc.
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add invoice_id to Appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Ensure appointments have a useful status for billing
-- (Assuming 'done' is the status for attended appointments)
