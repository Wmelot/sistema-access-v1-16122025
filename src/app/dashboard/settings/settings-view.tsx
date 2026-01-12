"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClinicalIntelligenceSettings } from "./intelligence/clinical-intelligence-settings"
import { Settings, Users, Shield, Lock, FileText, PieChart, Table2, Brain } from "lucide-react"
import { SettingsForm } from "./settings-form"
import { RolesList } from "./roles/roles-list"
import { RoleFormDialog } from "./roles/role-form-dialog"
import { ClientApiList } from "./system/apis/client-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UsersPage from "./users/page"
import { ReportTemplateList } from "@/components/reports/ReportTemplateList"
import { useSearchParams } from "next/navigation"
import { GenerateHolidaysButton } from "./schedule/generate-holidays-button"
import { MetricsList } from "./metrics/metrics-list"
import { ChartsList } from "./charts/chart-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SettingsViewProps {
    initialSettings: any
    hasGoogleIntegration: boolean
    rolesData: {
        canManage: boolean
        roles: any[]
        permissions: any[]
    }
    apiData: {
        canManage: boolean
        integrations: any[]
    }
    reportTemplates: any[]
    auditData: {
        // Placeholder
    }
    isMaster?: boolean // [NEW]
}

export function SettingsView({ initialSettings, hasGoogleIntegration, rolesData, apiData, reportTemplates = [], isMaster = false }: SettingsViewProps) {
    const searchParams = useSearchParams()
    // Default to 'general' or first available tab
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "general")

    // Sync tab with URL on change
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab) {
            setActiveTab(tab)
        }
    }, [searchParams])

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-md inline-flex flex-wrap h-auto">
                <TabsTrigger value="general" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Geral
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Relatórios
                </TabsTrigger>
                <TabsTrigger value="smart_reports" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Relatórios Inteligentes
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Inteligência
                </TabsTrigger>
                <TabsTrigger value="metrics" className="gap-2">
                    <PieChart className="h-4 w-4" />
                    Métricas & Gráficos
                </TabsTrigger>
                {rolesData.canManage && (
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" />
                        Usuários
                    </TabsTrigger>
                )}
                {rolesData.canManage && (
                    <TabsTrigger value="roles" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Perfis de Acesso
                    </TabsTrigger>
                )}
                {/* Only Master sees APIs/Integrations Tab if strictly requested, but user said 'Settings' lock.
                    Let's hide the tab if not master to be safe/granular, OR pass isMaster to child.
                    User said: "Restrict access to critical system settings (Whitelabel, Google Integration, Plans) to only the 'Master' role"
                    If we hide the tab, it's safer.
                */}
                {apiData.canManage && isMaster && (
                    <TabsTrigger value="apis" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Integrações & Segurança
                    </TabsTrigger>
                )}
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Geral</h2>
                        <p className="text-muted-foreground">Informações básicas da clínica.</p>
                    </div>
                    <GenerateHolidaysButton />
                </div>
                <SettingsForm initialSettings={initialSettings} hasGoogleIntegration={hasGoogleIntegration} isMaster={isMaster} />
            </TabsContent>

            {/* Report Templates */}
            <TabsContent value="reports" className="space-y-4">
                <ReportTemplateList templates={reportTemplates} />
            </TabsContent>

            {/* Smart Reports (New) */}
            <TabsContent value="smart_reports" className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Relatórios Inteligentes</h2>
                        <p className="text-muted-foreground">Crie e gerencie Blueprints avançados com gráficos e lógica condicional.</p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/settings/reports/builder">
                            <Brain className="w-4 h-4 mr-2" />
                            Novo Blueprint
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Modelos Disponíveis</CardTitle>
                        <CardDescription>Blueprints JSON salvos no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder List */}
                        <div className="border rounded bg-slate-50 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded text-indigo-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">Laudo Biomecânico & Prescrição de Órtese</p>
                                    <p className="text-xs text-muted-foreground">ID: REPORT_PALMILHA_V2 • v2.0.0</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/settings/reports/builder?id=REPORT_PALMILHA_V2">
                                        Editar Blueprint
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500">Excluir</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Intelligence */}
            <TabsContent value="intelligence" className="space-y-4">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Inteligência Clínica</h2>
                    <p className="text-muted-foreground">Gerencie protocolos baseados em evidência e comportamento da IA.</p>
                </div>
                <ClinicalIntelligenceSettings />
            </TabsContent>

            {/* Metrics & Charts */}
            <TabsContent value="metrics" className="space-y-4">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Métricas & Gráficos</h2>
                    <p className="text-muted-foreground">Defina métricas calculadas e configure gráficos para seus relatórios.</p>
                </div>
                <MetricsList />
                <ChartsList />
            </TabsContent>

            {/* Users Management */}
            {rolesData.canManage && (
                <TabsContent value="users" className="space-y-4">
                    <UsersPage />
                </TabsContent>
            )}

            {/* Roles Settings */}
            {rolesData.canManage && (
                <TabsContent value="roles" className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h2>
                            <p className="text-muted-foreground">Gerencie quem pode fazer o que no sistema.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/settings/permissions">
                                    <Table2 className="mr-2 h-4 w-4" />
                                    Ver Matriz
                                </Link>
                            </Button>
                            <RoleFormDialog allPermissions={rolesData.permissions} />
                        </div>
                    </div>
                    <RolesList roles={rolesData.roles} allPermissions={rolesData.permissions} />
                </TabsContent>
            )}

            {/* API Settings */}
            {apiData.canManage && isMaster && (
                <TabsContent value="apis" className="space-y-4">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Integrações & Segurança</h2>
                        <p className="text-muted-foreground">Chaves de API e Segredos de Webhook.</p>
                    </div>
                    <ClientApiList initialIntegrations={apiData.integrations} />
                </TabsContent>
            )}
        </Tabs>
    )
}
