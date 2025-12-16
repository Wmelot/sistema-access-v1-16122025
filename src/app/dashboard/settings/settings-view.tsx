"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Shield, Lock } from "lucide-react"
import { SettingsForm } from "./settings-form"
import { RolesList } from "./roles/roles-list"
import { RoleFormDialog } from "./roles/role-form-dialog"
import { ClientApiList } from "./system/apis/client-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    auditData: {
        // Placeholder
    }
}

export function SettingsView({ initialSettings, hasGoogleIntegration, rolesData, apiData }: SettingsViewProps) {
    // Default to 'general' or first available tab
    const [activeTab, setActiveTab] = useState("general")

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-md inline-flex">
                <TabsTrigger value="general" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Geral
                </TabsTrigger>
                {rolesData.canManage && (
                    <TabsTrigger value="roles" className="gap-2">
                        <Users className="h-4 w-4" />
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
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Geral</h2>
                    <p className="text-muted-foreground">Informações básicas da clínica.</p>
                </div>
                <SettingsForm initialSettings={initialSettings} hasGoogleIntegration={hasGoogleIntegration} />
            </TabsContent>

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
