
-- FIX WMELOT MASTER
-- "accessfisio@gmail.com" gives 0 rows, but "wmelot@gmail.com" IS in the list.
-- We will make wmelot@gmail.com the Master Admin.

DO $$
DECLARE
    target_email text := 'wmelot@gmail.com';
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Ensure Master Org Exists (Safe mode)
    INSERT INTO public.organizations (id, name, slug, plan_config_id)
    VALUES (master_org_id, 'Axiom Master', 'axiom-master', master_org_id)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Update Profile to Master Org
    UPDATE public.profiles
    SET 
        organization_id = master_org_id,
        role = 'admin'
    WHERE email = target_email;

    -- 3. Verification
    RAISE NOTICE 'Updated % to Master Organization %', target_email, master_org_id;
END $$;

SELECT email, organization_id, role FROM public.profiles WHERE email = 'wmelot@gmail.com';
