"use client"

import { useEffect, useState, useCallback } from "react"
import { Progress } from "@/components/ui/progress"
import { getCampaignDetails } from "../actions"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface CampaignProgressProps {
    campaignId: string
    initialStats: {
        pending: number
        sent: number
        failed: number
    }
    total: number
}

export function CampaignProgress({ campaignId, initialStats, total }: CampaignProgressProps) {
    const [stats, setStats] = useState(initialStats)
    const [progress, setProgress] = useState(0)
    const [isProcessRunning, setIsProcessRunning] = useState(false)

    // Calculate progress percentage
    const calculateProgress = (s: typeof stats) => {
        if (total === 0) return 0
        return Math.round(((s.sent + s.failed) / total) * 100)
    }

    // Trigger the processing backend (client-side cron)
    const triggerProcessing = useCallback(async (manual = false) => {
        if (isProcessRunning && !manual) return // Prevent overlap if auto
        setIsProcessRunning(true)
        try {
            const res = await fetch('/api/cron/process-campaigns', { cache: 'no-store' })
            const data = await res.json()

            if (!res.ok) {
                console.error("Cron Error:", data)
                if (manual) toast.error(`Erro no processamento: ${JSON.stringify(data)}`)
            } else {
                if (manual) toast.success(`Processado: ${JSON.stringify(data)}`)
            }
        } catch (e: any) {
            console.error("Failed to trigger processing:", e)
            if (manual) toast.error(`Erro de conexão: ${e.message}`)
        } finally {
            setIsProcessRunning(false)
        }
    }, [isProcessRunning])

    // Poll for status updates
    useEffect(() => {
        let interval: NodeJS.Timeout

        const fetchStats = async () => {
            const data = await getCampaignDetails(campaignId)
            if (data && data.stats) {
                setStats(prev => {
                    // Update progress only if changed to avoid jitter
                    if (JSON.stringify(prev) !== JSON.stringify(data.stats)) {
                        return data.stats
                    }
                    return prev
                })
            }
        }

        // Initial sync
        setProgress(calculateProgress(stats))
        fetchStats()

        // Poll every 3 seconds for UI updates
        interval = setInterval(() => {
            fetchStats()
        }, 3000)

        // Trigger processing immediately and then every 10 seconds (6 messages per batch usually)
        // This acts as the "Queue Runner" while the page is open
        triggerProcessing(false) // Auto trigger
        const runnerInterval = setInterval(() => triggerProcessing(false), 10000)

        return () => {
            clearInterval(interval)
            clearInterval(runnerInterval)
        }
    }, [campaignId, triggerProcessing])

    // Update progress bar when stats change
    useEffect(() => {
        setProgress(calculateProgress(stats))
    }, [stats, total])

    const isComplete = progress === 100

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between text-sm mb-2 items-center">
                    <span className="font-medium flex items-center gap-2">
                        {isComplete ? (
                            <span className="text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Concluído
                            </span>
                        ) : (
                            <span className="text-blue-600 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                            </span>
                        )}
                        - {progress}%
                    </span>
                    <span className="text-muted-foreground">{stats.sent + stats.failed} de {total}</span>
                </div>
                <Progress value={progress} className="h-4 transition-all duration-500" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Fila (Pendentes)</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                    <div className="text-xs text-green-700 uppercase font-semibold">Enviados</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-xs text-red-700 uppercase font-semibold">Falhas</div>
                </div>
            </div>

            {isProcessRunning && !isComplete && (
                <div className="text-xs text-center text-muted-foreground animate-pulse">
                    Processando lote... mantenha esta página aberta para acelerar o envio.
                </div>
            )}

            {/* DEBUG BUTTON */}
            {!isComplete && (
                <div className="border-t pt-4 mt-4">
                    <button
                        onClick={() => triggerProcessing(true)}
                        className="text-xs text-muted-foreground underline hover:text-primary"
                    >
                        [Debug] Forçar Processamento Manual (Clique aqui se travar)
                    </button>
                </div>
            )}
        </div>
    )
}
