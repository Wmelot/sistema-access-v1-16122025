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
import { updateAppointment } from "@/actions/appointments"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

interface AppointmentCardProps {
    appointment: any
    onClick?: (e: React.MouseEvent) => void
    hideTime?: boolean
}

// Status Config
const statusConfig = {
    scheduled: {
        borderColor: "border-blue-200",
        bg: "bg-blue-50/60",
        textColor: "text-blue-700",
        dotColor: "bg-blue-400",
        label: "Agendado",
        next: "checked_in",
        nextLabel: "Marcar como Chegou"
    },
    checked_in: {
        borderColor: "border-purple-200",
        bg: "bg-purple-50/60",
        textColor: "text-purple-700",
        dotColor: "bg-purple-400",
        label: "Chegou",
        next: "in_progress",
        nextLabel: "Iniciar Atendimento"
    },
    in_progress: {
        borderColor: "border-orange-200",
        bg: "bg-orange-50/60",
        textColor: "text-orange-700",
        dotColor: "bg-orange-400",
        label: "Em Atendimento",
        next: "attended",
        nextLabel: "Finalizar"
    },
    attended: {
        borderColor: "border-green-200",
        bg: "bg-green-50/60",
        textColor: "text-green-700",
        dotColor: "bg-green-500",
        label: "Finalizado",
        next: null,
        nextLabel: null
    },
    attended_unpaid: {
        borderColor: "border-yellow-200",
        bg: "bg-yellow-50/60",
        textColor: "text-yellow-700",
        dotColor: "bg-yellow-400",
        label: "Pendente Fatura",
        next: null,
        nextLabel: null
    },
    no_show: {
        borderColor: "border-red-200",
        bg: "bg-red-50/60",
        textColor: "text-red-700",
        dotColor: "bg-red-400",
        label: "Não Compareceu",
        next: null,
        nextLabel: null
    },
    rescheduled: {
        borderColor: "border-slate-200",
        bg: "bg-slate-50/60",
        textColor: "text-slate-700",
        dotColor: "bg-slate-400",
        label: "Reagendado",
        next: null,
        nextLabel: null
    },
    cancelled: {
        borderColor: "border-zinc-200",
        bg: "bg-zinc-50/60",
        textColor: "text-zinc-500",
        dotColor: "bg-zinc-300",
        label: "Cancelado",
        next: null,
        nextLabel: null
    },
    completed: {
        borderColor: "border-green-200",
        bg: "bg-green-50/60",
        textColor: "text-green-700",
        dotColor: "bg-green-500",
        label: "Finalizado",
        next: null,
        nextLabel: null
    }
}

export function AppointmentCard({ appointment, onClick, hideTime }: AppointmentCardProps) {
    // Optimistic UI State
    const [optimisticStatus, setOptimisticStatus] = useState(appointment.status || 'scheduled')
    const [loading, setLoading] = useState(false)

    // [NEW] Sync state when prop changes (necessary for public confirmation refresh)
    useEffect(() => {
        setOptimisticStatus(appointment.status || 'scheduled')
    }, [appointment.status])

    // Derived config based on optimistic status
    let status = optimisticStatus as keyof typeof statusConfig

    // Custom Logic for Invoiced (Faturado) vs Attended but not Invoiced
    const isPaid = !!(appointment.payment_method_id || appointment.resource?.payment_method_id)
    if (status === 'attended' && !isPaid) {
        status = 'attended_unpaid'
    }

    const config = statusConfig[status] || statusConfig.scheduled

    // Determine Service Color (Dot)
    // If we want the DOT to match the service (like Google Calendar)
    const serviceColor = appointment.services?.color || appointment.resource?.services?.color || '#3b82f6'

    const router = useRouter()
    const { slug } = useParams()

    const handleNextStatus = async (e: React.MouseEvent) => {
        e.stopPropagation()

        // Use current derived config for next step
        if (!config.next) return

        const previousStatus = optimisticStatus
        const nextStatus = config.next

        // 1. OPTIMISTIC UPDATE: Update UI immediately
        setOptimisticStatus(nextStatus)
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
            formData.append('status', nextStatus)

            const start = new Date(appointment.start_time)
            formData.append('date', start.toISOString().split('T')[0])
            formData.append('time', start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

            const result = await updateAppointment(formData)

            if (result.success) {
                // [MODIFIED] If redirecting, show a specific loading toast instead of a blocking alert
                if (nextStatus === 'in_progress') {
                    toast.loading("Iniciando atendimento... Abrindo prontuário.", {
                        id: `redirect-${appointment.id}`
                    })

                    const isAssessment =
                        appointment.services?.name?.toLowerCase().includes('consulta') ||
                        appointment.services?.name?.toLowerCase().includes('avaliação') ||
                        appointment.title?.toLowerCase().includes('consulta') ||
                        appointment.title?.toLowerCase().includes('avaliação')

                    const url = `/dashboard/${slug}/attendance/${appointment.id}${isAssessment ? '?mode=assessment' : ''}`
                    router.push(url)
                } else {
                    toast.success(`Status atualizado para ${statusConfig[nextStatus as keyof typeof statusConfig].label}`)
                }
            } else {
                // REVERT on error
                setOptimisticStatus(previousStatus)
                toast.error(result.error || "Erro ao atualizar status")
            }
        } catch (error) {
            // REVERT on connection error
            setOptimisticStatus(previousStatus)
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "h-full w-full rounded-md border-2 border-l-4 px-1.5 py-0.5 relative group transition-all hover:shadow-md cursor-pointer",
                config.bg,
                config.borderColor,
            )}
            style={{
                borderLeftColor: serviceColor
            }}
        >
            {/* Header: Time + Status Dot */}
            <div className="flex items-center justify-between text-[10px] leading-tight mb-0.5">
                <span className={cn("font-semibold opacity-70", config.textColor)}>
                    {!hideTime && (
                        <>
                            {new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </>
                    )}
                </span>
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 ml-1", config.dotColor)} />
            </div>

            {/* Patient Name */}
            <div className={cn("font-bold text-xs truncate leading-tight -mt-0.5", config.textColor)}>
                {appointment.patients?.name || appointment.title || 'Paciente'}
            </div>

            {/* Service Name */}
            <div className={cn("text-[8.5px] truncate opacity-60 leading-tight font-medium", config.textColor)}>
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
                                    className="h-7 w-7 sm:h-6 sm:w-6 shadow-md sm:shadow-sm bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-primary"
                                    onClick={handleNextStatus}
                                    disabled={loading}
                                >
                                    <ArrowRight className={cn("h-4 w-4 sm:h-3 sm:w-3", loading && "animate-spin")} />
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
