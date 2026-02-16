"use client"

import { useState } from "react"
import { Check, Shield, X, Info } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PermissionsMatrixProps {
    roles: any[]
    permissions: any[]
    initialRolePerms: any[]
}

const TOOLTIPS: Record<string, string> = {
    // Agenda
    'schedule.view': 'Visualizar a agenda e atendimentos.',
    'schedule.create': 'Criar novos agendamentos.',
    'schedule.update': 'Editar agendamentos existentes.',
    'schedule.delete': 'Remover agendamentos (Ação irreversível).',
    'schedule.block': 'Criar bloqueios de horário (férias, folgas).',
    'schedule.fit_in': 'Permitir agendamentos de encaixe.',
    'schedule.menu_visible': 'Exibir o menu de Agenda na barra lateral.',
    'appointments.view': 'Visualizar agendamentos.',
    'appointments.edit': 'Editar detalhes de agendamentos.',
    'appointments.view_all': 'Permite visualizar a agenda de TODOS os profissionais da clínica.',
    'appointments.view_own': 'Permite visualizar apenas a sua PRÓPRIA agenda.',
    'appointments.manage_all': 'Permite gerenciar a agenda de QUALQUER profissional.',
    'appointments.manage_own': 'Permite gerenciar apenas os SEUS próprios agendamentos.',

    // Pacientes
    'patients.view': 'Visualizar lista de pacientes cadastrados.',
    'patients.create': 'Cadastrar novos pacientes no sistema.',
    'patients.update': 'Atualizar dados cadastrais de pacientes.',
    'patients.edit': 'Editar informações de pacientes.',
    'patients.delete': 'Excluir permanentemente registros de pacientes.',
    'patients.records': 'Acessar históricos clínicos e evoluções.',
    'patients.certificates': 'Emitir atestados e documentos médicos.',
    'patients.prescriptions': 'Emitir receitas e prescrições.',
    'patients.files': 'Gerenciar anexos, exames e documentos enviados.',
    'patients.menu_visible': 'Exibir o menu de Pacientes na barra lateral.',
    'patients.view_all': 'Permite ver TODOS os pacientes cadastrados na clínica.',
    'patients.view_assigned': 'Permite ver apenas os pacientes vinculados a você ou sob seu cuidado.',

    // Financeiro
    'financial.view': 'Visualizar informações financeiras básicas.',
    'financial.view_clinic': 'Visualizar o faturamento total e saúde financeira da CLÍNICA.',
    'financial.view_own': 'Visualizar apenas as SUAS comissões e ganhos individuais.',
    'financial.create': 'Lançar novas receitas ou despesas.',
    'financial.update': 'Editar lançamentos financeiros existentes.',
    'financial.delete': 'Excluir registros do financeiro.',
    'financial.cash_flow': 'Acessar fluxo de caixa detalhado e extratos.',
    'financial.accounts': 'Gerenciar contas a pagar, receber e contas bancárias.',
    'financial.discounts': 'Aplicar ou gerenciar políticas de desconto.',
    'financial.menu_visible': 'Exibir o menu Financeiro na barra lateral.',
    'financial.overview_menu': 'Acessar o painel geral de métricas financeiras.',
    'financial.dre_menu': 'Acompanhar o DRE (Demonstrativo de Resultados) gerencial.',
    'financial.pricing_menu': 'Gerenciar a tabela de preços e valores de procedimentos.',
    'financial.products_menu': 'Gerenciar cadastro de produtos e venda de itens.',
    'financial.services_menu': 'Gerenciar cadastro e valores de serviços prestados.',

    // Outros
    'records.view_all': 'Ler prontuários e evoluções de TODOS os pacientes da clínica.',
    'records.view_assigned': 'Ler prontuários apenas dos SEUS pacientes vinculados.',
    'records.edit_all': 'Editar qualquer prontuário ou evolução no sistema.',
    'records.edit_own': 'Editar apenas os prontuários que você mesmo criou.',

    // Estoque
    'inventory.view': 'Permite visualizar o estoque de produtos e materiais.',
    'inventory.create': 'Permite cadastrar novos produtos no estoque.',
    'inventory.update': 'Permite editar informações de produtos.',
    'inventory.delete': 'Permite excluir produtos do cadastro.',
    'inventory.movements': 'Permite registrar movimentações de estoque.',
    'inventory.kits': 'Permite criar e gerenciar kits de produtos.',
    'inventory.menu_visible': 'Controla se o menu "Estoque" aparece na barra lateral.',

    // Outros
    'campaigns.menu_visible': 'Controla se o menu "Campanhas" aparece na barra lateral.',
    'my_billing.menu_visible': 'Permite que profissionais vejam seu próprio faturamento.',
    'forms.menu_visible': 'Controla se o menu "Formulários" aparece na barra lateral.',
    'reminders.menu_visible': 'Controla se o menu "Lembretes" aparece na barra lateral.',

    // Configurações e Sistema
    'settings.professionals_menu': 'Gerenciar equipe, usuários e escalas de trabalho.',
    'settings.forms_menu': 'Criar e editar formulários técnicos personalizados.',
    'settings.questionnaires_menu': 'Gerenciar envios de questionários de saúde.',
    'settings.locations_menu': 'Gerenciar salas, unidades e locais de atendimento.',
    'settings.whatsapp_menu': 'Configurar conta e mensagens automáticas do WhatsApp.',
    'settings.reports_menu': 'Criar e editar modelos de relatórios de impressão.',
    'settings.system_menu': 'Configurações críticas e técnicas do sistema Axiom.',
    'settings.view': 'Visualizar configurações básicas da clínica.',
    'settings.manage': 'Alterar dados da clínica, logo e identidade visual.',
    'settings.migration_menu': 'Acessar ferramentas de importação de dados externos.',
    'roles.manage': 'Gerenciar cargos, perfis e permissões da matriz (Permissão de alto risco).',
    'settings.edit': 'Permitir alteração de campos em configurações.',
    'system.access': 'Permissão fundamental de acesso ao portal do sistema.',
    'system.manage_apis': 'Acesso a chaves de API e integrações externas.',
    'system.view_logs': 'Acessar logs de auditoria (Histórico de alterações no sistema).',
    'dashboard.menu_visible': 'Exibir o dashboard inicial com métricas na barra lateral.',
}

export function PermissionsMatrix({ roles, permissions, initialRolePerms }: PermissionsMatrixProps) {
    const router = useRouter()
    const [rolePerms] = useState<any[]>(initialRolePerms)

    const hasPerm = (roleId: string, permId: string) => {
        return rolePerms.some(rp => rp.role_id === roleId && rp.permission_id === permId)
    }

    // --- Deduplicate Roles by Name ---
    const uniqueRoles = roles.reduce((acc: any[], role) => {
        const trimmedName = role.name?.trim()
        if (!acc.some(r => r.name?.trim() === trimmedName)) {
            acc.push({ ...role, name: trimmedName }) // Ensure name is trimmed in the UI too
        }
        return acc
    }, [])

    // Group permissions by module and Unify Module Names
    const permissionsByModule = permissions.reduce((acc, perm) => {
        let mod = perm.module || 'Geral'

        // Unify English/Portuguese and similar names
        if (mod === 'Patients') mod = 'Pacientes'
        if (mod === 'Record') mod = 'Prontuários'
        if (mod === 'Records') mod = 'Prontuários'
        if (mod === 'Schedule') mod = 'Agenda'
        if (mod === 'Setting') mod = 'Configurações'
        if (mod === 'Settings') mod = 'Configurações'
        if (mod === 'System') mod = 'Sistema'

        if (!acc[mod]) acc[mod] = []
        acc[mod].push(perm)
        return acc
    }, {} as Record<string, typeof permissions>)

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Tabela de Acesso (Visualização)
                    </CardTitle>
                    <CardDescription>
                        Esta é uma visualização das permissões do sistema antigo. Para editar permissões, use o botão "Permissões" na lista de perfis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Permissão / Ação</TableHead>
                                    {uniqueRoles.map(role => (
                                        <TableHead key={role.id} className="text-center bg-muted/30 min-w-[100px]">
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold text-foreground">{role.name}</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                                    <>
                                        <TableRow key={`module-${moduleName}`} className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={uniqueRoles.length + 1} className="font-semibold py-2">
                                                {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                                            </TableCell>
                                        </TableRow>
                                        {(perms as any[]).map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{perm.description}</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p className="text-sm">{TOOLTIPS[perm.code] || 'Sem descrição detalhada.'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {/* Module code removed here as requested */}
                                                    </div>
                                                </TableCell>
                                                {uniqueRoles.map(role => {
                                                    const active = hasPerm(role.id, perm.id)

                                                    return (
                                                        <TableCell
                                                            key={`${role.id}-${perm.id}`}
                                                            className="text-center"
                                                        >
                                                            {active ? (
                                                                <div className="flex justify-center">
                                                                    <div className="bg-green-100 text-green-700 p-1 rounded-full">
                                                                        <Check className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-center opacity-30">
                                                                    <div className="p-1">
                                                                        <X className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
