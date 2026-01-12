
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateEvolutionAction } from "@/app/actions/generate-evolution"
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TestAIButton() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [latency, setLatency] = useState<number>(0)
    const [sampleResponse, setSampleResponse] = useState("")

    const runDiagnostics = async () => {
        setLoading(true)
        setStatus('idle')
        setSampleResponse("")

        const start = Date.now()

        // Use a simple prompt to test connectivity
        const result = await generateEvolutionAction("Teste de conexão. O paciente está bem.")

        const end = Date.now()
        setLatency(end - start)
        setLoading(false)

        if (result.success && result.data) {
            setStatus('success')
            setSampleResponse(result.data)
            toast.success("IA Operante! Conexão estabelecida com sucesso.")
        } else {
            setStatus('error')
            toast.error("Falha na conexão com a IA.", { description: result.error })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button
                    onClick={runDiagnostics}
                    disabled={loading}
                    variant={status === 'error' ? "destructive" : "default"}
                    className="w-40"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {loading ? "Testando..." : "Testar Conexão"}
                </Button>

                {status === 'success' && (
                    <div className="text-sm text-green-600 flex items-center gap-2 font-medium bg-green-50 px-3 py-1 rounded-md border border-green-200">
                        <CheckCircle2 className="w-4 h-4" />
                        Online ({latency}ms)
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-sm text-red-600 flex items-center gap-2 font-medium bg-red-50 px-3 py-1 rounded-md border border-red-200">
                        <AlertCircle className="w-4 h-4" />
                        Offline/Erro
                    </div>
                )}
            </div>

            {sampleResponse && (
                <Alert className="bg-slate-50 border-slate-200">
                    <SparklesIcon className="h-4 w-4" />
                    <AlertTitle>Resposta da IA (Preview)</AlertTitle>
                    <AlertDescription className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {sampleResponse}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

function SparklesIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
