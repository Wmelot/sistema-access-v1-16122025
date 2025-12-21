"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Shield, Lock, FileText } from "lucide-react"
import { SettingsForm } from "./settings-form"
import { RolesList } from "./roles/roles-list"
import { RoleFormDialog } from "./roles/role-form-dialog"
import { ClientApiList } from "./system/apis/client-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UsersPage from "./users/page"
import { ReportTemplateList } from "@/components/reports/ReportTemplateList"
import { useSearchParams } from "next/navigation"
import { GenerateHolidaysButton } from "./schedule/generate-holidays-button"

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
}

export function SettingsView({ initialSettings, hasGoogleIntegration, rolesData, apiData, reportTemplates = [] }: SettingsViewProps) {
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
                {apiData.canManage && (
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
                <SettingsForm initialSettings={initialSettings} hasGoogleIntegration={hasGoogleIntegration} />
            </TabsContent>

            {/* Report Templates */}
            <TabsContent value="reports" className="space-y-4">
                <ReportTemplateList templates={reportTemplates} />
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
                        <RoleFormDialog allPermissions={rolesData.permissions} />
                    </div>
                    <RolesList roles={rolesData.roles} allPermissions={rolesData.permissions} />
                </TabsContent>
            )}

            {/* API Settings */}
            {apiData.canManage && (
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
