'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, Play, ChevronRight, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import { checkActiveAttendance, finishActiveAttendance } from './actions'

export function ActiveEvaluationWidget({ className }: { className?: string }) {
    const { activeAttendanceId, setFullActiveAttendance, startTime, patientName } = useActiveAttendance()
    const [elapsed, setElapsed] = useState('00:00:00')
    const router = useRouter()
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()

    // 1. Poll for active appointments (Using Server Action to bypass RLS)
    const checkActive = async () => {
        try {
            const result: any = await checkActiveAttendance()
            const activeAppt = result.data

            if (activeAppt) {
                // Handle different data shapes (array vs object)
                let pName = 'Paciente'
                if (activeAppt.patient) {
                    if (Array.isArray(activeAppt.patient)) {
                        pName = activeAppt.patient[0]?.name || 'Paciente'
                    } else {
                        pName = activeAppt.patient.name || 'Paciente'
                    }
                }
                // Fallback to activeAppt.patients (plural) if join was different
                // @ts-ignore
                if (!pName || pName === 'Paciente') {
                    // @ts-ignore
                    const altName = activeAppt.patients?.name
                    if (altName) pName = altName
                }

                // Prefer start_time from appointment (timestamp)
                let start = activeAppt.start_time || new Date().toISOString()

                // Atomic Update
                setFullActiveAttendance(activeAppt.id, start, pName, activeAppt.status || 'in_progress')
            } else {
                // Only clear if we currently have something set locally but server says nothing
                if (activeAttendanceId) {
                    setFullActiveAttendance(null, null, null, null)
                }
            }
        } catch (err) {
            console.error("Widget Poll Error:", err)
        }
    }

    useEffect(() => {
        // Run immediately on mount
        checkActive()

        // Poll frequently (2s) for instant "Yellow Card" feedback after starting attendance
        const interval = setInterval(checkActive, 2000)

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
                    className="w-full flex items-center justify-center h-10 rounded-md bg-yellow-400 text-yellow-950 shadow-md hover:bg-yellow-500 transition-all relative group"
                    title={`Em Atendimento: ${patientName} (${elapsed})`}
                >
                    <Timer className="h-5 w-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            </div>
        )
    }

    // EXPANDED MODE (Timer Card Style - AMBER/YELLOW THEME)
    return (
        <div className={cn("px-4 mt-4 mb-2 animate-in fade-in slide-in-from-left duration-300", className)}>
            <div className="bg-yellow-400 rounded-xl shadow-md border-l-4 border-yellow-600 text-yellow-950 overflow-hidden relative">

                <div className="p-3 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-600 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-700"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-800">
                                Em Andamento
                            </span>
                        </div>
                        <div className="text-xl font-mono font-bold tracking-tighter text-yellow-950">
                            {elapsed}
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="text-sm font-bold text-yellow-900 truncate pr-2 border-b border-yellow-500/30 pb-1" title={patientName || ''}>
                            {patientName || 'Paciente'}
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push(`/dashboard/attendance/${activeAttendanceId}`)}
                        size="sm"
                        className="flex-1 bg-yellow-950 text-yellow-50 hover:bg-yellow-900 font-semibold shadow-none text-xs h-8"
                    >
                        Retomar
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button
                        onClick={async () => {
                            if (confirm("Deseja encerrar este atendimento agora?")) {
                                await finishActiveAttendance(activeAttendanceId)
                                checkActive()
                                toast.success("Atendimento encerrado.")
                            }
                        }}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-yellow-900 hover:bg-yellow-500 font-bold text-xs h-8"
                    >
                        Encerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}
