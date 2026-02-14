-- ============================================================
-- AXIOM: Política de Retenção de Logs (LGPD + Padrão Premium)
-- ============================================================
-- Baseado em: LGPD (Lei 13.709/2018), CFM 1.821/2007, ISO 27001
--
-- Camadas:
--   1. audit_logs    → 20 anos (modificações de dados clínicos)
--   2. access_logs   → 5 anos  (visualizações de prontuários)
--   3. session_logs  → 2 anos  (login/logout/tentativas)
--   4. system_logs   → 90 dias (erros e performance)
--
-- Este script cria as policies e funções necessárias.
-- Rode no Supabase SQL Editor.
-- ============================================================

-- 1. Garantir que access_logs existe com estrutura correta
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_org_id ON public.access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);

-- Índices para audit_logs (se não existirem)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);

-- 2. Comentários de documentação (aparecem no Supabase Dashboard)
COMMENT ON TABLE public.audit_logs IS 'Registros de auditoria (LGPD). Criação, edição e exclusão de dados. Retenção: 20 anos.';
COMMENT ON TABLE public.access_logs IS 'Registros de acesso a dados sensíveis (LGPD). Visualizações de prontuários. Retenção: 5 anos.';

-- 3. Função de limpeza automática (para rodar com pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    access_deleted INTEGER;
    audit_archived INTEGER;
BEGIN
    -- Limpar access_logs com mais de 5 anos
    DELETE FROM public.access_logs
    WHERE created_at < NOW() - INTERVAL '5 years';
    GET DIAGNOSTICS access_deleted = ROW_COUNT;

    -- Não deletar audit_logs (retenção de 20 anos para LGPD/CFM)
    -- Apenas registrar quantos têm mais de 5 anos (para monitoramento)
    SELECT COUNT(*) INTO audit_archived
    FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '5 years';

    -- Log da limpeza
    RAISE NOTICE 'Log cleanup: % access_logs removed, % audit_logs older than 5y (kept)', access_deleted, audit_archived;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_logs IS 'Limpeza automática de logs antigos. Access logs: 5 anos. Audit logs: mantidos (20 anos LGPD/CFM).';

-- 4. (OPCIONAL) Se pg_cron estiver habilitado no seu plano Supabase:
-- Rodar limpeza todo dia 1 do mês às 3:00 AM UTC
-- SELECT cron.schedule('monthly-log-cleanup', '0 3 1 * *', 'SELECT public.cleanup_old_logs()');

-- 5. View para métricas de logs (útil para o Dashboard Master)
CREATE OR REPLACE VIEW public.log_metrics AS
SELECT
    'audit_logs' AS log_type,
    COUNT(*) AS total_records,
    MIN(created_at) AS oldest_record,
    MAX(created_at) AS newest_record,
    pg_size_pretty(pg_total_relation_size('public.audit_logs')) AS table_size
FROM public.audit_logs
UNION ALL
SELECT
    'access_logs' AS log_type,
    COUNT(*) AS total_records,
    MIN(created_at) AS oldest_record,
    MAX(created_at) AS newest_record,
    pg_size_pretty(pg_total_relation_size('public.access_logs')) AS table_size
FROM public.access_logs;

COMMENT ON VIEW public.log_metrics IS 'Métricas consolidadas de todos os logs do sistema.';
