
-- FINAL SCHEMA FIX & MASTER LINKING
-- Updates legacy tables to support SaaS features and links the Master User.

-- 1. Upgrade 'organizations' table (Add missing SaaS columns)
DO $$
BEGIN
    -- Add 'slug' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug') THEN
        ALTER TABLE public.organizations ADD COLUMN slug text;
    END IF;

    -- Add 'plan_config_id' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan_config_id') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_config_id uuid;
    END IF;
    
    -- Add 'owner_id' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE public.organizations ADD COLUMN owner_id uuid;
    END IF;
END $$;

-- 2. Upgrade 'profiles' table (Add missing organization link)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
    END IF;
END $$;

-- 3. Ensure Axiom Master Org exists (Now with correct columns)
INSERT INTO public.organizations (id, name, slug, plan_config_id, plan)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Axiom Master', 
    'axiom-master', 
    '00000000-0000-0000-0000-000000000001',
    'enterprise' -- Legacy column fallback
)
ON CONFLICT (id) DO UPDATE 
SET 
    slug = 'axiom-master',
    name = 'Axiom Master';

-- 4. Force Link 'accessfisio@gmail.com' to Master Org
UPDATE public.profiles
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin'
WHERE email = 'accessfisio@gmail.com';

-- 5. Verification
SELECT email, organization_id, role FROM public.profiles WHERE email LIKE 'accessfisio%';
