-- 1. Create 'followup' type if not exists (using text field so no need to create enum)

-- 2. Update specific forms to 'followup' type
UPDATE form_templates 
SET type = 'followup'
WHERE 
    (title ILIKE '%Consulta Palmilha%' 
    OR title ILIKE '%Acompanhamento%'
    OR title ILIKE '%Satisfação%'
    OR title ILIKE '%Feedback%')
    AND type = 'questionnaire'; -- Only migrate those currently marked as questionnaire (imported ones)

-- 3. Verify types
SELECT id, title, type FROM form_templates ORDER BY type, title;
