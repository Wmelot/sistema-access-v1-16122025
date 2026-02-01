"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateAppointmentStatus } from "@/actions/appointments"
import { toast } from "sonner"
import { Loader2, Check, X, Clock, Eye, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"

import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function abbreviateName(name: string) {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) return name;
    return `${parts[0]} ${parts[parts.length - 1]}`;
}

function summarizeService(name: string) {
    if (!name) return "";
    // Common mappings to shorten service names
    const n = name.toLowerCase();
    if (n.includes('consulta')) return 'Consulta';
    if (n.includes('atendimento')) return 'Atendimento';
    if (n.includes('entrega')) return 'Entrega';
    if (n.includes('avaliação') || n.includes('avaliacao')) return 'Avaliação';

    // Fallback: if it's too long, just truncate or use first word
    if (name.length > 15) return name.split(' ')[0] + '...';
    return name;
}

interface ScheduleListViewProps {
    appointments: any[]
    paymentMethods?: any[]
}

export function ScheduleListView({ appointments, paymentMethods }: ScheduleListViewProps) {
    const router = useRouter()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [items, setItems] = useState(appointments)

    // [NEW] Payment Dialog State
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [pendingApptId, setPendingApptId] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<string>("")
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [isConfirming, setIsConfirming] = useState(false)

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'start_time', direction: 'asc' })

    useEffect(() => {
        setItems(appointments)
    }, [appointments])

    // Sort logic
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const sortedAppointments = [...items].sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig

        let valA, valB

        if (key === 'start_time') {
            valA = new Date(a.start_time).getTime()
            valB = new Date(b.start_time).getTime()
        } else if (key === 'patient') {
            // Prioritize appointments with patients over blocks/holidays
            const nameA = a.patients?.name || ''
            const nameB = b.patients?.name || ''

            if (!nameA && nameB) return 1 // Put "Sem nome" at bottom
            if (nameA && !nameB) return -1
            if (!nameA && !nameB) return 0

            valA = nameA.toLowerCase()
            valB = nameB.toLowerCase()
        } else if (key === 'professional') {
            const profA = a.profiles?.full_name || ''
            const profB = b.profiles?.full_name || ''

            if (!profA && profB) return 1
            if (profA && !profB) return -1

            valA = profA.toLowerCase()
            valB = profB.toLowerCase()
        } else {
            return 0
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1
        if (valA > valB) return direction === 'asc' ? 1 : -1
        return 0
    })

    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="ml-2 h-4 w-4 text-primary" />
            : <ChevronDown className="ml-2 h-4 w-4 text-primary" />
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        // [NEW] Intercept "Completed" status for Payment Confirmation
        if (newStatus === 'completed' && paymentMethods && paymentMethods.length > 0) {
            const appt = items.find(i => i.id === id)
            setPendingApptId(id)
            setPaymentMethod(appt?.payment_method_id || "") // Pre-select if exists
            setPaymentDate(new Date().toISOString().split('T')[0])
            setPaymentDialogOpen(true)
            return
        }

        await executeStatusUpdate(id, newStatus)
    }

    const executeStatusUpdate = async (id: string, newStatus: string, paymentDetails?: { method: string, date: string }) => {
        setUpdatingId(id)

        // Optimistic Update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        ))

        try {
            const result = await updateAppointmentStatus(id, newStatus, paymentDetails)
            if (result?.error) {
                throw new Error(result.error)
            }
            toast.success("Status atualizado")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar")
            // Revert
            setItems(appointments)
        } finally {
            setUpdatingId(null)
        }
    }

    const confirmPayment = async () => {
        if (!pendingApptId) return
        if (!paymentMethod) {
            toast.error("Selecione uma forma de pagamento.")
            return
        }

        setIsConfirming(true)
        try {
            await executeStatusUpdate(pendingApptId, 'completed', {
                method: paymentMethod,
                date: paymentDate
            })
            setPaymentDialogOpen(false)
        } finally {
            setIsConfirming(false)
            setPendingApptId(null)
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
        <TooltipProvider>
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
                                                {appt.patients?.id ? (
                                                    <Link href={`/dashboard/patients/${appt.patients.id}`} className="hover:underline hover:text-blue-600 transition-colors">
                                                        {appt.patients.name}
                                                    </Link>
                                                ) : (
                                                    'Paciente sem nome'
                                                )}
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
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead
                                            className="w-[140px] cursor-pointer group select-none"
                                            onClick={() => requestSort('start_time')}
                                        >
                                            <div className="flex items-center">
                                                Data/Hora {getSortIcon('start_time')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer group select-none"
                                            onClick={() => requestSort('patient')}
                                        >
                                            <div className="flex items-center">
                                                Paciente {getSortIcon('patient')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer group select-none"
                                            onClick={() => requestSort('professional')}
                                        >
                                            <div className="flex items-center">
                                                Profissional {getSortIcon('professional')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="w-[150px]">Serviço</TableHead>
                                        <TableHead className="text-right w-[160px]">Status / Ações</TableHead>
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
                                                <TableCell className="max-w-[150px]">
                                                    {appt.patients?.id ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={`/dashboard/patients/${appt.patients.id}`} className="hover:underline hover:text-blue-600 font-medium transition-colors truncate block">
                                                                    {abbreviateName(appt.patients.name)}
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                {appt.patients.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        'Sem nome'
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[150px]">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2 truncate cursor-default">
                                                                {appt.profiles?.color && (
                                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: appt.profiles.color }} />
                                                                )}
                                                                <span className="truncate">{abbreviateName(appt.profiles?.full_name)}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            {appt.profiles?.full_name}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="max-w-[150px]">
                                                    {/* Service Name + Dot */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2 cursor-default">
                                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: borderColor }} />
                                                                <span className="truncate">{summarizeService(appt.services?.name)}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            {appt.services?.name}
                                                        </TooltipContent>
                                                    </Tooltip>
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

                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Recebimento</DialogTitle>
                            <DialogDescription>
                                Informe os detalhes do pagamento para gerar a comissão corretamente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment_date">Data do Pagamento</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={confirmPayment} disabled={isConfirming}>
                                {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}
