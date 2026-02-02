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
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { updateAppointmentStatus } from "@/actions/appointments"
import { ReceivePaymentDialog } from "@/components/financial/receive-payment-dialog"
import { FileText, Pencil, Stethoscope, Trash2, User, CheckCircle2, CheckSquare, DollarSign } from "lucide-react"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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
    const { slug } = useParams()
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [receiveOpen, setReceiveOpen] = useState(false)

    // Quick Status Update
    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const result = await updateAppointmentStatus(appointment.id, newStatus)
            if (result.error) {
                MySwal.fire('Erro', result.error, 'error')
            } else {
                MySwal.fire('Sucesso!', 'Status atualizado com sucesso.', 'success')
                if (onStatusChange) onStatusChange()
                router.refresh()
            }
        } catch (err) {
            MySwal.fire('Erro', 'Ocorreu um erro ao atualizar o status.', 'error')
        }
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




                    <ContextMenuSeparator />

                    {/* 3. Ver Prontuário */}
                    <ContextMenuItem onSelect={() => router.push(`/dashboard/${slug}/patients/${appointment.patient_id}`)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Prontuário
                    </ContextMenuItem>

                    {/* Faturar / Receber */}
                    <ContextMenuItem onSelect={() => setReceiveOpen(true)} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Faturar / Receber
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

            <ReceivePaymentDialog
                open={receiveOpen}
                onOpenChange={setReceiveOpen}
                appointment={appointment}
                onSuccess={() => {
                    if (onStatusChange) onStatusChange()
                    router.refresh()
                }}
            />
        </>
    )
}
