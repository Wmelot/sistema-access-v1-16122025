
-- INSERT MASTER PROFILE (Fix "No rows returned")
-- The user exists in 'auth.users' (authorized) but NOT in 'public.profiles' (app data).
-- We must manually create this profile record.

DO $$
DECLARE
    target_user_id uuid;
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Get the Auth ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'accessfisio@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- 2. Insert the Profile (Force it)
        INSERT INTO public.profiles (
            id, 
            email, 
            organization_id, 
            role, 
            full_name
        )
        VALUES (
            target_user_id, 
            'accessfisio@gmail.com', 
            master_org_id, 
            'admin',
            'Access Fisio Master'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            organization_id = master_org_id,
            role = 'admin';
            
        RAISE NOTICE 'SUCCESS: Profile created for %', target_user_id;
    ELSE
        RAISE NOTICE 'ERROR: User accessfisio@gmail.com not found in auth system!';
    END IF;
END $$;

-- Verify again
SELECT * FROM public.profiles WHERE email = 'accessfisio@gmail.com';
