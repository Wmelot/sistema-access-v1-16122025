-- Fix Organization IDs to match 'Access Fisioterapia'
UPDATE patients 
SET organization_id = '9571532e-fdf8-4aaa-b236-416fd6459566' 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';

UPDATE appointments 
SET organization_id = '9571532e-fdf8-4aaa-b236-416fd6459566' 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';
