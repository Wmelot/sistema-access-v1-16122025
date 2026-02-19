import { createClient, createAdminClient } from "@/lib/supabase/server"
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
    | 'settings.dre.view';

export const PERMISSION_METADATA: { code: PermissionCode; description: string; module: string; explanation?: string }[] = [
    // GERAL / CORE
    { code: 'dashboard.view', description: 'Visualizar Painel', module: 'Menu Superior', explanation: 'Permite que o usuário veja o resumo de estatísticas na tela inicial.' },
    { code: 'patients.view', description: 'Pacientes: Visualizar Listagem', module: 'Gestão (Módulos)', explanation: 'Dá acesso à lista de pacientes e à busca global.' },
    { code: 'patients.edit', description: 'Pacientes: Criar e Editar', module: 'Gestão (Módulos)', explanation: 'Permite alterar dados cadastrais e clínicos.' },
    { code: 'patients.delete', description: 'Pacientes: Excluir Registro', module: 'Gestão (Módulos)', explanation: 'Permite apagar registros de pacientes.' },
    { code: 'schedule.view_all', description: 'Agenda: Ver Tudo', module: 'Gestão (Módulos)', explanation: 'Visualiza as agendas de todos os profissionais.' },
    { code: 'schedule.manage_all', description: 'Agenda: Gerenciar Tudo', module: 'Gestão (Módulos)', explanation: 'Pode marcar e editar horários de qualquer colega.' },
    { code: 'schedule.view_own', description: 'Agenda: Ver Somente Própria', module: 'Gestão (Módulos)', explanation: 'Restringe a visão apenas aos seus próprios atendimentos.' },
    { code: 'schedule.manage_own', description: 'Agenda: Gerenciar Somente Própria', module: 'Gestão (Módulos)', explanation: 'Dá autonomia apenas para seus próprios horários.' },

    // FINANCEIRO CORE
    { code: 'financial.view', description: 'Financeiro: Ver Extratos', module: 'Gestão (Módulos)', explanation: 'Acesso básico ao financeiro.' },
    { code: 'financial.manage', description: 'Financeiro: Lançamentos', module: 'Gestão (Módulos)', explanation: 'Permite realizar baixas e editar lançamentos.' },
    { code: 'financial.view_clinic', description: 'Financeiro: Visão Geral Clínica', module: 'Gestão (Módulos)', explanation: 'Acesso total ao faturamento de todos.' },
    { code: 'financial.view_own', description: 'Financeiro: Visão Própria Produção', module: 'Gestão (Módulos)', explanation: 'Mostra apenas lucro individual.' },

    // SISTEMA CORE
    { code: 'settings.view', description: 'Configurações: Acesso Básico', module: 'Gestão (Módulos)', explanation: 'Acesso à central de configurações.' },
    { code: 'settings.edit', description: 'Configurações: Editar Dados Clínica', module: 'Gestão (Módulos)', explanation: 'Altera nome, logo e regras da clínica.' },
    { code: 'roles.manage', description: 'Segurança: Gerenciar Perfis/Acesso', module: 'Gestão (Módulos)', explanation: 'Cria e edita o que cada um pode ver.' },

    // MENU LATERAL (SIDEBAR)
    { code: 'sidebar.home.view', description: 'Sidebar: Tela Inicial', module: 'Menu Lateral', explanation: 'Fixa o link de início na barra lateral.' },
    { code: 'sidebar.schedule.view', description: 'Sidebar: Agenda', module: 'Menu Lateral', explanation: 'Fixa a agenda na barra lateral.' },
    { code: 'sidebar.patients.view', description: 'Sidebar: Pacientes', module: 'Menu Lateral', explanation: 'Fixa pacientes na barra lateral.' },
    { code: 'sidebar.financial.view', description: 'Sidebar: Finanças', module: 'Menu Lateral', explanation: 'Fixa o financeiro na barra lateral.' },
    { code: 'sidebar.whatsapp.view', description: 'Sidebar: WhatsApp', module: 'Menu Lateral', explanation: 'Fixa o WhatsApp na barra lateral.' },
    { code: 'sidebar.auditor.view', description: 'Sidebar: Auditor PBE', module: 'Menu Lateral', explanation: 'Fixa o auditor clínico na barra lateral.' },
    { code: 'sidebar.management.view', description: 'Sidebar: Configurações Gerais', module: 'Menu Lateral', explanation: 'Fixa o ícone de engrenagem na barra lateral.' },
    { code: 'sidebar.professionals.view', description: 'Sidebar: Atalho Equipe', module: 'Menu Lateral', explanation: 'Atalho direto para equipe na barra lateral.' },
    { code: 'sidebar.locations.view', description: 'Sidebar: Atalho Locais', module: 'Menu Lateral', explanation: 'Atalho direto para locais na barra lateral.' },
    { code: 'sidebar.services.view', description: 'Sidebar: Atalho Serviços', module: 'Menu Lateral', explanation: 'Atalho direto para serviços na barra lateral.' },
    { code: 'sidebar.forms.view', description: 'Sidebar: Atalho Formulários', module: 'Menu Lateral', explanation: 'Atalho direto para formulários na barra lateral.' },
    { code: 'sidebar.questionnaires.view', description: 'Sidebar: Atalho Questionários', module: 'Menu Lateral', explanation: 'Atalho direto para questionários na barra lateral.' },
    { code: 'sidebar.prices.view', description: 'Sidebar: Atalho Preços', module: 'Menu Lateral', explanation: 'Atalho direto para preços na barra lateral.' },
    { code: 'sidebar.products.view', description: 'Sidebar: Atalho Estoque', module: 'Menu Lateral', explanation: 'Atalho direto para estoque na barra lateral.' },
    { code: 'sidebar.marketing.view', description: 'Sidebar: Atalho Marketing', module: 'Menu Lateral', explanation: 'Atalho direto para marketing na barra lateral.' },
    { code: 'sidebar.users.view', description: 'Sidebar: Atalho Usuários', module: 'Menu Lateral', explanation: 'Atalho direto para usuários na barra lateral.' },
    { code: 'sidebar.roles.view', description: 'Sidebar: Atalho Perfis', module: 'Menu Lateral', explanation: 'Atalho direto para perfis na barra lateral.' },

    // MENU SUPERIOR / USUÁRIO (HEADER/PHOTO DROP-DOWN)
    { code: 'user_menu.home.view', description: 'Menu Usuário: Início', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.schedule.view', description: 'Menu Usuário: Agenda', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.patients.view', description: 'Menu Usuário: Pacientes', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.financial.view', description: 'Menu Usuário: Finanças', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.professionals.view', description: 'Menu Usuário: Equipe', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.locations.view', description: 'Menu Usuário: Locais', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.services.view', description: 'Menu Usuário: Serviços', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.forms.view', description: 'Menu Usuário: Formulários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.questionnaires.view', description: 'Menu Usuário: Questionários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.prices.view', description: 'Menu Usuário: Preços', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.products.view', description: 'Menu Usuário: Estoque', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.marketing.view', description: 'Menu Usuário: Marketing', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.users.view', description: 'Menu Usuário: Usuários', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.roles.view', description: 'Menu Usuário: Perfis', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.whatsapp.view', description: 'Menu Usuário: WhatsApp', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },
    { code: 'user_menu.auditor.view', description: 'Menu Usuário: Auditor PBE', module: 'Menu Superior', explanation: 'Atalho no menu da foto.' },

    // ABAS DO FINANCEIRO
    { code: 'financial.tabs.my_statement', description: 'Aba: Meu Extrato', module: 'Gestão (Módulos)', explanation: 'Produção individual.' },
    { code: 'financial.tabs.general_statement', description: 'Aba: Extrato Geral', module: 'Gestão (Módulos)', explanation: 'Todas movimentações.' },
    { code: 'financial.tabs.cash_flow', description: 'Aba: Fluxo de Caixa', module: 'Gestão (Módulos)', explanation: 'Visão futura/saldo.' },
    { code: 'financial.tabs.dre', description: 'Aba: DRE Financeiro', module: 'Gestão (Módulos)', explanation: 'Saúde financeira.' },
    { code: 'financial.tabs.settings', description: 'Aba: Config Financeiras', module: 'Gestão (Módulos)', explanation: 'Centros de custo.' },

    // GESTÃO HUB
    { code: 'settings.professionals.view', description: 'Gestão: Profissionais', module: 'Configurações', explanation: 'Acesso à lista de profissionais.' },
    { code: 'settings.locations.view', description: 'Gestão: Locais', module: 'Configurações', explanation: 'Acesso à lista de locais.' },
    { code: 'settings.services.view', description: 'Gestão: Serviços', module: 'Configurações', explanation: 'Acesso à lista de serviços.' },
    { code: 'settings.forms.view', description: 'Gestão: Formulários', module: 'Configurações', explanation: 'Acesso à lista de formulários.' },
    { code: 'settings.questionnaires.view', description: 'Gestão: Questionários', module: 'Configurações', explanation: 'Acesso à lista de questionários.' },
    { code: 'settings.prices.view', description: 'Gestão: Preços', module: 'Configurações', explanation: 'Acesso à tabela de preços.' },
    { code: 'settings.products.view', description: 'Gestão: Estoque', module: 'Configurações', explanation: 'Acesso à gestão de estoque.' },
    { code: 'settings.marketplace.view', description: 'Gestão: Marketplace', module: 'Configurações', explanation: 'Acesso à loja de recursos.' },
    { code: 'settings.marketing.view', description: 'Gestão: Marketing', module: 'Configurações', explanation: 'Acesso às configs de marketing.' },
    { code: 'settings.communication.view', description: 'Gestão: WhatsApp/Comunicação', module: 'Configurações', explanation: 'Acesso às comunicações.' },
    { code: 'settings.identity.view', description: 'Gestão: Identidade Visual', module: 'Configurações', explanation: 'Acesso às configs visuais.' },
    { code: 'settings.documents.view', description: 'Gestão: Modelos de Docs', module: 'Configurações', explanation: 'Acesso a modelos de atestados.' },
    { code: 'settings.intelligence.view', description: 'Gestão: IA e Protocolos', module: 'Configurações', explanation: 'Acesso a configs de IA.' },
    { code: 'settings.users.view', description: 'Gestão: Usuários', module: 'Configurações', explanation: 'Acesso à gestão de usuários.' },
    { code: 'settings.roles.view', description: 'Gestão: Perfis de Acesso', module: 'Configurações', explanation: 'Acesso à gestão de permissões.' },
    { code: 'settings.audit.view', description: 'Gestão: Auditoria LGPD', module: 'Configurações', explanation: 'Acesso aos logs do sistema.' },
    { code: 'settings.migration.view', description: 'Gestão: Migração de Dados', module: 'Configurações', explanation: 'Acesso ao assistente de migração.' },
    { code: 'settings.support.view', description: 'Gestão: Suporte Técnico', module: 'Configurações', explanation: 'Acesso ao diagnóstico de saúde.' },
    { code: 'settings.dre.view', description: 'Gestão: Atalho DRE', module: 'Configurações', explanation: 'Atalho para relatórios financeiros.' },
];

/**
 * Checks if the current user has a specific permission.
 * Uses the new `role_permissions` and `permissions` tables.
 */
export async function hasPermission(permission: PermissionCode): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // [ROBUSTNESS] If Auth is 500/offline, we might return false.
        // But let's log it to be sure.
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

    // 1. Get User's Role ID from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.role_id) return false

    // 2. Resolve Permission Logic
    // For Master users, we differentiate between Visibility (Menus) and Functional Access
    if (isMaster) {
        if (permission.startsWith('sidebar.') || permission.startsWith('user_menu.')) {
            // Visibility: Respect the database configuration
            const adminSupabase = await createAdminClient()
            const { count } = await adminSupabase
                .from('role_permissions')
                .select('permissions!inner(code)', { count: 'exact', head: true })
                .eq('role_id', profile.role_id)
                .eq('permissions.code', permission)
            return (count || 0) > 0
        }
        // Functional Access: Master always has access
        return true
    }

    // For other users, everything is strictly per database
    const adminSupabase = await createAdminClient()
    const { count } = await adminSupabase
        .from('role_permissions')
        .select('permissions!inner(code)', { count: 'exact', head: true })
        .eq('role_id', profile.role_id)
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

    // 1. Get User's Role ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

    const isMaster = await checkIsMaster(user.id)
    let targetRoleId = profile?.role_id

    if (!targetRoleId && isMaster) {
        // [RESILIENCE] Fallback: Look for a role named 'Master' if user has no role_id assigned
        const adminSupabase = await createAdminClient()
        const { data: masterRole } = await adminSupabase.from('roles').select('id').eq('name', 'Master').limit(1).single()
        if (masterRole) {
            targetRoleId = masterRole.id
            console.log(`[RBAC] Master user detected without role_id. Falling back to role: ${targetRoleId}`);
        }
    }

    if (!targetRoleId) {
        // Master without any role fallback still gets core access
        if (isMaster) return [
            'dashboard.view',
            'settings.view',
            'roles.manage',
            'sidebar.management.view'
        ] as PermissionCode[]
        return []
    }

    // Use admin client to ensure visibility of joining permissions table
    const adminSupabase = await createAdminClient()
    const { data: rolePerms } = await adminSupabase
        .from('role_permissions')
        .select('permissions(code)')
        .eq('role_id', targetRoleId)

    if (!rolePerms) return []

    // Flatten the result
    return rolePerms
        .map((rp: any) => rp.permissions?.code as PermissionCode)
        .filter(Boolean)
}

/**
 * Checks if current user is a "Master" (or Admin).
 * Useful for super-admin bypasses if hardcoded, OR simply check for a high-level permission.
 */
export async function isMasterUser(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return checkIsMaster(user?.id)
}
