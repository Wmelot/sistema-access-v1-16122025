import { createClient } from "@/lib/supabase/server"
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
    | 'user_menu.roles.view';

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

    // Master Bypass
    if (await checkIsMaster(user.id)) return true

    // 1. Get User's Role ID from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.role_id) return false

    // 2. Check if this Role has the mapping to the permission Code
    // We join role_permissions -> permissions
    const { count } = await supabase
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

    // 1. Master Bypass - If master, return all possible permissions from the DB
    if (await checkIsMaster(user.id)) {
        const { data: allPerms } = await supabase.from('permissions').select('code')
        return (allPerms?.map((p: any) => p.code) || []) as PermissionCode[]
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.role_id) return []

    // 2. Administrator Bypass (Optional but requested: "administrador vê tudo")
    // If the role name is 'Administrador', we could also return all perms
    if ((profile.roles as any)?.name === 'Administrador') {
        const { data: allPerms } = await supabase.from('permissions').select('code')
        return (allPerms?.map((p: any) => p.code) || []) as PermissionCode[]
    }

    const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('permissions(code)')
        .eq('role_id', profile.role_id)

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
