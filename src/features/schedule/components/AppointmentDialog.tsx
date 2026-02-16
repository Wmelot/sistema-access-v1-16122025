import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { quickCreatePatient } from "@/actions/patients"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, Trash2, CalendarIcon, Clock, User, FileText, Check, DollarSign, ChevronsUpDown, Loader2, CheckCircle2, CheckSquare, MessageSquare, CreditCard, Search, Link2, Home, Phone } from "lucide-react"
import { createAppointment, updateAppointment, deleteAppointment, searchPatients, updateAppointmentStatus, getAvailableSlots } from "@/actions/appointments"
import { sendAppointmentMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import pt from 'react-phone-number-input/locale/pt'
import { format } from "date-fns"
import { getPatientPriceTableId, getServicePrice } from "@/app/dashboard/[slug]/schedule/pricing-actions"
import { CurrencyInput } from "@/components/ui/currency-input"
import { createClient } from "@/lib/supabase/client" // [NEW] - Correct path
import { formatPhoneDisplay } from "@/utils/format-phone"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTemplates } from "@/app/dashboard/[slug]/settings/communication/actions"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

interface AppointmentDialogProps {
    patients: { id: string, name: string, phone?: string }[]
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
    userRole?: string
    onSuccess?: (data: { date: string, time: string }) => void
}

export function AppointmentDialog({ patients, locations, services, professionals = [], serviceLinks = [], selectedSlot, appointment, holidays = [], priceTables = [], open, onOpenChange, initialPatientId, initialPatientName, initialPatientPhone, initialProfessionalId, userRole, onSuccess }: AppointmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState(1) // [NEW] Stepper State

    // Reset step on close
    useEffect(() => {
        if (!open && !internalOpen) {
            setStep(1)
            isSuccessRef.current = false
        }
    }, [open, internalOpen])
    const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false)
    const [bypassWarning, setBypassWarning] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const formDataRef = useRef<FormData | null>(null)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
    const isSuccessRef = useRef(false)
    const { activeAttendanceId } = useActiveAttendance()
    const { slug } = useParams()

    const isAdmin = userRole === 'admin' || userRole === 'master'

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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
    const [cardBrandId, setCardBrandId] = useState<string | null>(null)
    const [invoiceIssued, setInvoiceIssued] = useState(true)
    const [cardBrands, setCardBrands] = useState<any[]>([])
    const [paymentFees, setPaymentFees] = useState<any[]>([])
    const [acquirers, setAcquirers] = useState<any[]>([])
    const [selectedAcquirerId, setSelectedAcquirerId] = useState<string | null>(null)
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)

    // Calculated Final Price for Display
    const finalTotal = Math.max(0, Number(price || 0) - Number(discount || 0) + Number(addition || 0))

    // Calculate Net Value (after payment fees) and suggest best acquirer
    const getBestAcquirerSuggestion = () => {
        if (!paymentMethodId || !cardBrandId) return null

        const method = paymentMethods.find(m => m.id === paymentMethodId)
        if (!method) return null

        const methodSlugRaw = method.slug?.toLowerCase() || method.name.toLowerCase()
        let slug = ''
        if (methodSlugRaw.includes('débito') || methodSlugRaw.includes('debit')) slug = 'debit_card'
        else if (methodSlugRaw.includes('crédito') || methodSlugRaw.includes('credit')) slug = 'credit_card'

        if (!slug) return null

        // Find best fee across all acquirers for this method/brand/installments
        const options = paymentFees.filter(f =>
            f.method === slug &&
            f.card_brand?.id === cardBrandId &&
            f.installments === installments
        )

        if (options.length === 0) return null

        // Sort by fee_percent ascending
        const best = options.sort((a, b) => a.fee_percent - b.fee_percent)[0]
        return best
    }

    const calculateNetValueForAcquirer = (acquirerId: string | null) => {
        if (!paymentMethodId || !cardBrandId) return { net: finalTotal, feePercent: 0, acquirerName: '' }

        const targetFee = acquirerId
            ? paymentFees.find(f =>
                f.acquirer_id === acquirerId &&
                f.card_brand?.id === cardBrandId &&
                f.installments === installments
            )
            : getBestAcquirerSuggestion()

        if (!targetFee) return { net: finalTotal, feePercent: 0, acquirerName: '' }

        const feeAmount = finalTotal * (targetFee.fee_percent / 100)
        return {
            net: finalTotal - feeAmount,
            feePercent: targetFee.fee_percent,
            acquirerName: targetFee.acquirer?.name || ''
        }
    }

    const bestFeeSuggestion = getBestAcquirerSuggestion()
    const currentCalculation = calculateNetValueForAcquirer(selectedAcquirerId)
    const netValue = currentCalculation.net
    const appliedFee = finalTotal - netValue


    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

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

            // [NEW] Detect Questionnaire from notes
            const notes = appointment.notes || ""
            const match = notes.match(/Queixa: (.*)/)
            if (match && match[1]) {
                setSelectedQuestionnaire(match[1].trim())
            } else {
                setSelectedQuestionnaire("none")
            }
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

    // Load templates when edit mode
    useEffect(() => {
        if (isEditMode && (open || internalOpen) && slug) {
            const fetchTemplates = async () => {
                setIsLoadingTemplates(true)
                try {
                    const data = await getTemplates(slug as string)
                    setTemplates(data || [])
                } catch (err) {
                    console.error("Failed to load templates", err)
                } finally {
                    setIsLoadingTemplates(false)
                }
            }
            fetchTemplates()
        }
    }, [isEditMode, open, internalOpen, slug])



    const handleSendWhatsApp = async (triggerType: string = 'confirmation', customText?: string) => {
        if (!appointment?.id) return

        setIsSendingWhatsApp(true)
        try {
            const result = await sendAppointmentMessage(appointment.id, triggerType as any, slug as string, null, customText) as any
            if (result.success) {
                toast.success("Mensagem enviada com sucesso!")
            } else {
                toast.error(result.error || "Erro ao enviar WhatsApp.")
            }
        } catch (err) {
            toast.error("Erro ao processar envio.")
        } finally {
            setIsSendingWhatsApp(false)
        }
    }

    // [HIDDEN METADATA] Filter out grouping tags from notes to avoid confusing the user
    const rawNotes = appointment?.notes || ''
    const defaultNotes = rawNotes.replace(/\n\n\[GRP:[a-z0-9]+\]/g, '').replace(/\[GRP:[a-z0-9]+\]/g, '').trim()
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

    // [NEW] Fetch Available Slots when context changes
    useEffect(() => {
        if (!selectedProfessionalId || !selectedDateVal) {
            setAvailableSlots([])
            return
        }

        async function fetchSlots() {
            setIsLoadingSlots(true)
            try {
                const slots = await getAvailableSlots(selectedProfessionalId, selectedDateVal, selectedServiceId || undefined)
                setAvailableSlots(slots)
            } catch (err) {
                console.error("Failed to fetch slots", err)
                setAvailableSlots([])
            } finally {
                setIsLoadingSlots(false)
            }
        }

        const timer = setTimeout(fetchSlots, 300) // Debounce
        return () => clearTimeout(timer)
    }, [selectedProfessionalId, selectedDateVal, selectedServiceId])

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
        ? professionals.filter(p => {
            const hasLink = serviceLinks.some(link => link.service_id === selectedServiceId && link.profile_id === p.id)
            return hasLink || (p as any).role === 'admin' || (p as any).role === 'master'
        })
        : professionals

    // Final check to ensure we don't show an empty list if services are messed up
    const finalProfessionals = availableProfessionals.length > 0 ? availableProfessionals : professionals

    // 2. Available Services based on Selected Professional
    const availableServicesFiltered = selectedProfessionalId
        ? services.filter(s => serviceLinks.some(link => link.profile_id === selectedProfessionalId && link.service_id === s.id))
        : services

    // Fallback: If filter results in empty list (e.g. data issue), show all services to allow scheduling
    const availableServices = availableServicesFiltered.length > 0 ? availableServicesFiltered : services


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

    useEffect(() => {
        if (appointment?.patients) {
            setLocalPatients(prev => {
                const exists = prev.some(p => p.id === appointment.patients.id);
                if (exists) return prev;
                return [appointment.patients, ...patients];
            });
        } else {
            setLocalPatients(patients);
        }
    }, [patients, appointment])

    // [NEW] Async Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (patientSearch && patientSearch.length >= 2) {
                // [FIX] Pass SLUG to searchPatients to ensure correct Org context
                const results = await searchPatients(patientSearch, slug as string)
                setLocalPatients(prev => {
                    // Merge results but avoid duplicates if selected is there
                    const selected = prev.find(p => p.id === selectedPatientId)
                    const newPatients = results || []
                    if (selected && !newPatients.find(p => p.id === selected.id)) {
                        return [selected, ...newPatients]
                    }
                    return newPatients
                })
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [patientSearch, selectedPatientId, slug])

    // Fetch payment methods
    useEffect(() => {
        const supabase = createClient()

        async function fetchPaymentMethods() {
            setLoadingPaymentMethods(true)
            const { data, error } = await supabase.from('payment_methods').select('*').order('name')
            if (error) {
                console.error("Error carregar métodos de pagamento:", error)
            } else {
                setPaymentMethods(data || [])
            }
            setLoadingPaymentMethods(false)
        }
        fetchPaymentMethods()
    }, [])

    // Fetch card brands, payment fees and acquirers
    useEffect(() => {
        const supabase = createClient()

        async function fetchCardData() {
            const [brandsResult, feesResult, acquirersResult] = await Promise.all([
                supabase.from('card_brands').select('*').order('name'),
                supabase.from('payment_method_fees').select(`
                    *,
                    card_brand:card_brands(id, name, slug),
                    acquirer:payment_acquirers(id, name, receipt_days)
                `).order('method').order('installments'),
                supabase.from('payment_acquirers').select('*').eq('active', true).order('name')
            ])

            if (brandsResult.data) setCardBrands(brandsResult.data)
            if (feesResult.data) setPaymentFees(feesResult.data)
            if (acquirersResult.data) setAcquirers(acquirersResult.data)
        }

        fetchCardData()
    }, [])

    // Auto-Toggle Invoice based on Payment Method
    // Auto-Toggle Invoice logic moved to onChange event

    const filteredPatients = localPatients

    const handleQuickCreate = async () => {
        if (!patientSearch || patientSearch.length < 3) return
        if (!quickPhone || quickPhone.length < 8) {
            MySwal.fire('Atenção', "Por favor, informe o celular para o cadastro.", 'warning')
            return
        }

        setIsCreatingPatient(true)
        const result = await quickCreatePatient(patientSearch, quickPhone, slug as string)
        setIsCreatingPatient(false)

        if (result.error) {
            if (result.code === 'DUPLICATE') {
                const resultData = result as any
                const existingPatients = resultData.existingPatients || (resultData.existingPatient ? [resultData.existingPatient] : [])

                const patientsHtml = existingPatients.map((p: any) => `
                    <div 
                        class="patient-item-option" 
                        data-patient-id="${p.id}"
                        style="text-align:left; padding:12px; margin-bottom:8px; background:#fff; border:2px solid #f1f5f9; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s; position:relative;"
                    >
                        <div class="radio-circle" style="width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <div class="radio-inner" style="width:10px; height:10px; border-radius:50%; background:#4f46e5; display:none;"></div>
                        </div>
                        <div style="flex:1;">
                            <p style="margin:0; font-size:14px; color:#1e293b; font-weight:700;">${p.name || '---'}</p>
                            <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;"><b>Tel:</b> ${p.phone ? formatPhoneDisplay(p.phone) : '---'} | <b>CPF:</b> ${p.cpf || '---'}</p>
                        </div>
                    </div>
                `).join('')

                let selectedDuplicateId: string | null = null;

                const handleItemClick = (clickedItem: HTMLElement) => {
                    const id = clickedItem.closest('.patient-item-option')?.getAttribute('data-patient-id');
                    if (!id) return;
                    selectedDuplicateId = id;
                    document.querySelectorAll('.patient-item-option').forEach(item => {
                        const htmlItem = item as HTMLElement;
                        const isSelected = htmlItem.getAttribute('data-patient-id') === id;
                        htmlItem.style.borderColor = isSelected ? '#4f46e5' : '#f1f5f9';
                        htmlItem.style.background = isSelected ? '#f5f3ff' : '#fff';
                        const inner = htmlItem.querySelector('.radio-inner') as HTMLElement;
                        const outer = htmlItem.querySelector('.radio-circle') as HTMLElement;
                        if (inner) inner.style.display = isSelected ? 'block' : 'none';
                        if (outer) outer.style.borderColor = isSelected ? '#4f46e5' : '#cbd5e1';
                    });
                };

                const choice = await MySwal.fire({
                    title: 'Paciente(s) já Cadastrado(s)',
                    html: `
                        <div style="max-height:400px; overflow-y:auto; padding:4px; margin-bottom:10px; scrollbar-width: thin;">
                            ${patientsHtml}
                        </div>
                        <p style="margin-top:14px; color:#475569; font-size:14px; font-weight:500;">Selecione o paciente existente ou crie um novo:</p>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Usar selecionado',
                    denyButtonText: 'Criar novo',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#4f46e5',
                    denyButtonColor: '#10b981',
                    didOpen: () => {
                        // Bind click events AFTER DOM is rendered
                        document.querySelectorAll('.patient-item-option').forEach(item => {
                            item.addEventListener('click', () => handleItemClick(item as HTMLElement));
                        });
                    },
                    preConfirm: () => {
                        if (!selectedDuplicateId && existingPatients.length > 0) {
                            MySwal.showValidationMessage('Selecione um paciente na lista acima para prosseguir');
                            return false;
                        }
                        return selectedDuplicateId;
                    }
                })

                if (choice.isConfirmed && choice.value) {
                    const existing = existingPatients.find((p: any) => p.id === choice.value)
                    if (existing) {
                        setLocalPatients(prev => {
                            if (prev.find(p => p.id === existing.id)) return prev
                            return [...prev, existing]
                        })
                        setSelectedPatientId(existing.id)
                        setQuickPhone("")
                        toast.success(`Paciente ${existing.name} selecionado!`)
                    }
                    setOpenCombobox(false)
                    setQuickPhone("")
                } else if (choice.isDenied) {
                    // Force create - call quickCreatePatient bypassing check won't work,
                    // so we insert directly
                    setIsCreatingPatient(true)
                    const { createClient: cc } = await import('@/lib/supabase/client')
                    const supabase = cc()
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
                        let orgId = profile?.organization_id
                        if (slug) {
                            const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
                            if (orgData) orgId = orgData.id
                        }
                        const { data: newP, error: newErr } = await supabase.from('patients').insert({
                            organization_id: orgId,
                            name: patientSearch.trim(),
                            phone: quickPhone || null,
                        }).select('id, name').single()

                        if (newErr) {
                            toast.error("Erro ao criar paciente: " + newErr.message)
                        } else if (newP) {
                            const newPatient = { id: newP.id, name: newP.name, phone: quickPhone }
                            setLocalPatients(prev => [...prev, newPatient])
                            setSelectedPatientId(newPatient.id)
                            setQuickPhone("")
                            toast.success(`Paciente ${newPatient.name} cadastrado!`)
                        }
                    }
                    setIsCreatingPatient(false)
                }
            } else {
                toast.error(result.error)
            }
        } else if (result.data) {
            const newPatient = { id: result.data.id, name: result.data.name, phone: quickPhone }
            setLocalPatients(prev => [...prev, newPatient])
            setSelectedPatientId(newPatient.id)
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
        setIsSaving(true)
        try {
            // Enforce Time Format
            const timeStr = timeInput
            if (timeStr.length !== 5 || !timeStr.includes(':')) {
                MySwal.fire('Erro', 'Horário inválido. Use o formato 08:00', 'error')
                setIsSaving(false)
                return
            }
            formData.set('time', timeStr)
            if (selectedDateVal) {
                formData.set('date', selectedDateVal)
            } else {
                MySwal.fire('Erro', 'Data inválida.', 'error')
                setIsSaving(false)
                return
            }

            let result
            if (isEditMode) {
                formData.append('appointment_id', appointment.id)
                result = await updateAppointment(formData)
            } else {
                result = await createAppointment(formData)
            }

            if ((result as any)?.confirmationRequired) {
                setIsSaving(false)
                const swalRes = await MySwal.fire({
                    title: 'Atenção: Conflito',
                    html: (result as any).message.replace(/\n/g, '<br/>'),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar mesmo assim',
                    cancelButtonText: 'Cancelar',
                    customClass: {
                        confirmButton: 'bg-amber-600 text-white border-none',
                        cancelButton: 'bg-slate-200 text-slate-700'
                    }
                })

                if (swalRes.isConfirmed) {
                    setIsSaving(true)
                    formData.set('force_block_override', 'true')
                    const retryResult = isEditMode
                        ? await updateAppointment(formData)
                        : await createAppointment(formData)

                    if (retryResult?.error) {
                        MySwal.fire('Erro', retryResult.error, 'error')
                    } else {
                        MySwal.fire('Sucesso!', 'Operação concluída com sucesso.', 'success')
                        if (onOpenChange) onOpenChange(false)
                        setInternalOpen(false)
                        router.refresh()
                    }
                }
                return
            }

            if (result?.error) {
                MySwal.fire('Erro', result.error, 'error')
            } else {
                MySwal.fire('Sucesso!', 'Operação concluída com sucesso.', 'success')
                isSuccessRef.current = true
                if (onSuccess) {
                    onSuccess({ date: selectedDateVal, time: timeInput })
                }
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
                router.refresh()
            }
        } catch (err: any) {
            console.error("ExecuteSave Error:", err)
            MySwal.fire('Erro', `Falha na requisição: ${err.message || 'Erro desconhecido'}`, 'error')
        } finally {
            setIsSaving(false)
            setBypassWarning(false)
            formDataRef.current = null
        }
    }

    async function handleSubmit(formData: FormData) {
        const newStatus = formData.get('status') as string
        const oldStatus = appointment?.status

        // Financial Warning: If changing from 'attended' (Finalizado)
        if (oldStatus === 'attended' && newStatus !== 'attended') {
            const result = await MySwal.fire({
                title: 'Atenção: Atendimento Faturado',
                html: `Este atendimento já foi finalizado. O que deseja fazer com o <b>financeiro (Venda/Comissão)</b>?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Mudar e APAGAR recebimento',
                denyButtonText: 'Mudar e MANTER recebimento',
                cancelButtonText: 'Cancelar alteração',
                showDenyButton: true,
                confirmButtonColor: '#ef4444',
                denyButtonColor: '#10b981',
                cancelButtonColor: '#6b7280',
            })

            if (result.isDismissed) return

            if (result.isDenied) {
                formData.append('keep_financial', 'true')
            }
        }

        if (newStatus === 'in_progress' && activeAttendanceId && activeAttendanceId !== appointment?.id) {
            const { checkActiveAttendance } = await import("@/actions/attendance")
            const active = await checkActiveAttendance()
            const pName = active.data?.patient?.name || "Outro Paciente"

            const confirm = await MySwal.fire({
                title: 'Atenção!',
                html: `Você já está atendendo <b>${pName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, iniciar este',
                cancelButtonText: 'Manter anterior',
                confirmButtonColor: '#ff9800',
            })

            if (!confirm.isConfirmed) return

            const { finishAttendance } = await import("@/actions/attendance")
            await finishAttendance(active.data.id, { appointment_id: active.data.id, content: {} }, slug as string)
        }

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

        // Inject Questionnaire Region in Notes if selected
        if (selectedQuestionnaire && selectedQuestionnaire !== 'none') {
            const currentNotes = formData.get('notes') as string || ""
            if (!currentNotes.toLowerCase().includes(selectedQuestionnaire.toLowerCase())) {
                formData.set('notes', (currentNotes + "\n\nQueixa: " + selectedQuestionnaire).trim())
            }
        }

        // Ensure buttons know we are saving (although executeSave handles loading too? No, handleSubmit triggers action)
        // Actually executeSave uses form action logic, so setIsSaving(true) is good?
        // But executeSave is async.
        await executeSave(formData)
    }

    async function handleDelete() {
        if (!appointment?.id) return

        const isBilled = ['billed', 'paid', 'attended', 'completed', 'Concluído', 'Faturado'].includes(appointment.status)

        if (isBilled) {
            const { value: formValues } = await MySwal.fire({
                title: 'Confirmar Exclusão Faturada',
                html: `
                    <div class="text-left space-y-4">
                        <p class="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <strong>Atenção:</strong> Este atendimento já foi faturado. A exclusão afetará os relatórios financeiros.
                        </p>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-600">Sua Senha (Login ou PIN Master)</label>
                            <input id="swal-password" type="password" class="swal2-input !m-0 !w-full" placeholder="Digite sua senha">
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-slate-600">Justificativa da Exclusão</label>
                            <textarea id="swal-justification" class="swal2-textarea !m-0 !w-full" placeholder="Ex: Erro de lançamento / Paciente desistiu e estornou" style="height: 80px"></textarea>
                        </div>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Confirmar Exclusão',
                cancelButtonText: 'Voltar',
                confirmButtonColor: '#ef4444',
                focusConfirm: false,
                preConfirm: () => {
                    const password = (document.getElementById('swal-password') as HTMLInputElement).value
                    const justification = (document.getElementById('swal-justification') as HTMLTextAreaElement).value

                    if (!password) {
                        MySwal.showValidationMessage('A senha é obrigatória')
                        return false
                    }
                    if (!justification || justification.length < 5) {
                        MySwal.showValidationMessage('Justificativa mínima de 5 caracteres')
                        return false
                    }
                    return { password, justification }
                }
            })

            if (!formValues) return

            setIsDeleting(true)
            try {
                const deleteResult = await deleteAppointment(appointment.id, false, formValues.password, formValues.justification)
                if (deleteResult?.error) {
                    if (deleteResult.error === 'PASSWORD_REQUIRED' || deleteResult.error === 'Senha incorreta. Use sua senha de login ou o PIN Master.') {
                        MySwal.fire('Erro de Senha', 'A senha informada está incorreta.', 'error')
                    } else {
                        MySwal.fire('Erro', deleteResult.error, 'error')
                    }
                } else {
                    MySwal.fire('Excluído!', 'O registro financeiro e o agendamento foram removidos.', 'success')
                    if (onOpenChange) onOpenChange(false)
                    setInternalOpen(false)
                    router.refresh()
                }
            } finally {
                setIsDeleting(false)
            }
            return
        }

        const result = await MySwal.fire({
            title: 'Excluir Agendamento',
            text: 'Esta ação é irreversível. Deseja continuar?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
        })

        if (result.isConfirmed) {
            setIsDeleting(true)
            try {
                const deleteResult = await deleteAppointment(appointment.id, false)
                if (deleteResult?.error) {
                    MySwal.fire('Erro', deleteResult.error, 'error')
                } else {
                    MySwal.fire('Excluído!', 'O registro foi removido com sucesso.', 'success')
                    if (onOpenChange) onOpenChange(false)
                    setInternalOpen(false)
                    router.refresh()
                }
            } finally {
                setIsDeleting(false)
            }
        }
    }

    // [NEW] Quick Status Update Handlers
    const handleStatusUpdate = async (newStatus: string) => {
        if (!appointment?.id) return

        setIsSaving(true)
        try {
            const result = await updateAppointmentStatus(appointment.id, newStatus)
            if (result.error) {
                MySwal.fire('Erro', result.error, 'error')
            } else {
                MySwal.fire('Sucesso!', 'Status atualizado com sucesso.', 'success')
                if (onOpenChange) onOpenChange(false)
                setInternalOpen(false)
                router.refresh()
            }
        } finally {
            setIsSaving(false)
        }
    }

    const isOpen = isControlled ? open : internalOpen
    const onChange = isControlled ? onOpenChange : setInternalOpen

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onChange}>
                {!isControlled && (
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            Novo Agendamento
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent
                    className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 transition-all duration-300"
                    onInteractOutside={(e) => {
                        // Prevent Dialog from closing when SweetAlert2 is open on top
                        const target = e.target as HTMLElement
                        if (target?.closest('.swal2-container') || document.querySelector('.swal2-container')) {
                            e.preventDefault()
                        }
                    }}
                    onPointerDownOutside={(e) => {
                        // Same protection for pointer events
                        if (document.querySelector('.swal2-container')) {
                            e.preventDefault()
                        }
                    }}
                >
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
                                        <PopoverContent
                                            className="w-[400px] p-0"
                                        >
                                            <Command shouldFilter={false} className="flex flex-col">
                                                <CommandInput
                                                    placeholder="Buscar paciente..."
                                                    onValueChange={setPatientSearch}
                                                    className="border-none focus:ring-0 focus:ring-offset-0 focus:outline-none outline-none ring-0 shadow-none h-12"
                                                />
                                                <CommandList className="max-h-[350px] min-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 pb-12">
                                                    <CommandEmpty />

                                                    {/* Quick Create: Show if user typed 3+ chars */}
                                                    {patientSearch.length >= 3 && (
                                                        <div className="p-3 flex flex-col items-center gap-3 border-b bg-muted/30">
                                                            <p className="text-sm text-muted-foreground">
                                                                {filteredPatients.length === 0
                                                                    ? "Nenhum paciente encontrado."
                                                                    : "Não encontrou? Cadastre agora:"}
                                                            </p>

                                                            <div className="w-full space-y-2">
                                                                <Label className="text-xs">Nome do Paciente</Label>
                                                                <Input
                                                                    value={patientSearch}
                                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                                    placeholder="Nome completo"
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>

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
                                                                Cadastrar Paciente
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <CommandGroup heading="Pacientes">
                                                        {filteredPatients.map((p: any) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={`${p.id} ${p.name}`}
                                                                onSelect={() => {
                                                                    setSelectedPatientId(p.id)
                                                                    setPatientSearch("")
                                                                    setOpenCombobox(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4 shrink-0",
                                                                        selectedPatientId === p.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-semibold truncate">{p.name}</span>
                                                                    {(p as any).phone && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            {formatPhoneDisplay((p as any).phone)}
                                                                            {(p as any).cpf && ` • CPF: ${(p as any).cpf}`}
                                                                        </span>
                                                                    )}
                                                                </div>
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
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
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
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                <SelectItem value="all_clear" className="text-muted-foreground font-medium">-- Selecione --</SelectItem>
                                                {finalProfessionals.map(p => (
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
                                            availableSlots={availableSlots}
                                        />
                                    </div>
                                </div>

                                <div className={cn("grid gap-4", isEditMode && selectedType === 'appointment' ? "grid-cols-2" : "grid-cols-1")}>
                                    <div className="grid gap-2">
                                        <Label htmlFor="location_id">Local</Label>
                                        <Select name="location_id" required value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
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

                                    {isEditMode && selectedType === 'appointment' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="status" className="font-medium">Status</Label>
                                            <Select name="status" defaultValue={appointment?.status || 'scheduled'}>
                                                <SelectTrigger className={cn(
                                                    "w-full font-medium",
                                                    appointment?.status === 'attended' || appointment?.status === 'completed' ? "text-green-600 bg-green-50 border-green-200" :
                                                        appointment?.status === 'cancelled' ? "text-red-600 bg-red-50 border-red-200" :
                                                            ""
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                                    <SelectItem value="checked_in">Aguardando (Chegou)</SelectItem>
                                                    <SelectItem value="in_progress">Em Atendimento</SelectItem>
                                                    <SelectItem value="attended">Atendido</SelectItem>
                                                    <SelectItem value="billed">Faturado / Recebido</SelectItem>
                                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                                    <SelectItem value="no_show">Faltou</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Observações</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Ex: Coluna Lombar e Ombro (dispara questionários automaticamente)"
                                        defaultValue={defaultNotes}
                                        className="min-h-[80px]"
                                    />
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
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                <SelectItem value="default">Padrão / Particular</SelectItem>
                                                {priceTables.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="grid gap-2 flex-1">
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
                                                <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                    <SelectItem value="null">Selecione...</SelectItem>
                                                    {paymentMethods.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name.replace(/\(1x\)/i, '').trim()}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="payment_method_id" value={paymentMethodId || ""} />
                                        </div>

                                        {(() => {
                                            const method = paymentMethods.find(m => m.id === paymentMethodId)
                                            const isCredit = method?.name.toLowerCase().includes('crédito') || method?.name.toLowerCase().includes('credit')
                                            if (isCredit) {
                                                return (
                                                    <div className="grid gap-2 w-[100px] animate-in slide-in-from-right-2">
                                                        <Label htmlFor="installments">Parcelas</Label>
                                                        <Select
                                                            value={String(installments)}
                                                            onValueChange={(v) => setInstallments(Number(v))}
                                                            name="installments"
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
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

                                    {/* Card Brand Selection (appears for Debit/Credit) */}
                                    {(() => {
                                        const method = paymentMethods.find(m => m.id === paymentMethodId)
                                        const methodName = method?.name.toLowerCase() || ''
                                        const methodSlug = method?.slug?.toLowerCase() || ''
                                        const isCard = methodName.includes('débito') || methodName.includes('crédito') ||
                                            methodName.includes('debit') || methodName.includes('credit') ||
                                            methodSlug.includes('debit') || methodSlug.includes('credit')

                                        if (isCard && cardBrands.length > 0) {
                                            return (
                                                <div className="space-y-4 animate-in fade-in">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="card_brand">Bandeira do Cartão</Label>
                                                        <Select
                                                            value={cardBrandId || "null"}
                                                            onValueChange={(val) => setCardBrandId(val === "null" ? null : val)}
                                                            name="card_brand_id"
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione a bandeira..." />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                                <SelectItem value="null">Selecione...</SelectItem>
                                                                {cardBrands.map(brand => (
                                                                    <SelectItem key={brand.id} value={brand.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                                                                            {brand.name}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name="card_brand_id" value={cardBrandId || ""} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="acquirer_id">Maquininha</Label>
                                                            {bestFeeSuggestion && selectedAcquirerId !== bestFeeSuggestion.acquirer_id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedAcquirerId(bestFeeSuggestion.acquirer_id)}
                                                                    className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full hover:bg-green-200 transition-colors uppercase font-bold flex items-center gap-1 border border-green-200"
                                                                >
                                                                    ✨ Sugerido: {bestFeeSuggestion.acquirer?.name} ({bestFeeSuggestion.fee_percent}%)
                                                                </button>
                                                            )}
                                                        </div>
                                                        <Select
                                                            value={selectedAcquirerId || "null"}
                                                            onValueChange={(val) => setSelectedAcquirerId(val === "null" ? null : val)}
                                                            name="acquirer_id"
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione a máquina..." />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                                <SelectItem value="null">Automático / Melhor Taxa</SelectItem>
                                                                {acquirers.map(acq => (
                                                                    <SelectItem key={acq.id} value={acq.id}>
                                                                        {acq.name} (D+{acq.receipt_days})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name="acquirer_id" value={selectedAcquirerId || ""} />
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}

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

                                    {/* Net Value Display (after fees) */}
                                    {appliedFee > 0 && (
                                        <div className="space-y-2 animate-in fade-in">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-amber-600 flex items-center gap-1">
                                                    <span className="text-xs">⚠️</span>
                                                    Taxa {currentCalculation.acquirerName ? `(${currentCalculation.acquirerName})` : ''} - {currentCalculation.feePercent}%
                                                </span>
                                                <span className="font-medium text-amber-600">
                                                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appliedFee)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                                                <span className="text-sm font-medium text-green-700">Valor Líquido (você recebe)</span>
                                                <span className="font-bold text-2xl text-green-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netValue)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <DialogFooter className="p-6 pt-3 border-t mt-0 bg-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0">
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    {/* Quick Attendance Actions (Step 1) - SHOW FIRST ON MOBILE */}
                                    {isEditMode && step === 1 && (
                                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 h-10 sm:h-8"
                                                onClick={() => {
                                                    const pId = appointment.patient_id || appointment.patients?.id
                                                    if (pId && slug) router.push(`/dashboard/${slug}/patients/${pId}`)
                                                    else if (pId) router.push(`/dashboard/access-fisioterapia/patients/${pId}`)
                                                    else MySwal.fire('Erro', "Paciente não encontrado", 'error')
                                                }}
                                            >
                                                <FileText className="h-4 w-4 mr-2 sm:mr-0" />
                                                <span className="sm:hidden text-xs font-semibold">Prontuário</span>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 sm:flex-none text-green-600 hover:text-green-700 hover:bg-green-50 border-green-100 h-10 sm:h-8"
                                                        disabled={isSendingWhatsApp}
                                                    >
                                                        {isSendingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2 sm:mr-0" />}
                                                        <span className="sm:hidden text-xs font-semibold">WhatsApp</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[280px] sm:w-[240px]">
                                                    <DropdownMenuLabel className="text-xs">Enviar Mensagem</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('appointment_confirmation_immediate')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <Plus className="h-4 w-4 text-slate-500" />
                                                        <span className="flex-1">Boas-vindas (Imediato)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('appointment_confirmation')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <Clock className="h-4 w-4 text-blue-600" />
                                                        <span className="flex-1">Confirmação (24h)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('questionnaire_12h')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <FileText className="h-4 w-4 text-purple-600" />
                                                        <span className="flex-1">Questionários (12h)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('appointment_confirmation_8h')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                                        <span className="flex-1">Reforço Confirmação (8h)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('appointment_confirmation_2h')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        <span className="flex-1">Último Chamado (2h)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendWhatsApp('appointment_reminder_confirmed_2h')} className="cursor-pointer gap-3 py-3 sm:py-2">
                                                        <MessageSquare className="h-4 w-4 text-green-600" />
                                                        <span className="flex-1">Lembrete Confirmado (2h)</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            const { value: text } = await MySwal.fire({
                                                                title: 'Escrever Mensagem WhatsApp',
                                                                input: 'textarea',
                                                                inputLabel: 'Sua mensagem para o paciente',
                                                                inputPlaceholder: 'Olá, tudo bem? Gostaríamos de...',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Enviar',
                                                                cancelButtonText: 'Cancelar',
                                                                confirmButtonColor: '#22c55e',
                                                                inputAttributes: {
                                                                    'aria-label': 'Digite sua mensagem'
                                                                },
                                                                inputValidator: (value) => {
                                                                    if (!value) return 'Você precisa escrever algo!'
                                                                }
                                                            })

                                                            if (text) {
                                                                handleSendWhatsApp('manual' as any, text)
                                                            }
                                                        }}
                                                        className="cursor-pointer gap-3 py-3 sm:py-2 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 font-medium"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        <span className="flex-1">Escrever Mensagem...</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2">Outros Modelos</DropdownMenuLabel>
                                                    {templates
                                                        .filter(t => t.trigger_type === 'manual' || t.trigger_type === 'post_attendance')
                                                        .map(t => (
                                                            <DropdownMenuItem key={t.id} onClick={() => handleSendWhatsApp(t.trigger_type)} className="cursor-pointer py-3 sm:py-2">
                                                                {t.title}
                                                            </DropdownMenuItem>
                                                        ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}

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
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto border border-red-100 h-10 sm:h-9"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    {step === 1 ? (
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto gap-2"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                // Basic Validation
                                                if (!selectedPatientId || !selectedServiceId || !selectedProfessionalId || !selectedDateVal || !timeInput) {
                                                    MySwal.fire({
                                                        title: 'Campos Obrigatórios',
                                                        text: "Por favor, preencha todos os campos obrigatórios para continuar.",
                                                        icon: 'info',
                                                        confirmButtonColor: '#3b82f6'
                                                    })
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
                                            {isEditMode && appointment?.status !== 'attended' && appointment?.status !== 'completed' && (
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="w-full sm:w-auto text-green-700 border-green-200 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (!paymentMethodId) {
                                                            MySwal.fire('Atenção', "Selecione a Forma de Pagamento.", 'warning')
                                                            return
                                                        }
                                                        const form = document.querySelector('#appointment-form') as HTMLFormElement
                                                        if (form) {
                                                            const formData = new FormData(form)
                                                            formData.set('status', 'attended')
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
                                        MySwal.fire('Erro', "Erro ao processar. Tente novamente.", 'error')
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
