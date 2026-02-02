-- Check Warley's profile and permissions
SELECT 
    p.id,
    p.full_name,
    p.role,
    r.name as role_name,
    p.role_id
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.full_name ILIKE '%warley%';

-- Check role permissions for Master role
SELECT 
    r.name as role_name,
    perm.code as permission_code,
    perm.description
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE r.name ILIKE '%master%'
ORDER BY perm.code;
