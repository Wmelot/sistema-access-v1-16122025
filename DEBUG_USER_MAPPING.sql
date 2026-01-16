
-- DEBUG USER MAPPING
-- Find the exact Auth User and check if they really have a profile.

SELECT 
    au.id AS auth_id, 
    au.email AS auth_email,
    au.created_at AS auth_created,
    p.id AS profile_id,
    p.email AS profile_email,
    p.organization_id
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email ILIKE '%accessfisio%'; 
-- Using ILIKE to ignore lowercase/uppercase differences
