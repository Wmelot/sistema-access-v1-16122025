-- ============================================
-- 🔒 VERIFICAÇÃO E CORREÇÃO DE RLS
-- Row Level Security - Isolamento de Dados
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para garantir que NENHUM usuário vê dados
-- de outra organização
-- ============================================

-- ============================================
-- 1. VERIFICAR POLÍTICAS RLS EXISTENTES
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 2. VERIFICAR QUAIS TABELAS TÊM RLS ATIVO
-- ============================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 3. ATIVAR RLS EM TODAS AS TABELAS PRINCIPAIS
-- ============================================

-- Tabelas que DEVEM ter RLS ativo:
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CRIAR POLÍTICAS RLS PARA ISOLAMENTO
-- ============================================

-- IMPORTANTE: Estas políticas garantem que cada usuário
-- só vê dados da própria organização

-- ============================================
-- 4.1. PATIENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view patients from their organization" ON public.patients;
CREATE POLICY "Users can view patients from their organization"
ON public.patients FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert patients in their organization" ON public.patients;
CREATE POLICY "Users can insert patients in their organization"
ON public.patients FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update patients from their organization" ON public.patients;
CREATE POLICY "Users can update patients from their organization"
ON public.patients FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete patients from their organization" ON public.patients;
CREATE POLICY "Users can delete patients from their organization"
ON public.patients FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 4.2. APPOINTMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view appointments from their organization" ON public.appointments;
CREATE POLICY "Users can view appointments from their organization"
ON public.appointments FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert appointments in their organization" ON public.appointments;
CREATE POLICY "Users can insert appointments in their organization"
ON public.appointments FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update appointments from their organization" ON public.appointments;
CREATE POLICY "Users can update appointments from their organization"
ON public.appointments FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete appointments from their organization" ON public.appointments;
CREATE POLICY "Users can delete appointments from their organization"
ON public.appointments FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 4.3. SERVICES
-- ============================================

DROP POLICY IF EXISTS "Users can view services from their organization" ON public.services;
CREATE POLICY "Users can view services from their organization"
ON public.services FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can manage services in their organization" ON public.services;
CREATE POLICY "Users can manage services in their organization"
ON public.services FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 4.4. INVOICES
-- ============================================

DROP POLICY IF EXISTS "Users can view invoices from their organization" ON public.invoices;
CREATE POLICY "Users can view invoices from their organization"
ON public.invoices FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can manage invoices in their organization" ON public.invoices;
CREATE POLICY "Users can manage invoices in their organization"
ON public.invoices FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 4.5. PROFILES
-- ============================================

-- Profiles: Usuários podem ver outros da mesma organização
DROP POLICY IF EXISTS "Users can view profiles from their organization" ON public.profiles;
CREATE POLICY "Users can view profiles from their organization"
ON public.profiles FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
    OR id = auth.uid() -- Sempre pode ver o próprio perfil
);

-- Profiles: Usuários podem atualizar o próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 4.6. ORGANIZATIONS
-- ============================================

-- Organizations: Usuários podem ver a própria organização
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- Organizations: Apenas owners podem atualizar
DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;
CREATE POLICY "Owners can update their organization"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- ============================================
-- 5. POLÍTICA ESPECIAL PARA MASTER
-- ============================================

-- Master pode ver TUDO (apenas para Warley)
DROP POLICY IF EXISTS "Master can view all organizations" ON public.organizations;
CREATE POLICY "Master can view all organizations"
ON public.organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'master'
    )
);

-- ============================================
-- 6. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================

SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No condition'
    END as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('patients', 'appointments', 'services', 'invoices', 'profiles', 'organizations')
ORDER BY tablename, policyname;

-- ============================================
-- 7. TESTE DE ISOLAMENTO
-- ============================================

-- Execute como usuário normal (não master):
-- Deve retornar APENAS dados da organização do usuário

SELECT 
    'patients' as table_name,
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT organization_id) as org_ids
FROM public.patients
UNION ALL
SELECT 
    'appointments',
    COUNT(*),
    ARRAY_AGG(DISTINCT organization_id)
FROM public.appointments
UNION ALL
SELECT 
    'services',
    COUNT(*),
    ARRAY_AGG(DISTINCT organization_id)
FROM public.services;

-- ============================================
-- ✅ CHECKLIST DE SEGURANÇA
-- ============================================

/*
[ ] RLS ativo em todas as tabelas principais
[ ] Políticas criadas para SELECT, INSERT, UPDATE, DELETE
[ ] Teste com usuário não-master
[ ] Verificar que usuário NÃO vê dados de outras orgs
[ ] Verificar que master VÊ todos os dados
[ ] Documentar políticas RLS
*/

-- ============================================
-- 📝 NOTAS IMPORTANTES
-- ============================================

/*
1. SEMPRE use organization_id para filtrar dados
2. NUNCA confie apenas no frontend para filtrar
3. RLS é a ÚLTIMA linha de defesa
4. Teste regularmente com usuários de teste
5. Monitore logs de acesso suspeitos
*/
