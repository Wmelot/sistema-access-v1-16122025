'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertCircle, Settings, ShieldCheck, ShieldAlert, Key, Server, Hash, QrCode } from "lucide-react"
import { toast } from "sonner"
import { getWhatsappConfig, saveWhatsappConfig, testZapiConnection, getZapiQrCode } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WhatsAppConnect({ slug }: { slug?: string }) {
    const [loading, setLoading] = useState(false)
    const [qrLoading, setQrLoading] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
    const [qrError, setQrError] = useState<string | null>(null)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    // Z-API Config
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

    // View State
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
                    const loadedConfig = {
                        instanceId: String(savedConfig.zapi.instanceId || ""),
                        token: String(savedConfig.zapi.token || ""),
                        clientToken: String(savedConfig.zapi.clientToken || "")
                    }
                    setZapiConfig(loadedConfig)

                    // If we have config, check connection immediately
                    // We don't await here to let the UI render first, but we trigger it.
                    checkConnection(loadedConfig)
                }

                if (savedConfig.testMode) {
                    setTestMode({
                        isActive: Boolean(savedConfig.testMode.isActive),
                        safeNumber: String(savedConfig.testMode.safeNumber || "")
                    })
                }
            } else {
                setConnectionStatus('disconnected')
            }
        } catch (e: any) {
            console.error("Load Config Error", e)
        } finally {
            setLoading(false)
        }
    }

    const checkConnection = async (config = zapiConfig) => {
        if (!config.instanceId || !config.token) return

        setIsChecking(true)
        setConnectionError(null)
        setQrError(null) // Reset QR error too

        try {
            const res = await testZapiConnection(config)

            if (res.success && res.data) {
                if (res.data.connected) {
                    setConnectionStatus('connected')
                    setQrCodeUrl(null)
                } else {
                    setConnectionStatus('disconnected')
                    // Auto-fetch QR if disconnected from WhatsApp but connected to API
                    await refreshQrCode(config)
                }
            } else {
                setConnectionStatus('disconnected')
                setConnectionError(res.error || "Não foi possível conectar à Z-API. Verifique ID e Token.")
            }
        } catch (e) {
            console.error(e)
            setConnectionStatus('disconnected')
            setConnectionError("Erro inesperado ao verificar conexão.")
        } finally {
            setIsChecking(false)
        }
    }

    const refreshQrCode = async (config = zapiConfig) => {
        setQrLoading(true)
        setQrCodeUrl(null)
        setQrError(null)
        try {
            const res = await getZapiQrCode(config)
            if (res.success && res.qrCodeUrl) {
                setQrCodeUrl(res.qrCodeUrl)
            } else {
                setQrError(res.error || "Erro ao carregar QR Code")
                // Don't toast here, just show in UI
            }
        } catch (e) {
            console.error(e)
            setQrError("Erro na comunicação com o servidor.")
        } finally {
            setQrLoading(false)
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
                // Reload to refresh status
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

    // --- RENDER HELPERS ---

    // 1. SETTINGS MODE (Credentials & Safety)
    if (isConfiguring) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">Conexão Z-API (WhatsApp)</h3>
                        <p className="text-sm text-slate-500">Configurações Técnicas e de Segurança.</p>
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
                            Quando ativo, <strong>TODAS</strong> as mensagens serão enviadas apenas para o número seguro.
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
                        </CardContent>
                    )}
                </Card>

                {/* Z-API CONFIG FORM */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Credenciais da Instância</CardTitle>
                        <CardDescription>Dados técnicos da conexão com a Z-API.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
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
                                <Label>Client Token (Opcional)</Label>
                                <Input
                                    type="password"
                                    value={zapiConfig.clientToken}
                                    onChange={e => setZapiConfig({ ...zapiConfig, clientToken: e.target.value.trim() })}
                                    placeholder="Apenas se configurado"
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 flex justify-end pt-6">
                        <Button onClick={handleSaveConfig} disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // 2. MAIN VIEW (Client Friendly)
    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-6">

            {/* Header / Config Button */}
            <div className="w-full flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Status do WhatsApp</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(true)} className="text-slate-500 hover:text-slate-800">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                </Button>
            </div>

            {/* Safety Mode Banner */}
            {testMode.isActive && (
                <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Modo de Segurança Ativo</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                        Mensagens redirecionadas para: <strong>{testMode.safeNumber || 'Não configurado'}</strong>
                    </AlertDescription>
                </Alert>
            )}

            {/* Connection Status Card */}
            <Card className="w-full border shadow-sm overflow-hidden">
                {!zapiConfig.instanceId ? (
                    <div className="p-8 text-center bg-slate-50">
                        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium mb-1">Não Configurado</h3>
                        <p className="text-slate-500 text-sm mb-4">A instância do WhatsApp ainda não foi vinculada.</p>
                        <Button onClick={() => setIsConfiguring(true)} variant="outline">Configurar Agora</Button>
                    </div>
                ) : (
                    <>
                        <div className={`p-6 text-center border-b ${connectionStatus === 'connected' ? 'bg-green-50/50' : 'bg-white'}`}>
                            {connectionStatus === 'connected' ? (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800 mb-1">Conectado e Pronto!</h3>
                                    <p className="text-green-600 text-sm">Seu WhatsApp está sincronizado com o sistema.</p>
                                    <Badge variant="outline" className="mt-4 bg-white text-green-700 border-green-200">
                                        Instância: {zapiConfig.instanceId}
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    {qrCodeUrl ? (
                                        <div className="space-y-4">
                                            <div className="bg-white p-4 rounded-xl border shadow-sm inline-block relative">
                                                {/* Scan Line Animation */}
                                                <div className="absolute top-4 left-4 right-4 h-0.5 bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-[scan_2s_ease-in-out_infinite] z-10 pointer-events-none"></div>
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="QR Code WhatsApp"
                                                    className="w-64 h-64 object-contain"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">Escaneie com seu Celular</h3>
                                                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                                                    Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos Conectados {'>'} Conectar Aparelho
                                                </p>
                                                <p className="text-xs text-red-500 mt-2 font-medium animate-pulse">
                                                    Não feche esta tela até conectar!
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            {qrError || connectionError ? (
                                                <div className="flex flex-col items-center">
                                                    <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                                                    <p className="text-red-600 font-medium mb-1">Falha de Conexão</p>
                                                    <p className="text-slate-500 text-sm mb-4 max-w-xs text-center">{qrError || connectionError}</p>
                                                    <Button variant="outline" size="sm" onClick={() => checkConnection()}>
                                                        <RefreshCw className="h-3 w-3 mr-2" />
                                                        Tentar Conexão
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    {(qrLoading || isChecking) ? (
                                                        <div className="flex flex-col items-center">
                                                            <Loader2 className="h-10 w-10 text-slate-300 animate-spin mx-auto mb-4" />
                                                            <p className="text-slate-500">
                                                                {qrLoading ? "Gerando QR Code..." : "Verificando conexão..."}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                                <QrCode className="h-7 w-7 text-slate-400" />
                                                            </div>
                                                            <p className="text-slate-900 font-medium mb-1">Pronto para Conectar</p>
                                                            <p className="text-slate-500 text-sm mb-4">Gere o QR Code para vincular seu WhatsApp.</p>
                                                            <Button onClick={() => checkConnection()} className="bg-green-600 hover:bg-green-700 text-white">
                                                                Gerar QR Code
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="bg-slate-50 p-4 flex justify-between items-center text-sm text-slate-500">
                            <div className='flex items-center gap-2'>
                                <span className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                {connectionStatus === 'connected' ? 'Online' : 'Desconectado'}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => checkConnection()}
                                disabled={loading || qrLoading || isChecking}
                                className="hover:bg-white border hover:border-slate-200"
                            >
                                <RefreshCw className={`h-3 w-3 mr-2 ${loading || qrLoading || isChecking ? 'animate-spin' : ''}`} />
                                Atualizar Status
                            </Button>
                        </div>
                    </>
                )}
            </Card>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 16px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 270px; opacity: 0; }
                }
            `}</style>
        </div>
    )
}
