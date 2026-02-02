-- Add cost_price to products if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN 
        ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0; 
    END IF;
END $$;

-- Add cost_price and product_id to invoice_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'cost_price') THEN 
        ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'product_id') THEN 
        ALTER TABLE invoice_items ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL; 
    END IF;
END $$;
