
-- INSERT WMELOT PROFILE (Fix "No rows returned")
-- User 'wmelot@gmail.com' exists in Auth but has no Profile.
-- We must CREATE the profile manually.

DO $$
DECLARE
    target_user_id uuid;
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Find the Auth ID for wmelot
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'wmelot@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- 2. Insert Profile
        INSERT INTO public.profiles (
            id, 
            email, 
            organization_id, 
            role, 
            full_name
        )
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
            
        RAISE NOTICE 'SUCCESS: Profile created for ID %', target_user_id;
    ELSE
        RAISE NOTICE 'ERROR: User wmelot@gmail.com not found in Auth!';
    END IF;
END $$;

-- Verification
SELECT * FROM public.profiles WHERE email = 'wmelot@gmail.com';
