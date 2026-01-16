-- Check ALL forms in current database (no filters)
SELECT 
    id, 
    title, 
    type,
    is_active,
    created_at
FROM form_templates 
ORDER BY title;
