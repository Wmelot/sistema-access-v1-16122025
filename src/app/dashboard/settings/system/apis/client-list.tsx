
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { createIntegration, generateSecret, deleteIntegration } from "./actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function ClientApiList({ initialIntegrations }: { initialIntegrations: any[] }) {
    const [integrations, setIntegrations] = useState(initialIntegrations)
    const [newServiceName, setNewServiceName] = useState("")
    const [loading, setLoading] = useState(false)
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})

    const handleCreate = async () => {
        if (!newServiceName) return
        setLoading(true)
        try {
            const res = await createIntegration(newServiceName)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Integração criada!")
                setNewServiceName("")
                // Refresh effectively? Using server action revalidatePath handles it usually, 
                // but client state might need manual update or router.refresh()
                window.location.reload()
            }
        } catch (e) {
            toast.error("Erro ao criar.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza? Isso pode quebrar integrações ativas.")) return
        try {
            await deleteIntegration(id)
            toast.success("Removida.")
            setIntegrations(prev => prev.filter(i => i.id !== id))
        } catch (e) {
            toast.error("Erro ao excluir.")
        }
    }

    const handleGenerate = async (id: string, keyName: string) => {
        if (!confirm("Gerar nova chave invalidará a anterior. Continuar?")) return
        try {
            const res = await generateSecret(id, keyName)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Nova chave gerada com segurança!")
                window.location.reload()
            }
        } catch (e) {
            toast.error("Erro ao gerar.")
        }
    }

    const toggleVisibility = (id: string) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copiado!")
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 max-w-sm">
                <Input
                    placeholder="Nome do Serviço (ex: eNotas)"
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                />
                <Button onClick={handleCreate} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                </Button>
            </div>

            <div className="grid gap-4">
                {integrations.map(integration => {
                    const creds = integration.credentials || {}
                    const secretKey = creds.secret_key || "Não gerada"
                    const isVisible = visibleKeys[integration.id]

                    return (
                        <Card key={integration.id} className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-destructive hover:bg-red-50 hover:text-red-600 z-10"
                                onClick={() => handleDelete(integration.id)}
                                title="Excluir Integração"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>

                            <CardHeader className="pb-3 pr-12">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Serviço</span>
                                </div>
                                <CardTitle className="text-base break-all leading-tight">
                                    {integration.service_name}
                                </CardTitle>
                                <CardDescription className="text-xs font-mono mt-1">ID: {integration.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Chave de Acesso (API Key / Secret)</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                readOnly
                                                type={isVisible ? "text" : "password"}
                                                value={secretKey}
                                                className="font-mono pr-20"
                                            />
                                            {secretKey !== "Não gerada" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1 h-7"
                                                    onClick={() => copyToClipboard(secretKey)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => toggleVisibility(integration.id)}>
                                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="outline" onClick={() => handleGenerate(integration.id, 'secret_key')}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Gerar Nova
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Esta chave é gerada criptograficamente. Mantenha-a em segredo.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
