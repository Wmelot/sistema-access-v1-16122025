-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Create Invoice Items table (for extra items like products)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id), -- Optional link
    description TEXT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy for invoice items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invoice items" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert invoice items" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update invoice items" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete invoice items" ON invoice_items FOR DELETE TO authenticated USING (true);

-- Seed initial products
INSERT INTO products (name, base_price) VALUES ('Palmilha', 350.00);
