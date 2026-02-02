SELECT 
    id, 
    title, 
    description,
    is_active,
    created_at,
    updated_at
FROM form_templates 
WHERE is_active = true
ORDER BY created_at DESC;
