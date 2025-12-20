'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const timerRef = useRef<NodeJS.Timeout>(null)

    // [DEV] Disabled/Increased to 24 hours as per user request
    const TIMEOUT_MS = 24 * 60 * 60 * 1000 // 15 * 60 * 1000

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () => {
            // Check if session exists before logging out (to avoid double logout or errors)
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                await supabase.auth.signOut()
                toast.warning('Sessão expirada por inatividade.')
                router.push('/login?error=Session expired due to inactivity')
            }
        }, TIMEOUT_MS)
    }

    useEffect(() => {
        // Initial timer
        resetTimer()

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

        const handleActivity = () => {
            resetTimer()
        }

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [router]) // Dependencies

    return <>{children}</>
}
