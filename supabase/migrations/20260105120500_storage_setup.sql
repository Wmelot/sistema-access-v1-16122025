
-- Create bucket 'attachments'
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Skip: usually already enabled and requires superuser

-- Policy: Allow authenticated upload
CREATE POLICY "Authenticated Insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

-- Policy: Allow authenticated select (view)
CREATE POLICY "Authenticated Select" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'attachments');

-- Policy: Allow owner update/delete
CREATE POLICY "Owner Maintain" ON storage.objects
FOR ALL TO authenticated USING (auth.uid() = owner);
