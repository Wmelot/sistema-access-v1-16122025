"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateAppointmentStatus } from "./actions"
import { toast } from "sonner"
import { Loader2, Check, X, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

interface ScheduleListViewProps {
    appointments: any[]
}

export function ScheduleListView({ appointments }: ScheduleListViewProps) {
    const router = useRouter()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [items, setItems] = useState(appointments)

    useEffect(() => {
        setItems(appointments)
    }, [appointments])

    // Sort by Date/Time
    const sortedAppointments = [...items].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id)

        // Optimistic Update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        ))

        try {
            const result = await updateAppointmentStatus(id, newStatus)
            if (result?.error) {
                throw new Error(result.error)
            }
            toast.success("Status atualizado")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar")
            // Revert on error (optional, but good practice)
            setItems(appointments)
        } finally {
            setUpdatingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Concluído</Badge>
            case 'confirmed': return <Badge className="!bg-yellow-500 hover:!bg-yellow-600 !text-black border-transparent">Confirmado</Badge>
            case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>
            case 'no_show': return <Badge variant="outline" className="border-red-500 text-red-500">Faltou</Badge>
            default: return <Badge variant="secondary">Agendado</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-3">
                {sortedAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border p-4">
                        Nenhum agendamento para hoje.
                    </div>
                ) : (
                    sortedAppointments.map((appt) => (
                        <Card key={appt.id} className="border shadow-sm">
                            <CardContent className="p-4 grid gap-3">
                                {/* Header: Time and Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Clock className="h-4 w-4 text-primary" />
                                        {format(new Date(appt.start_time), "HH:mm")}
                                    </div>
                                    {getStatusBadge(appt.status)}
                                </div>

                                {/* Patient Info */}
                                <div>
                                    <div className="font-medium text-base">{appt.patients?.name || 'Sem nome'}</div>
                                    <div className="text-sm text-muted-foreground">{appt.services?.name}</div>
                                </div>

                                {/* Professional */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-2 mt-1">
                                    {appt.profiles?.color && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: appt.profiles.color }} />
                                    )}
                                    {appt.profiles?.full_name}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                    {appt.status !== 'confirmed' && appt.status !== 'completed' && (
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black gap-2"
                                            onClick={() => handleStatusChange(appt.id, 'confirmed')}
                                            disabled={updatingId === appt.id}
                                        >
                                            {updatingId === appt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            Confirmar
                                        </Button>
                                    )}

                                    <Select
                                        value={appt.status}
                                        onValueChange={(v) => handleStatusChange(appt.id, v)}
                                    >
                                        <SelectTrigger className="flex-1 h-9">
                                            <SelectValue placeholder="Mudar Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduled">Agendado</SelectItem>
                                            <SelectItem value="confirmed">Confirmado</SelectItem>
                                            <SelectItem value="completed">Concluído</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                            <SelectItem value="no_show">Faltou</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhum agendamento encontrado para os filtros selecionados.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedAppointments.map((appt) => (
                                    <TableRow key={appt.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(appt.start_time), "dd/MM/yyyy", { locale: ptBR })}</span>
                                                <span className="text-xs text-muted-foreground">{format(new Date(appt.start_time), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{appt.patients?.name || 'Sem nome'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {appt.profiles?.color && (
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: appt.profiles.color }} />
                                                )}
                                                {appt.profiles?.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{appt.services?.name}</TableCell>
                                        <TableCell>
                                            {getStatusBadge(appt.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {updatingId === appt.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Select
                                                        value={appt.status}
                                                        onValueChange={(v) => handleStatusChange(appt.id, v)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="scheduled">Agendado</SelectItem>
                                                            <SelectItem value="confirmed">Confirmado</SelectItem>
                                                            <SelectItem value="completed">Concluído</SelectItem>
                                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                                            <SelectItem value="no_show">Faltou</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
