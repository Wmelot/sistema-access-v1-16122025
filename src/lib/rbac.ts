import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isMasterUser as checkIsMaster } from "@/lib/auth-master"

// Define Permission Codes type for safety
export type PermissionCode =
    | 'dashboard.view'
    | 'settings.view'
    | 'settings.edit'
    | 'roles.manage'
    | 'financial.view'
    | 'financial.manage'
    | 'financial.view_own'
    | 'financial.view_clinic'
    | 'financial.share_expenses'
    | 'schedule.view_all'
    | 'schedule.manage_all'
    | 'schedule.view_own'
    | 'schedule.manage_own'
    | 'patients.view'
    | 'patients.edit'
    | 'patients.delete'
    | 'system.view_logs'
    | 'system.manage_apis'
    | 'financial.transparency_view'
    // FINANCIAL TABS
    | 'financial.tabs.my_statement'
    | 'financial.tabs.general_statement'
    | 'financial.tabs.cash_flow'
    | 'financial.tabs.dre'
    | 'financial.tabs.settings'
    // UI PLACEMENT - SIDEBAR
    | 'sidebar.home.view'
    | 'sidebar.schedule.view'
    | 'sidebar.patients.view'
    | 'sidebar.financial.view'
    | 'sidebar.whatsapp.view'
    | 'sidebar.auditor.view'
    | 'sidebar.management.view'
    | 'sidebar.professionals.view'
    | 'sidebar.locations.view'
    | 'sidebar.services.view'
    | 'sidebar.forms.view'
    | 'sidebar.questionnaires.view'
    | 'sidebar.prices.view'
    | 'sidebar.products.view'
    | 'sidebar.marketing.view'
    | 'sidebar.users.view'
    | 'sidebar.roles.view'
    // UI PLACEMENT - USER MENU (Mapeado da FOTO 3)
    | 'user_menu.home.view'
    | 'user_menu.schedule.view'
    | 'user_menu.patients.view'
    | 'user_menu.financial.view'
    | 'user_menu.whatsapp.view'
    | 'user_menu.auditor.view'
    | 'user_menu.professionals.view'
    | 'user_menu.locations.view'
    | 'user_menu.services.view'
    | 'user_menu.forms.view'
    | 'user_menu.questionnaires.view'
    | 'user_menu.prices.view'
    | 'user_menu.products.view'
    | 'user_menu.marketing.view'
    | 'user_menu.users.view'
    | 'user_menu.roles.view'
    | 'settings.professionals.view'
    | 'settings.locations.view'
    | 'settings.services.view'
    | 'settings.forms.view'
    | 'settings.questionnaires.view'
    | 'settings.prices.view'
    | 'settings.products.view'
    | 'settings.marketplace.view'
    | 'settings.marketing.view'
    | 'settings.communication.view'
    | 'settings.identity.view'
    | 'settings.documents.view'
    | 'settings.intelligence.view'
    | 'settings.users.view'
    | 'settings.roles.view'
    | 'settings.audit.view'
    | 'settings.migration.view'
    | 'settings.support.view'
    | 'settings.dre.view'
    // SETTINGS TABS
    | 'settings.tabs.general'
    | 'settings.tabs.integrations'
    | 'settings.tabs.reports'
    | 'settings.tabs.intelligence'
    | 'settings.tabs.users'
    | 'settings.tabs.roles';

export const PERMISSION_METADATA: {
    code: PermissionCode;
    description: string;
    module: string;
    explanation?: string;
    featureGate?: string; // Links to organization.features key
}[] = [
        // GERAL / CORE
        { code: 'dashboard.view', description: 'Visualizar Painel', module: 'Menu Superior', explanation: 'Permite que o usuário veja o resumo de estatísticas na tela inicial.' },
        { code: 'patients.view', description: 'Pacientes: Visualizar Listagem', module: 'Gestão (Módulos)', explanation: 'Dá acesso à lista de pacientes e à busca global.', featureGate: 'records_module' },
        { code: 'patients.edit', description: 'Pacientes: Criar e Editar', module: 'Gestão (Módulos)', explanation: 'Permite alterar dados cadastrais e clínicos.', featureGate: 'records_module' },
        { code: 'patients.delete', description: 'Pacientes: Excluir Registro', module: 'Gestão (Módulos)', explanation: 'Permite apagar registros de pacientes.', featureGate: 'records_module' },
        { code: 'schedule.view_all', description: 'Agenda: Ver Tudo', module: 'Gestão (Módulos)', explanation: 'Visualiza as agendas de todos os profissionais.', featureGate: 'agenda_module' },
        { code: 'schedule.manage_all', description: 'Agenda: Gerenciar Tudo', module: 'Gestão (Módulos)', explanation: 'Pode marcar e editar horários de qualquer colega.', featureGate: 'agenda_module' },
        { code: 'schedule.view_own', description: 'Agenda: Ver Somente Própria', module: 'Gestão (Módulos)', explanation: 'Restringe a visão apenas aos seus próprios atendimentos.', featureGate: 'agenda_module' },
        { code: 'schedule.manage_own', description: 'Agenda: Gerenciar Somente Própria', module: 'Gestão (Módulos)', explanation: 'Dá autonomia apenas para seus próprios horários.', featureGate: 'agenda_module' },

        // FINANCEIRO CORE
        { code: 'financial.view', description: 'Financeiro: Ver Extratos', module: 'Gestão (Módulos)', explanation: 'Acesso básico ao financeiro.', featureGate: 'financial_module' },
        { code: 'financial.manage', description: 'Financeiro: Lançamentos', module: 'Gestão (Módulos)', explanation: 'Permite realizar baixas e editar lançamentos.', featureGate: 'financial_module' },
        { code: 'financial.view_clinic', description: 'Financeiro: Visão Geral Clínica', module: 'Gestão (Módulos)', explanation: 'Acesso total ao faturamento de todos.', featureGate: 'financial_module' },
        { code: 'financial.view_own', description: 'Financeiro: Visão Própria Produção', module: 'Gestão (Módulos)', explanation: 'Mostra apenas lucro individual.', featureGate: 'financial_module' },

        // SISTEMA CORE
        { code: 'settings.view', description: 'Configurações: Acesso Básico', module: 'Gestão (Módulos)', explanation: 'Acesso à central de configurações.' },
        { code: 'settings.edit', description: 'Configurações: Editar Dados Clínica', module: 'Gestão (Módulos)', explanation: 'Altera nome, logo e regras da clínica.' },
        { code: 'roles.manage', description: 'Segurança: Gerenciar Perfis/Acesso', module: 'Gestão (Módulos)', explanation: 'Cria e edita o que cada um pode ver.' },

        // MENU LATERAL (SIDEBAR)
        { code: 'sidebar.home.view', description: 'Sidebar: Tela Inicial', module: 'Menu Lateral', explanation: 'Fixa o link de início na barra lateral.' },
        { code: 'sidebar.schedule.view', description: 'Sidebar: Agenda', module: 'Menu Lateral', explanation: 'Fixa a agenda na barra lateral.', featureGate: 'agenda_module' },
        { code: 'sidebar.patients.view', description: 'Sidebar: Pacientes', module: 'Menu Lateral', explanation: 'Fixa pacientes na barra lateral.', featureGate: 'records_module' },
        { code: 'sidebar.financial.view', description: 'Sidebar: Finanças', module: 'Menu Lateral', explanation: 'Fixa o financeiro na barra lateral.', featureGate: 'financial_module' },
        { code: 'sidebar.whatsapp.view', description: 'Sidebar: WhatsApp', module: 'Menu Lateral', explanation: 'Fixa o WhatsApp na barra lateral.', featureGate: 'whatsapp_integration' },
        { code: 'sidebar.auditor.view', description: 'Sidebar: Auditor PBE', module: 'Menu Lateral', explanation: 'Fixa o auditor clínico na barra lateral.', featureGate: 'ai_assistant' },
        { code: 'sidebar.management.view', description: 'Sidebar: Configurações Gerais', module: 'Menu Lateral', explanation: 'Fixa o ícone de engrenagem na barra lateral.' },
        { code: 'sidebar.professionals.view', description: 'Sidebar: Atalho Equipe', module: 'Menu Lateral', explanation: 'Atalho direto para equipe na barra lateral.' },
        { code: 'sidebar.locations.view', description: 'Sidebar: Atalho Locais', module: 'Menu Lateral', explanation: 'Atalho direto para locais na barra lateral.' },
        { code: 'sidebar.services.view', description: 'Sidebar: Atalho Serviços', module: 'Menu Lateral', explanation: 'Atalho direto para serviços na barra lateral.' },
        { code: 'sidebar.forms.view', description: 'Sidebar: Atalho Formulários', module: 'Menu Lateral', explanation: 'Atalho direto para formulários na barra lateral.', featureGate: 'form_management' },
        { code: 'sidebar.questionnaires.view', description: 'Sidebar: Atalho Questionários', module: 'Menu Lateral', explanation: 'Atalho direto para questionários na barra lateral.', featureGate: 'form_management' },
        { code: 'sidebar.prices.view', description: 'Sidebar: Atalho Preços', module: 'Menu Lateral', explanation: 'Atalho direto para preços na barra lateral.', featureGate: 'financial_module' },
        { code: 'sidebar.products.view', description: 'Sidebar: Atalho Estoque', module: 'Menu Lateral', explanation: 'Atalho direto para estoque na barra lateral.' },
        { code: 'sidebar.marketing.view', description: 'Sidebar: Atalho Marketing', module: 'Menu Lateral', explanation: 'Atalho direto para marketing na barra lateral.', featureGate: 'marketing_module' },
        { code: 'sidebar.users.view', description: 'Sidebar: Atalho Usuários', module: 'Menu Lateral', explanation: 'Atalho direto para usuários na barra lateral.' },
        { code: 'sidebar.roles.view', description: 'Sidebar: Atalho Perfis', module: 'Menu Lateral', explanation: 'Atalho direto para perfis na barra lateral.' },

        // MENU SUPERIOR / USUÁRIO (HEADER/PHOTO DROP-DOWN)
        { code: 'user_menu.home.view', description: 'Menu Usuário: Início', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.schedule.view', description: 'Menu Usuário: Agenda', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'agenda_module' },
        {
            code: 'user_menu.patients.view', description: 'Menu Usuário: Pacientes', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'records_module'
        },
        { code: 'user_menu.financial.view', description: 'Menu Usuário: Finanças', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'financial_module' },
        { code: 'user_menu.professionals.view', description: 'Menu Usuário: Equipe', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.locations.view', description: 'Menu Usuário: Locais', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.services.view', description: 'Menu Usuário: Serviços', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.forms.view', description: 'Menu Usuário: Formulários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'form_management' },
        { code: 'user_menu.questionnaires.view', description: 'Menu Usuário: Questionários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'form_management' },
        { code: 'user_menu.prices.view', description: 'Menu Usuário: Preços', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'financial_module' },
        { code: 'user_menu.products.view', description: 'Menu Usuário: Estoque', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.marketing.view', description: 'Menu Usuário: Marketing', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'marketing_module' },
        { code: 'user_menu.users.view', description: 'Menu Usuário: Usuários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.roles.view', description: 'Menu Usuário: Perfis', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
        { code: 'user_menu.whatsapp.view', description: 'Menu Usuário: WhatsApp', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'whatsapp_integration' },
        { code: 'user_menu.auditor.view', description: 'Menu Usuário: Auditor PBE', module: 'Menu Superior', explanation: 'Atalho no menu da foto.', featureGate: 'ai_assistant' },

        // ABAS DO FINANCEIRO
        { code: 'financial.tabs.my_statement', description: 'Aba: Meu Extrato', module: 'Gestão (Módulos)', explanation: 'Produção individual.', featureGate: 'financial_module' },
        { code: 'financial.tabs.general_statement', description: 'Aba: Extrato Geral', module: 'Gestão (Módulos)', explanation: 'Todas movimentações.', featureGate: 'financial_module' },
        { code: 'financial.tabs.cash_flow', description: 'Aba: Fluxo de Caixa', module: 'Gestão (Módulos)', explanation: 'Visão futura/saldo.', featureGate: 'financial_module' },
        { code: 'financial.tabs.dre', description: 'Aba: DRE Financeiro', module: 'Gestão (Módulos)', explanation: 'Saúde financeira.', featureGate: 'financial_module' },
        { code: 'financial.tabs.settings', description: 'Aba: Config Financeiras', module: 'Gestão (Módulos)', explanation: 'Centros de custo.', featureGate: 'financial_module' },

        // GESTÃO HUB
        { code: 'settings.professionals.view', description: 'Gestão: Profissionais', module: 'Configurações', explanation: 'Acesso à lista de profissionais.' },
        { code: 'settings.locations.view', description: 'Gestão: Locais', module: 'Configurações', explanation: 'Acesso à lista de locais.' },
        { code: 'settings.services.view', description: 'Gestão: Serviços', module: 'Configurações', explanation: 'Acesso à lista de serviços.' },
        { code: 'settings.forms.view', description: 'Gestão: Formulários', module: 'Configurações', explanation: 'Acesso à lista de formulários.', featureGate: 'form_management' },
        { code: 'settings.questionnaires.view', description: 'Gestão: Questionários', module: 'Configurações', explanation: 'Acesso à lista de questionários.', featureGate: 'form_management' },
        { code: 'settings.prices.view', description: 'Gestão: Preços', module: 'Configurações', explanation: 'Acesso à tabela de preços.', featureGate: 'financial_module' },
        { code: 'settings.products.view', description: 'Gestão: Estoque', module: 'Configurações', explanation: 'Acesso à gestão de estoque.' },
        { code: 'settings.marketplace.view', description: 'Gestão: Marketplace', module: 'Configurações', explanation: 'Acesso à loja de recursos.' },
        { code: 'settings.marketing.view', description: 'Gestão: Marketing', module: 'Configurações', explanation: 'Acesso às configs de marketing.', featureGate: 'marketing_module' },
        { code: 'settings.communication.view', description: 'Gestão: WhatsApp/Comunicação', module: 'Configurações', explanation: 'Acesso às comunicações.', featureGate: 'whatsapp_integration' },
        { code: 'settings.identity.view', description: 'Gestão: Identidade Visual', module: 'Configurações', explanation: 'Acesso às configs visuais.' },
        { code: 'settings.documents.view', description: 'Gestão: Modelos de Docs', module: 'Configurações', explanation: 'Acesso a modelos de atestados.', featureGate: 'advanced_reports' },
        { code: 'settings.intelligence.view', description: 'Gestão: IA e Protocolos', module: 'Configurações', explanation: 'Acesso a configs de IA.', featureGate: 'ai_assistant' },
        { code: 'settings.users.view', description: 'Gestão: Usuários', module: 'Configurações', explanation: 'Acesso à gestão de usuários.' },
        { code: 'settings.roles.view', description: 'Gestão: Perfis de Acesso', module: 'Configurações', explanation: 'Acesso à gestão de permissões.' },
        { code: 'settings.audit.view', description: 'Gestão: Auditoria LGPD', module: 'Configurações', explanation: 'Acesso aos logs do sistema.' },
        { code: 'settings.migration.view', description: 'Gestão: Migração de Dados', module: 'Configurações', explanation: 'Acesso ao assistente de migração.' },
        { code: 'settings.support.view', description: 'Gestão: Suporte Técnico', module: 'Configurações', explanation: 'Acesso ao diagnóstico de saúde.' },
        { code: 'settings.dre.view', description: 'Gestão: Atalho DRE', module: 'Configurações', explanation: 'Atalho para relatórios financeiros.', featureGate: 'financial_module' },

        // ABAS DE CONFIGURAÇÃO (LAYER 2)
        { code: 'settings.tabs.general', description: 'Config Aba: Geral', module: 'Configurações', explanation: 'Acesso à aba de dados da clínica.' },
        { code: 'settings.tabs.integrations', description: 'Config Aba: Integrações', module: 'Configurações', explanation: 'Acesso às integrações de terceiros.' },
        { code: 'settings.tabs.reports', description: 'Config Aba: Documentos', module: 'Configurações', explanation: 'Acesso aos modelos de documentos.' },
        { code: 'settings.tabs.intelligence', description: 'Config Aba: Inteligência', module: 'Configurações', explanation: 'Acesso às configurações de IA.' },
        { code: 'settings.tabs.users', description: 'Config Aba: Usuários', module: 'Configurações', explanation: 'Acesso à gestão de usuários.' },
        { code: 'settings.tabs.roles', description: 'Config Aba: Perfis', module: 'Configurações', explanation: 'Acesso aos perfis de acesso.' },
    ];

/**
 * Checks if the current user has a specific permission.
 * Uses the new `role_permissions` and `permissions` tables.
 */
export async function hasPermission(permission: PermissionCode): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.warn('hasPermission: No user found (possible Auth API error). Returning false.')
        return false
    }

    const id = user.id
    const isMaster = await checkIsMaster(id)

    // Master Backdoor: Always allow role and settings management to avoid lockout
    if (isMaster && (
        permission === 'roles.manage' ||
        permission === 'settings.view' ||
        permission === 'sidebar.management.view'
    )) return true

    // 1. Get User's Profile and Organization Features
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select(`
            role_id, 
            role,
            organization_id, 
            organizations (
                features
            )
        `)
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return false

    let targetRoleId = profile.role_id

    // [RESILIENCE] Fallback for unmigrated users (role column string)
    if (!targetRoleId && profile.role) {
        const { data: fallbackRole } = await adminSupabase
            .from('roles')
            .select('id')
            .ilike('name', profile.role === 'admin' ? 'Administrador' : profile.role)
            .is('organization_id', null)
            .limit(1)
            .single()

        if (fallbackRole) {
            targetRoleId = fallbackRole.id
        }
    }

    if (!targetRoleId) return false

    // Layer 1 Check: Organization-Level Feature Gating
    const meta = PERMISSION_METADATA.find(p => p.code === permission)
    if (meta?.featureGate) {
        const orgFeatures = (profile.organizations as any)?.features
        const isFeatureEnabled = (orgFeatures === null || orgFeatures === undefined || orgFeatures[meta.featureGate] === undefined)
            ? true
            : !!orgFeatures[meta.featureGate]

        // If feature is disabled and user is NOT a master, block access
        if (!isFeatureEnabled && !isMaster) {
            console.log(`[RBAC] Access blocked: Feature "${meta.featureGate}" is disabled for organization ${profile.organization_id}`);
            return false
        }
    }

    // 2. Resolve Permission Logic (Role-Based)
    // For Master users, we grant absolute access to everything (Visibility and Functional)
    if (isMaster) return true;

    // For other users, everything is strictly per database
    const { count } = await adminSupabase
        .from('role_permissions')
        .select('permissions!inner(code)', { count: 'exact', head: true })
        .eq('role_id', targetRoleId)
        .eq('permissions.code', permission)

    return (count || 0) > 0
}

/**
 * Gets all permissions for the current user.
 * Useful for initializing the frontend session or context.
 */
export async function getCurrentUserPermissions(): Promise<PermissionCode[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Get User's Role, Organization and Features
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select(`
            role_id, 
            role,
            organization_id,
            organizations (
                features
            )
        `)
        .eq('id', user.id)
        .single()

    const isMaster = await checkIsMaster(user.id)
    let targetRoleId = profile?.role_id
    const orgFeatures = (profile?.organizations as any)?.features || {}

    // [RESILIENCE] Fallback for unmigrated users (role column string)
    if (!targetRoleId && profile?.role) {
        const { data: fallbackRole } = await adminSupabase
            .from('roles')
            .select('id')
            .ilike('name', profile.role === 'admin' ? 'Administrador' : profile.role)
            .is('organization_id', null)
            .limit(1)
            .single()

        if (fallbackRole) {
            targetRoleId = fallbackRole.id
        }
    }

    if (!targetRoleId && isMaster) {
        // [RESILIENCE] Fallback: Look for a role named 'Master' if user has no role_id assigned
        const { data: masterRole } = await adminSupabase.from('roles').select('id').eq('name', 'Master').limit(1).single()
        if (masterRole) {
            targetRoleId = masterRole.id
        }
    }

    // 2. Resolve Base Permissions (Layer 1)
    // Note: We removed the hardcoded "isMaster" bypass here so Master users can 
    // customize their sidebar/UI by unchecking permissions in their profile.
    // Safety is still guaranteed by the latches in hasPermission().

    let rolePerms: any[] = []
    if (targetRoleId) {
        // Fetch specific role permissions
        const { data } = await adminSupabase
            .from('role_permissions')
            .select('permissions!inner(code)')
            .eq('role_id', targetRoleId)
        rolePerms = data || []
    } else {
        // If no targetRoleId and not a master, return no permissions
        return []
    }

    // Layer 1 Filter + Flattening

    // Layer 1 Filter + Flattening
    return rolePerms
        .map((rp: any) => {
            const code = rp.permissions?.code as PermissionCode
            const meta = PERMISSION_METADATA.find(p => p.code === code)

            if (meta?.featureGate) {
                const isFeatureEnabled = (orgFeatures === null || orgFeatures === undefined || orgFeatures[meta.featureGate] === undefined)
                    ? true
                    : !!orgFeatures[meta.featureGate]
                // Master Bypasses Layer 1 Filter for complete oversight
                if (!isFeatureEnabled && !isMaster) return null
            }
            return code
        })
        .filter(Boolean) as PermissionCode[]
}

/**
 * Layer 3 Check: Asset-Specific Permissions
 * Checks if a user can perform an action (view, fill, edit) on a specific asset (form/template).
 */
export async function canAccessAsset(asset: any, action: 'view' | 'fill' | 'edit'): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const id = user.id
    const isMaster = await checkIsMaster(id)

    // 1. Master Bypass: Full control over everything
    if (isMaster) return true

    // 2. Get User Profile for Role ID (Using cached admin client here would be better but keeping it simple for now)
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role_id')
        .eq('id', id)
        .single()

    const roleId = profile?.role_id
    const config = asset.access_config || {}

    // 3. Individual User Permissions (Highest priority)
    const userPerms = config.users?.[id] || []
    if (userPerms.includes(action)) return true

    // 4. Role-Based Permissions
    if (roleId) {
        const rolePerms = config.roles?.[roleId] || []
        if (rolePerms.includes(action)) return true
    }

    // 5. Fallback to Legacy 'allowed_roles' (Layer 2.5)
    // If no access_config is defined, we use the old whitelist for 'view' and 'fill'.
    // 'edit' always requires explicit config or Ownership or Master.
    const hasConfig = (config.roles && Object.values(config.roles).some((v: any) => v.length > 0)) ||
        (config.users && Object.values(config.users).some((v: any) => v.length > 0))

    if (!hasConfig) {
        // If it's a legacy form, we only check against 'view' and 'fill'
        if (action === 'edit') {
            // Only the creator can edit legacy forms if no config exists
            return asset.user_id === id
        }

        const allowed = asset.allowed_roles || []
        // Empty allowed_roles = public for the organization
        if (allowed.length === 0) return true
        return allowed.includes(id) || (roleId && allowed.includes(roleId))
    }

    return false
}

export async function isMasterUser(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return checkIsMaster(user?.id)
}
