-- 20260110140000_fix_superuser.sql

-- 1. Ensure 'Axiom Central' (Master) Exists
INSERT INTO public.organizations (id, name, primary_color, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Axiom Central', '#000000', 'enterprise')
ON CONFLICT (id) DO UPDATE 
SET name = 'Axiom Central';

-- 2. Ensure 'Access Fisioterapia' (Client) Exists
INSERT INTO public.organizations (id, name, primary_color, plan)
VALUES ('00000000-0000-0000-0000-000000000002', 'Access Fisioterapia', '#15803d', 'pro')
ON CONFLICT (id) DO UPDATE 
SET name = 'Access Fisioterapia';

-- 3. Create Function to Auto-Promote Users based on Email
CREATE OR REPLACE FUNCTION public.auto_promote_superuser()
RETURNS TRIGGER AS $$
DECLARE
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
    client_org_id uuid := '00000000-0000-0000-0000-000000000002';
    admin_role_id uuid;
BEGIN
    -- Fetch 'Administrador' Role ID
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Administrador' OR name = 'Admin' ORDER BY id LIMIT 1;

    -- Case 1: Master Super Admin
    IF NEW.email = 'accessfisio@gmail.com' THEN
        NEW.organization_id := master_org_id;
        IF admin_role_id IS NOT NULL THEN
            NEW.role_id := admin_role_id;
        END IF;
        NEW.role := 'admin'; 
        
    -- Case 2: Clinic Admin
    ELSIF NEW.email = 'wmelot@gmail.com' THEN
        NEW.organization_id := client_org_id;
        IF admin_role_id IS NOT NULL THEN
            NEW.role_id := admin_role_id;
        END IF;
        NEW.role := 'admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger on Profiles (Before Insert)
DROP TRIGGER IF EXISTS trg_auto_promote_superuser ON public.profiles;

CREATE TRIGGER trg_auto_promote_superuser
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_promote_superuser();

-- 5. Backfill: Update existing users if they exist
DO $$
DECLARE
    admin_role_id uuid;
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
    client_org_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Administrador' OR name = 'Admin' ORDER BY id LIMIT 1;

    -- Update Master
    UPDATE public.profiles
    SET organization_id = master_org_id, role_id = admin_role_id, role = 'admin'
    WHERE email = 'accessfisio@gmail.com';

    -- Update Client
    UPDATE public.profiles
    SET organization_id = client_org_id, role_id = admin_role_id, role = 'admin'
    WHERE email = 'wmelot@gmail.com';
END $$;

-- 6. RLS: Allow Master Org to View ALL Organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

CREATE POLICY "Users can view their own organization OR Master can view all"
ON public.organizations FOR SELECT
USING (
    -- Standard User: View own
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR
    -- Master Admin: View All
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND organization_id = '00000000-0000-0000-0000-000000000001'
    )
);
