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
import { formatBrazilDate } from "@/lib/date-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Trash2, CalendarIcon } from "lucide-react"
import { createAppointment, updateAppointment, deleteAppointment } from "@/actions/appointments"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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
    initialProfessionalId?: string // [NEW]
    userRole?: string
}

export function BlockDialog({ professionals, currentUserId, userRole, selectedSlot, appointment, open, onOpenChange, locations = [], holidays = [], currentDate, initialProfessionalId }: BlockDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined

    // Derived State
    const isEditMode = !!appointment

    // Form State
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("") // Determines recurrence logic if different
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // [NEW] Role Check
    const isAdmin = userRole === 'admin' || userRole === 'master'

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]) // [RESTORED]
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(initialProfessionalId || currentUserId || "")
    // const [selectedLocationId, setSelectedLocationId] = useState<string>("all") // Removed Location State
    const [linkHoliday, setLinkHoliday] = useState<string>("none")
    const [allDay, setAllDay] = useState<boolean>(false) // [NEW] All-day block toggle

    // [NEW] Confirmation State
    const [confirmation, setConfirmation] = useState<{
        open: boolean,
        message: string,
        pendingFormData: FormData | null,
        type: 'override' | 'delete' // [NEW] Distinguish actions
    }>({ open: false, message: "", pendingFormData: null, type: 'override' })
    const [deleteSeries, setDeleteSeries] = useState(false)

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

            setStartDate(formatBrazilDate(start))
            setEndDate(formatBrazilDate(end))
            setStartTime(start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            setEndTime(end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

            // [NEW] Detect if it's an all-day block (00:00 to 23:59)
            const isAllDay = appointment.all_day || (
                start.getHours() === 0 && start.getMinutes() === 0 &&
                end.getHours() === 23 && end.getMinutes() === 59
            )
            setAllDay(isAllDay)

            // Parse Notes for Title/Desc
            // Convention: "Title\nDescription" or just "Description"
            const rawNotes = (appointment.notes || "").replace(/\[GRP:[^\]]+\]/, "").trim()
            const parts = rawNotes.split('\n')
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

            setStartDate(formatBrazilDate(sDate))
            setEndDate(formatBrazilDate(sDate))

            // Default Times
            if (selectedSlot) {
                setStartTime(selectedSlot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
                // Default duration 1h? Or slot end?
                // If slot is 30m, check end
                const slotEnd = selectedSlot.end
                setEndTime(slotEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
                setAllDay(false)
            } else {
                setStartTime("00:00")
                setEndTime("23:59")
                setAllDay(true) // Default to all-day when no slot selected
            }

            // Default Recurrence Days: Current weekday checked
            setRecurrenceDays([sDate.getDay()])

            // Default Professional: Current user or first one (Respect Role)
            const defaultProf = isAdmin
                ? (initialProfessionalId || currentUserId || professionals[0]?.id || "")
                : (currentUserId || "")
            setSelectedProfessionalId(defaultProf)
        }
    }, [isControlled, open, internalOpen, isEditMode, appointment, selectedSlot, currentUserId, professionals, isAdmin, initialProfessionalId])


    async function handleSubmit(formData: FormData) {
        // Validation
        if (!startDate || !endDate || !startTime || !endTime) {
            MySwal.fire('Atenção', "Preencha todas as datas e horários.", 'warning')
            return
        }
        if (!selectedProfessionalId) {
            MySwal.fire('Atenção', "Selecione um profissional.", 'warning')
            return
        }

        // Combine Title + Description into Notes
        let finalNotes = `${title}\n${description}`.trim()

        // [NEW] Preserve Group ID if editing a recurring series
        if (isEditMode && appointment?.notes?.includes('[GRP:')) {
            const match = appointment.notes.match(/\[GRP:[^\]]+\]/)
            if (match) {
                finalNotes += `\n\n${match[0]}`
            }
        }

        formData.set('notes', finalNotes)

        formData.set('type', 'block')
        formData.set('professional_id', selectedProfessionalId)
        formData.set('location_id', '') // [FIX] Blocks are Professional-only (Global), not per location.

        // Calculate Recurrence logic based on Start/End Date
        // If End Date > Start Date, we treat it as "Recurrence Type = 'date'" ending on End Date
        const sD = new Date(startDate + 'T12:00:00')
        const eD = new Date(endDate + 'T12:00:00')

        let effectiveStartTime = startTime
        let effectiveEndTime = endTime

        // [MODIFIED] Continuous Block Logic (Foto Multiple Days)
        // We want a SINGLE record spanning multiple days if dates are different.
        const sT = new Date(`${startDate}T${effectiveStartTime}:00-03:00`)
        const eT = new Date(`${endDate}T${effectiveEndTime}:00-03:00`)

        const diffMins = (eT.getTime() - sT.getTime()) / 60000
        if (diffMins <= 0) {
            MySwal.fire('Erro', "Hora fim deve ser maior que hora início.", 'error')
            return
        }

        formData.set('is_recurring', 'false')
        formData.set('custom_duration', diffMins.toString())
        formData.set('time', effectiveStartTime)
        formData.set('date', startDate)
        formData.set('all_day', allDay.toString())

        // Ensure start_time and end_time match the full range for the server
        formData.set('start_time', sT.toISOString())
        formData.set('end_time', eT.toISOString())


        let result
        setIsSaving(true)
        try {
            if (isEditMode && appointment) {
                formData.append('appointment_id', appointment.id)
                result = await updateAppointment(formData)
            } else {
                result = await createAppointment(formData)
            }

            // [NEW] Handle Conflict Confirmation with Swal
            if ((result as any)?.confirmationRequired) {
                setIsSaving(false)
                const swalRes = await MySwal.fire({
                    title: 'Conflito de Horário',
                    html: (result as any).message.replace(/\n/g, '<br/>'),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Continuar mesmo assim',
                    cancelButtonText: 'Cancelar',
                    customClass: {
                        confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white border-none',
                        cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }
                })

                if (swalRes.isConfirmed) {
                    setIsSaving(true)
                    formData.set('force_block_override', 'true')
                    const overrideRes = isEditMode
                        ? await updateAppointment(formData)
                        : await createAppointment(formData)

                    if (overrideRes?.error) {
                        MySwal.fire('Erro', overrideRes.error, 'error')
                    } else {
                        MySwal.fire({
                            title: 'Sucesso!',
                            text: isEditMode ? "Bloqueio atualizado!" : "Bloqueio criado!",
                            icon: 'success',
                            confirmButtonColor: '#10b981'
                        })
                        if (onOpenChange) onOpenChange(false)
                        setInternalOpen(false)
                    }
                }
                return
            }

            if (result?.error) {
                MySwal.fire('Erro', result.error, 'error')
            } else {
                MySwal.fire({
                    title: 'Sucesso!',
                    text: isEditMode ? "Bloqueio atualizado!" : "Bloqueio criado!",
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                })
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
            }
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteClick() {
        if (!appointment?.id) return

        const hasGroup = appointment.notes?.includes('[GRP:')

        const swalRes = await MySwal.fire({
            title: 'Excluir Bloqueio',
            text: hasGroup
                ? "Este bloqueio faz parte de uma série. Deseja excluir apenas este dia ou toda a série?"
                : "Tem certeza que deseja excluir este bloqueio?",
            icon: 'question',
            showDenyButton: hasGroup,
            showCancelButton: true,
            confirmButtonText: hasGroup ? 'Toda a Série' : 'Sim, Excluir',
            denyButtonText: 'Apenas Este Dia',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                denyButton: 'bg-slate-600 hover:bg-slate-700 text-white',
                cancelButton: 'bg-slate-200 text-slate-700'
            }
        })

        if (swalRes.isConfirmed || swalRes.isDenied) {
            const deleteSeries = swalRes.isConfirmed && hasGroup
            const res = await deleteAppointment(appointment.id, deleteSeries)
            if (res?.error) {
                MySwal.fire('Erro', res.error, 'error')
            } else {
                MySwal.fire('Excluído!', "O bloqueio foi removido com sucesso.", 'success')
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
            }
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
                                    <DateInput name="start_date" required value={startDate} onChange={val => {
                                        setStartDate(val)
                                        // Auto-sync End Date if same or empty
                                        if (!endDate || endDate === startDate) {
                                            setEndDate(val)
                                        }
                                    }} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Data Fim</Label>
                                    <DateInput name="end_date" required value={endDate} onChange={val => setEndDate(val)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Hora Início</Label>
                                    <TimeInput
                                        name="start_time"
                                        required
                                        value={startTime}
                                        onChange={val => setStartTime(val)}
                                        disabled={allDay}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                                    <TimeInput
                                        name="end_time"
                                        required
                                        value={endTime}
                                        onChange={val => setEndTime(val)}
                                        disabled={allDay}
                                    />
                                </div>
                            </div>

                            {/* [NEW] All-Day Checkbox */}
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="allDay"
                                    checked={allDay}
                                    onCheckedChange={(checked) => {
                                        setAllDay(checked as boolean)
                                        if (checked) {
                                            setStartTime("00:00")
                                            setEndTime("23:59")
                                        }
                                    }}
                                />
                                <Label
                                    htmlFor="allDay"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Dia Inteiro (00:00 - 23:59)
                                </Label>
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
                                <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId} disabled={!isAdmin && !isEditMode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" sideOffset={4}>
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
                                <Button type="button" variant="destructive" onClick={handleDeleteClick} className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Excluir Bloqueio
                                </Button>
                            )}
                            <Button type="submit" className="ml-auto min-w-[140px] gap-2" disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                {isEditMode ? "Salvar Alterações" : "Criar Bloqueio"}
                            </Button>
                        </div>

                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
