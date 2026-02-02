-- Check ALL forms (without deleted_at column)
SELECT 
    id, 
    title, 
    type,
    is_active,
    created_at,
    updated_at
FROM form_templates 
ORDER BY created_at DESC;
