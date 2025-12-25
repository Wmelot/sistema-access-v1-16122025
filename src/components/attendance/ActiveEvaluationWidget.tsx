'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, Play, ChevronRight, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider' // [NEW]

export function ActiveEvaluationWidget({ className }: { className?: string }) {
    // const [activeAppointment, setActiveAppointment] = useState<any>(null) // [REMOVED] Use Context
    const { activeAttendanceId, setActiveAttendanceId, startTime, setStartTime, patientName, setPatientName } = useActiveAttendance()
    const [elapsed, setElapsed] = useState('00:00:00')
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const { isCollapsed } = useSidebar()

    // 1. Poll for active appointments
    const checkActive = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Find started appointment (in_progress) for this pro
        // We order by start_time desc to get the most recent one if multiple (though should be one)
        const { data } = await supabase
            .from('appointments')
            .select(`
                id,
                start_time,
                date,
                patient:patients(name),
                patient_records(created_at) 
            `)
            .eq('professional_id', user.id)
            .eq('status', 'in_progress')
            .order('start_time', { ascending: false })
            .limit(1)
            .single()

        if (data) {
            setActiveAttendanceId(data.id)
            // Handle array or object response from Supabase
            // @ts-ignore    
            const pName = Array.isArray(data.patient) ? data.patient[0]?.name : data.patient?.name
            setPatientName(pName)

            // Calc start time preference (Record > Appointment)
            let start = `${data.date}T${data.start_time}`
            if (data.patient_records?.[0]?.created_at) {
                start = data.patient_records[0].created_at
            }
            setStartTime(start)
        } else {
            // Sync: If DB says no active attendance, clear context
            if (activeAttendanceId) {
                setActiveAttendanceId(null)
            }
        }
    }

    useEffect(() => {
        checkActive()
        const interval = setInterval(checkActive, 1000 * 30) // Check every 30s

        return () => clearInterval(interval)
    }, [pathname])

    // 2. Timer Logic
    useEffect(() => {
        if (!startTime) return

        const timer = setInterval(() => {
            const start = new Date(startTime)

            // patient_records is an array due to relation
            // Logic moved to checkActive or Context Setter
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

    const isOnAttendancePage = pathname.includes(`/dashboard/attendance/${activeAttendanceId}`)

    if (isOnAttendancePage) return null

    return (
        <div className={cn("px-2 lg:px-4 mt-1", className)}>
            <button
                onClick={() => router.push(`/dashboard/attendance/${activeAttendanceId}`)}
                className={cn(
                    "group flex items-center gap-3 rounded-lg py-2 text-primary transition-all hover:bg-primary/10 w-full animate-in fade-in slide-in-from-left duration-300",
                    isCollapsed ? "justify-center px-0" : "px-3"
                )}
                title={!isCollapsed ? undefined : `Em Atendimento: ${patientName} (${elapsed})`}
            >
                <div className="relative">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="absolute flex h-2 w-2 top-0 right-0 -mt-0.5 -mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                </div>

                {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                        <div className="flex flex-col items-start truncate overflow-hidden">
                            <span className="text-sm font-medium truncate w-full text-left">
                                Em Atendimento
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                                {patientName}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-medium bg-background border px-1.5 py-0.5 rounded ml-2 shadow-sm">
                            {elapsed}
                        </span>
                    </div>
                )}
            </button>
        </div>
    )
}
