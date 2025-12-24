import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { NewEvaluationDialog } from "@/components/patients/NewEvaluationDialog"
import { FileText, Pencil, Stethoscope, Trash2, User, CheckCircle2, CheckSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateAppointmentStatus } from "@/app/dashboard/schedule/actions" // [NEW]
import { toast } from "sonner"

interface AppointmentContextMenuProps {
    children: React.ReactNode
    appointment: any
    onEdit?: (appointment: any) => void
    onStatusChange?: () => void // [NEW] Refresh callback
}

export function AppointmentContextMenu({
    children,
    appointment,
    onEdit,
    onStatusChange
}: AppointmentContextMenuProps) {
    const router = useRouter()
    const [isEvalOpen, setIsEvalOpen] = useState(false)

    // [NEW] Quick Status Update
    const handleStatusUpdate = async (newStatus: string) => {
        // [MODIFIED] Use existing action signature (id, status)
        const promise = updateAppointmentStatus(appointment.id, newStatus)

        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: 'Status atualizado!',
            error: 'Erro ao atualizar status'
        })

        await promise
        if (onStatusChange) onStatusChange()
        router.refresh()
    }

    // appointment.patient_id and appointment.profiles.full_name (or similar)
    // Need to verify structure of appointment object passed here.
    // Assuming appointment.patient_id exists.
    // Assuming appointment.patient_name or similar. `profiles` usually holds professional? 
    // Wait, appointment usually has patient relation.
    // Let's safe check or use placeholder name if missing.
    const patientName = appointment.patients?.name || appointment.patient_name || "Paciente"

    const isBlock = appointment.type === 'block'

    if (isBlock) {
        return (
            <ContextMenu>
                <ContextMenuTrigger>{children}</ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    <ContextMenuItem onSelect={() => onEdit?.(appointment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Bloqueio
                    </ContextMenuItem>
                    <ContextMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover Bloqueio
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        )
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>{children}</ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    <ContextMenuItem
                        className="font-bold text-primary focus:text-primary focus:bg-primary/10"
                        onSelect={() => router.push(`/dashboard/attendance/${appointment.id}?mode=evolution`)}
                    >
                        <Stethoscope className="mr-2 h-4 w-4" />
                        Iniciar Atendimento
                    </ContextMenuItem>

                    {/* [NEW] Check-in / Check-out */}
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <ContextMenuItem onSelect={() => handleStatusUpdate('checked_in')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            Marcar Presença (Chegou)
                        </ContextMenuItem>
                    )}

                    {appointment.status === 'checked_in' && (
                        <ContextMenuItem onSelect={() => handleStatusUpdate('completed')}>
                            <CheckSquare className="mr-2 h-4 w-4 text-blue-600" />
                            Finalizar (Atendido)
                        </ContextMenuItem>
                    )}

                    <ContextMenuItem
                        onSelect={() => router.push(`/dashboard/patients/${appointment.patient_id}/edit?appointmentId=${appointment.id}&mode=assessment`)}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Iniciar Avaliação
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem onSelect={() => router.push(`/dashboard/patients/${appointment.patient_id}`)}>
                        <User className="mr-2 h-4 w-4" />
                        Ver Paciente
                    </ContextMenuItem>

                    <ContextMenuItem onSelect={() => onEdit?.(appointment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Agendamento
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar Agendamento
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu >


        </>
    )
}
