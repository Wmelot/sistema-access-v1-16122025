-- Ensure all users have profiles and organizations
-- This solves "Critical: User has no organization_id" even if the profile was missing entirely.

DO $$
DECLARE
    default_org_id UUID;
BEGIN
    -- 1. Get or Create Default Organization
    INSERT INTO public.organizations (name) VALUES ('Minha Clínica') 
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO default_org_id FROM public.organizations LIMIT 1;

    -- 2. Insert missing profiles for existing auth users
    -- We try to copy email from auth.users if possible.
    -- Note: Accessing auth.users requires appropriate permissions, which migration runner usually has.
    INSERT INTO public.profiles (id, email, role, organization_id)
    SELECT id, email, 'admin', default_org_id
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles);

    -- 3. Fix existing profiles that have NULL organization_id
    UPDATE public.profiles
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

END $$;

-- Reload Schema
NOTIFY pgrst, 'reload config';
