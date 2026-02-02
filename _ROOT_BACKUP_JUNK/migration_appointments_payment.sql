-- Add payment details columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS addition NUMERIC DEFAULT 0;

-- Optional: Comment on columns
COMMENT ON COLUMN appointments.original_price IS 'Base price before adjustments';
COMMENT ON COLUMN appointments.discount IS 'Discount applied (R$)';
COMMENT ON COLUMN appointments.addition IS 'Surcharge/Addition applied (R$)';
