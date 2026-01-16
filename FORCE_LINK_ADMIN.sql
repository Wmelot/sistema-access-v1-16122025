
-- FORCE LINK ADMIN TO ORGANIZATION
-- Since the user already exists, the "New User Trigger" won't run.
-- We must manually link 'wmelot@gmail.com' to the 'Axiom Master' organization.

DO $$
DECLARE
    target_user_id uuid;
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Get the User ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'wmelot@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- 2. Insert or Update the Profile
        INSERT INTO public.profiles (id, email, organization_id, role, full_name)
        VALUES (
            target_user_id, 
            'wmelot@gmail.com', 
            master_org_id, 
            'admin',
            'Warley Admin'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            organization_id = master_org_id,
            role = 'admin';
            
        RAISE NOTICE 'SUCCESS: User linked to Org %', master_org_id;
    ELSE
        RAISE NOTICE 'WARNING: User wmelot@gmail.com not found in auth.users';
    END IF;
END $$;
