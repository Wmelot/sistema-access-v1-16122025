'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, Play, ChevronRight, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import { checkActiveAttendance } from './actions'

export function ActiveEvaluationWidget({ className }: { className?: string }) {
    const { activeAttendanceId, setFullActiveAttendance, startTime, patientName } = useActiveAttendance()
    const [elapsed, setElapsed] = useState('00:00:00')
    const router = useRouter()
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()

    // 1. Poll for active appointments (Using Server Action to bypass RLS)
    const checkActive = async () => {
        const { data: activeAppt, error } = await checkActiveAttendance()

        if (error) {
            console.error("Error checking active attendance:", error)
            return
        }

        if (activeAppt) {
            // @ts-ignore    
            const pName = Array.isArray(activeAppt.patient) ? activeAppt.patient[0]?.name : activeAppt.patient?.name

            // Prefer start_time from appointment (timestamp)
            let start = activeAppt.start_time || new Date().toISOString()

            // Atomic Update
            setFullActiveAttendance(activeAppt.id, start, pName)

        } else {
            // Only clear if we are sure there is nothing active AND we currently have something set
            if (activeAttendanceId) {
                setFullActiveAttendance(null, null, null)
            }
        }
    }

    useEffect(() => {
        // Run immediately on mount
        checkActive()

        // Also run when the path changes (e.g. navigation)
        // AND poll every 10 seconds for robustness
        const interval = setInterval(checkActive, 10000)

        return () => clearInterval(interval)
    }, [pathname])

    // 2. Timer Logic
    useEffect(() => {
        if (!startTime) return

        const timer = setInterval(() => {
            const start = new Date(startTime)
            const now = new Date()
            const diff = now.getTime() - start.getTime()

            if (diff > 0) {
                const hours = Math.floor(diff / 3600000)
                const minutes = Math.floor((diff % 3600000) / 60000)
                const seconds = Math.floor((diff % 60000) / 1000)
                setElapsed(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                )
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [startTime])

    // 3. Visibility Check
    if (!activeAttendanceId) return null

    // If on assessment page, hide it
    const isOnAttendancePage = pathname.includes(`/dashboard/attendance/${activeAttendanceId}`)

    if (isOnAttendancePage) return null

    // COMPACT MODE (Collapsed Sidebar)
    if (isCollapsed) {
        return (
            <div className={cn("px-2 mt-2", className)}>
                <button
                    onClick={() => router.push(`/dashboard/attendance/${activeAttendanceId}`)}
                    className="w-full flex items-center justify-center h-10 rounded-md bg-yellow-500 text-black shadow-md hover:bg-yellow-600 transition-all relative group"
                    title={`Em Atendimento: ${patientName} (${elapsed})`}
                >
                    <Timer className="h-5 w-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            </div>
        )
    }

    // EXPANDED MODE (Timer Card Style - AMBER/YELLOW THEME)
    return (
        <div className={cn("px-4 mt-4 mb-2 animate-in fade-in slide-in-from-left duration-500", className)}>
            <div className="bg-yellow-500 rounded-xl shadow-lg shadow-yellow-200 overflow-hidden text-black relative border border-yellow-400">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none z-0">
                    <Activity className="w-32 h-32 transform rotate-[-15deg] -mt-8 -mr-8 text-black" />
                </div>

                <div className="p-4 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-black/5 p-1.5 rounded-full backdrop-blur-sm animate-pulse">
                            <Timer className="w-4 h-4 text-black/70" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                            Atendimento em Curso
                        </span>
                    </div>

                    <div className="mb-4">
                        <div className="text-3xl font-mono font-bold tracking-tighter text-black/80 drop-shadow-sm">
                            {elapsed}
                        </div>
                        <div className="text-sm font-medium text-black/70 truncate mt-1" title={patientName || ''}>
                            {patientName || 'Paciente sem nome'}
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push(`/dashboard/attendance/${activeAttendanceId}`)}
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white text-black hover:bg-yellow-50 font-bold shadow-sm transition-all text-xs h-8 border border-yellow-200"
                    >
                        Retomar Agora
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>

                {/* Progress Bar / Activity Indicator */}
                <div className="h-1 w-full bg-black/10">
                    <div className="h-full bg-white/50 animate-progress-indeterminate w-full origin-left"></div>
                </div>
            </div>
        </div>
    )
}
