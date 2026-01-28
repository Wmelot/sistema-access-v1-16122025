-- Add card_brand_id and installments to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS card_brand_id UUID REFERENCES card_brands(id),
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN appointments.card_brand_id IS 'Card brand used for payment (Visa, Master, Elo, etc)';
COMMENT ON COLUMN appointments.installments IS 'Number of installments for credit card payments';
