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
}

export function BlockDialog({ professionals, currentUserId, selectedSlot, appointment, open, onOpenChange, locations = [], holidays = [] }: BlockDialogProps) {
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

    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")
    const [selectedLocationId, setSelectedLocationId] = useState<string>("all") // Access Clinic style uses Unit
    const [linkHoliday, setLinkHoliday] = useState<string>("none")

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
            setSelectedLocationId(appointment.location_id || locations[0]?.id || "all")

            // Recurrence? currently simplistic edit (single instance usually)
            setRecurrenceDays([])
        } else {
            // New Mode
            const now = new Date()
            const sDate = selectedSlot ? selectedSlot.start : now
            const eDate = selectedSlot ? selectedSlot.start : now // Default end date SAME as start

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
                setStartTime("08:00")
                setEndTime("18:00") // Full day block default?
            }

            // Default Recurrence Days: Current weekday checked
            setRecurrenceDays([sDate.getDay()])

            // Default Professional: Current user or first one
            setSelectedProfessionalId(currentUserId || professionals[0]?.id || "")
            // Default Location: First one
            setSelectedLocationId(locations[0]?.id || "")
        }
    }, [isControlled, open, internalOpen, isEditMode, appointment, selectedSlot, currentUserId, professionals, locations])


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
        if (selectedLocationId && selectedLocationId !== 'all') {
            formData.set('location_id', selectedLocationId)
        }

        // Calculate Recurrence logic based on Start/End Date
        // If End Date > Start Date, we treat it as "Recurrence Type = 'date'" ending on End Date
        const sD = new Date(startDate + 'T12:00:00')
        const eD = new Date(endDate + 'T12:00:00')

        if (eD > sD) {
            formData.set('is_recurring', 'true')
            formData.set('recurrence_end_type', 'date')
            formData.set('recurrence_end_date', endDate)
            // Auto-fill all days for continuous block
            formData.set('recurrence_days', JSON.stringify([0, 1, 2, 3, 4, 5, 6]))
        } else {
            formData.set('is_recurring', 'false')
        }

        // Duration (Time based)
        const sT = new Date(`2000-01-01T${startTime}:00`)
        const eT = new Date(`2000-01-01T${endTime}:00`)
        const diffMins = (eT.getTime() - sT.getTime()) / 60000
        if (diffMins <= 0) {
            toast.error("Hora fim deve ser maior que hora início.")
            return
        }
        formData.set('custom_duration', diffMins.toString())
        formData.set('time', startTime)
        formData.set('date', startDate)


        let result
        if (isEditMode && appointment) {
            formData.append('appointment_id', appointment.id)
            result = await updateAppointment(formData)
        } else {
            result = await createAppointment(formData)
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
        if (!confirm("Excluir este bloqueio?")) return
        const res = await deleteAppointment(appointment.id)
        if (res?.error) toast.error(res.error); else {
            toast.success("Bloqueio excluído.")
            if (onOpenChange) onOpenChange(false)
            setInternalOpen(false)
        }
    }

    const isOpen = isControlled ? open : internalOpen
    const onChange = isControlled ? onOpenChange : setInternalOpen

    return (
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
                                <Input type="date" name="start_date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Data Fim</Label>
                                <Input type="date" name="end_date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Hora Início</Label>
                                <Input type="time" name="start_time" required value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                                <Input type="time" name="end_time" required value={endTime} onChange={e => setEndTime(e.target.value)} />
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
                        {/* Hidden Unit Input */}
                        <input type="hidden" name="location_id" value={selectedLocationId} />
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
    )
}
