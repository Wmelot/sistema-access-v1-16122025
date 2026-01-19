'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 font-sans">
                <div className="text-center p-6">
                    <h2 className="text-3xl font-bold mb-4 text-red-600">Erro Crítico do Sistema</h2>
                    <p className="mb-8 max-w-lg mx-auto bg-white p-4 rounded shadow border text-left text-sm font-mono overflow-auto">
                        {error.message}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Recarregar Aplicação
                    </button>
                </div>
            </body>
        </html>
    )
}
