
-- CRITICAL FIX: ADD MISSING COLUMN & LINK MASTER
-- The error "column p.organization_id does not exist" reveals the root cause.
-- We must add this column to enable SaaS/Master features.

-- 1. Add the column safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
    END IF;
END $$;

-- 2. Ensure Axiom Master Org exists (Just to be safe)
INSERT INTO public.organizations (id, name, slug, plan_config_id)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Axiom Master', 
    'axiom-master', 
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Force Link 'accessfisio@gmail.com' to Master Org
UPDATE public.profiles
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin'
WHERE email = 'accessfisio@gmail.com';

-- 4. Verify Result
SELECT email, organization_id FROM public.profiles WHERE email = 'accessfisio@gmail.com';
