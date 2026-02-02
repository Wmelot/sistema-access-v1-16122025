
-- FIX SAAS STRUCTURE (O Upgrade Obrigatório)
-- O erro anterior provou: A tabela 'patients' é antiga e não tem o campo 'organization_id'.
-- Por isso você não vê nada: O sistema novo procura uma etiqueta que não existe.

BEGIN;

-- 1. Adicionar coluna na tabela Pacientes (se não existir)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- 2. Adicionar coluna na tabela Avaliações (se não existir)
ALTER TABLE public.patient_assessments
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- 3. Adicionar coluna na tabela Lembretes (se não existir)
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- 4. FORÇAR vínculo de tudo com o Master (Axiom Central)
-- Isso garante que todos os dados antigos apareçam para você.
UPDATE public.patients SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.patient_assessments SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE email NOT LIKE '%@axiom.com'; 

-- 5. Liberar Protocolos (Tornar globais/sistema)
UPDATE public.clinical_protocols SET is_custom = FALSE;

COMMIT;

-- 6. Conferência Final (Se os dois números forem iguais, SUCESSO)
SELECT 
    (SELECT COUNT(*) FROM public.patients) as total_pacientes,
    (SELECT COUNT(*) FROM public.patients WHERE organization_id = '00000000-0000-0000-0000-000000000001') as meus_pacientes_master;
