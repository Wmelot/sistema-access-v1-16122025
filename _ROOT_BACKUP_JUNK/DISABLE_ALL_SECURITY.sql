
-- DISABLE ALL SECURITY (MODO PÂNICO)
-- Você pediu, eu obedeço: Removendo TODAS as travas de segurança.
-- O objetivo é ver os dados na tela, custe o que custar.

BEGIN;

-- 1. Desativar RLS em TUDO (Pacientes, Agendamentos, Perfis, etc)
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_protocols DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_settings DISABLE ROW LEVEL SECURITY;

-- 2. Grant Explícito (Liberar acesso para o 'authenticated')
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;

-- 3. Verificação (Confirma que RLS está 'DISABLED' para patients)
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'patients';
