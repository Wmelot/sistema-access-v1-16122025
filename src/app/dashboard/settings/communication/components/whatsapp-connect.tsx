'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertCircle, Settings, ShieldCheck, ShieldAlert, Key, Server, Hash } from "lucide-react"
import { toast } from "sonner"
import { getWhatsappConfig, saveWhatsappConfig, testZapiConnection } from "../actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function WhatsAppConnect() {
    const [status, setStatus] = useState<'not_found' | 'disconnected' | 'connecting' | 'connected' | 'offline'>('offline')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Config State
    const [provider, setProvider] = useState<string>('evolution')

    // Evolution Config
    const [evoConfig, setEvoConfig] = useState({
        url: "http://localhost:8080",
        apiKey: "",
        instanceName: "AccessFisioMain"
    })

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

    const [isConfiguring, setIsConfiguring] = useState(false)

    // Check status on mount
    useEffect(() => {
        loadConfigAndStatus()
    }, [])

    const cleanString = (val: any) => {
        if (!val) return ""
        const str = String(val)
        if (str === '[object Object]') return ""
        return str
    }

    const loadConfigAndStatus = async () => {
        setLoading(true)
        try {
            const savedConfig = await getWhatsappConfig()

            if (savedConfig) {
                // FORCE STRING
                const validProvider = typeof savedConfig.provider === 'string' ? savedConfig.provider : 'evolution'
                setProvider(validProvider)

                if (savedConfig.evolution) {
                    setEvoConfig({
                        url: cleanString(savedConfig.evolution.url),
                        apiKey: cleanString(savedConfig.evolution.apiKey),
                        instanceName: cleanString(savedConfig.evolution.instanceName)
                    })
                }

                if (savedConfig.zapi) {
                    setZapiConfig({
                        instanceId: cleanString(savedConfig.zapi.instanceId),
                        token: cleanString(savedConfig.zapi.token),
                        clientToken: cleanString(savedConfig.zapi.clientToken)
                    })
                }

                if (savedConfig.testMode) {
                    setTestMode({
                        isActive: Boolean(savedConfig.testMode.isActive),
                        safeNumber: cleanString(savedConfig.testMode.safeNumber)
                    })
                }

                // Check Status 
                if (validProvider === 'evolution' && savedConfig.evolution) {
                    await checkEvolutionStatus(cleanString(savedConfig.evolution.url), cleanString(savedConfig.evolution.apiKey), cleanString(savedConfig.evolution.instanceName))
                } else if (validProvider === 'zapi') {
                    // Z-API is assumed connected if config exists
                    setStatus('connected')
                }
            } else {
                // Default checks if nothing saved
                await checkEvolutionStatus(evoConfig.url, evoConfig.apiKey, evoConfig.instanceName)
            }
        } catch (e: any) {
            console.error("Load Config Error", e)
        } finally {
            setLoading(false)
        }
    }

    const checkEvolutionStatus = async (url: string, apiKey: string, instanceName: string) => {
        try {
            if (!url) return
            const baseUrl = url.replace(/\/$/, "")
            const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
                headers: { 'apikey': apiKey }
            })

            if (!res.ok) throw new Error("API Unreachable")

            const data = await res.json()
            const instance = Array.isArray(data) ? data.find((i: any) => (i.name === instanceName || i.instance?.instanceName === instanceName)) : null

            if (instance) {
                const status = instance.connectionStatus || instance.instance?.status
                if (status === 'open') {
                    setStatus('connected')
                } else {
                    setStatus('disconnected')
                }
            } else {
                setStatus('not_found')
            }

        } catch (e) {
            console.error(e)
            setStatus('offline')
        }
    }

    const handleSaveConfig = async () => {
        setLoading(true)
        try {
            const configToSave = {
                provider: provider as 'evolution' | 'zapi',
                evolution: provider === 'evolution' ? evoConfig : undefined,
                zapi: provider === 'zapi' ? zapiConfig : undefined,
                testMode
            }

            // Using any to bypass strict type check for now if needed, but configToSave matches structure
            const res = await saveWhatsappConfig(configToSave as any)
            if (res.success) {
                toast.success("Configuração salva!")
                setIsConfiguring(false)
                loadConfigAndStatus()
            } else {
                toast.error(typeof res.error === 'string' ? res.error : "Erro desconhecido")
            }
        } catch (e) {
            toast.error("Erro ao salvar.")
        } finally {
            setLoading(false)
        }
    }

    // --- Evolution Specific Config ---
    const createEvoInstance = async () => {
        setLoading(true)
        try {
            const baseUrl = evoConfig.url.replace(/\/$/, "")
            const res = await fetch(`${baseUrl}/instance/create`, {
                method: 'POST',
                headers: { 'apikey': evoConfig.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName: evoConfig.instanceName, integration: 'WHATSAPP-BAILEYS' })
            })
            const data = await res.json()

            const isCreated = data.status === 'CREATED' || data.instance?.instanceName
            const isAlreadyExists = data.error === 'Forbidden' && JSON.stringify(data.response || {}).includes("already in use")

            if (isCreated || isAlreadyExists) {
                if (isAlreadyExists) toast.info("Instância já existe. Buscando QR Code...")
                else toast.success("Instância criada! Buscando QR Code...")
                setTimeout(() => fetchEvoQrCode(), 1000)
            } else {
                toast.error(`Falha: ${JSON.stringify(data)}`)
            }
        } catch (e) { toast.error("Erro ao conectar na API.") } finally { setLoading(false) }
    }

    const fetchEvoQrCode = async (retries = 10) => {
        setLoading(true)
        setQrCode(null)
        try {
            const baseUrl = evoConfig.url.replace(/\/$/, "")
            const res = await fetch(`${baseUrl}/instance/connect/${evoConfig.instanceName}`, { headers: { 'apikey': evoConfig.apiKey } })
            const data = await res.json()
            if (data.base64) { setQrCode(data.base64); setStatus('connecting'); return }
            if (data.instance?.status === 'open') { setStatus('connected'); toast.success("Já conectado!"); return }
            if (retries > 0) { await new Promise(r => setTimeout(r, 2000)); await fetchEvoQrCode(retries - 1); return }
            if (data.code || data.pairingCode) { setQrCode(data.code || data.pairingCode); setStatus('connecting') }
            else { toast.warning("Não foi possível obter o QR Code.") }
        } catch (e) { toast.error("Erro ao buscar QR Code.") } finally { if (retries === 0) setLoading(false) }
    }

    const handleEvoDisconnect = async () => {
        if (!confirm("Desconectar WhatsApp Local?")) return
        setLoading(true)
        try {
            const baseUrl = evoConfig.url.replace(/\/$/, "")
            await fetch(`${baseUrl}/instance/logout/${evoConfig.instanceName}`, { method: 'DELETE', headers: { 'apikey': evoConfig.apiKey } })
            setStatus('disconnected'); setQrCode(null); toast.success("Desconectado.")
        } catch (e) { toast.error("Erro ao desconectar.") } finally { setLoading(false) }
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
                    toast.warning("API conectada, mas o WhatsApp parece desconectado.")
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

    const safeProvider = typeof provider === 'string' ? provider : 'evolution'

    if (isConfiguring) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">Configurações de Integração</h3>
                        <p className="text-sm text-slate-500">Escolha o provedor e configure o modo de segurança.</p>
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
                            />
                        </div>
                        <CardDescription>
                            Quando ativo, <strong>TODAS</strong> as mensagens do sistema serão enviadas apenas para o número seguro abaixo, ignorando o número real do paciente.
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

                {/* PROVIDER TABS */}
                <Tabs value={provider} onValueChange={(v: any) => setProvider(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="evolution">Evolution API (Local)</TabsTrigger>
                        <TabsTrigger value="zapi">Z-API (Nuvem)</TabsTrigger>
                    </TabsList>

                    {/* EVOLUTION FORM */}
                    <TabsContent value="evolution" className="space-y-4 mt-4 border rounded-lg p-4 bg-slate-50">
                        <div className="space-y-3">
                            <div>
                                <Label className="flex items-center gap-2"><Server className="h-4 w-4" /> URL da API</Label>
                                <Input
                                    value={evoConfig.url}
                                    onChange={e => setEvoConfig({ ...evoConfig, url: e.target.value })}
                                    placeholder="http://localhost:8080"
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> API Key (Global)</Label>
                                <Input
                                    type="password"
                                    value={evoConfig.apiKey}
                                    onChange={e => setEvoConfig({ ...evoConfig, apiKey: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2"><Hash className="h-4 w-4" /> Nome da Instância</Label>
                                <Input
                                    value={evoConfig.instanceName}
                                    onChange={e => setEvoConfig({ ...evoConfig, instanceName: e.target.value })}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Z-API FORM */}
                    <TabsContent value="zapi" className="space-y-4 mt-4 border rounded-lg p-4 bg-slate-50">
                        <Alert className="bg-blue-100 border-blue-200 mb-4">
                            <AlertTitle className="text-blue-800">Z-API Selecionada</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Certifique-se de que a instância já está conectada no painel da Z-API.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                            <div>
                                <Label>ID da Instância</Label>
                                <Input
                                    value={zapiConfig.instanceId}
                                    onChange={e => setZapiConfig({ ...zapiConfig, instanceId: e.target.value.trim() })}
                                    placeholder="Ex: 3B2D..."
                                />
                            </div>
                            <div>
                                <Label>Token da Instância</Label>
                                <Input
                                    type="password"
                                    value={zapiConfig.token}
                                    onChange={e => setZapiConfig({ ...zapiConfig, token: e.target.value.trim() })}
                                    placeholder="Ex: 23F2..."
                                />
                            </div>
                            <div>
                                <Label>Client Token (Opcional - Segurança)</Label>
                                <Input
                                    type="password"
                                    value={zapiConfig.clientToken}
                                    onChange={e => setZapiConfig({ ...zapiConfig, clientToken: e.target.value.trim() })}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestZapi}
                                disabled={loading || !zapiConfig.instanceId || !zapiConfig.token}
                                className="w-full"
                            >
                                Testar Conexão com Z-API
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                <Button onClick={handleSaveConfig} disabled={loading} className="w-full h-12 text-lg">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Salvar Configuração e Conectar
                </Button>
            </div>
        )
    }

    // MAIN VIEW (Summary)
    return (
        <div className="flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
                <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(true)} className="text-slate-500 hover:text-slate-800">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                </Button>
            </div>

            {testMode.isActive && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-sm text-blue-800">
                    <ShieldCheck className="h-4 w-4" />
                    <strong>Modo Seguro Ativo:</strong> Mensagens redirecionadas para {testMode.safeNumber || '...'}
                </div>
            )}

            {safeProvider === 'zapi' ? (
                // Z-API VIEW
                <div className="text-center space-y-4 p-8 border rounded-lg bg-green-50/50 border-green-200">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold text-green-800">Z-API Configurada</h3>
                    <p className="text-green-700">Instância ID: {zapiConfig.instanceId}</p>
                    <p className="text-xs text-muted-foreground mt-2">O status de conexão é gerenciado pelo painel da Z-API.</p>
                </div>
            ) : (
                // EVOLUTION VIEW (Complex States)
                <>
                    {status === 'offline' && (
                        <div className="text-center p-8 border-2 border-dashed border-red-200 bg-red-50 rounded-lg">
                            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-red-900">Evolution API Offline</h3>
                            <p className="text-sm text-red-600 mb-4">API não detectada em {evoConfig.url}</p>
                            <Button variant="outline" onClick={() => loadConfigAndStatus()}>Tentar Novamente</Button>
                        </div>
                    )}

                    {status === 'connected' && (
                        <div className="text-center p-8 border rounded-lg bg-green-50/50 border-green-200">
                            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-green-800">Local WhatsApp Conectado!</h3>
                            <p className="text-green-700 mb-4">Instância: {evoConfig.instanceName}</p>
                            <Button variant="destructive" size="sm" onClick={handleEvoDisconnect}>Desconectar</Button>
                        </div>
                    )}

                    {(status === 'disconnected' || status === 'not_found' || status === 'connecting') && (
                        <div className="text-center space-y-4">
                            {qrCode ? (
                                <div className="bg-white p-4 rounded-lg shadow-sm border inline-block">
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                    <p className="text-sm text-muted-foreground mt-2">Escaneie com seu WhatsApp</p>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <Smartphone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4">Instância Local desconectada.</p>
                                    {status === 'disconnected' ? (
                                        <Button onClick={() => fetchEvoQrCode()}>Buscar QR Code</Button>
                                    ) : (
                                        <Button onClick={createEvoInstance}>Criar Instância e Gerar QR</Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
