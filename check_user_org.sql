-- Verificar o estado atual do usuário wmelot@gmail.com
SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    p.organization_id,
    o.name as org_name,
    o.slug as org_slug
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.email = 'wmelot@gmail.com';

-- Verificar todas as organizações
SELECT id, name, slug, created_at 
FROM organizations 
ORDER BY created_at;
