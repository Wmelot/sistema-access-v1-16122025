
SELECT 
    au.email, 
    p.full_name, 
    p.role,
    om.organization_id,
    o.name as org_name
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN organization_members om ON om.user_id = p.id
JOIN organizations o ON o.id = om.organization_id
WHERE au.email = 'wmelot@gmail.com';
