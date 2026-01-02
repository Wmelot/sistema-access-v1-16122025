import { useRouter } from "next/navigation"

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
// [FIX] Add Alert Dialog Imports
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
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { TimeInput } from "@/components/ui/time-input"
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
import { Plus, AlertTriangle, Trash2, CalendarIcon, Clock, User, FileText, Check, DollarSign, ChevronsUpDown, Loader2, CheckCircle2, CheckSquare } from "lucide-react"
import { createAppointment, updateAppointment, deleteAppointment, searchPatients, updateAppointmentStatus } from "@/app/dashboard/schedule/actions"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import pt from 'react-phone-number-input/locale/pt'
import { format } from "date-fns"
import { getPatientPriceTableId, getServicePrice } from "@/app/dashboard/schedule/pricing-actions"
import { CurrencyInput } from "@/components/ui/currency-input"
import { createClient } from "@/lib/supabase/client" // [NEW] - Correct path
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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { SecurityConfirmationDialog } from "@/components/ui/security-confirmation-dialog" // [NEW]

interface AppointmentDialogProps {
    patients: { id: string, name: string }[]
    locations: { id: string, name: string, color: string }[]
    services: { id: string, name: string }[]
    professionals: { id: string, full_name: string, professional_availability?: any[] }[]
    serviceLinks: { service_id: string, profile_id: string }[]
    selectedSlot?: { start: Date, end: Date } | null
    appointment?: any
    holidays?: { date: string, name: string, type: string }[]
    priceTables?: { id: string, name: string }[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
    initialPatientId?: string
    initialPatientName?: string // [NEW] Pre-fill name for search
    initialPatientPhone?: string // [NEW] Pre-fill phone for quick add
    initialProfessionalId?: string
}

export function AppointmentDialog({ patients, locations, services, professionals = [], serviceLinks = [], selectedSlot, appointment, holidays = [], priceTables = [], open, onOpenChange, initialPatientId, initialPatientName, initialPatientPhone, initialProfessionalId }: AppointmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState(1) // [NEW] Stepper State

    // Reset step on close
    useEffect(() => {
        if (!open && !internalOpen) {
            setStep(1)
        }
    }, [open, internalOpen])
    const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false)
    const [bypassWarning, setBypassWarning] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const formDataRef = useRef<FormData | null>(null)

    const isControlled = open !== undefined
    const router = useRouter()

    // Derived State
    const isEditMode = !!appointment
    const [selectedType, setSelectedType] = useState<'appointment' | 'block'>(appointment?.type === 'block' ? 'block' : 'appointment')

    // Pricing State
    // Pricing State
    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    // [MODIFIED] Initialize with context (initialProfessionalId) or fallback to first
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(initialProfessionalId || professionals[0]?.id || "")
    const [installments, setInstallments] = useState<number>(1) // [NEW]

    const [priceTableId, setPriceTableId] = useState<string | null>(null)
    const [price, setPrice] = useState<number | string>(0) // Holds the Unit / Original Price
    const [discount, setDiscount] = useState<number | string>(0)
    const [addition, setAddition] = useState<number | string>(0)

    // [NEW] Discount Type Toggle (percent | fixed)
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
    const [discountPercent, setDiscountPercent] = useState<number | string>(0)

    // [NEW] Payment Method State
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
    const [invoiceIssued, setInvoiceIssued] = useState(true)

    // Calculated Final Price for Display
    const finalTotal = Math.max(0, Number(price || 0) - Number(discount || 0) + Number(addition || 0))

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Form Initialization Check
    useEffect(() => {
        if (isEditMode && appointment && (internalOpen || open)) {
            setSelectedPatientId(appointment.patient_id)
            setSelectedServiceId(appointment.service_id)
            setSelectedProfessionalId(appointment.professional_id)
            setSelectedLocationId(appointment.location_id) // [NEW]

            // [FIX] Update Date State using LOCAL time to avoid UTC shift
            const localDate = new Date(appointment.start_time)
            setSelectedDateVal(format(localDate, 'yyyy-MM-dd'))

            setPrice(appointment.original_price || appointment.price) // Prefer original_price if exists
            setDiscount(appointment.discount || 0)
            setAddition(appointment.addition || 0)
            setPaymentMethodId(appointment.payment_method_id || null)
            setInvoiceIssued(appointment.invoice_issued || false)
            setInstallments(appointment.installments || 1) // [NEW] Set installments
        } else {
            // [MODIFIED] Reset defaults for New Appointment
            setPaymentMethodId("") // Empty by default
            setInstallments(1)
        }
    }, [isEditMode, appointment, open, internalOpen])

    useEffect(() => {
        if (isEditMode && appointment && (internalOpen || open)) {
            setSelectedPatientId(appointment.patient_id)
            setSelectedServiceId(appointment.service_id)
            setSelectedProfessionalId(appointment.professional_id)
            setSelectedLocationId(appointment.location_id) // [NEW]
            setPrice(appointment.original_price || appointment.price) // Prefer original_price if exists
            setDiscount(appointment.discount || 0)
            setAddition(appointment.addition || 0)
            setPaymentMethodId(appointment.payment_method_id || null)
            setInvoiceIssued(appointment.invoice_issued || false)
        }
    }, [isEditMode, appointment, open, internalOpen])

    // Moved Auto-Toggle Invoice based on Payment Method to lower in the file to access paymentMethods state

    // [NEW] Location State
    const [selectedLocationId, setSelectedLocationId] = useState<string>(appointment?.location_id || locations[0]?.id || "")

    useEffect(() => {
        if (!selectedLocationId && locations.length > 0) {
            setSelectedLocationId(locations[0].id)
        }
    }, [locations, selectedLocationId])

    const defaultDate = isEditMode
        ? appointment.start_time.split('T')[0]
        : (selectedSlot ? format(selectedSlot.start, 'yyyy-MM-dd') : '')

    // [FIX] Force update of defaultDate when selectedSlot actually changes
    const lastSlotRef = useRef<string>('')
    useEffect(() => {
        if (selectedSlot && !isEditMode) {
            const slotKey = selectedSlot.start.toISOString()
            if (slotKey !== lastSlotRef.current) {
                lastSlotRef.current = slotKey
                setSelectedDateVal(format(selectedSlot.start, 'yyyy-MM-dd'))
                setTimeInput(selectedSlot.start.toTimeString().slice(0, 5))
            }
        }
    }, [selectedSlot, isEditMode])

    const defaultTimeRaw = isEditMode
        ? new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : (selectedSlot ? selectedSlot.start.toTimeString().slice(0, 5) : '')

    // Time Input State
    const [timeInput, setTimeInput] = useState(defaultTimeRaw)

    useEffect(() => {
        if ((open || internalOpen) && !isEditMode && selectedSlot) {
            // Reset to slot time if new
            setTimeInput(selectedSlot.start.toTimeString().slice(0, 5))
        } else if (isEditMode && appointment) {
            setTimeInput(new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        }
    }, [defaultTimeRaw, open, internalOpen, isEditMode, appointment, selectedSlot])

    // [NEW] Handle Initial Patient (Pre-fill)
    useEffect(() => {
        if (!isEditMode && (open || internalOpen)) {
            if (initialPatientId) {
                setSelectedPatientId(initialPatientId)
                // Close Combobox
                setOpenCombobox(false)
                setPatientSearch('')
                setQuickPhone('')
            } else if (initialPatientName) {
                // Pre-fill search logic for NEW patient
                setSelectedPatientId("") // Clear any previous selection
                setPatientSearch(initialPatientName)
                if (initialPatientPhone) {
                    setQuickPhone(initialPatientPhone)
                }
                setOpenCombobox(true) // Open to show/search
            }
        }

        // [NEW] Handle Initial Professional
        if (initialProfessionalId && !isEditMode && (open || internalOpen)) {
            setSelectedProfessionalId(initialProfessionalId)
        }
    }, [initialPatientId, initialPatientName, initialPatientPhone, initialProfessionalId, isEditMode, open, internalOpen])


    const defaultNotes = appointment?.notes || ''
    const defaultLocationId = appointment?.location_id || locations[0]?.id
    const defaultIsExtra = appointment?.is_extra || false

    // Holiday Check
    const [selectedDateVal, setSelectedDateVal] = useState(defaultDate)

    useEffect(() => {
        if ((Number(open) || internalOpen) && !selectedDateVal) {
            // Only set default if EMPTY. But the effect above handles Slot changes.
            if (!selectedSlot) setSelectedDateVal(defaultDate)
        }
    }, [defaultDate, open, internalOpen])

    // [NEW] Auto-Select Location based on Professional Availability
    useEffect(() => {
        if (!selectedProfessionalId || !selectedDateVal || !timeInput || isEditMode) return

        const prof = professionals.find(p => p.id === selectedProfessionalId)
        if (!prof?.professional_availability) return

        const dateObj = new Date(selectedDateVal + 'T' + timeInput + ':00')
        if (isNaN(dateObj.getTime())) return

        const dayOfWeek = dateObj.getDay()
        const timeMins = dateObj.getHours() * 60 + dateObj.getMinutes()

        // Find matching slot
        const slot = prof.professional_availability.find((s: any) => {
            if (s.day_of_week !== dayOfWeek) return false
            const [sh, sm] = s.start_time.split(':').map(Number)
            const [eh, em] = s.end_time.split(':').map(Number)
            const startMins = sh * 60 + sm
            const endMins = eh * 60 + em
            return timeMins >= startMins && timeMins < endMins
        })

        if (slot?.location_id && locations.some(l => l.id === slot.location_id)) {
            setSelectedLocationId(slot.location_id)
        }
    }, [selectedProfessionalId, timeInput, selectedDateVal, professionals, locations, isEditMode])

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

    // [NEW] Auto-Select Professional if only one available
    useEffect(() => {
        if (selectedServiceId && availableProfessionals.length === 1) {
            const singleProfId = availableProfessionals[0].id
            if (selectedProfessionalId !== singleProfId) {
                setSelectedProfessionalId(singleProfId)
            }
        }
    }, [selectedServiceId, availableProfessionals, selectedProfessionalId])

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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]) // [NEW]
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)

    useEffect(() => {
        if (appointment?.patients) {
            setLocalPatients([appointment.patients])
        } else {
            setLocalPatients(patients)
        }
    }, [patients, appointment])

    // [NEW] Async Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (patientSearch && patientSearch.length >= 2) {
                const results = await searchPatients(patientSearch)
                setLocalPatients(prev => {
                    // Merge results but avoid duplicates if selected is there
                    const selected = prev.find(p => p.id === selectedPatientId)
                    const newPatients = results
                    if (selected && !newPatients.find(p => p.id === selected.id)) {
                        return [selected, ...newPatients]
                    }
                    return newPatients
                })
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [patientSearch, selectedPatientId])

    // Fetch payment methods
    useEffect(() => {
        const supabase = createClient()

        async function fetchPaymentMethods() {
            setLoadingPaymentMethods(true)
            const { data, error } = await supabase.from('payment_methods').select('*').eq('active', true).order('name')
            if (error) {
                toast.error("Erro ao carregar métodos de pagamento: " + error.message)
            } else {
                setPaymentMethods(data || [])
            }
            setLoadingPaymentMethods(false)
        }
        fetchPaymentMethods()
    }, [])

    // Auto-Toggle Invoice based on Payment Method
    // Auto-Toggle Invoice logic moved to onChange event

    const filteredPatients = localPatients

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

    async function executeSave(formData: FormData) {
        // Enforce Time Format
        const timeStr = timeInput
        if (timeStr.length !== 5 || !timeStr.includes(':')) {
            toast.error("Horário inválido. Use o formato 08:00")
            return
        }
        formData.set('time', timeStr)
        // Ensure Date is ISO (YYYY-MM-DD) not Display (DD/MM/YYYY)
        if (selectedDateVal) {
            formData.set('date', selectedDateVal)
        } else {
            toast.error("Data inválida.")
            return
        }

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
                        setSelectedLocationId(locations[0]?.id || "")
                        setPrice(0)
                        setDiscount(0)
                        setAddition(0)
                        setPaymentMethodId(null)
                        setTimeInput("")
                        setIsRecurring(false)
                        setRecurrenceDays([])
                    }
                }
            }
        } else {
            toast.success(isEditMode ? "Agendamento atualizado!" : "Agendamento realizado!")
            if ((result as any)?.warning) {
                toast.warning("Observação", {
                    description: <span className="text-zinc-900 font-medium">{(result as any).warning}</span>,
                    duration: 6000
                })
            }

            if (onOpenChange) onOpenChange(false)
            setInternalOpen(false)

            // Explicit Reset
            if (!isEditMode) {
                setSelectedPatientId("")
                setSelectedServiceId("")
                setSelectedProfessionalId("")
                setSelectedLocationId(locations[0]?.id || "")
                setPrice(0)
                setDiscount(0)
                setAddition(0)
                setAddition(0)
                setPaymentMethodId(null)
                setInvoiceIssued(false)
                setTimeInput("")
                setIsRecurring(false)
                setRecurrenceDays([])
            }
        }
        setIsSaving(false)
        setBypassWarning(false)
        formDataRef.current = null
    }

    async function handleSubmit(formData: FormData) {
        // [NEW] Availability Check Wrapper
        if (!bypassWarning && selectedType === 'appointment' && selectedProfessionalId && selectedDateVal && timeInput) {
            const startDateTime = new Date(`${selectedDateVal}T${timeInput}:00`)
            const professional = professionals.find(p => p.id === selectedProfessionalId)

            if (professional && professional.professional_availability && professional.professional_availability.length > 0) {
                const dayOfWeek = startDateTime.getDay()
                const daySlots = professional.professional_availability.filter(s => s.day_of_week === dayOfWeek)

                if (daySlots.length === 0) {
                    formDataRef.current = formData
                    setShowAvailabilityWarning(true)
                    return
                }

                const timeMins = startDateTime.getHours() * 60 + startDateTime.getMinutes()

                const isWithinSlot = daySlots.some(slot => {
                    const [sh, sm] = slot.start_time.split(':').map(Number)
                    const [eh, em] = slot.end_time.split(':').map(Number)
                    const startMins = sh * 60 + sm
                    const endMins = eh * 60 + em
                    return timeMins >= startMins && timeMins < endMins
                })

                if (!isWithinSlot) {
                    formDataRef.current = formData
                    setShowAvailabilityWarning(true)
                    return
                }
            }
        }

        // Ensure buttons know we are saving (although executeSave handles loading too? No, handleSubmit triggers action)
        // Actually executeSave uses form action logic, so setIsSaving(true) is good?
        // But executeSave is async.
        await executeSave(formData)
    }

    async function handleDelete() {
        if (!appointment?.id) return
        setShowDeleteConfirmation(true)
    }

    async function handleConfirmDelete(password: string) {
        setIsDeleting(true)
        try {
            const result = await deleteAppointment(appointment.id, false, password)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Agendamento excluído.")
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
            }
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirmation(false)
        }
    }

    // [NEW] Quick Status Update Handlers
    const handleStatusUpdate = async (newStatus: string) => {
        if (!appointment?.id) return

        const promise = updateAppointmentStatus(appointment.id, newStatus)

        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: 'Status atualizado!',
            error: 'Erro ao atualizar status.'
        })

        // Close dialog on success? Maybe keep open?
        // Better to close to see calendar update.
        if (onOpenChange) onOpenChange(false)
        setInternalOpen(false)
    }

    const isOpen = isControlled ? open : internalOpen
    const onChange = isControlled ? onOpenChange : setInternalOpen

    return (
        <>
            <SecurityConfirmationDialog
                open={showDeleteConfirmation}
                onOpenChange={setShowDeleteConfirmation}
                title="Excluir Agendamento"
                variant={appointment?.status === 'completed' ? 'warning' : 'destructive'}
                description={
                    appointment?.status === 'completed' ? (
                        <div className="space-y-2">
                            <p>Este agendamento já foi <strong>recebido/faturado (Atendido)</strong>.</p>
                            <p className="bg-amber-50 p-2 border border-amber-200 rounded text-amber-800 text-xs">
                                ⚠️ <strong>Atenção:</strong> Ao excluí-lo, este valor será removido do faturamento exibido nos relatórios financeiros.
                            </p>
                        </div>
                    ) : "Esta ação é irreversível. Por favor, confirme sua senha para continuar."
                }
                confirmText="Excluir Permanentemente"
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <Dialog open={isOpen} onOpenChange={onChange}>
                {!isControlled && (
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            Novo Agendamento
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 transition-all duration-300">
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle>{isEditMode ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                                {/* Steps Indicator */}
                                <div className="flex gap-1">
                                    <div className={cn("h-2 w-8 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-muted")} />
                                    <div className={cn("h-2 w-8 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-muted")} />
                                </div>
                            </div>
                            <DialogDescription>
                                {step === 1 ? "Passo 1: Dados do Agendamento" : "Passo 2: Financeiro e Detalhes"}
                            </DialogDescription>
                        </DialogHeader>

                        {holidayWarning && (
                            <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 mb-2 text-sm flex items-center gap-2 mt-4" role="alert">
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                    Feriado: <strong>{holidayWarning.name}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    <form action={handleSubmit} className="flex flex-col flex-1 overflow-hidden" id="appointment-form">
                        <div className="flex-1 overflow-y-auto p-6 pt-2">

                            {/* STEP 1: SCHEDULING */}
                            <div className={cn("space-y-4", step === 1 ? "block" : "hidden")}>
                                <input type="hidden" name="type" value="appointment" />

                                {/* Patient Selection */}
                                <div className="grid gap-2">
                                    <Label>Paciente <span className="text-red-500">*</span></Label>
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
                                                                <PhoneInput
                                                                    defaultCountry="BR"
                                                                    placeholder="(00) 00000-0000"
                                                                    value={quickPhone}
                                                                    onChange={(val) => setQuickPhone(val || "")}
                                                                    labels={pt}
                                                                    inputComponent={Input}
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="service_id">Serviço <span className="text-red-500">*</span></Label>
                                        <Select name="service_id" required onValueChange={(val) => setSelectedServiceId(val === 'all_clear' ? '' : val)} value={selectedServiceId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all_clear" className="text-muted-foreground font-medium">-- Selecione --</SelectItem>
                                                {availableServices.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="professional_id">Profissional <span className="text-red-500">*</span></Label>
                                        <Select name="professional_id" required onValueChange={(val) => setSelectedProfessionalId(val === 'all_clear' ? '' : val)} value={selectedProfessionalId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all_clear" className="text-muted-foreground font-medium">-- Selecione --</SelectItem>
                                                {availableProfessionals.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Data <span className="text-red-500">*</span></Label>
                                        <DateInput
                                            id="date"
                                            name="date"
                                            required
                                            value={selectedDateVal}
                                            onChange={(val) => setSelectedDateVal(val)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="time">Hora <span className="text-red-500">*</span></Label>
                                        <TimeInput
                                            id="time"
                                            name="time"
                                            required
                                            value={timeInput}
                                            onChange={(val) => setTimeInput(val)}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="location_id">Local</Label>
                                    <Select name="location_id" required value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
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
                                    <Textarea id="notes" name="notes" placeholder="Notas internas..." defaultValue={defaultNotes} className="min-h-[80px]" />
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="is_extra" name="is_extra" value="true" defaultChecked={defaultIsExtra} />
                                    <label
                                        htmlFor="is_extra"
                                        className="text-sm font-medium leading-none cursor-pointer text-muted-foreground"
                                    >
                                        Encaixe (Permitir conflito de horário)
                                    </label>
                                </div>

                                {/* Recurrence Toggler - Kept simple in Step 1 */}
                                <div className="flex items-center space-x-2 pt-2">
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
                                    <div className="p-3 bg-muted/20 rounded-lg space-y-3 border text-sm">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Dias da Semana</Label>
                                            <div className="flex gap-1 justify-between sm:justify-start">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => toggleDay(idx)}
                                                        className={`
                                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors
                                                            ${recurrenceDays.includes(idx)
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            }
                                                        `}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="hidden"
                                                name="recurrence_end_type"
                                                value="count"
                                            />
                                            <span className="text-sm">Repetir por</span>
                                            <Input
                                                type="number"
                                                className="w-16 h-7 text-center p-1"
                                                value={recurrenceCount}
                                                onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                                                min={1}
                                                max={50}
                                            />
                                            <span className="text-sm">vezes</span>
                                        </div>
                                        <input type="hidden" name="is_recurring" value={isRecurring ? "true" : "false"} />
                                        <input type="hidden" name="recurrence_days" value={JSON.stringify(recurrenceDays)} />
                                        <input type="hidden" name="recurrence_count" value={recurrenceCount} />
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: FINANCIAL */}
                            <div className={cn("space-y-4", step === 2 ? "block" : "hidden")}>
                                {isEditMode && selectedType === 'appointment' && (
                                    <div className="grid gap-2 p-3 bg-muted/30 rounded-lg border">
                                        <Label htmlFor="status" className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status do Agendamento</Label>
                                        <Select name="status" defaultValue={appointment?.status || 'scheduled'}>
                                            <SelectTrigger className={cn(
                                                "w-full font-medium h-9",
                                                appointment?.status === 'completed' ? "text-green-600 bg-green-50 border-green-200" :
                                                    appointment?.status === 'cancelled' ? "text-red-600 bg-red-50 border-red-200" :
                                                        ""
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Agendado</SelectItem>
                                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                                <SelectItem value="checked_in">Aguardando (Chegou)</SelectItem>
                                                <SelectItem value="attended">Atendido</SelectItem>
                                                <SelectItem value="completed">Faturado / Concluído</SelectItem>
                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                <SelectItem value="no_show">Faltou</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-4 pt-1">
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
                                        <Label htmlFor="payment_method">Forma de Pagamento</Label>
                                        <Select
                                            value={(paymentMethodId && paymentMethodId !== "null") ? paymentMethodId : "null"}
                                            onValueChange={(val) => {
                                                const newValue = val === "null" ? null : val
                                                setPaymentMethodId(newValue)

                                                if (newValue) {
                                                    const method = paymentMethods.find(m => m.id === newValue)
                                                    if (method) {
                                                        const name = method.name.toLowerCase()
                                                        const slug = method.slug?.toLowerCase() || ''
                                                        if (name.includes('dinheiro') || slug === 'money' || slug === 'cash') {
                                                            setInvoiceIssued(false)
                                                        } else {
                                                            setInvoiceIssued(true)
                                                        }
                                                    }
                                                }
                                            }}
                                            name="payment_method_id"
                                        >
                                            <SelectTrigger id="payment-method-trigger">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Selecione...</SelectItem>
                                                {paymentMethods.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name.replace(/\(1x\)/i, '').trim()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" name="payment_method_id" value={paymentMethodId || ""} />
                                    </div>

                                    {/* Invoice & Installments */}
                                    <div className="flex items-center justify-between py-1">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="invoice_issued"
                                                name="invoice_issued"
                                                value="true"
                                                checked={invoiceIssued}
                                                onCheckedChange={(c) => setInvoiceIssued(!!c)}
                                            />
                                            <label
                                                htmlFor="invoice_issued"
                                                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                                            >
                                                <FileText className="h-3 w-3 text-muted-foreground" />
                                                Emitir Nota Fiscal
                                            </label>
                                        </div>
                                        {(() => {
                                            const method = paymentMethods.find(m => m.id === paymentMethodId)
                                            const isCredit = method?.name.toLowerCase().includes('crédito') || method?.name.toLowerCase().includes('credit')
                                            if (isCredit) {
                                                return (
                                                    <div className="flex items-center gap-2 animate-in fade-in">
                                                        <Label htmlFor="installments" className="text-xs shrink-0">Parcelas</Label>
                                                        <Select
                                                            value={String(installments)}
                                                            onValueChange={(v) => setInstallments(Number(v))}
                                                            name="installments"
                                                        >
                                                            <SelectTrigger className="h-8 w-[80px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                                                    <SelectItem key={i} value={String(i)}>{i}x</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>

                                    {/* Financial Values */}
                                    <div className="flex gap-3 w-full">
                                        <div className="grid gap-1 flex-1">
                                            <Label htmlFor="price" className="text-xs">Valor Original</Label>
                                            <CurrencyInput
                                                id="price"
                                                value={Number(price)}
                                                onValueChange={(val) => setPrice(val || 0)}
                                                className="font-mono bg-white h-9 text-sm"
                                            />
                                            <input type="hidden" name="price" value={price} />
                                        </div>

                                        <div className="grid gap-1 flex-1">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="discount" className="text-xs text-red-600">Desconto</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                                                    className="text-[10px] bg-red-100 text-red-700 px-1 rounded hover:bg-red-200 transition-colors uppercase tracking-wider font-bold"
                                                >
                                                    {discountType === 'fixed' ? 'R$' : '%'}
                                                </button>
                                            </div>
                                            {discountType === 'fixed' ? (
                                                <CurrencyInput
                                                    id="discount"
                                                    value={Number(discount)}
                                                    onValueChange={(val) => setDiscount(val || 0)}
                                                    className="font-mono bg-white h-9 text-sm text-red-600"
                                                    placeholder="0,00"
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="100"
                                                        value={discountPercent}
                                                        onChange={(e) => {
                                                            const pct = Number(e.target.value)
                                                            setDiscountPercent(pct)
                                                            const p = Number(price)
                                                            const val = (p * pct) / 100
                                                            setDiscount(val)
                                                        }}
                                                        className="font-mono bg-white h-9 text-sm text-red-600 pr-6"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-2 text-xs text-red-600 font-bold">%</span>
                                                </div>
                                            )}
                                            <input type="hidden" name="discount" value={discount} />
                                        </div>

                                        <div className="grid gap-1 flex-1">
                                            <Label htmlFor="addition" className="text-xs text-green-600">Acréscimo</Label>
                                            <CurrencyInput
                                                id="addition"
                                                value={Number(addition)}
                                                onValueChange={(val) => setAddition(val || 0)}
                                                className="font-mono bg-white h-9 text-sm text-green-600"
                                                placeholder="0,00"
                                            />
                                            <input type="hidden" name="addition" value={addition} />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg border border-dashed">
                                        <span className="text-sm font-medium text-muted-foreground">Total Final Previsto</span>
                                        <span className="font-bold text-2xl text-primary">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <DialogFooter className="p-6 pt-3 border-t mt-0 bg-white">
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full gap-3 sm:gap-0">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {/* Back Button (Step 2) */}
                                    {step === 2 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(1)}
                                            className="w-full sm:w-auto"
                                        >
                                            Voltar
                                        </Button>
                                    )}

                                    {/* Delete (Step 1 or 2 if edit) */}
                                    {isEditMode && step === 1 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto border border-red-100" // Subtler style
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </Button>
                                    )}

                                    {/* Quick Attendance Actions (Step 1) */}
                                    {isEditMode && step === 1 && (
                                        <div className="hidden sm:flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => router.push(`/dashboard/attendance/${appointment.id}?mode=evolution`)}
                                                title="Ir para Prontuário"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    {step === 1 ? (
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto gap-2"
                                            onClick={() => {
                                                // Basic Validation
                                                if (!selectedPatientId || !selectedServiceId || !selectedProfessionalId || !selectedDateVal || !timeInput) {
                                                    toast.error("Preencha todos os campos obrigatórios (*) para continuar.")
                                                    return
                                                }
                                                setStep(2)
                                            }}
                                        >
                                            Próximo
                                            <ChevronsUpDown className="rotate-90 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <>
                                            {/* Quick Receive (Step 2 Only) */}
                                            {isEditMode && appointment?.status !== 'completed' && (
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="w-full sm:w-auto text-green-700 border-green-200 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (!paymentMethodId) {
                                                            toast.warning("Selecione a Forma de Pagamento.")
                                                            return
                                                        }
                                                        const form = document.querySelector('#appointment-form') as HTMLFormElement
                                                        if (form) {
                                                            const formData = new FormData(form)
                                                            formData.set('status', 'completed')
                                                            handleSubmit(formData)
                                                        }
                                                    }}
                                                >
                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                    Receber
                                                </Button>
                                            )}

                                            <Button type="submit" className="w-full sm:w-auto min-w-[120px]" disabled={isSaving}>
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditMode ? "Salvar Alterações" : "Confirmar Agendamento")}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Warning Dialog for Availability */}
            <Dialog open={showAvailabilityWarning} onOpenChange={setShowAvailabilityWarning}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Horário Indisponível
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            O horário selecionado ({timeInput}) está fora do período de atendimento cadastrado para este profissional nesta data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 text-sm text-slate-600">
                        Deseja forçar o agendamento mesmo assim?
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => {
                            setShowAvailabilityWarning(false)
                            formDataRef.current = null // Clear stored form data if cancelled
                        }}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => {
                                setBypassWarning(true)
                                if (formDataRef.current) {
                                    // Ensure server accepts the off-hours booking by treating it as an override/extra
                                    formDataRef.current.set('force_block_override', 'true')
                                    executeSave(formDataRef.current)
                                } else {
                                    // Fallback
                                    const form = document.querySelector('form')
                                    if (form) {
                                        const fd = new FormData(form)
                                        fd.set('force_block_override', 'true')
                                        executeSave(fd)
                                    } else {
                                        toast.error("Erro ao processar. Tente novamente.")
                                        setShowAvailabilityWarning(false)
                                        setBypassWarning(false)
                                    }
                                }
                            }}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Agendamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
