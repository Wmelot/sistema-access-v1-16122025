-- Create webhook_logs table for tracking Z-API webhook events

CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    provider TEXT NOT NULL, -- 'zapi', 'evolution', etc.
    event_type TEXT NOT NULL, -- 'message_received', 'status_update', etc.
    payload JSONB, -- Full webhook payload
    status TEXT NOT NULL, -- 'success', 'error', 'ignored'
    details TEXT -- Additional information or error messages
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can view logs
CREATE POLICY "Authenticated users can view webhook logs"
    ON public.webhook_logs FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider 
    ON public.webhook_logs(provider);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_status 
    ON public.webhook_logs(status);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at 
    ON public.webhook_logs(created_at DESC);

-- Reload Schema
NOTIFY pgrst, 'reload config';
