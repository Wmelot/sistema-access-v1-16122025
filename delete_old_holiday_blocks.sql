-- Delete all holiday blocks to recreate with correct dates
DELETE FROM appointments 
WHERE type = 'block' 
AND notes LIKE 'Feriado:%'
AND organization_id = (SELECT id FROM organizations WHERE slug = 'access-fisioterapia');
