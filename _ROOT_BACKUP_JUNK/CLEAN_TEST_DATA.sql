-- ============================================
-- 🧹 LIMPEZA DE BASE DE TESTES (Access Fisioterapia)
-- ============================================
-- Este script remove agendamentos e pacientes de teste
-- sem afetar configurações, serviços ou profissionais.
-- ============================================

-- DEFINA O ID DA ORGANIZAÇÃO (Access Fisioterapia)
DO $$
DECLARE
    target_org_id UUID := '9571532e-fdf8-4aaa-b236-416fd6459566';
BEGIN
    -- 1. Remover Logs, Lembretes e Questionários
    DELETE FROM public.message_logs WHERE organization_id = target_org_id;
    DELETE FROM public.reminders WHERE organization_id = target_org_id;
    DELETE FROM public.assessment_follow_ups WHERE organization_id = target_org_id;
    DELETE FROM public.waiting_list WHERE organization_id = target_org_id;
    
    -- 2. Remover Transações e Faturas de teste
    DELETE FROM public.financial_transactions WHERE organization_id = target_org_id;
    DELETE FROM public.invoices WHERE organization_id = target_org_id;

    -- 3. Remover Agendamentos
    DELETE FROM public.appointments WHERE organization_id = target_org_id;
    
    -- 4. Remover Dados Clínicos (Avaliações e Documentos)
    DELETE FROM public.assessments WHERE organization_id = target_org_id;
    -- Descomente se quiser limpar também os arquivos/docs
    -- DELETE FROM public.patient_documents WHERE organization_id = target_org_id;
    
    -- 5. Remover Pacientes (Base Final)
    DELETE FROM public.patients WHERE organization_id = target_org_id;

    RAISE NOTICE 'Base de testes da Access Fisioterapia limpa com sucesso!';
END $$;
