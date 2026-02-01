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
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"

const MySwal = withReactContent(Swal)

interface AppointmentCardProps {
    appointment: any
    onClick?: (e: React.MouseEvent) => void
    hideTime?: boolean
}

// Status Config
const statusConfig = {
    scheduled: {
        borderColor: "border-slate-200", // Will be overridden by serviceColor if needed, but slate-200 is fallback
        bg: "bg-white",
        textColor: "text-slate-700",
        dotColor: "bg-slate-300",
        label: "Agendado",
        next: "confirmed",
        nextLabel: "Confirmar Agendamento"
    },
    confirmed: {
        borderColor: "border-blue-200",
        bg: "bg-blue-50/60",
        textColor: "text-blue-700",
        dotColor: "bg-blue-400",
        label: "Confirmado",
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
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    },
    attended_unpaid: {
        borderColor: "border-yellow-200",
        bg: "bg-yellow-50/60",
        textColor: "text-yellow-700",
        dotColor: "bg-yellow-400",
        label: "Pendente Fatura",
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    },
    no_show: {
        borderColor: "border-red-200",
        bg: "bg-red-50/60",
        textColor: "text-red-700",
        dotColor: "bg-red-400",
        label: "Não Compareceu",
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    },
    rescheduled: {
        borderColor: "border-slate-200",
        bg: "bg-slate-50/60",
        textColor: "text-slate-700",
        dotColor: "bg-slate-400",
        label: "Reagendado",
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    },
    cancelled: {
        borderColor: "border-zinc-200",
        bg: "bg-zinc-50/60",
        textColor: "text-zinc-500",
        dotColor: "bg-zinc-300",
        label: "Cancelado",
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    },
    completed: {
        borderColor: "border-green-200",
        bg: "bg-green-50/60",
        textColor: "text-green-700",
        dotColor: "bg-green-500",
        label: "Finalizado",
        next: "scheduled",
        nextLabel: "Voltar para Agendado"
    }
}

export function AppointmentCard({ appointment, onClick, hideTime }: AppointmentCardProps) {
    // Optimistic UI State
    const [optimisticStatus, setOptimisticStatus] = useState(appointment.status || 'scheduled')
    const [loading, setLoading] = useState(false)
    const { activeAttendanceId } = useActiveAttendance()

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

    // [NEW] Calculate duration to handle small cards (Foto 1)
    const startTime = new Date(appointment.start_time)
    const endTime = new Date(appointment.end_time)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    const isSmallCard = durationMinutes <= 25 // Usually 15-20 min slots are small enough to hide text

    // Determine Service Color (Dot)
    // If we want the DOT to match the service (like Google Calendar)
    const serviceColor = appointment.services?.color || appointment.resource?.services?.color || '#3b82f6'

    const router = useRouter()
    const { slug } = useParams()

    const handleNextStatus = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!config.next) return

        const previousStatus = optimisticStatus
        const nextStatus = config.next

        // [UNIFIED] Use AttendanceService logic for starting
        if (nextStatus === 'in_progress') {
            setLoading(true)
            const { startAttendance, finishAttendance } = await import("@/actions/attendance")

            const res = await startAttendance(appointment.id, slug as string)

            if (res.error === 'ALREADY_IN_ATTENDANCE') {
                setLoading(false)
                const confirm = await MySwal.fire({
                    title: 'Atenção!',
                    html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, iniciar este',
                    cancelButtonText: 'Voltar ao anterior',
                    confirmButtonColor: '#ff9800',
                    cancelButtonColor: '#607d8b',
                    allowOutsideClick: false
                })

                if (confirm.isConfirmed) {
                    setLoading(true)
                    // 1. Finish Old
                    await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug as string)
                    // 2. Start This
                    const retry = await startAttendance(appointment.id, slug as string)
                    if (retry.success) {
                        toast.success("Atendimento iniciado!")
                        setOptimisticStatus('in_progress')
                        router.push(`/dashboard/${slug}/attendance/${appointment.id}`)
                    } else {
                        toast.error("Erro ao iniciar atendimento.")
                    }
                }
                setLoading(false)
                return
            }

            if (!res.success) {
                setLoading(false)
                toast.error(res.error || "Erro ao iniciar atendimento")
                return
            }

            // Success Transition
            setOptimisticStatus('in_progress')
            router.push(`/dashboard/${slug}/attendance/${appointment.id}`)
            setLoading(false)
            return
        }

        // Financial Warning: If changing from 'attended' (Finalizado)
        let keepFinancial = false
        if (optimisticStatus === 'attended') {
            const result = await MySwal.fire({
                title: 'Atenção: Atendimento Faturado',
                html: `Este atendimento já foi finalizado. O que deseja fazer com o <b>financeiro (Venda/Comissão)</b>?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Mudar e APAGAR recebimento',
                denyButtonText: 'Mudar e MANTER recebimento',
                cancelButtonText: 'Cancelar alteração',
                showDenyButton: true,
                confirmButtonColor: '#ef4444',
                denyButtonColor: '#10b981',
                cancelButtonColor: '#6b7280',
            })

            if (result.isDismissed) return

            if (result.isDenied) {
                keepFinancial = true
            }
            // If result.isConfirmed (APAGAR), keepFinancial stays false
        }

        setOptimisticStatus(nextStatus)
        setLoading(true)

        try {
            const { updateAppointmentStatus } = await import("@/actions/appointments")
            const result = await updateAppointmentStatus(appointment.id, nextStatus, undefined, slug as string, keepFinancial)

            if (result.success) {
                toast.success(`Status atualizado para ${statusConfig[nextStatus as keyof typeof statusConfig].label}`)
            } else {
                setOptimisticStatus(previousStatus)
                toast.error(result.error || "Erro ao atualizar status")
            }
        } catch (error) {
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
                status === 'scheduled' ? "" : config.bg,
                status === 'scheduled' ? "" : config.borderColor,
            )}
            style={{
                backgroundColor: status === 'scheduled' ? 'white' : undefined,
                borderColor: status === 'scheduled' ? serviceColor : undefined,
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
                <div
                    className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full z-10"
                    style={{ backgroundColor: serviceColor }}
                />
            </div>

            {/* Patient Name - Hide if small and not hovered (Foto 1) */}
            <div className={cn(
                "font-bold text-xs truncate leading-tight -mt-0.5",
                config.textColor,
                isSmallCard && "opacity-0 group-hover:opacity-100 transition-opacity"
            )}>
                {appointment.patients?.name || appointment.title || 'Paciente'}
            </div>

            {/* Service Name - Hide if small and not hovered (Foto 1) */}
            <div className={cn(
                "text-[8.5px] truncate opacity-60 leading-tight font-medium",
                config.textColor,
                isSmallCard && "opacity-0 group-hover:opacity-100 transition-opacity"
            )}>
                {appointment.services?.name || 'Atendimento'}
            </div>

            {/* Quick Action Overlay (Desktop only - hover to show) */}
            {config.next && (
                <div className="hidden sm:block absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-6 w-6 shadow-sm bg-white hover:bg-slate-100 border border-slate-300 rounded-full text-primary"
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
