
-- CHECK MASTER USER STATUS
-- Verifies why the user is being kicked out of the Admin Panel.

SELECT 
    u.email as auth_email,
    p.full_name,
    p.role,
    p.organization_id,
    o.name as organization_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.organizations o ON o.id = p.organization_id
WHERE u.email LIKE 'accessfisio%';
