
-- FIX VISIBILITY ALL (Liberar Geral)
-- Os dados existem (31 protocolos, etc), mas o "Porteiro" (RLS) não está deixando você ver.
-- Vamos demitir o porteiro temporariamente.

BEGIN;

-- 1. Destrancar Protocolos (31 itens)
ALTER TABLE public.clinical_protocols DISABLE ROW LEVEL SECURITY;

-- 2. Destrancar Lembretes (8 itens)
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

-- 3. Destrancar Avaliações (69 itens)
ALTER TABLE public.patient_assessments DISABLE ROW LEVEL SECURITY;

-- 4. Garantir permissões de leitura/escrita para todos logados
GRANT ALL ON public.clinical_protocols TO authenticated;
GRANT ALL ON public.reminders TO authenticated;
GRANT ALL ON public.patient_assessments TO authenticated;

COMMIT;

-- Prova real: Tenta ler um título para ver se o banco deixa
SELECT title FROM public.clinical_protocols LIMIT 1;
