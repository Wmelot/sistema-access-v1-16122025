
-- CREATE OR RESET ADMIN USER (Supabase Auth + Public Profile)

-- 1. Create User in auth.users (Password: '123456')
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '34812328-305d-4f7f-83de-a83232230491', -- FIXED UUID
    'authenticated',
    'authenticated',
    'wmelot@gmail.com', -- YOUR EMAIL
    crypt('123456', gen_salt('bf')), -- PASSWORD: 123456
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Warley Melo"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Link to Organization (Create Profile)
INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    organization_id,
    created_at
) VALUES (
    '34812328-305d-4f7f-83de-a83232230491', -- SAME UUID
    'wmelot@gmail.com',
    'admin',
    'Warley Melo',
    '00000000-0000-0000-0000-000000000001', -- LINK TO DEFAULT ORGANIZATION
    NOW()
) ON CONFLICT (id) DO UPDATE 
SET organization_id = '00000000-0000-0000-0000-000000000001', role = 'admin';

-- 3. Ensure Permissions
-- (Already handled by RLS if role is 'admin', but good to be safe)
