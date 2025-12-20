"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { TimeInput } from "@/components/ui/time-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Trash2, CalendarIcon } from "lucide-react"
import { createAppointment, updateAppointment, deleteAppointment } from "@/app/dashboard/schedule/actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BlockDialogProps {
    professionals: { id: string, full_name: string }[]
    currentUserId?: string
    selectedSlot?: { start: Date, end: Date } | null
    appointment?: any // If editing existing block
    open?: boolean
    onOpenChange?: (open: boolean) => void
    locations?: { id: string, name: string }[]
    holidays?: { date: string, name: string }[]
    currentDate?: Date // [NEW] Context date from schedule
}

export function BlockDialog({ professionals, currentUserId, selectedSlot, appointment, open, onOpenChange, locations = [], holidays = [], currentDate }: BlockDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined

    // Derived State
    const isEditMode = !!appointment

    // Form State
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("") // Determines recurrence logic if different
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]) // [RESTORED]
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")
    // const [selectedLocationId, setSelectedLocationId] = useState<string>("all") // Removed Location State
    const [linkHoliday, setLinkHoliday] = useState<string>("none")

    // [NEW] Confirmation State
    const [confirmation, setConfirmation] = useState<{
        open: boolean,
        message: string,
        pendingFormData: FormData | null,
        type: 'override' | 'delete' // [NEW] Distinguish actions
    }>({ open: false, message: "", pendingFormData: null, type: 'override' })

    const toggleDay = (dayIdx: number) => {
        setRecurrenceDays(prev =>
            prev.includes(dayIdx)
                ? prev.filter(d => d !== dayIdx)
                : [...prev, dayIdx].sort()
        )
    }

    // Init Logic
    useEffect(() => {
        const isOpen = isControlled ? open : internalOpen
        if (!isOpen) return

        if (isEditMode && appointment) {
            // Edit Mode
            const start = new Date(appointment.start_time)
            const end = new Date(appointment.end_time)

            setStartDate(start.toISOString().split('T')[0])
            setEndDate(start.toISOString().split('T')[0]) // Default to same day unless we find recurrence info later
            setStartTime(start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            setEndTime(end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

            // Parse Notes for Title/Desc
            // Convention: "Title\nDescription" or just "Description"?
            // Let's assume user just types in Description field mostly.
            // But we requested Title. So we might store "Title \n Description"
            const parts = (appointment.notes || "").split('\n')
            setTitle(parts[0] || "")
            setDescription(parts.slice(1).join('\n') || "")

            setSelectedProfessionalId(appointment.professional_id)
            setSelectedProfessionalId(appointment.professional_id)
            // setSelectedLocationId(appointment.location_id || locations[0]?.id || "all") // Removed

            // Recurrence? currently simplistic edit (single instance usually)
            setRecurrenceDays([])
        } else {
            // New Mode
            const now = new Date()
            // [MODIFIED] Prefer selectedSlot, then provided currentDate, then Now.
            const sDate = selectedSlot ? selectedSlot.start : (currentDate || now)
            const eDate = selectedSlot ? selectedSlot.start : (currentDate || now)

            setStartDate(sDate.toISOString().split('T')[0])
            setEndDate(sDate.toISOString().split('T')[0])

            // Default Times
            if (selectedSlot) {
                setStartTime(selectedSlot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
                // Default duration 1h? Or slot end?
                // If slot is 30m, check end
                const slotEnd = selectedSlot.end
                setEndTime(slotEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            } else {
                setStartTime("06:00")
                setEndTime("22:00") // Full day block default?
            }

            // Default Recurrence Days: Current weekday checked
            setRecurrenceDays([sDate.getDay()])

            // Default Professional: Current user or first one
            setSelectedProfessionalId(currentUserId || professionals[0]?.id || "")
            // Default Location: First one
            // setSelectedLocationId(locations[0]?.id || "") // Removed
        }
    }, [isControlled, open, internalOpen, isEditMode, appointment, selectedSlot, currentUserId, professionals])


    async function handleSubmit(formData: FormData) {
        // Validation
        if (!startDate || !endDate || !startTime || !endTime) {
            toast.error("Preencha todas as datas e horários.")
            return
        }
        if (!selectedProfessionalId) {
            toast.error("Selecione um profissional.")
            return
        }

        // Combine Title + Description into Notes
        const finalNotes = `${title}\n${description}`.trim()
        formData.set('notes', finalNotes)

        formData.set('type', 'block')
        formData.set('professional_id', selectedProfessionalId)
        formData.set('location_id', '') // [FIX] Blocks are Professional-only (Global), not per location.

        // Calculate Recurrence logic based on Start/End Date
        // If End Date > Start Date, we treat it as "Recurrence Type = 'date'" ending on End Date
        const sD = new Date(startDate + 'T12:00:00')
        const eD = new Date(endDate + 'T12:00:00')

        // [new] visual fix: if multi-day, force full day times
        let effectiveStartTime = startTime
        let effectiveEndTime = endTime

        if (eD > sD) {
            formData.set('is_recurring', 'true')
            formData.set('recurrence_end_type', 'date')
            formData.set('recurrence_end_date', endDate)
            // Auto-fill all days for continuous block
            formData.set('recurrence_days', JSON.stringify([0, 1, 2, 3, 4, 5, 6]))

            // Force Full Day (00:00 - 23:59) for visual dominance
            effectiveStartTime = '00:00'
            effectiveEndTime = '23:59'
        } else {
            formData.set('is_recurring', 'false')
        }

        // Duration (Time based)
        const sT = new Date(`2000-01-01T${effectiveStartTime}:00`)
        const eT = new Date(`2000-01-01T${effectiveEndTime}:00`)
        const diffMins = (eT.getTime() - sT.getTime()) / 60000
        if (diffMins <= 0) {
            toast.error("Hora fim deve ser maior que hora início.")
            return
        }
        formData.set('custom_duration', diffMins.toString())
        formData.set('time', effectiveStartTime) // Use effective
        formData.set('date', startDate)


        let result
        if (isEditMode && appointment) {
            formData.append('appointment_id', appointment.id)
            result = await updateAppointment(formData)
        } else {
            result = await createAppointment(formData)
        }

        // [NEW] Handle Conflict Confirmation
        if ((result as any)?.confirmationRequired) {
            setConfirmation({
                open: true,
                message: (result as any).message,
                pendingFormData: formData,
                type: 'override'
            })
            return
        }

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(isEditMode ? "Bloqueio atualizado!" : "Bloqueio criado!")
            if (onOpenChange) onOpenChange(false)
            setInternalOpen(false)
        }
    }

    async function handleDelete() {
        if (!appointment?.id) return

        // [MODIFIED] Use System Dialog
        setConfirmation({
            open: true,
            message: "Tem certeza que deseja EXCLUIR este bloqueio?\n\nO horário ficará livre para agendamentos novamente.",
            pendingFormData: null,
            type: 'delete'
        })
    }

    const handleConfirmAction = async () => {
        if (confirmation.type === 'delete') {
            const res = await deleteAppointment(appointment.id)
            setConfirmation({ ...confirmation, open: false }) // Close first
            if (res?.error) toast.error(res.error); else {
                toast.success("Bloqueio excluído.")
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
            }
            return
        }

        // Override Logic
        if (!confirmation.pendingFormData) return

        const formData = confirmation.pendingFormData
        formData.set('force_block_override', 'true')

        let result
        if (isEditMode && appointment) {
            result = await updateAppointment(formData)
        } else {
            result = await createAppointment(formData)
        }

        setConfirmation({ open: false, message: "", pendingFormData: null, type: 'override' })

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(isEditMode ? "Bloqueio atualizado!" : "Bloqueio criado!")
            if (onOpenChange) onOpenChange(false)
            setInternalOpen(false)
        }
    }

    const isOpen = isControlled ? open : internalOpen
    const onChange = isControlled ? onOpenChange : setInternalOpen

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onChange}>
                {!isControlled && (
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2 text-slate-600 h-9 border-dashed border-slate-300 hover:bg-slate-50">
                            <Lock className="h-4 w-4" />
                            Bloqueio
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-slate-700">
                            <Lock className="h-5 w-5 text-slate-500" />
                            {isEditMode ? "Editar Bloqueio" : "Novo Bloqueio / Compromisso"}
                        </DialogTitle>
                        <DialogDescription>
                            Defina períodos onde não será possível realizar agendamentos.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={handleSubmit} className="py-4 space-y-6">

                        {/* Row 1: Date/Time Range (2x2 Grid) */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                Período
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Data Início</Label>
                                    <DateInput name="start_date" required value={startDate} onChange={val => setStartDate(val)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Data Fim</Label>
                                    <DateInput name="end_date" required value={endDate} onChange={val => setEndDate(val)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Hora Início</Label>
                                    <TimeInput name="start_time" required value={startTime} onChange={val => setStartTime(val)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                                    <TimeInput name="end_time" required value={endTime} onChange={val => setEndTime(val)} />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Details */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                            <div className="space-y-1.5">
                                <Label>Título</Label>
                                <Input placeholder="Ex: Reunião, Ausência, Almoço..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descrição</Label>
                                <Textarea placeholder="Detalhes opcionais..." className="min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </div>

                        {/* Row 3: Professional (Unit Hidden) */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="space-y-1.5">
                                <Label>Profissional</Label>
                                <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professionals.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <input type="hidden" name="location_id" value="" />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                            {isEditMode && (
                                <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Excluir Bloqueio
                                </Button>
                            )}
                            <Button type="submit" className="ml-auto min-w-[140px] gap-2">
                                <Lock className="h-4 w-4" />
                                {isEditMode ? "Salvar Alterações" : "Criar Bloqueio"}
                            </Button>
                        </div>

                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog (Nested) */}
            <Dialog open={confirmation.open} onOpenChange={(open) => !open && setConfirmation({ ...confirmation, open: false })}>
                <DialogContent className="max-w-[400px] z-[9999]">
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Atenção: Conflito de Agenda
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-slate-700 whitespace-pre-line">
                            {confirmation.message}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setConfirmation({ ...confirmation, open: false })}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmAction}>
                            {confirmation.type === 'delete' ? "Excluir Definitivamente" : "Confirmar Bloqueio"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
