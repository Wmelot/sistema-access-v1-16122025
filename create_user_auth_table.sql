-- Drop table if exists (to recreate cleanly)
DROP TABLE IF EXISTS public.user_authenticators CASCADE;

-- Create user_authenticators table for WebAuthn/TouchID/FaceID
CREATE TABLE public.user_authenticators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    credential_device_type TEXT,
    credential_backed_up BOOLEAN DEFAULT false,
    transports TEXT[],
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_user_authenticators_user_id ON public.user_authenticators(user_id);
CREATE INDEX idx_user_authenticators_credential_id ON public.user_authenticators(credential_id);

-- Enable RLS
ALTER TABLE public.user_authenticators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own authenticators"
    ON public.user_authenticators
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own authenticators"
    ON public.user_authenticators
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own authenticators"
    ON public.user_authenticators
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own authenticators"
    ON public.user_authenticators
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_authenticators TO authenticated;
GRANT ALL ON public.user_authenticators TO service_role;

-- Comment
COMMENT ON TABLE public.user_authenticators IS 'Stores WebAuthn/Passkey credentials for passwordless authentication';
