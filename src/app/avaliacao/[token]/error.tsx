'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Public Assessment Page Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-50 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-800">Ops! Algo deu errado</h1>
                    <p className="text-slate-500 text-sm">
                        Tivemos um problema técnico ao processar sua avaliação. Por favor, tente novamente ou entre em contato com seu profissional.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        onClick={() => reset()}
                        className="w-full h-12 gap-2 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-95"
                    >
                        <RefreshCcw className="h-5 w-5" />
                        Tentar Novamente
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="w-full h-12 gap-2 text-slate-600 hover:bg-slate-50 transition-all border-slate-200"
                    >
                        <Home className="h-5 w-5" />
                        Voltar ao Início
                    </Button>
                </div>

                <div className="pt-6 border-t border-slate-100 italic">
                    <p className="text-[10px] text-slate-400">
                        ID do Erro: {error.digest || 'Internal Error'}
                    </p>
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-xs text-center uppercase tracking-widest font-bold opacity-50">
                Access Fisioterapia • Inteligência em Saúde
            </p>
        </div>
    )
}
