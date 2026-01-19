'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full border border-gray-200">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Ops! Algo deu errado.</h2>
                <p className="text-gray-600 mb-6 font-mono text-xs bg-gray-100 p-2 rounded overflow-auto text-left max-h-32">
                    {error.message || "Erro desconhecido"}
                </p>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary text-primary-foreground bg-black text-white rounded hover:opacity-90 transition-opacity"
                    >
                        Tentar novamente
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        </div>
    )
}
