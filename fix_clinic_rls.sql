-- Ensure RLS is enabled
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Authenticated users can view settings" ON clinic_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON clinic_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON clinic_settings;

-- Create comprehensive policies
CREATE POLICY "Authenticated users can view settings"
ON clinic_settings FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert settings"
ON clinic_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settings"
ON clinic_settings FOR UPDATE
USING (auth.role() = 'authenticated');

-- Also allow DELETE just in case, though not used here
CREATE POLICY "Authenticated users can delete settings"
ON clinic_settings FOR DELETE
USING (auth.role() = 'authenticated');
