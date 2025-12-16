
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getIntegrations, createIntegration, generateSecret, deleteIntegration } from "./actions"
import { Plus, Trash2, RefreshCw, Copy, Eye, EyeOff } from "lucide-react"
import { hasPermission } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { ClientApiList } from "./client-list"

export default async function ApiSettingsPage() {
    const can = await hasPermission('system.manage_apis')
    if (!can) {
        redirect('/dashboard') // Or settings root
    }

    const integrations = await getIntegrations()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Integrações & APIs</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie chaves de acesso e segredos para serviços externos.
                    </p>
                </div>
            </div>

            <ClientApiList initialIntegrations={integrations} />
        </div>
    )
}
