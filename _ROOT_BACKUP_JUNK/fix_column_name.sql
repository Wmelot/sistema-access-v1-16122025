-- Rename column to match what the code expects
ALTER TABLE public.user_authenticators 
RENAME COLUMN public_key TO credential_public_key;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
