-- Create api_integrations table if not exists (it should exist, but being safe)
CREATE TABLE IF NOT EXISTS public.api_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add config column if missing (in case table exists but column doesn't)
ALTER TABLE public.api_integrations ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin full access to api_integrations" ON public.api_integrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Reload schema cache
NOTIFY pgrst, 'reload config';
