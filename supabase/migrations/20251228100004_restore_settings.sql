-- Restore Settings and Logs tables

-- 1. API Integrations (WhatsApp Config)
CREATE TABLE IF NOT EXISTS public.api_integrations (
    provider TEXT PRIMARY KEY, -- 'zapi', 'evolution', 'test_mode'
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Message Logs
CREATE TABLE IF NOT EXISTS public.message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    template_id UUID REFERENCES public.message_templates(id),
    phone TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    message_id TEXT, -- External ID
    error_message TEXT
);

-- 3. Fix message_templates column name mismatch (active -> is_active)
-- Check if 'active' exists and 'is_active' does not via DO block or just try rename.
-- Postgres rename works if column exists.
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='message_templates' AND column_name='active')
  THEN
      ALTER TABLE public.message_templates RENAME COLUMN active TO is_active;
  END IF;
END $$;


-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Auth users full access api_integrations" ON public.api_integrations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access message_logs" ON public.message_logs FOR ALL USING (auth.role() = 'authenticated');

-- Reload schema
NOTIFY pgrst, 'reload config';
