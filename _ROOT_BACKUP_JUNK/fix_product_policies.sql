-- Reset Policies for Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

CREATE POLICY "Users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Ensure Master can definitely do everything (redundant but safe)
GRANT ALL ON products TO authenticated;
GRANT ALL ON products TO service_role;
GRANT ALL ON products TO postgres;
