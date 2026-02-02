
-- CHECK PATIENTS SCHEMA
-- O log de erro reclamou de "column gender does not exist".
-- Vamos ver quais colunas realmente existem na tabela patients.

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY column_name;
