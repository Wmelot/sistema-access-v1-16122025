'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Activity, Plus, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import Link from 'next/link'
import { startNewAttendance } from '@/app/dashboard/[slug]/patients/actions/start-attendance'
import { cn } from "@/lib/utils"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import Swal from 'sweetalert2'

interface StartAttendanceButtonProps {
    patientId: string
    activeAppointmentId?: string
    className?: string
}

export function StartAttendanceButton({ patientId, activeAppointmentId, className }: StartAttendanceButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { slug } = useParams()

    const { activeAttendanceId } = useActiveAttendance()

    const handleCreate = async () => {
        setLoading(true)
        const res = await startNewAttendance(patientId, slug as string)

        if (res.error === 'ALREADY_IN_ATTENDANCE') {
            setLoading(false)
            const confirm = await Swal.fire({
                title: 'Atenção!',
                html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, iniciar este',
                cancelButtonText: 'Voltar ao anterior',
                confirmButtonColor: '#ff9800',
            })

            if (confirm.isConfirmed) {
                setLoading(true)
                const { finishAttendance } = await import("@/actions/attendance")
                await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug as string)

                const retry = await startNewAttendance(patientId, slug as string)
                if (retry.success) {
                    toast.success("Atendimento iniciado!")
                    router.push(`/dashboard/${slug}/attendance/${retry.appointmentId}`)
                } else {
                    toast.error(retry.msg || "Erro ao iniciar.")
                }
            }
            setLoading(false)
            return
        }

        if (res.success && res.appointmentId) {
            toast.success("Atendimento iniciado!")
            router.push(`/dashboard/${slug}/attendance/${res.appointmentId}`)
        } else {
            toast.error(res.msg || "Erro ao iniciar atendimento")
            setLoading(false)
        }
    }

    const buttonClass = cn("gap-2", className)

    if (activeAppointmentId) {
        return (
            <Button size="sm" variant="default" className={cn("bg-green-600 hover:bg-green-700 text-white shadow-md", buttonClass)} asChild>
                <Link href={`/dashboard/${slug}/attendance/${activeAppointmentId}`}>
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
            className={cn("shadow-md", buttonClass)}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Novo Atendimento
        </Button>
    )
}
