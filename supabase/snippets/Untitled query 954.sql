-- 1. Desativa temporariamente as travas para podermos limpar tudo
SET session_replication_role = 'replica';

-- 2. Deleta qualquer rastro dos e-mails para começar do zero absoluto
DELETE FROM public.profiles WHERE email IN ('accessfisio@gmail.com', 'wmelot@gmail.com');
DELETE FROM auth.users WHERE email IN ('accessfisio@gmail.com', 'wmelot@gmail.com');

-- 3. Reativa as travas de segurança
SET session_replication_role = 'origin';

-- 4. Cria o seu USUÁRIO MESTRE (Senha: Axiom2026)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, instance_id)
VALUES (
    gen_random_uuid(), 
    'accessfisio@gmail.com', 
    crypt('Axiom2026', gen_salt('bf')), 
    now(), 
    'authenticated', 
    'authenticated', 
    '00000000-0000-0000-0000-000000000000'
) RETURNING id;

-- 5. Cria o seu PERFIL AXIOM (NULL no organization_id libera o painel geral)
INSERT INTO public.profiles (id, email, role, organization_id)
SELECT id, email, 'admin', NULL 
FROM auth.users 
WHERE email = 'accessfisio@gmail.com';