-- 20251228190000_create_organizations.sql

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    plan TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Default Organization (Access Fisioterapia)
INSERT INTO public.organizations (id, name, primary_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'Access Fisioterapia', '#15803d') -- #15803d is green-700
ON CONFLICT (id) DO NOTHING;

-- 3. Add FK to Patients and Profiles (if not exists)
-- Logic: If column users has organization_id, add FK constraint.
-- Note: We already have organization_id column, we just need the FK.

-- Profiles FK
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_organization_id_fkey') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
    END IF;
END $$;

-- Patients FK
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'patients_organization_id_fkey') THEN
        ALTER TABLE public.patients 
        ADD CONSTRAINT patients_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
    END IF;
END $$;

-- 4. Backfill: Assign all existing profiles/patients to Default Org if null
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.patients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- 5. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT 
USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can update their organization" 
ON public.organizations FOR UPDATE 
USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
    AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
