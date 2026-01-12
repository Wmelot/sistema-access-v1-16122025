'use client'

import { useEffect, useState } from 'react'

export function TrialDisplay({ trialEndsAt }: { trialEndsAt?: string | null }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !trialEndsAt) return null

    const date = new Date(trialEndsAt)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return null // Expired handled elsewhere or specific UI

    return (
        <div className="px-4 py-2 mt-auto">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs">
                <p className="font-semibold text-indigo-900 mb-1">Teste Gratuito</p>
                <p className="text-indigo-700">
                    Restam <span className="font-bold">{diffDays} dias</span>
                </p>
                <p className="text-[10px] text-indigo-500 mt-1">
                    Até {new Intl.DateTimeFormat('pt-BR').format(date)}
                </p>
            </div>
        </div>
    )
}
