-- Add cost_price to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;

-- Add cost_price to invoice_items table (to track cost at moment of sale)
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;
