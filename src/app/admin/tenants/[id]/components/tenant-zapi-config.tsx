'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, CheckCircle2, Loader2, Key, Info } from "lucide-react"
import { saveTenantZapiConfig } from "../actions"
import { toast } from "sonner"

interface TenantZapiConfigProps {
    tenantId: string
    initialConfig: any
}

export function TenantZapiConfig({ tenantId, initialConfig }: TenantZapiConfigProps) {
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        instanceId: initialConfig?.config?.instanceId || '',
        token: initialConfig?.config?.token || '',
        clientToken: initialConfig?.config?.clientToken || ''
    })

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await saveTenantZapiConfig(tenantId, config)
            if (res.success) {
                toast.success("Credenciais Z-API salvas com sucesso!")
            }
        } catch (e) {
            toast.error("Erro ao salvar credenciais")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-indigo-50/20 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Configuração Z-API</CardTitle>
                        <CardDescription>Defina as credenciais técnicas para esta clínica.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>ID da Instância</Label>
                        <Input
                            value={config.instanceId}
                            onChange={e => setConfig({ ...config, instanceId: e.target.value })}
                            placeholder="3B2D..."
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Token da Instância</Label>
                        <Input
                            type="password"
                            value={config.token}
                            onChange={e => setConfig({ ...config, token: e.target.value })}
                            placeholder="23F2..."
                            className="font-mono text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        Client Token (Opcional)
                        <Info className="h-3 w-3 text-zinc-400" />
                    </Label>
                    <Input
                        type="password"
                        value={config.clientToken}
                        onChange={e => setConfig({ ...config, clientToken: e.target.value })}
                        placeholder="Insira se ativado no painel Z-API"
                        className="font-mono text-sm"
                    />
                </div>
            </CardContent>
            <CardFooter className="bg-zinc-50 border-t py-4 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Salvar Credenciais
                </Button>
            </CardFooter>
        </Card>
    )
}
