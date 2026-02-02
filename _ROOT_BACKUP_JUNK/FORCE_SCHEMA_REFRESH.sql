
-- FORCE SCHEMA REFRESH (O Despertador Potente)
-- O 'reload config' foi ignorado pelo sistema.
-- Vamos fazer uma mudança inofensiva nas tabelas para OBRIGAR o sistema a atualizar o cache.

-- 1. Cria um comentário na tabela (isso força update de schema)
COMMENT ON TABLE public.clinical_protocols IS 'Schema Refresh Triggered by Fix';
COMMENT ON TABLE public.reminders IS 'Schema Refresh Triggered by Fix';
COMMENT ON TABLE public.patient_assessments IS 'Schema Refresh Triggered by Fix';

-- 2. Tenta o reload normal de novo (pra garantir)
NOTIFY pgrst, 'reload config';

-- 3. Confirmação
SELECT 'Schema Refreshed Successfully' as status;
