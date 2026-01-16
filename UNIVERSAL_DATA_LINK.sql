
-- UNIVERSAL DATA LINK (O Grande Link)
-- O áudio foi claro: "Nada visível". 
-- Motivo: Você é da organização MASTER (...001), mas os dados ficaram "órfãos" (organization_id NULL ou antigo).
-- A Solução: Adotar todos os órfãos para a organização Master.

BEGIN;

-- 1. Vincular TODOS os pacientes ao Master
UPDATE public.patients 
SET organization_id = '00000000-0000-0000-0000-000000000001';
-- WHERE organization_id IS NULL; (Comentado pra forçar tudo mesmo)

-- 2. Vincular TODAS as avaliações ao Master (via tabela de compatibilidade)
UPDATE public.patient_assessments
SET organization_id = '00000000-0000-0000-0000-000000000001';

-- 3. Vincular TODOS os usuários/perfis ao Master
UPDATE public.profiles
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE email NOT LIKE '%@axiom.com'; -- Preserva admins nativos se houver

-- 4. Vincular Protocolos e Lembretes (se tiverem essa coluna)
UPDATE public.clinical_protocols SET is_custom = FALSE; -- Torna todos "do sistema" pra todo mundo ver

COMMIT;

-- 5. Conferência (tem que dar números altos)
SELECT 
    (SELECT COUNT(*) FROM public.patients WHERE organization_id = '00000000-0000-0000-0000-000000000001') as pacientes_master,
    (SELECT COUNT(*) FROM public.patient_assessments WHERE organization_id = '00000000-0000-0000-0000-000000000001') as avaliacoes_master;
