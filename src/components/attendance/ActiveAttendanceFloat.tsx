"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { useEffect, useState } from "react"

export function ActiveAttendanceFloat() {
    const { activeAttendanceId, patientName, startTime, patientId } = useActiveAttendance()
    const [elapsed, setElapsed] = useState("00:00")

    useEffect(() => {
        if (!startTime) return

        const updateTimer = () => {
            const start = new Date(startTime)
            if (isNaN(start.getTime())) return "00:00"
            const now = new Date()
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000)

            const hours = Math.floor(diff / 3600)
            const minutes = Math.floor((diff % 3600) / 60)
            const seconds = diff % 60

            const fmt = (n: number) => n.toString().padStart(2, '0')
            setElapsed(`${hours > 0 ? fmt(hours) + ':' : ''}${fmt(minutes)}:${fmt(seconds)}`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [startTime])

    const pathname = usePathname()

    // Hide if inside the active attendance screen to avoid distraction (Execution Screen)
    if (!activeAttendanceId) return null
    if (pathname.includes(`/dashboard/attendance/${activeAttendanceId}`)) return null

    // Hide if on the Patient Profile of the active patient (Duplication with Banner)
    // Path: /dashboard/patients/[id]
    if (patientId && pathname.includes(`/dashboard/patients/${patientId}`)) return null


    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Card className="bg-slate-900 text-white shadow-xl border-slate-700 w-auto min-w-[300px]">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Em Atendimento
                        </div>
                        <div className="font-bold text-lg leading-none truncate max-w-[180px]">
                            {patientName || "Paciente"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono mt-1">
                            <Clock className="w-3 h-3" />
                            {elapsed}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg shadow-green-900/20">
                            <Link href={`/dashboard/attendance/${activeAttendanceId}`}>
                                <Play className="w-3 h-3 mr-1.5 fill-current" />
                                Retomar
                            </Link>
                        </Button>
                        {/* Option to minimize/close? For now, keep it persistent until finished */}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
