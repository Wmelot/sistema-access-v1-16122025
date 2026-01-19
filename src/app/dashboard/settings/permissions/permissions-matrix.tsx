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
    'schedule.view': 'Permite visualizar a agenda e os agendamentos. Sem esta permissão, o usuário não consegue ver nenhum agendamento.',
    'schedule.create': 'Permite criar novos agendamentos na agenda.',
    'schedule.update': 'Permite editar agendamentos existentes (horário, paciente, observações, etc.).',
    'schedule.delete': 'Permite excluir agendamentos. Ação irreversível.',
    'schedule.block': 'Permite criar bloqueios na agenda (férias, folgas, horários indisponíveis).',
    'schedule.fit_in': 'Permite criar agendamentos de encaixe fora dos horários padrão.',
    'schedule.menu_visible': 'Controla se o menu "Agenda" aparece na barra lateral.',
    'appointments.view': 'Permite visualizar a agenda e os agendamentos.',
    'appointments.edit': 'Permite editar agendamentos existentes.',

    // Pacientes
    'patients.view': 'Permite visualizar a lista de pacientes e seus dados básicos.',
    'patients.create': 'Permite cadastrar novos pacientes no sistema.',
    'patients.update': 'Permite editar dados cadastrais dos pacientes.',
    'patients.edit': 'Permite editar dados cadastrais dos pacientes.',
    'patients.delete': 'Permite excluir pacientes do sistema.',
    'patients.records': 'Permite acessar e editar prontuários médicos e evoluções clínicas.',
    'patients.certificates': 'Permite emitir atestados médicos.',
    'patients.prescriptions': 'Permite emitir receitas e prescrições médicas.',
    'patients.files': 'Permite fazer upload e gerenciar arquivos dos pacientes.',
    'patients.menu_visible': 'Controla se o menu "Pacientes" aparece na barra lateral.',

    // Financeiro
    'financial.view': 'Permite visualizar informações financeiras gerais da clínica.',
    'financial.view_clinic': 'Permite visualizar o financeiro da clínica.',
    'financial.create': 'Permite criar novos lançamentos financeiros.',
    'financial.update': 'Permite editar lançamentos financeiros existentes.',
    'financial.delete': 'Permite excluir lançamentos financeiros.',
    'financial.cash_flow': 'Permite acessar o fluxo de caixa e extratos bancários.',
    'financial.accounts': 'Permite gerenciar contas a pagar e a receber.',
    'financial.discounts': 'Permite aplicar descontos em consultas e procedimentos.',
    'financial.menu_visible': 'Controla se o menu "Financeiro" aparece na barra lateral.',
    'financial.overview_menu': 'Permite acessar a visão geral financeira.',
    'financial.dre_menu': 'Permite acessar o DRE Gerencial.',
    'financial.pricing_menu': 'Permite acessar e editar a tabela de preços.',
    'financial.products_menu': 'Permite acessar o cadastro de produtos.',
    'financial.services_menu': 'Permite acessar o cadastro de serviços.',

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
    'settings.professionals_menu': 'Permite acessar o cadastro de profissionais.',
    'settings.forms_menu': 'Permite criar e editar formulários personalizados.',
    'settings.questionnaires_menu': 'Permite gerenciar questionários padronizados.',
    'settings.locations_menu': 'Permite cadastrar e gerenciar locais de atendimento.',
    'settings.whatsapp_menu': 'Permite configurar integrações com WhatsApp.',
    'settings.reports_menu': 'Permite criar e editar modelos de relatórios.',
    'settings.system_menu': 'Permite acessar configurações avançadas do sistema.',
    'settings.migration_menu': 'Permite usar ferramentas de migração de dados.',
    'roles.manage': 'Permite gerenciar perfis de acesso e permissões.',
    'settings.edit': 'Permite editar configurações gerais do sistema.',
    'system.access': 'Permite acesso básico ao sistema.',
    'system.manage_apis': 'Permite gerenciar chaves de API (apenas Master).',
    'system.view_logs': 'Permite visualizar logs de auditoria do sistema.',
    'dashboard.menu_visible': 'Controla se o menu "Tela Inicial" aparece na barra lateral.',
}

export function PermissionsMatrix({ roles, permissions, initialRolePerms }: PermissionsMatrixProps) {
    const router = useRouter()
    const [rolePerms] = useState<any[]>(initialRolePerms)

    const hasPerm = (roleId: string, permId: string) => {
        return rolePerms.some(rp => rp.role_id === roleId && rp.permission_id === permId)
    }

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        const mod = perm.module || 'Geral'
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
                                    {roles.map(role => (
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
                                            <TableCell colSpan={roles.length + 1} className="font-semibold py-2">
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
                                                {roles.map(role => {
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
