"use client"

import { cn } from "@/lib/utils"
import { Check, Clock, Play, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { updateAppointment } from "@/app/dashboard/schedule/actions"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface AppointmentCardProps {
    appointment: any
    onClick?: (e: React.MouseEvent) => void
    hideTime?: boolean
}

// Status Config
const statusConfig = {
    scheduled: {
        color: "bg-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        icon: Clock,
        label: "Agendado",
        next: "checked_in",
        nextLabel: "Marcar como Chegou"
    },
    checked_in: {
        color: "bg-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
        text: "text-slate-700",
        icon: AlertCircle,
        label: "Aguardando",
        next: "attended",
        nextLabel: "Iniciar Atendimento"
    },
    attended: {
        color: "bg-yellow-500",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-900",
        icon: Play,
        label: "Em Atendimento",
        next: "completed",
        nextLabel: "Finalizar"
    },
    completed: {
        color: "bg-green-500",
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-900",
        icon: CheckCircle2,
        label: "Finalizado",
        next: null,
        nextLabel: null
    },
    no_show: {
        color: "bg-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        icon: AlertCircle,
        label: "Não Compareceu",
        next: null,
        nextLabel: null
    },
    rescheduled: {
        color: "bg-orange-500",
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-900",
        icon: Clock,
        label: "Reagendado",
        next: null,
        nextLabel: null
    },
    cancelled: {
        color: "bg-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        icon: AlertCircle,
        label: "Cancelado",
        next: null,
        nextLabel: null
    }
}

export function AppointmentCard({ appointment, onClick, hideTime }: AppointmentCardProps) {
    const [loading, setLoading] = useState(false)
    const status = (appointment.status || 'scheduled') as keyof typeof statusConfig
    const config = statusConfig[status] || statusConfig.scheduled

    // Determine Service Color (Dot)
    // If we want the DOT to match the service (like Google Calendar)
    const serviceColor = appointment.services?.color || appointment.resource?.services?.color || '#3b82f6'

    const router = useRouter()

    const handleNextStatus = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!config.next) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('appointment_id', appointment.id)
            formData.append('patient_id', appointment.patient_id || appointment.patients?.id)
            formData.append('professional_id', appointment.professional_id)
            formData.append('service_id', appointment.service_id)
            formData.append('location_id', appointment.location_id || '')
            formData.append('price', String(appointment.price || 0))
            formData.append('notes', appointment.notes || '')
            formData.append('is_extra', String(appointment.is_extra))
            formData.append('status', config.next)

            const start = new Date(appointment.start_time)
            formData.append('date', start.toISOString().split('T')[0])
            formData.append('time', start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

            const result = await updateAppointment(formData)

            if (result.success) {
                toast.success(`Status atualizado para ${statusConfig[config.next as keyof typeof statusConfig].label}`)

                // [NEW] Redirect to Attendance if status is 'attended'
                if (config.next === 'attended') {
                    const isAssessment =
                        appointment.services?.name?.toLowerCase().includes('consulta') ||
                        appointment.services?.name?.toLowerCase().includes('avaliação') ||
                        appointment.title?.toLowerCase().includes('consulta') ||
                        appointment.title?.toLowerCase().includes('avaliação')

                    // Fix: Use path param [id] instead of query param
                    // Append mode=assessment if it's an evaluation
                    const url = `/dashboard/attendance/${appointment.id}${isAssessment ? '?mode=assessment' : ''}`
                    router.push(url)
                }
            } else {
                toast.error(result.error || "Erro ao atualizar status")
            }
        } catch (error) {
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "h-full w-full rounded-md border-l-4 px-1.5 py-0.5 relative group transition-all hover:shadow-md cursor-pointer",
                config.bg,
                config.border,
                // Override border-l color based on Service Color implementation?
                // User liked "Status Colors". Let's use Status Color for the Card Background/Border, 
                // but keep Service Color for the Dot?
                // Or use Service Color for the Left Border and Status for the BG?
                // Let's stick to the Plan: Status Colors (Green, Blue, Gray) dictate the CARD.
            )}
            style={{
                borderLeftColor: serviceColor // OPTIONAL: Keep Service Color as the main identifier? Or Status?
                // Visual Flow usually implies Status Control.
                // Let's try: Border Left = Service Color (Identity). Background = Status Color (State).
            }}
        >
            {/* Header: Time + Status Dot */}
            <div className="flex items-center justify-between text-[10px] leading-tight mb-0.5">
                <span className={cn("font-semibold opacity-90", config.text)}>
                    {!hideTime && (
                        <>
                            {new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(appointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </>
                    )}
                </span>
            </div>

            {/* Patient Name */}
            <div className={cn("font-bold text-xs truncate leading-tight -mt-0.5", config.text)}>
                {appointment.patients?.name || appointment.title || 'Paciente'}
            </div>

            {/* Service Name */}
            <div className={cn("text-[9px] truncate opacity-75 leading-tight", config.text)}>
                {appointment.services?.name || 'Atendimento'}
            </div>

            {/* Quick Action Overlay (Visible on Hover) */}
            {config.next && (
                <div className="absolute top-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-6 w-6 shadow-sm bg-white hover:bg-slate-100 border border-slate-200 rounded-full"
                                    onClick={handleNextStatus}
                                    disabled={loading}
                                >
                                    <ArrowRight className={cn("h-3 w-3", loading && "animate-spin")} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{config.nextLabel}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}
        </div>
    )
}
