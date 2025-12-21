'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

// Evolution API Configuration (Localhost default)
const EVO_API_URL = "http://localhost:8080"
const EVO_API_KEY = "B8988582-7067-463E-A4C3-A3F0E0D06939" // Matches docker-compose default

export function WhatsAppConnect() {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'offline'>('offline')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [instanceName] = useState("AccessFisioMain")

    // Check status on mount
    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        setLoading(true)
        try {
            // 1. Check if Evolution API is running
            // We use 'fetch' directly. Note: In a real deploy, this might need a proxy. 
            // For localhost dev, browser -> localhost:8080 usually works if CORS is allowed.
            // Evolution API v2 usually returns instances list.

            const res = await fetch(`${EVO_API_URL}/instance/fetchInstances`, {
                headers: { 'apikey': EVO_API_KEY }
            })

            if (!res.ok) {
                // If 404/500, maybe server is up but instance logic differs. 
                // Let's assume offline if fetch fails hard.
                throw new Error("API Unreachable")
            }

            const data = await res.json()
            // Data structure depends on Evolution version. usually [ { name: ..., status: ... } ]
            // We'll look for our instance.
            const instance = Array.isArray(data) ? data.find((i: any) => i.instance.instanceName === instanceName) : null

            if (instance && instance.instance.status === 'open') {
                setStatus('connected')
            } else if (instance) {
                setStatus('disconnected') // Exists but closed
            } else {
                setStatus('disconnected') // Doesn't exist, we need to create
            }

        } catch (e) {
            console.error("Evolution API Check Failed:", e)
            setStatus('offline')
        } finally {
            setLoading(false)
        }
    }

    const createInstance = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${EVO_API_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'apikey': EVO_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ instanceName: instanceName })
            })
            const data = await res.json()
            if (data.status === 'CREATED' || data.instance?.instanceName) {
                toast.success("Instância criada! Buscando QR Code...")
                fetchQrCode()
            } else {
                toast.error("Falha ao criar instância.")
            }
        } catch (e) {
            toast.error("Erro ao conectar na API.")
        } finally {
            setLoading(false)
        }
    }

    const fetchQrCode = async () => {
        setLoading(true)
        setQrCode(null)
        try {
            const res = await fetch(`${EVO_API_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVO_API_KEY }
            })
            const data = await res.json()

            // Evolution return base64 usually in data.base64 or similar
            if (data.base64) {
                setQrCode(data.base64)
                setStatus('connecting')
            } else if (data.instance?.status === 'open') {
                setStatus('connected')
                toast.success("Já conectado!")
            }

        } catch (e) {
            toast.error("Erro ao buscar QR Code")
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm("Desconectar WhatsApp?")) return
        setLoading(true)
        try {
            await fetch(`${EVO_API_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_API_KEY }
            })
            setStatus('disconnected')
            setQrCode(null)
            toast.success("Desconectado.")
        } catch (e) {
            toast.error("Erro ao desconectar.")
        } finally {
            setLoading(false)
        }
    }

    if (status === 'offline') {
        return (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-red-50/50 border-red-200">
                <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Servidor WhatsApp Offline</h3>
                <p className="text-sm text-red-600 text-center max-w-md mb-6">
                    A Evolution API não foi detectada em <code>localhost:8080</code>.
                    Você precisa rodar o servidor localmente para conectar.
                </p>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs w-full max-w-lg overflow-x-auto">
                    cd "Sistema Access/evolution-api"<br />
                    docker-compose up -d
                </div>
                <Button variant="outline" className="mt-6 gap-2" onClick={checkStatus}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Tentar Novamente
                </Button>
            </div>
        )
    }

    if (status === 'connected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-green-50/50 border-green-200">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold text-green-800">WhatsApp Conectado!</h3>
                <p className="text-green-700 mt-2">Instância: {instanceName}</p>
                <Badge variant="outline" className="mt-4 bg-green-100 text-green-800 border-green-300">Online</Badge>

                <Button variant="destructive" size="sm" className="mt-8" onClick={handleDisconnect}>
                    Desconectar
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center">
            {qrCode ? (
                <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border inline-block">
                        <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
                    </div>
                    <p className="text-sm text-muted-foreground">Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar</p>
                    <Button variant="ghost" size="sm" onClick={checkStatus} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Confirmei a leitura
                    </Button>
                </div>
            ) : (
                <div className="text-center space-y-4 py-8">
                    <div className="bg-blue-50 p-4 rounded-full inline-flex">
                        <Smartphone className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">Conectar Nova Sessão</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                            Clique abaixo para gerar o QR Code e conectar seu WhatsApp da clínica.
                        </p>
                    </div>
                    <Button onClick={createInstance} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar QR Code
                    </Button>
                    <div className='pt-2'>
                        <Button variant="link" size="sm" onClick={fetchQrCode} disabled={loading} className="text-muted-foreground">
                            (Já tenho instância, apenas reconectar)
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
