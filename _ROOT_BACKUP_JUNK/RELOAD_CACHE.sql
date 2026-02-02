
-- RELOAD CACHE & CHECK REMINDERS (A Limpeza Final)
-- 1. Força o Supabase a "ler de novo" o banco (corrige o erro PGRST205).
NOTIFY pgrst, 'reload config';

-- 2. Conta chaves das outras tabelas para te dar paz de espírito
SELECT 
    (SELECT COUNT(*) FROM public.reminders) as total_reminders,
    (SELECT COUNT(*) FROM public.clinical_protocols) as total_protocols,
    (SELECT COUNT(*) FROM public.patient_assessments) as total_avaliacoes;

-- 3. Garante acesso liberado (Limpeza de terreno)
GRANT ALL ON public.assessments TO postgres, authenticated, service_role;
GRANT ALL ON public.reminders TO postgres, authenticated, service_role;
GRANT ALL ON public.clinical_protocols TO postgres, authenticated, service_role;
