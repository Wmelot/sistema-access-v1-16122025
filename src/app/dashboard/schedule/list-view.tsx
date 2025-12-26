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
            case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Faturado</Badge>
            case 'attended': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black border-transparent">Atendido</Badge>
            case 'checked_in': return <Badge className="bg-slate-500 hover:bg-slate-600 text-white border-transparent">Aguardando</Badge>
            case 'confirmed': return <Badge className="bg-blue-600 hover:bg-blue-700">Confirmado</Badge>
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
                    sortedAppointments.map((appt) => {
                        // Styling Logic
                        const serviceColor = appt.services?.color || '#cbd5e1' // default slate-300
                        const isNoShow = appt.status === 'no_show'
                        const borderColor = isNoShow ? '#ef4444' : serviceColor

                        let bgClass = "bg-white"
                        if (appt.status === 'confirmed') bgClass = "bg-blue-50"
                        else if (appt.status === 'checked_in') bgClass = "bg-slate-50" // Gray for Arrived
                        else if (appt.status === 'attended') bgClass = "bg-yellow-50" // Yellow for Attended
                        else if (appt.status === 'completed') bgClass = "bg-green-50"
                        else if (appt.status === 'cancelled') bgClass = "bg-pink-50"

                        return (
                            <Card key={appt.id} className={`border shadow-sm border-l-4 ${bgClass}`} style={{ borderLeftColor: borderColor }}>
                                <CardContent className="p-4 grid gap-3 relative">
                                    {/* Service Color Dot (Top Right) */}
                                    <div
                                        className="absolute top-4 right-4 w-3 h-3 rounded-full"
                                        style={{ backgroundColor: borderColor }}
                                    />

                                    {/* Header: Time & Date */}
                                    <div className="flex items-center justify-between pr-6">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="text-xs text-muted-foreground font-normal mr-1">
                                                {format(new Date(appt.start_time), "dd/MM")}
                                            </span>
                                            {format(new Date(appt.start_time), "HH:mm")}
                                        </div>
                                    </div>

                                    {/* Patient Name */}
                                    <div>
                                        <div className="text-lg font-bold text-gray-900 leading-tight">
                                            {appt.patients?.name || 'Paciente sem nome'}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            {appt.services?.name || 'Serviço não especificado'}
                                            {appt.profiles?.full_name && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{appt.profiles.full_name.split(' ')[0]}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Selector */}
                                    <div className="pt-2">
                                        {updatingId === appt.id ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md bg-slate-50">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Atualizando...
                                            </div>
                                        ) : (
                                            <Select
                                                value={appt.status}
                                                onValueChange={(v) => handleStatusChange(appt.id, v)}
                                            >
                                                <SelectTrigger className="w-full h-9 bg-white border-slate-300 shadow-sm font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                                    <SelectItem value="checked_in">Aguardando (Chegou)</SelectItem>
                                                    <SelectItem value="attended">Atendido</SelectItem>
                                                    <SelectItem value="completed">Faturado / Recebido</SelectItem>
                                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                                    <SelectItem value="no_show">Não Compareceu</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
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
                                    <TableHead className="text-right">Status / Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum agendamento encontrado para os filtros selecionados.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedAppointments.map((appt) => {
                                    const serviceColor = appt.services?.color || '#cbd5e1'
                                    const isNoShow = appt.status === 'no_show'
                                    const borderColor = isNoShow ? '#ef4444' : serviceColor

                                    let bgClass = "bg-white"
                                    if (appt.status === 'confirmed') bgClass = "bg-blue-50"
                                    else if (appt.status === 'checked_in') bgClass = "bg-slate-50"
                                    else if (appt.status === 'attended') bgClass = "bg-yellow-50"
                                    else if (appt.status === 'completed') bgClass = "bg-green-50"
                                    else if (appt.status === 'cancelled') bgClass = "bg-pink-50"

                                    return (
                                        <TableRow key={appt.id} className={`border-l-4 hover:bg-opacity-80 transition-colors ${bgClass}`} style={{ borderLeftColor: borderColor }}>
                                            <TableCell className="font-medium relative">
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(appt.start_time), "dd/MM/yyyy", { locale: ptBR })}</span>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(appt.start_time), "HH:mm")}</span>
                                                </div>
                                                {/* Optional Dot for desktop? The border-l covers the "sidebar" requirement. */}
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
                                            <TableCell>
                                                {/* Service Name + Dot */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
                                                    {appt.services?.name}
                                                </div>
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
                                                            <SelectTrigger className="w-[180px] h-8 bg-transparent border-slate-300">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="scheduled">Agendado</SelectItem>
                                                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                                                <SelectItem value="checked_in">Aguardando (Chegou)</SelectItem>
                                                                <SelectItem value="attended">Atendido</SelectItem>
                                                                <SelectItem value="completed">Faturado / Recebido</SelectItem>
                                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                                <SelectItem value="no_show">Não Compareceu</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
