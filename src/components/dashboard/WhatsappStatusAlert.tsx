"use client"

import { useEffect, useState } from "react"
import { AlertCircle, MessageSquare, RefreshCw, X } from "lucide-react"
import { getWhatsappConfig } from "@/app/dashboard/[slug]/settings/communication/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function WhatsappStatusAlert({ slug, role }: { slug: string, role?: string }) {
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'error' | 'unknown' | 'hidden'>('unknown')
    const [loading, setLoading] = useState(false)
    const isAdmin = role === 'Master' || role === 'Administrador'

    const checkStatus = async () => {
        if (!slug || !isAdmin) return
        setLoading(true)
        try {
            const config = await getWhatsappConfig(slug, true)
            if (config?.isFeatureActive && config?.provider) {
                setStatus(config.connectionStatus as any)
            } else {
                setStatus('hidden')
            }
        } catch (error) {
            console.error("Failed to check WhatsApp status", error)
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAdmin) {
            checkStatus()
        }
    }, [slug, isAdmin])

    if (!isAdmin || status === 'connected' || status === 'hidden' || status === 'unknown') return null

    return (
        <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-bold flex items-center justify-between">
                WhatsApp Desconectado
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-red-700 hover:bg-red-100"
                        onClick={checkStatus}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
                        Atualizar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-700 hover:bg-red-100"
                        onClick={() => setStatus('hidden')}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </AlertTitle>
            <AlertDescription className="text-red-800 text-xs">
                As mensagens automáticas de confirmação e lembretes **não estão sendo enviadas**.
                <Link href={`/dashboard/${slug}/settings/communication`} className="ml-1 underline font-bold hover:text-red-600">
                    Clique aqui para reconectar sua instância.
                </Link>
            </AlertDescription>
        </Alert>
    )
}
