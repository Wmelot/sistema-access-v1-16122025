
-- FIX SAAS DATA (MISSING ORGANIZATION)
-- If the "Axiom Master" organization is missing, the Trigger fails to create the user.
-- This script guarantees the organization exists.

-- 1. Insert the Default Plan if missing
INSERT INTO public.plan_configs (id, name, max_professionals, price_monthly)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pro', 10, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert the Default Organization if missing
INSERT INTO public.organizations (id, name, slug, plan_config_id)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Axiom Master', 
    'axiom-master', 
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE 
SET name = 'Axiom Master'; -- Just to show it ran

-- 3. Verify Constraints (Optional but good)
-- Ensure 'profiles' table actually has the FK constraint (it should)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_organization_id_fkey') THEN
        ALTER TABLE "public"."profiles" 
        ADD CONSTRAINT "profiles_organization_id_fkey" 
        FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");
    END IF;
END $$;

SELECT 'SUCCESS: Organization Data Verified' as status;
