'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Tenant Details Error:', error)
    }, [error])

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Algo deu errado!</AlertTitle>
                <AlertDescription className="mt-2 space-y-4">
                    <p>Não foi possível carregar os detalhes desta clínica.</p>
                    <div className="bg-red-950/10 p-2 rounded text-xs font-mono break-all">
                        {error.message || "Erro desconhecido"}
                    </div>
                    <Button onClick={() => reset()} variant="outline" size="sm">
                        Tentar novamente
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
}
