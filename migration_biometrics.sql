-- Create user_authenticators table for WebAuthn/Passkeys

CREATE TABLE IF NOT EXISTS public.user_authenticators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Can link to auth.users OR public.profiles depending on architecture. 
    -- Linking to auth.users is safer for auth credentials.
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    credential_public_key BYTEA NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    credential_device_type TEXT NOT NULL, -- 'singleDevice', 'multiDevice'
    credential_backed_up BOOLEAN NOT NULL DEFAULT false,
    transports TEXT[], -- 'usb', 'ble', 'nfc', 'internal'
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional: friendly name for the device
    device_name TEXT 
);

-- RLS Policies
ALTER TABLE public.user_authenticators ENABLE ROW LEVEL SECURITY;

-- Users can view their own authenticators
CREATE POLICY "Users can view own authenticators" 
ON public.user_authenticators FOR SELECT 
USING (auth.uid() = user_id);

-- Users can delete their own authenticators
CREATE POLICY "Users can delete own authenticators" 
ON public.user_authenticators FOR DELETE 
USING (auth.uid() = user_id);

-- Only creating usually happens via server-side action bypassing RLS or authenticated user 
-- For now allow insert for authenticated user matching uid
CREATE POLICY "Users can insert own authenticators" 
ON public.user_authenticators FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_authenticators TO authenticated;
GRANT ALL ON public.user_authenticators TO service_role;
