import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Pencil, Stethoscope, Trash2, User, CheckCircle2, CheckSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateAppointmentStatus } from "@/app/dashboard/schedule/actions"
import { toast } from "sonner"

interface AppointmentContextMenuProps {
    children: React.ReactNode
    appointment: any
    onEdit?: (appointment: any) => void
    onStatusChange?: () => void
}

export function AppointmentContextMenu({
    children,
    appointment,
    onEdit,
    onStatusChange
}: AppointmentContextMenuProps) {
    const router = useRouter()
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    // Quick Status Update
    const handleStatusUpdate = async (newStatus: string) => {
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
                    <ContextMenuItem inset disabled>
                        <span className="font-semibold">{patientName}</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />

                    {/* 1. Iniciar Atendimento */}
                    <ContextMenuItem
                        className="font-bold text-blue-700 focus:text-blue-800 focus:bg-blue-50"
                        onSelect={() => router.push(`/dashboard/attendance/${appointment.id}`)}
                    >
                        <Stethoscope className="mr-2 h-4 w-4" />
                        Iniciar Atendimento
                    </ContextMenuItem>

                    {/* 2. Iniciar Avaliação */}
                    <ContextMenuItem
                        className="text-green-700 focus:text-green-800 focus:bg-green-50"
                        onSelect={() => router.push(`/dashboard/attendance/${appointment.id}?mode=assessment`)}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Iniciar Avaliação
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    {/* 3. Ver Paciente */}
                    <ContextMenuItem onSelect={() => router.push(`/dashboard/patients/${appointment.patient_id}`)}>
                        <User className="mr-2 h-4 w-4" />
                        Ver Paciente
                    </ContextMenuItem>

                    {/* 4. Editar Agendamento */}
                    <ContextMenuItem onSelect={() => onEdit?.(appointment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Agendamento
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    {/* 5. Cancelar Agendamento */}
                    <ContextMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onSelect={(e) => {
                            e.preventDefault()
                            setShowCancelConfirm(true)
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar Agendamento
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O status mudará para "Cancelado". O horário ficará livre.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async (e) => {
                                e.preventDefault()
                                await handleStatusUpdate('cancelled')
                                setShowCancelConfirm(false)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sim, Cancelar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
