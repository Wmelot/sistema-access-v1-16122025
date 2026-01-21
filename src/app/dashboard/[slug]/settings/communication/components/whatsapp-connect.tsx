'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertCircle, Settings, ShieldCheck, ShieldAlert, Key, Server, Hash } from "lucide-react"
import { toast } from "sonner"
import { getWhatsappConfig, saveWhatsappConfig, testZapiConnection } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function WhatsAppConnect({ slug }: { slug?: string }) {
    const [loading, setLoading] = useState(false)

    // Z-API Config Only
    const [zapiConfig, setZapiConfig] = useState({
        instanceId: "",
        token: "",
        clientToken: ""
    })

    // Test Mode / Safety Config
    const [testMode, setTestMode] = useState({
        isActive: true, // Default to true for safety
        safeNumber: ""
    })

    const [isConfiguring, setIsConfiguring] = useState(false)

    // Check status on mount
    useEffect(() => {
        loadConfig()
    }, [])


    const loadConfig = async () => {
        setLoading(true)
        try {
            const savedConfig = await getWhatsappConfig(slug)

            if (savedConfig) {
                if (savedConfig.zapi) {
                    setZapiConfig({
                        instanceId: String(savedConfig.zapi.instanceId || ""),
                        token: String(savedConfig.zapi.token || ""),
                        clientToken: String(savedConfig.zapi.clientToken || "")
                    })
                }

                if (savedConfig.testMode) {
                    setTestMode({
                        isActive: Boolean(savedConfig.testMode.isActive),
                        safeNumber: String(savedConfig.testMode.safeNumber || "")
                    })
                }
            }
        } catch (e: any) {
            console.error("Load Config Error", e)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveConfig = async () => {
        setLoading(true)
        try {
            const configToSave = {
                provider: 'zapi', // Enforce Z-API
                zapi: zapiConfig,
                testMode
            }

            const res = await saveWhatsappConfig(configToSave as any, slug)
            if (res.success) {
                toast.success("Configuração Z-API salva com sucesso!")
                setIsConfiguring(false)
                loadConfig()
            } else {
                toast.error(typeof res.error === 'string' ? res.error : "Erro desconhecido")
            }
        } catch (e) {
            toast.error("Erro ao salvar.")
        } finally {
            setLoading(false)
        }
    }

    const handleTestZapi = async () => {
        setLoading(true)
        try {
            const res = await testZapiConnection({
                instanceId: zapiConfig.instanceId,
                token: zapiConfig.token,
                clientToken: zapiConfig.clientToken
            })

            if (res.success) {
                toast.success("Conexão com Z-API bem sucedida!")
                if (res.data?.connected) {
                    toast.success("Instância CONECTADA ao WhatsApp!")
                } else if (res.data?.connected === false) {
                    toast.warning("API conectada, mas o WhatsApp parece desconectado. Escaneie o QR Code no painel da Z-API.")
                }
            } else {
                toast.error(res.error || "Erro ao conectar com Z-API")
            }
        } catch (e) {
            toast.error("Erro ao testar conexão.")
        } finally {
            setLoading(false)
        }
    }

    if (isConfiguring) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">Conexão Z-API (WhatsApp)</h3>
                        <p className="text-sm text-slate-500">Integração oficial via nuvem.</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsConfiguring(false)}>Voltar</Button>
                </div>

                {/* SAFETY MODE CARD */}
                <Card className={`border-l-4 ${testMode.isActive ? "border-l-blue-500 bg-blue-50/30" : "border-l-slate-300"}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                {testMode.isActive ? <ShieldCheck className="h-5 w-5 text-blue-600" /> : <ShieldAlert className="h-5 w-5 text-slate-400" />}
                                Modo de Segurança (Sandbox)
                            </CardTitle>
                            <Switch
                                checked={testMode.isActive}
                                onCheckedChange={(checked) => setTestMode({ ...testMode, isActive: checked })}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>
                        <CardDescription>
                            Quando ativo, <strong>TODAS</strong> as mensagens do sistema serão enviadas apenas para o número seguro abaixo.
                        </CardDescription>
                    </CardHeader>
                    {testMode.isActive && (
                        <CardContent>
                            <Label>Número Seguro (Seu WhatsApp)</Label>
                            <Input
                                placeholder="5511999999999"
                                value={testMode.safeNumber}
                                onChange={e => setTestMode({ ...testMode, safeNumber: e.target.value })}
                                className="mt-1.5"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                * Mensagens chegarão com o prefixo <code>[MODO TESTE]</code>.
                            </p>
                        </CardContent>
                    )}
                </Card>

                {/* Z-API CONFIG FORM */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Credenciais da Instância</CardTitle>
                        <CardDescription>Copie os dados do seu painel Z-API.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-100 mb-4">
                            <AlertTitle className="text-blue-800 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Z-API Selecionada
                            </AlertTitle>
                            <AlertDescription className="text-blue-700 text-xs mt-1">
                                O sistema usará esta conexão para todos os envios.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                            <div>
                                <Label>ID da Instância</Label>
                                <Input
                                    value={zapiConfig.instanceId}
                                    onChange={e => setZapiConfig({ ...zapiConfig, instanceId: e.target.value.trim() })}
                                    placeholder="Ex: 3B2D..."
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div>
                                <Label>Token da Instância</Label>
                                <Input
                                    type="password"
                                    value={zapiConfig.token}
                                    onChange={e => setZapiConfig({ ...zapiConfig, token: e.target.value.trim() })}
                                    placeholder="Ex: 23F2..."
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div>
                                <Label>Client Token (Segurança)</Label>
                                <Input
                                    type="password"
                                    value={zapiConfig.clientToken}
                                    onChange={e => setZapiConfig({ ...zapiConfig, clientToken: e.target.value.trim() })}
                                    placeholder="Deixe vazio se não usar"
                                    className="font-mono text-sm"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Obrigatório apenas se configurado na Z-API. Se na sua Z-API não aparece "Client Token", <strong>deixe em branco</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleTestZapi}
                                disabled={loading || !zapiConfig.instanceId || !zapiConfig.token}
                                className="w-full text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Testar Conexão com Z-API
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={handleSaveConfig} disabled={loading} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Salvar Configuração e Conectar
                </Button>
            </div>
        )
    }

    // MAIN VIEW (Summary)
    return (
        <div className="flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => setIsConfiguring(true)} className="text-slate-600 border-slate-300">
                    <Settings className="h-4 w-4 mr-2" />
                    Alterar Configurações
                </Button>
            </div>

            {testMode.isActive && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-sm text-blue-800 shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <strong>Modo Seguro Ativo:</strong> Mensagens redirecionadas para {testMode.safeNumber || '...'}
                </div>
            )}

            {/* Z-API STATUS ONLY */}
            {!zapiConfig.instanceId ? (
                <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg bg-slate-50">
                    <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">WhatsApp não configurado</h3>
                    <p className="text-slate-500 mb-6">Conecte sua instância Z-API para ativar o envio de mensagens.</p>
                    <Button onClick={() => setIsConfiguring(true)}>Configurar Agora</Button>
                </div>
            ) : (
                <div className="w-full text-center space-y-4 p-8 border rounded-xl bg-gradient-to-br from-green-50 to-white border-200 shadow-sm">
                    <div className="bg-green-100 p-4 rounded-full w-fit mx-auto">
                        <Smartphone className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-green-900">Z-API Conectada</h3>
                        <p className="text-green-700 mt-1 font-mono text-sm bg-green-100/50 py-1 px-3 rounded-full inline-block">ID: {zapiConfig.instanceId}</p>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-green-100">
                        O status da conexão é gerenciado diretamente no painel da Z-API.
                    </div>
                    <Button variant="outline" size="sm" onClick={handleTestZapi} className="text-green-700 border-green-200 hover:bg-green-50 mt-2">
                        Verificar Status da API
                    </Button>
                </div>
            )}
        </div>
    )
}
