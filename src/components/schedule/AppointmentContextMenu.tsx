"use client"

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Calendar as CalendarIcon, FileText, Pencil, Trash2, User, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"

interface AppointmentContextMenuProps {
    children: React.ReactNode
    appointment: any
    onEdit?: (appt: any) => void
    onBlock?: (appt: any) => void // If it were a block
}

export function AppointmentContextMenu({
    children,
    appointment,
    onEdit
}: AppointmentContextMenuProps) {
    const router = useRouter()
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
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem
                    className="font-bold text-primary focus:text-primary focus:bg-primary/10"
                    onSelect={() => router.push(`/dashboard/attendance/${appointment.id}`)}
                >
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Iniciar Atendimento
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

                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <FileText className="mr-2 h-4 w-4" />
                        Prontuário
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                        <ContextMenuItem>Ver Evoluções</ContextMenuItem>
                        <ContextMenuItem>Anexar Arquivo</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                <ContextMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar Agendamento
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
