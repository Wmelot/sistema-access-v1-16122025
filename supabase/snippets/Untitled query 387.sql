-- 1. Ativa o seu e-mail pulando a coluna protegida
UPDATE auth.users 
SET email_confirmed_at = now(),
    last_sign_in_at = now()
WHERE email = 'wmelot@gmail.com';

-- 2. Te transforma em Admin Mestre da Axiom (sem organização fixa)
UPDATE public.profiles 
SET role = 'admin', 
    organization_id = NULL 
WHERE email = 'wmelot@gmail.com';

-- 3. Cria a organização Axiom Master no banco local
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'SISTEMA MESTRE AXIOM')
ON CONFLICT (id) DO NOTHING;