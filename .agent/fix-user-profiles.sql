-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO DE USUÁRIOS SEM ORGANIZAÇÃO
-- ============================================================================

-- PASSO 1: Verificar todos os usuários e seus perfis
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created,
    p.id as profile_id,
    p.full_name,
    p.organization_id,
    o.name as org_name,
    o.slug as org_slug,
    CASE 
        WHEN p.id IS NULL THEN '❌ SEM PERFIL'
        WHEN p.organization_id IS NULL THEN '❌ SEM ORGANIZAÇÃO'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN organizations o ON p.organization_id = o.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- PASSO 2: Encontrar usuários problemáticos
-- ============================================================================

-- Usuários sem perfil
SELECT 
    au.id,
    au.email,
    'Sem perfil criado' as problema
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Usuários sem organization_id
SELECT 
    p.id,
    p.email,
    p.full_name,
    'Sem organization_id' as problema
FROM profiles p
WHERE p.organization_id IS NULL;

-- ============================================================================
-- PASSO 3: CORREÇÃO AUTOMÁTICA
-- ============================================================================

-- Criar perfis para usuários que não têm
-- (Vincula à primeira organização encontrada)
DO $$
DECLARE
    default_org_id UUID;
    user_rec RECORD;
BEGIN
    -- Pegar primeira organização (Access Fisioterapia)
    SELECT id INTO default_org_id 
    FROM organizations 
    ORDER BY created_at 
    LIMIT 1;

    IF default_org_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma organização encontrada! Crie uma primeiro.';
    END IF;

    -- Criar perfis para usuários sem perfil
    FOR user_rec IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO profiles (id, email, organization_id, full_name, role)
        VALUES (
            user_rec.id,
            user_rec.email,
            default_org_id,
            split_part(user_rec.email, '@', 1), -- Nome baseado no email
            'user' -- Role padrão
        );
        
        RAISE NOTICE 'Perfil criado para: %', user_rec.email;
    END LOOP;

    -- Atualizar perfis sem organization_id
    UPDATE profiles
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Correção concluída!';
END $$;

-- ============================================================================
-- PASSO 4: VERIFICAÇÃO FINAL
-- ============================================================================

-- Contar usuários por status
SELECT 
    COUNT(*) FILTER (WHERE p.id IS NULL) as sem_perfil,
    COUNT(*) FILTER (WHERE p.organization_id IS NULL) as sem_org,
    COUNT(*) FILTER (WHERE p.id IS NOT NULL AND p.organization_id IS NOT NULL) as ok,
    COUNT(*) as total
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;

-- ============================================================================
-- PASSO 5: LIMPAR USUÁRIOS DE TESTE (OPCIONAL)
-- ============================================================================

-- CUIDADO: Isso vai deletar usuários de teste!
-- Descomente apenas se tiver certeza

-- DELETE FROM auth.users 
-- WHERE email LIKE '%teste%' 
--   OR email LIKE '%test%';

-- RAISE NOTICE 'Usuários de teste removidos';

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

SELECT 
    '✅ DIAGNÓSTICO COMPLETO' as status,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE organization_id IS NOT NULL) as profiles_with_org,
    (SELECT COUNT(*) FROM organizations) as total_orgs;
