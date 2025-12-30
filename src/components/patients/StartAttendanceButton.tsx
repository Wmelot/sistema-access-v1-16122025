'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Activity, Plus, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import Link from 'next/link'
import { startNewAttendance } from '@/app/dashboard/patients/actions/start-attendance'
import { cn } from "@/lib/utils"

interface StartAttendanceButtonProps {
    patientId: string
    activeAppointmentId?: string
    className?: string
}

export function StartAttendanceButton({ patientId, activeAppointmentId, className }: StartAttendanceButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        setLoading(true)
        const res = await startNewAttendance(patientId)

        if (res.success && res.appointmentId) {
            toast.success("Atendimento iniciado!")
            router.push(`/dashboard/attendance/${res.appointmentId}`)
        } else {
            toast.error(res.msg || "Erro ao iniciar atendimento")
            setLoading(false)
        }
    }

    // Reuse visual style from original buttons, but unified
    const buttonClass = cn("gap-2", className)

    if (activeAppointmentId) {
        return (
            <Button size="sm" variant="default" className={cn("bg-green-600 hover:bg-green-700 text-white", buttonClass)} asChild>
                <Link href={`/dashboard/attendance/${activeAppointmentId}`}>
                    <Activity className="h-4 w-4" />
                    Retomar Atendimento
                </Link>
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            onClick={handleCreate}
            disabled={loading}
            className={buttonClass} // Default variant (Primary)
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Novo Atendimento
        </Button>
    )
}
