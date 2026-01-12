-- 1. Cria a organização '001' que o layout.tsx exige
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'AXIOM MASTER')
ON CONFLICT (id) DO NOTHING;

-- 2. Vincula o seu e-mail mestre a essa organização específica
UPDATE public.profiles 
SET role = 'admin', 
    organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE email = 'accessfisio@gmail.com';