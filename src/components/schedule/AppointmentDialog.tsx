"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { quickCreatePatient } from "@/app/dashboard/patients/actions"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, Trash2 } from "lucide-react"
import { createAppointment, updateAppointment, deleteAppointment } from "@/app/dashboard/schedule/actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { getPatientPriceTableId, getServicePrice } from "@/app/dashboard/schedule/pricing-actions"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface AppointmentDialogProps {
    patients: { id: string, name: string }[]
    locations: { id: string, name: string, color: string }[]
    services: { id: string, name: string }[]
    professionals: { id: string, full_name: string }[]
    serviceLinks: { service_id: string, profile_id: string }[]
    selectedSlot?: { start: Date, end: Date } | null
    appointment?: any
    holidays?: { date: string, name: string, type: string }[]
    priceTables?: { id: string, name: string }[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AppointmentDialog({ patients, locations, services, professionals = [], serviceLinks = [], selectedSlot, appointment, holidays = [], priceTables = [], open, onOpenChange }: AppointmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined

    // Derived State
    const isEditMode = !!appointment
    const [selectedType, setSelectedType] = useState<'appointment' | 'block'>(appointment?.type === 'block' ? 'block' : 'appointment')

    // Pricing State
    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")

    const [priceTableId, setPriceTableId] = useState<string | null>(null)
    const [price, setPrice] = useState<number | string>(0)

    // Form Initialization Check
    useEffect(() => {
        if (isEditMode && appointment && (internalOpen || open)) {
            setSelectedPatientId(appointment.patient_id)
            setSelectedServiceId(appointment.service_id)
            setSelectedProfessionalId(appointment.professional_id)
            setPrice(appointment.price)
        }
    }, [isEditMode, appointment, open, internalOpen])

    const defaultDate = isEditMode
        ? appointment.start_time.split('T')[0]
        : (selectedSlot ? selectedSlot.start.toISOString().split('T')[0] : '')

    const defaultTimeRaw = isEditMode
        ? new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : (selectedSlot ? selectedSlot.start.toTimeString().slice(0, 5) : '')

    // Time Input State for Masking
    const [timeInput, setTimeInput] = useState(defaultTimeRaw)

    useEffect(() => {
        if ((open || internalOpen) && !isEditMode && selectedSlot) {
            // Reset to slot time if new
            setTimeInput(selectedSlot.start.toTimeString().slice(0, 5))
        } else if (isEditMode && appointment) {
            setTimeInput(new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        }
    }, [defaultTimeRaw, open, internalOpen, isEditMode, appointment, selectedSlot])

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/[^0-9:]/g, '')
        const digits = v.replace(':', '')
        if (digits.length > 4) return

        let formatted = digits
        if (digits.length >= 3) {
            formatted = digits.slice(0, 2) + ':' + digits.slice(2)
        }
        setTimeInput(formatted)
    }

    const defaultNotes = appointment?.notes || ''
    const defaultLocationId = appointment?.location_id || locations[0]?.id
    const defaultIsExtra = appointment?.is_extra || false

    // Holiday Check
    const [selectedDateVal, setSelectedDateVal] = useState(defaultDate)

    useEffect(() => {
        if ((Number(open) || internalOpen) && !selectedDateVal) {
            setSelectedDateVal(defaultDate)
        }
    }, [defaultDate, open, internalOpen, selectedDateVal])

    const holidayWarning = holidays.find(h => h.date === selectedDateVal)

    // FILTERING LOGIC
    // 1. Available Professionals based on Selected Service
    const availableProfessionals = selectedServiceId
        ? professionals.filter(p => serviceLinks.some(link => link.service_id === selectedServiceId && link.profile_id === p.id))
        : professionals

    // 2. Available Services based on Selected Professional
    const availableServices = selectedProfessionalId
        ? services.filter(s => serviceLinks.some(link => link.profile_id === selectedProfessionalId && link.service_id === s.id))
        : services

    // Fetch Price Table when Patient Changes
    useEffect(() => {
        if (!selectedPatientId) return

        async function fetchTable() {
            const tableId = await getPatientPriceTableId(selectedPatientId)
            setPriceTableId(tableId)
        }
        fetchTable()
    }, [selectedPatientId])

    // Update Price when Service OR Table changes
    useEffect(() => {
        if (!selectedServiceId) return

        async function fetchPrice() {
            const calculatedPrice = await getServicePrice(selectedServiceId, priceTableId)
            setPrice(calculatedPrice)
        }
        fetchPrice()
    }, [selectedServiceId, priceTableId])

    // Combobox State
    const [openCombobox, setOpenCombobox] = useState(false)
    const [patientSearch, setPatientSearch] = useState("")
    const [quickPhone, setQuickPhone] = useState("")
    const [isCreatingPatient, setIsCreatingPatient] = useState(false)
    const [localPatients, setLocalPatients] = useState(patients)

    useEffect(() => {
        setLocalPatients(patients)
    }, [patients])

    const filteredPatients = localPatients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase())
    )

    const handleQuickCreate = async () => {
        if (!patientSearch || patientSearch.length < 3) return
        if (!quickPhone || quickPhone.length < 8) {
            toast.error("Por favor, informe o celular para o cadastro.")
            return
        }

        setIsCreatingPatient(true)
        const result = await quickCreatePatient(patientSearch, quickPhone)
        setIsCreatingPatient(false)

        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {
            const newPatient = { id: result.data.id, name: result.data.name }
            setLocalPatients(prev => [...prev, newPatient])
            setSelectedPatientId(newPatient.id)
            setOpenCombobox(false)
            setQuickPhone("")
            toast.success(`Paciente ${newPatient.name} cadastrado!`)
        }
    }

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceCount, setRecurrenceCount] = useState(10)
    const [recurrenceEndType, setRecurrenceEndType] = useState<'count' | 'date'>('count')
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])

    const toggleDay = (dayIdx: number) => {
        setRecurrenceDays(prev =>
            prev.includes(dayIdx)
                ? prev.filter(d => d !== dayIdx)
                : [...prev, dayIdx].sort()
        )
    }

    async function handleSubmit(formData: FormData) {
        // Enforce Time Format
        const timeStr = timeInput
        if (timeStr.length !== 5 || !timeStr.includes(':')) {
            toast.error("Horário inválido. Use o formato 08:00")
            return
        }
        formData.set('time', timeStr)

        let result
        if (isEditMode) {
            formData.append('appointment_id', appointment.id)
            result = await updateAppointment(formData)
        } else {
            result = await createAppointment(formData)
        }

        if (result?.error) {
            toast.error(result.error)
        } else if ((result as any)?.confirmationRequired) {
            // Handle Confirmation
            if (confirm((result as any).message)) {
                // Resubmit with force override
                formData.set('force_block_override', 'true')
                // Note: Server treats this as 'is_extra=true' for logic safety

                // Recursive call or just re-run action?
                // Action buttons are async, so just re-await the action function
                let retryResult
                if (isEditMode) {
                    retryResult = await updateAppointment(formData)
                } else {
                    retryResult = await createAppointment(formData)
                }

                if (retryResult?.error) {
                    toast.error(retryResult.error)
                } else {
                    toast.success(isEditMode ? "Agendamento atualizado com permissão!" : "Agendamento realizado com permissão!")
                    if (onOpenChange) onOpenChange(false)
                    setInternalOpen(false)
                    // Reset fields
                    if (!isEditMode) {
                        setSelectedPatientId("")
                        setSelectedServiceId("")
                        setSelectedProfessionalId("")
                        setPrice(0)
                        setTimeInput("")
                        setIsRecurring(false)
                        setRecurrenceDays([])
                    }
                }
            }
        } else {
            toast.success(isEditMode ? "Agendamento atualizado!" : "Agendamento realizado!")
            if (result?.warning) {
                toast.warning("Observação", { description: result.warning, duration: 6000 })
            }

            if (onOpenChange) onOpenChange(false)
            setInternalOpen(false)

            // Explicit Reset
            if (!isEditMode) {
                setSelectedPatientId("")
                setSelectedServiceId("")
                setSelectedProfessionalId("")
                setPrice(0)
                setTimeInput("")
                setIsRecurring(false)
                setRecurrenceDays([])
            }
        }
    }

    async function handleDelete() {
        if (!appointment?.id) return
        if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

        const result = await deleteAppointment(appointment.id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Agendamento excluído.")
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
                    <Button size="sm" className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Novo Agendamento
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Altere os dados ou exclua." : "Marque uma consulta ou sessão."}
                    </DialogDescription>
                </DialogHeader>

                {holidayWarning && (
                    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 mb-2 text-sm flex items-center gap-2" role="alert">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                            Feriado: <strong>{holidayWarning.name}</strong>
                        </span>
                    </div>
                )}

                <form action={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

                        {/* LEFT COLUMN */}
                        <div className="space-y-4">
                            {/* [MODIFIED] Block Toggle Removed - Always Appointment */}
                            <input type="hidden" name="type" value="appointment" />

                            {/* Patient Selection */}
                            <div className="grid gap-2">
                                <Label>Paciente</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            {selectedPatientId
                                                ? localPatients.find((p) => p.id === selectedPatientId)?.name
                                                : "Selecione ou digite..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Buscar paciente..."
                                                onValueChange={setPatientSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty />

                                                {filteredPatients.length === 0 && patientSearch.length >= 3 && (
                                                    <div className="p-3 flex flex-col items-center gap-3 border-b bg-muted/30">
                                                        <p className="text-sm text-muted-foreground">
                                                            Nenhum paciente encontrado.
                                                        </p>

                                                        <div className="w-full space-y-2">
                                                            <Label className="text-xs">Celular do Paciente (WhatsApp)</Label>
                                                            <Input
                                                                placeholder="(00) 00000-0000"
                                                                value={quickPhone}
                                                                onChange={(e) => setQuickPhone(e.target.value)}
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="w-full gap-2"
                                                            onClick={handleQuickCreate}
                                                            disabled={isCreatingPatient || !patientSearch || !quickPhone}
                                                        >
                                                            {isCreatingPatient ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Plus className="h-4 w-4" />
                                                            )}
                                                            Cadastrar e Agendar
                                                        </Button>
                                                    </div>
                                                )}

                                                <CommandGroup heading="Pacientes">
                                                    {filteredPatients.map((p) => (
                                                        <CommandItem
                                                            key={p.id}
                                                            value={p.name}
                                                            onSelect={() => {
                                                                setSelectedPatientId(p.id)
                                                                setOpenCombobox(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedPatientId === p.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {p.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <input type="hidden" name="patient_id" value={selectedPatientId} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="service_id">Serviço</Label>
                                    <Select name="service_id" required onValueChange={setSelectedServiceId} value={selectedServiceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableServices.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="professional_id">Profissional</Label>
                                    <Select name="professional_id" required onValueChange={setSelectedProfessionalId} value={selectedProfessionalId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProfessionals.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location_id">Local</Label>
                                <Select name="location_id" required defaultValue={defaultLocationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o local" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.id}>
                                                <span className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                                                    {l.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea id="notes" name="notes" placeholder="Notas internas..." defaultValue={defaultNotes} className="min-h-[100px]" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Time, Price, Recurrence */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Data</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        required
                                        defaultValue={defaultDate}
                                        onChange={(e) => setSelectedDateVal(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Hora</Label>
                                    <Input
                                        id="time"
                                        name="time"
                                        type="text"
                                        required
                                        value={timeInput}
                                        onChange={handleTimeChange}
                                        placeholder="00:00"
                                        maxLength={5}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pb-2">
                                <Checkbox id="is_extra" name="is_extra" value="true" defaultChecked={defaultIsExtra} />
                                <label
                                    htmlFor="is_extra"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Encaixe (Ignorar conflitos)
                                </label>
                            </div>


                            <div className="p-4 bg-muted/20 rounded-lg space-y-4 border">
                                {isEditMode && selectedType === 'appointment' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue={appointment?.status || 'scheduled'}>
                                            <SelectTrigger className={cn(
                                                "w-full font-medium",
                                                appointment?.status === 'completed' ? "text-green-600 bg-green-50 border-green-200" :
                                                    appointment?.status === 'cancelled' ? "text-red-600 bg-red-50 border-red-200" :
                                                        ""
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">📅 Agendado</SelectItem>
                                                <SelectItem value="confirmed">✅ Confirmado</SelectItem>
                                                <SelectItem value="completed">🏁 Atendido / Concluído</SelectItem>
                                                <SelectItem value="cancelled">🚫 Cancelado</SelectItem>
                                                <SelectItem value="no_show">👻 Não Compareceu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {appointment?.status !== 'completed' && (
                                            <p className="text-[10px] text-muted-foreground">
                                                Marcar como "Atendido" gera a comissão.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedType === 'appointment' && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="price_table">Tabela de Preços</Label>
                                            <Select
                                                value={priceTableId || "default"}
                                                onValueChange={(val) => setPriceTableId(val === "default" ? null : val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Padrão (Particular)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default">Padrão / Particular</SelectItem>
                                                    {priceTables.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="price">Valor (R$)</Label>
                                            <CurrencyInput
                                                id="price"
                                                value={Number(price)}
                                                onValueChange={(val) => setPrice(val || 0)}
                                                className="font-mono bg-white"
                                            />
                                            <input type="hidden" name="price" value={price} />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Recurrence Options */}
                            <div className="border rounded-md p-3 space-y-3 bg-muted/10">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_recurring"
                                        checked={isRecurring}
                                        onCheckedChange={(c) => setIsRecurring(!!c)}
                                    />
                                    <label
                                        htmlFor="is_recurring"
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        Repetir agendamento
                                    </label>
                                </div>

                                {isRecurring && (
                                    <div className="space-y-3 pt-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Dias da Semana</Label>
                                            <div className="flex gap-1">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => toggleDay(idx)}
                                                        className={`
                                                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors
                                                                ${recurrenceDays.includes(idx)
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                                            `}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Terminar</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id="end_count"
                                                        name="recurrence_end_type"
                                                        value="count"
                                                        checked={recurrenceEndType === 'count'}
                                                        onChange={() => setRecurrenceEndType('count')}
                                                        className="accent-primary"
                                                    />
                                                    <label htmlFor="end_count" className="text-sm">Após</label>
                                                    <Input
                                                        type="number"
                                                        className="w-16 h-7 text-center p-1"
                                                        value={recurrenceCount}
                                                        onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                                                        disabled={recurrenceEndType !== 'count'}
                                                    />
                                                    <span className="text-sm">vezes</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="radio"
                                                    id="end_date"
                                                    name="recurrence_end_type"
                                                    value="date"
                                                    checked={recurrenceEndType === 'date'}
                                                    onChange={() => setRecurrenceEndType('date')}
                                                    className="accent-primary"
                                                />
                                                <label htmlFor="end_date" className="text-sm">Até</label>
                                                <Input
                                                    type="date"
                                                    className="w-auto h-7 p-1"
                                                    name="recurrence_end_date"
                                                    value={recurrenceEndDate}
                                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                                    disabled={recurrenceEndType !== 'date'}
                                                />
                                            </div>
                                        </div>

                                        <input type="hidden" name="is_recurring" value={isRecurring ? "true" : "false"} />
                                        <input type="hidden" name="recurrence_days" value={JSON.stringify(recurrenceDays)} />
                                        <input type="hidden" name="recurrence_count" value={recurrenceCount} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t mt-2">
                        {isEditMode && (
                            <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Excluir
                            </Button>
                        )}
                        <Button type="submit" className="ml-auto min-w-[120px]">
                            {isEditMode ? "Atualizar" : "Confirmar Agendamento"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    )
}
