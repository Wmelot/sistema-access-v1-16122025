'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, CheckCircle2, ShieldCheck, ExternalLink, Lock } from "lucide-react"
import { toast } from "sonner"
import { saveAsaasConfig, getAsaasConfig } from "./system/apis/actions"

export function AsaasConfigCard({ slug }: { slug: string }) {
    const [apiKey, setApiKey] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const config = await getAsaasConfig(slug)
            if (config && config.config) {
                setApiKey((config.config as any).api_key || "")
                setIsActive(config.is_active)
            }
        } catch (e) {
            console.error("Erro ao carregar card asaas", e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!apiKey) return toast.error("Por favor, insira uma chave de API")

        setSaving(true)
        try {
            const res = await saveAsaasConfig(apiKey, slug)
            if (res.success) {
                toast.success("Configuração do Asaas salva com sucesso!")
                setIsActive(true)
            } else {
                toast.error(res.error || "Erro ao salvar")
            }
        } catch (e) {
            toast.error("Erro na comunicação com o servidor")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <Card>
            <CardContent className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </CardContent>
        </Card>
    )

    return (
        <Card className="border-l-4 border-l-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-slate-600" />
                        </div>
                        <div>
                            <CardTitle>Configuração Asaas</CardTitle>
                            <CardDescription>Receba pagamentos via Boleto, PIX e Cartão direto na sua conta.</CardDescription>
                        </div>
                    </div>
                    {isActive && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            ATIVO
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100 italic">
                    <p>
                        Para ativar esta integração, você precisa da <strong>API KEY</strong> gerada no painel do seu Asaas em
                        <i> Configurações {'>'} Integrações</i>. Toda cobrança gerada por aqui será creditada diretamente na sua conta Asaas.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="asaas_key">Sua API Key do Asaas</Label>
                    <div className="relative">
                        <Input
                            id="asaas_key"
                            type="password"
                            className="pr-10"
                            placeholder="$a... (sua chave secreta)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Lock className="h-4 w-4 text-slate-300" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-slate-100">
                <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-800 w-full sm:w-auto">
                    <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer">
                        Criar conta no Asaas
                        <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-800 hover:bg-zinc-900 text-white w-full sm:min-w-[140px] shadow-sm active:scale-95 transition-all"
                >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Salvar Chave
                </Button>
            </CardFooter>
        </Card>
    )
}
