-- Check all questionnaires (type = 'questionnaire')
SELECT 
    id, 
    title, 
    type,
    is_active,
    created_at
FROM form_templates 
WHERE type = 'questionnaire' OR type IS NULL
ORDER BY created_at DESC;
