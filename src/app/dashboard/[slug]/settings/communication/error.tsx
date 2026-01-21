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
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black text-white rounded-lg">
            <h2 className="text-xl font-bold text-red-500 mb-4">Algo deu errado!</h2>
            <div className="bg-slate-900 p-4 rounded-md font-mono text-sm border border-red-900 mb-4 max-w-full overflow-auto">
                <p className="text-red-300">Erro: {error.message}</p>
                {error.digest && <p className="text-slate-500 text-xs mt-2">Digest: {error.digest}</p>}
                {error.stack && <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">{error.stack}</pre>}
            </div>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
                Tentar novamente
            </button>
        </div>
    )
}
