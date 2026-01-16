
-- FIX MASTER USER (accessfisio@gmail.com)
-- 1. Reset Password to '123'
-- 2. Link to Axiom Master Organization (0000...0001)
-- 3. Grant Admin Role

DO $$
DECLARE
    target_email text := 'accessfisio@gmail.com';
    target_user_id uuid;
    master_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- A. Find User ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- B. Reset Password (Aggressive)
        UPDATE auth.users
        SET encrypted_password = crypt('123', gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}',
            raw_user_meta_data = '{"full_name": "Access Fisio Master"}'
        WHERE id = target_user_id;

        -- C. Link to Organization & Profile
        INSERT INTO public.profiles (id, email, organization_id, role, full_name)
        VALUES (
            target_user_id, 
            target_email, 
            master_org_id, 
            'admin',
            'Access Fisio Master'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            organization_id = master_org_id,
            role = 'admin';
            
        RAISE NOTICE 'SUCCESS: Master User % fixed and linked.', target_email;
    ELSE
        RAISE NOTICE 'ERROR: User % does not exist via SQL. Please Sign Up first or use the Create User script.', target_email;
    END IF;
END $$;
