-- Enable RLS
ALTER TABLE "public"."api_integrations" ENABLE ROW LEVEL SECURITY;

-- Policy to View (All authenticated)
CREATE POLICY "Enable read access for authenticated users" ON "public"."api_integrations"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Policy to Insert (All authenticated)
CREATE POLICY "Enable insert access for authenticated users" ON "public"."api_integrations"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to Update (All authenticated)
CREATE POLICY "Enable update access for authenticated users" ON "public"."api_integrations"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

-- Policy to Delete (All authenticated)
CREATE POLICY "Enable delete access for authenticated users" ON "public"."api_integrations"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);
