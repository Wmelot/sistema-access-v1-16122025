-- Diagnostic: Check User Role and Permissions
select 
    p.full_name, 
    r.name as role_name, 
    perm.code as permission_code
from profiles p
left join roles r on p.role_id = r.id
left join role_permissions rp on r.id = rp.role_id
left join permissions perm on rp.permission_id = perm.id
where p.full_name ilike '%teste%' or p.email ilike '%teste%';
