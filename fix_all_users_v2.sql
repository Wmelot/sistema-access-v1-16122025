
-- FIX USER ACCESS & RESET PASSWORDS (V2)

-- 1. Reset Warley (wmelot@gmail.com) if exists
UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = NOW(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'
WHERE email = 'wmelot@gmail.com';

-- Ensure Warley Profile
INSERT INTO public.profiles (id, email, role, full_name, organization_id)
SELECT id, email, 'admin', 'Warley Melo', '00000000-0000-0000-0000-000000000001'
FROM auth.users WHERE email = 'wmelot@gmail.com'
ON CONFLICT (id) DO UPDATE
SET organization_id = '00000000-0000-0000-0000-000000000001', role = 'admin';


-- 2. Handle Access Master (accessfisio@gmail.com)
DO $$
BEGIN
    -- Update if exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'accessfisio@gmail.com') THEN
        UPDATE auth.users
        SET encrypted_password = crypt('123456', gen_salt('bf')),
            email_confirmed_at = NOW()
        WHERE email = 'accessfisio@gmail.com';
    ELSE
        -- Insert if not exists
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'accessfisio@gmail.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Axiom Master"}',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Ensure Access Master Profile
INSERT INTO public.profiles (id, email, role, full_name, organization_id)
SELECT id, email, 'admin', 'Axiom Master', '00000000-0000-0000-0000-000000000001'
FROM auth.users WHERE email = 'accessfisio@gmail.com'
ON CONFLICT (id) DO UPDATE
SET organization_id = '00000000-0000-0000-0000-000000000001', role = 'admin';
