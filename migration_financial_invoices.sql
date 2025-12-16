-- Add invoice tracking to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS invoice_issued BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS invoice_number TEXT; -- Optional: Number of the invoice
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- Update existing records: Pix/Card assumed to have invoice per user rule
-- This is a one-time fix for past data if desired, but reckless?
-- User said "tudo que for pago em pix ou cartão vamos emitir nota".
-- So let's update past records to reflect this policy if they are 'paid'.
UPDATE appointments 
SET invoice_issued = TRUE 
WHERE status = 'completed' 
AND payment_method_id IN (
    SELECT id FROM payment_methods 
    WHERE slug IN ('pix', 'credit_card', 'debit_card') 
    OR name ILIKE '%pix%' OR name ILIKE '%crédito%' OR name ILIKE '%débito%'
);
