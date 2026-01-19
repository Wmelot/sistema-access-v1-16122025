'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Loader2, Info } from 'lucide-react'

interface PermissionsMatrixProps {
    roleId: string
    roleName: string
}

interface PermissionGroup {
    module: string
    label: string
    actions: Array<{
        action: string
        label: string
        description: string
    }>
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        module: 'dashboard',
        label: 'Tela Inicial',
        actions: [
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Permite que o item "Tela Inicial" apareça no menu lateral. Desative para ocultar completamente este menu para o perfil.'
            }
        ]
    },
    {
        module: 'schedule',
        label: 'Agenda',
        actions: [
            {
                action: 'view',
                label: 'Visualizar',
                description: 'Permite visualizar a agenda e os agendamentos. Sem esta permissão, o usuário não consegue ver nenhum agendamento.'
            },
            {
                action: 'create',
                label: 'Criar Agendamentos',
                description: 'Permite criar novos agendamentos na agenda. Útil para recepcionistas e profissionais que precisam marcar consultas.'
            },
            {
                action: 'update',
                label: 'Alterar Agendamentos',
                description: 'Permite editar agendamentos existentes (horário, paciente, observações, etc.). Importante para reagendamentos.'
            },
            {
                action: 'delete',
                label: 'Excluir Agendamentos',
                description: 'Permite excluir agendamentos. Recomendado apenas para administradores, pois é uma ação irreversível.'
            },
            {
                action: 'block',
                label: 'Bloqueios de Grade',
                description: 'Permite criar bloqueios na agenda (férias, folgas, horários indisponíveis). Geralmente usado por administradores.'
            },
            {
                action: 'fit_in',
                label: 'Agendamentos de Encaixe',
                description: 'Permite criar agendamentos de encaixe fora dos horários padrão. Útil para emergências ou casos especiais.'
            },
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Agenda" aparece na barra lateral para este perfil.'
            }
        ]
    },
    {
        module: 'patients',
        label: 'Pacientes',
        actions: [
            {
                action: 'view',
                label: 'Visualizar',
                description: 'Permite visualizar a lista de pacientes e seus dados básicos (nome, contato, etc.).'
            },
            {
                action: 'create',
                label: 'Criar Pacientes',
                description: 'Permite cadastrar novos pacientes no sistema. Essencial para recepcionistas e profissionais.'
            },
            {
                action: 'update',
                label: 'Alterar Pacientes',
                description: 'Permite editar dados cadastrais dos pacientes (telefone, endereço, convênio, etc.).'
            },
            {
                action: 'delete',
                label: 'Excluir Pacientes',
                description: 'Permite excluir pacientes do sistema. Ação sensível, recomendada apenas para administradores.'
            },
            {
                action: 'records',
                label: 'Prontuário/Evoluções',
                description: 'Permite acessar e editar prontuários médicos e evoluções clínicas. Restrito a profissionais de saúde.'
            },
            {
                action: 'certificates',
                label: 'Atestados',
                description: 'Permite emitir atestados médicos. Exclusivo para profissionais habilitados.'
            },
            {
                action: 'prescriptions',
                label: 'Receitas/Prescrições',
                description: 'Permite emitir receitas e prescrições médicas. Exclusivo para profissionais habilitados.'
            },
            {
                action: 'files',
                label: 'Arquivos/Imagens',
                description: 'Permite fazer upload e gerenciar arquivos dos pacientes (exames, laudos, imagens).'
            },
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Pacientes" aparece na barra lateral.'
            }
        ]
    },
    {
        module: 'financial',
        label: 'Financeiro',
        actions: [
            {
                action: 'view',
                label: 'Visualizar',
                description: 'Permite visualizar informações financeiras gerais da clínica (receitas, despesas, relatórios).'
            },
            {
                action: 'create',
                label: 'Criar Lançamentos',
                description: 'Permite criar novos lançamentos financeiros (receitas e despesas).'
            },
            {
                action: 'update',
                label: 'Alterar Lançamentos',
                description: 'Permite editar lançamentos financeiros existentes.'
            },
            {
                action: 'delete',
                label: 'Excluir Lançamentos',
                description: 'Permite excluir lançamentos financeiros. Recomendado apenas para administradores.'
            },
            {
                action: 'cash_flow',
                label: 'Fluxo de Caixa/Extrato',
                description: 'Permite acessar o fluxo de caixa e extratos bancários da clínica.'
            },
            {
                action: 'accounts',
                label: 'Contas a Pagar/Receber',
                description: 'Permite gerenciar contas a pagar e a receber (fornecedores, pacientes, convênios).'
            },
            {
                action: 'discounts',
                label: 'Aplicar Descontos',
                description: 'Permite aplicar descontos em consultas e procedimentos. Controle importante para gestão financeira.'
            },
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Financeiro" aparece na barra lateral.'
            },
            {
                action: 'overview_menu',
                label: 'Submenu: Visão Geral',
                description: 'Permite acessar a visão geral financeira (dashboard com gráficos e resumos).'
            },
            {
                action: 'dre_menu',
                label: 'Submenu: DRE Gerencial',
                description: 'Permite acessar o DRE (Demonstrativo de Resultados) com análise detalhada de lucros e despesas.'
            },
            {
                action: 'pricing_menu',
                label: 'Submenu: Tabela de Preços',
                description: 'Permite acessar e editar a tabela de preços de serviços e procedimentos.'
            },
            {
                action: 'products_menu',
                label: 'Submenu: Produtos',
                description: 'Permite acessar o cadastro de produtos vendidos pela clínica.'
            },
            {
                action: 'services_menu',
                label: 'Submenu: Serviços',
                description: 'Permite acessar o cadastro de serviços oferecidos pela clínica.'
            }
        ]
    },
    {
        module: 'inventory',
        label: 'Estoque/Produtos',
        actions: [
            {
                action: 'view',
                label: 'Visualizar',
                description: 'Permite visualizar o estoque de produtos e materiais.'
            },
            {
                action: 'create',
                label: 'Criar Produtos',
                description: 'Permite cadastrar novos produtos no estoque.'
            },
            {
                action: 'update',
                label: 'Alterar Produtos',
                description: 'Permite editar informações de produtos (preço, descrição, fornecedor).'
            },
            {
                action: 'delete',
                label: 'Excluir Produtos',
                description: 'Permite excluir produtos do cadastro.'
            },
            {
                action: 'movements',
                label: 'Entrada/Saída de Estoque',
                description: 'Permite registrar movimentações de estoque (compras, vendas, ajustes).'
            },
            {
                action: 'kits',
                label: 'Kits de Produtos',
                description: 'Permite criar e gerenciar kits de produtos (conjuntos de itens vendidos juntos).'
            },
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Estoque/Produtos" aparece na barra lateral.'
            }
        ]
    },
    {
        module: 'campaigns',
        label: 'Campanhas',
        actions: [
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Campanhas" (marketing e comunicação) aparece na barra lateral.'
            }
        ]
    },
    {
        module: 'my_billing',
        label: 'Meu Faturamento',
        actions: [
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Permite que profissionais vejam seu próprio faturamento e comissões. Útil para transparência com a equipe.'
            }
        ]
    },
    {
        module: 'forms',
        label: 'Formulários',
        actions: [
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Formulários" (avaliações personalizadas) aparece na barra lateral.'
            }
        ]
    },
    {
        module: 'reminders',
        label: 'Lembretes',
        actions: [
            {
                action: 'menu_visible',
                label: 'Menu Visível',
                description: 'Controla se o menu "Lembretes" (notificações e alertas) aparece na barra lateral.'
            }
        ]
    },
    {
        module: 'settings',
        label: 'Configurações',
        actions: [
            {
                action: 'professionals_menu',
                label: 'Gestão de Profissionais',
                description: 'Permite acessar o cadastro de profissionais da clínica (fisioterapeutas, médicos, etc.).'
            },
            {
                action: 'forms_menu',
                label: 'Gestão de Formulários',
                description: 'Permite criar e editar formulários personalizados de avaliação.'
            },
            {
                action: 'questionnaires_menu',
                label: 'Gestão de Questionários',
                description: 'Permite gerenciar questionários padronizados (escalas de dor, funcionalidade, etc.).'
            },
            {
                action: 'locations_menu',
                label: 'Gestão de Locais',
                description: 'Permite cadastrar e gerenciar locais de atendimento (salas, consultórios, filiais).'
            },
            {
                action: 'whatsapp_menu',
                label: 'Comunicação WhatsApp',
                description: 'Permite configurar e gerenciar integrações com WhatsApp para envio de mensagens.'
            },
            {
                action: 'reports_menu',
                label: 'Modelos de Relatório',
                description: 'Permite criar e editar modelos de relatórios e laudos personalizados.'
            },
            {
                action: 'system_menu',
                label: 'Configurações de Sistema',
                description: 'Permite acessar configurações avançadas do sistema (integrações, APIs, segurança).'
            },
            {
                action: 'migration_menu',
                label: 'Assistente de Migração',
                description: 'Permite usar ferramentas de migração de dados de outros sistemas.'
            }
        ]
    }
]

export function PermissionsMatrix({ roleId, roleName }: PermissionsMatrixProps) {
    const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadPermissions()
    }, [roleId])

    async function loadPermissions() {
        try {
            const response = await fetch(`/api/permissions/${roleId}`)
            const data = await response.json()

            const permMap = new Map<string, boolean>()
            data.permissions?.forEach((p: any) => {
                permMap.set(`${p.module}.${p.action}`, p.granted)
            })

            setPermissions(permMap)
        } catch (error) {
            console.error('Error loading permissions:', error)
            toast.error('Erro ao carregar permissões')
        } finally {
            setLoading(false)
        }
    }

    async function togglePermission(module: string, action: string, granted: boolean) {
        const key = `${module}.${action}`
        const previousValue = permissions.get(key)

        // Optimistic update
        setPermissions(new Map(permissions.set(key, granted)))

        try {
            setSaving(true)
            const response = await fetch(`/api/permissions/${roleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module, action, granted })
            })

            if (!response.ok) {
                throw new Error('Failed to update permission')
            }

            toast.success('Permissão atualizada')
        } catch (error) {
            // Revert on error
            setPermissions(new Map(permissions.set(key, previousValue ?? false)))
            toast.error('Erro ao atualizar permissão')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Matriz de Permissões</h3>
                        <p className="text-sm text-muted-foreground">
                            Configurando permissões para: <Badge variant="outline">{roleName}</Badge>
                        </p>
                    </div>
                    {saving && (
                        <Badge variant="secondary" className="gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Salvando...
                        </Badge>
                    )}
                </div>

                <Separator />

                <div className="space-y-6">
                    {PERMISSION_GROUPS.map((group) => (
                        <Card key={group.module}>
                            <CardHeader>
                                <CardTitle className="text-base">{group.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {group.actions.map((action) => {
                                        const key = `${group.module}.${action.action}`
                                        const isGranted = permissions.get(key) ?? false

                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Label
                                                        htmlFor={key}
                                                        className="cursor-pointer text-sm font-medium"
                                                    >
                                                        {action.label}
                                                    </Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <p className="text-sm">{action.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Switch
                                                    id={key}
                                                    checked={isGranted}
                                                    onCheckedChange={(checked) =>
                                                        togglePermission(group.module, action.action, checked)
                                                    }
                                                    disabled={saving}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    )
}
