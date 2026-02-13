"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClinicalIntelligenceSettings } from "./intelligence/clinical-intelligence-settings"
import { Settings, Users, Shield, Lock, FileText, Table2, Brain, ChevronDown } from "lucide-react"
import { SettingsForm } from "./settings-form"
import { RolesList } from "./roles/roles-list"
import { RoleFormDialog } from "./roles/role-form-dialog"
import { ClientApiList } from "./system/apis/client-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UsersPage from "./users/page"
import { ReportTemplateList } from "@/components/reports/ReportTemplateList"
import { useSearchParams } from "next/navigation"
import { GenerateHolidaysButton } from "./schedule/generate-holidays-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SystemIntegrationsCard } from "./system/system-integrations-card"
import { AsaasConfigCard } from "./asaas-config-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    isMaster?: boolean
    slug: string // [NEW] Tenant Isolation
}

export function SettingsView({ initialSettings, hasGoogleIntegration, rolesData, apiData, reportTemplates = [], isMaster = false, slug }: SettingsViewProps) {
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

    const menuItems = [
        { value: "general", label: "Geral", icon: Settings },
        { value: "integrations", label: "Integrações", icon: Table2 },
        { value: "reports", label: "Documentos e Atestados", icon: FileText },
        { value: "intelligence", label: "Inteligência", icon: Brain },
        ...(rolesData.canManage ? [
            { value: "users", label: "Usuários", icon: Users },
            { value: "roles", label: "Perfis de Acesso", icon: Shield }
        ] : [])
    ]

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Desktop Tabs List */}
            <div className="hidden md:block">
                <TabsList className="h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    {menuItems.map(item => (
                        <TabsTrigger
                            key={item.value}
                            value={item.value}
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                        >
                            <item.icon className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            {item.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            {/* Mobile Tab Selector */}
            <div className="md:hidden w-full">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full h-12 bg-white border-2 border-slate-200 rounded-xl shadow-sm focus:ring-slate-500">
                        <div className="flex items-center gap-3">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {menuItems.map(item => (
                            <SelectItem key={item.value} value={item.value}>
                                <div className="flex items-center gap-2 py-1">
                                    <item.icon className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Geral</h2>
                        <p className="text-muted-foreground text-sm">Informações básicas da clínica.</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <GenerateHolidaysButton />
                    </div>
                </div>
                <SettingsForm initialSettings={initialSettings} hasGoogleIntegration={hasGoogleIntegration} isMaster={isMaster} slug={slug} />
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Integrações de Terceiros</h2>
                    <p className="text-muted-foreground text-sm">Conecte sua clínica a ferramentas externas para automatizar processos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AsaasConfigCard slug={slug} />
                    <SystemIntegrationsCard hasGoogleIntegration={hasGoogleIntegration} />
                </div>
            </TabsContent>

            {/* Report Templates (Unified) */}
            <TabsContent value="reports" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold tracking-tight">Documentos e Atestados</h2>
                    <p className="text-muted-foreground text-sm">Gerencie seus modelos personalizados de documentos, atestados e declarações.</p>
                </div>
                <ReportTemplateList templates={reportTemplates} />
            </TabsContent>

            {/* Intelligence */}
            <TabsContent value="intelligence" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Inteligência Clínica</h2>
                    <p className="text-muted-foreground text-sm">Gerencie protocolos baseados em evidência e comportamento da IA.</p>
                </div>
                <ClinicalIntelligenceSettings />
            </TabsContent>

            {/* Users Management */}
            {rolesData.canManage && (
                <TabsContent value="users" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <UsersPage />
                </TabsContent>
            )}

            {/* Roles Settings */}
            {rolesData.canManage && (
                <TabsContent value="roles" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h2>
                            <p className="text-muted-foreground text-sm">Gerencie quem pode fazer o que no sistema.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" asChild className="w-full sm:w-auto">
                                <Link href={`/dashboard/${slug}/settings/permissions`}>
                                    <Table2 className="mr-2 h-4 w-4" />
                                    Ver Matriz
                                </Link>
                            </Button>
                            <div className="w-full sm:w-auto">
                                <RoleFormDialog allPermissions={rolesData.permissions} />
                            </div>
                        </div>
                    </div>
                    <RolesList roles={rolesData.roles} allPermissions={rolesData.permissions} />
                </TabsContent>
            )}
        </Tabs>
    )
}
