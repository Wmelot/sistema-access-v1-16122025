-- RESTARAR ACESSO MASTER (RODE NO SUPABASE SQL EDITOR)

DO $$
DECLARE
    target_user_id UUID;
    org_id UUID;
    v_count integer;
BEGIN
    -- 1. Identificar o usuário wmelot@gmail.com
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'wmelot@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuário wmelot@gmail.com NÃO encontrado na tabela auth.users. Verifique o e-mail.';
        RETURN;
    END IF;

    RAISE NOTICE 'Usuário encontrado: %', target_user_id;

    -- 2. Garantir que a organização "Access Fisioterapia" existe
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'access-fisioterapia';

    IF org_id IS NULL THEN
        RAISE NOTICE 'Criando organização Access Fisioterapia...';
        INSERT INTO public.organizations (name, slug, type, status)
        VALUES ('Access Fisioterapia', 'access-fisioterapia', 'clinic', 'active')
        RETURNING id INTO org_id;
    ELSE
        RAISE NOTICE 'Organização Access Fisioterapia encontrada: %', org_id;
        -- Garante que está ativa
        UPDATE public.organizations SET status = 'active' WHERE id = org_id;
    END IF;

    -- 3. Corrigir/Criar o Perfil do Usuário
    -- Verifica se já existe perfil
    SELECT count(*) INTO v_count FROM public.profiles WHERE id = target_user_id;

    IF v_count > 0 THEN
        -- Atualiza perfil existente para ser Admin e dono da Org
        UPDATE public.profiles
        SET organization_id = org_id,
            role = 'admin',   -- ou 'super_admin' dependendo do seu sistema
            full_name = 'Warley Melo' -- Garante nome
        WHERE id = target_user_id;
        RAISE NOTICE 'Perfil atualizado e vinculado.';
    ELSE
        -- Cria perfil se não existir (o erro de login pode ser por falta de perfil)
        INSERT INTO public.profiles (id, user_id, email, full_name, role, organization_id)
        VALUES (target_user_id, target_user_id, 'wmelot@gmail.com', 'Warley Melo', 'admin', org_id);
        RAISE NOTICE 'Perfil criado e vinculado.';
    END IF;

    -- 4. Garantir permissões extras (exemplo: tabela tenants/users se houver)
    -- Opcional: Se houver tabela de ligação user_organizations ou tenants
    -- INSERT INTO public.organization_members ...

    RAISE NOTICE 'SUCESSO: wmelot@gmail.com vinculado a Access Fisioterapia.';

END $$;
