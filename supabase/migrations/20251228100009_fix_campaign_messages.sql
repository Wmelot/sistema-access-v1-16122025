-- Add missing columns to campaign_messages

ALTER TABLE public.campaign_messages
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Reload Schema
NOTIFY pgrst, 'reload config';
