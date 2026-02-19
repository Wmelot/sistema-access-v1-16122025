-- Migration: Add Audit and Attachments to Transactions
-- Date: 2026-02-18

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Storage Bucket for Financial Attachments (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial', 'financial', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload financial attachments' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated users can upload financial attachments"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'financial' AND auth.role() = 'authenticated' );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view financial attachments' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated users can view financial attachments"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'financial' AND auth.role() = 'authenticated' );
    END IF;
END $$;
