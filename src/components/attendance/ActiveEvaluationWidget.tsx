'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, Play, ChevronRight, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import { checkActiveAttendance, finishActiveAttendance } from './actions'

export function ActiveEvaluationWidget({ className, slug: propSlug }: { className?: string, slug?: string }) {
    const { activeAttendanceId, setFullActiveAttendance, startTime, patientName } = useActiveAttendance()
    const [elapsed, setElapsed] = useState('00:00:00')
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const slug = propSlug || params?.slug
    const { isCollapsed } = useSidebar()

    // 1. Poll for active appointments (Using Server Action to bypass RLS)
    const checkActive = async () => {
        try {
            const result: any = await checkActiveAttendance()
            const activeAppt = result.data

            if (activeAppt) {
                // Handle different data shapes (array vs object)
                let pName = 'Paciente'
                if (activeAppt.patient || activeAppt.patients) {
                    const pData = activeAppt.patient || activeAppt.patients
                    if (Array.isArray(pData)) {
                        pName = pData[0]?.name || 'Paciente'
                    } else {
                        pName = pData.name || 'Paciente'
                    }
                }

                // Prefer start_time from appointment (timestamp)
                let start = activeAppt.start_time || new Date().toISOString()

                // Atomic Update
                setFullActiveAttendance(activeAppt.id, start, pName, activeAppt.patient_id)
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
    const isOnAttendancePage = pathname.includes(`/dashboard/${slug}/attendance/${activeAttendanceId}`)

    if (isOnAttendancePage) return null

    // COMPACT MODE (Collapsed Sidebar)
    if (isCollapsed) {
        return (
            <div className={cn("px-2 mt-2", className)}>
                <button
                    onClick={() => router.push(`/dashboard/${slug}/attendance/${activeAttendanceId}`)}
                    className="w-full flex items-center justify-center h-10 rounded-md bg-amber-100 text-amber-900 shadow-sm hover:bg-amber-200 transition-all relative group border border-amber-200"
                    title={`Em Atendimento: ${patientName} (${elapsed})`}
                >
                    <Timer className="h-5 w-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            </div>
        )
    }

    // EXPANDED MODE (Timer Card Style - AMBER THEME)
    return (
        <div className={cn("px-4 mt-4 mb-2 animate-in fade-in slide-in-from-left duration-300", className)}>
            <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200/50 border-l-4 border-l-amber-500 text-amber-900 overflow-hidden relative">

                <div className="p-3 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700/80">
                                Em Andamento
                            </span>
                        </div>
                        <div className="text-xl font-mono font-bold tracking-tighter text-amber-900/90">
                            {elapsed}
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="text-sm font-bold text-amber-900 truncate pr-2 border-b border-amber-200 pb-1" title={patientName || ''}>
                            {patientName || 'Paciente'}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.push(`/dashboard/${slug}/attendance/${activeAttendanceId}`)}
                            size="sm"
                            className="flex-1 bg-amber-600 text-white hover:bg-amber-700 font-semibold shadow-sm text-xs h-8"
                        >
                            Retomar
                            <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                            onClick={() => {
                                toast("Deseja encerrar este atendimento agora?", {
                                    action: {
                                        label: "Sim, Encerrar",
                                        onClick: async () => {
                                            await finishActiveAttendance(activeAttendanceId)
                                            checkActive()
                                            toast.success("Atendimento encerrado.")
                                        }
                                    }
                                })
                            }}
                            variant="ghost"
                            size="sm"
                            className="flex-none text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-bold text-xs h-8 px-2"
                        >
                            Encerrar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
