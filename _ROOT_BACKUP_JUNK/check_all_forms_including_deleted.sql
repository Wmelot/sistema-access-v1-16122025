-- Check ALL forms including deleted and inactive
SELECT 
    id, 
    title, 
    type,
    is_active,
    created_at,
    updated_at,
    deleted_at
FROM form_templates 
ORDER BY created_at DESC;
