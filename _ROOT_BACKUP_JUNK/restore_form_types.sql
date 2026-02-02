-- 1. Add type column to form_templates
ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'assessment';

-- 2. Set type for existing forms based on title patterns
-- Questionários = questionnaire
UPDATE form_templates 
SET type = 'questionnaire'
WHERE title ILIKE '%questionário%' 
   OR title ILIKE '%escala%'
   OR title ILIKE '%HOOS%'
   OR title ILIKE '%KOOS%'
   OR title ILIKE '%WOMAC%'
   OR title ILIKE '%Lysholm%';

-- 3. Avaliações = assessment (default, already set)
UPDATE form_templates 
SET type = 'assessment'
WHERE title ILIKE '%avaliação%'
   OR title ILIKE '%palmilha%'
   OR title ILIKE '%assessment%';

-- 4. Evoluções = evolution
UPDATE form_templates 
SET type = 'evolution'
WHERE title ILIKE '%evolução%'
   OR title ILIKE '%evolution%';

-- 5. Show results
SELECT id, title, type, is_active FROM form_templates ORDER BY created_at DESC;
