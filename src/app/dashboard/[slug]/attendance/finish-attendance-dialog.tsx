"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, DollarSign, FileText, Calendar as CalendarIcon, Printer, Clock, Sparkles, Loader2, Search, PenTool, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
import { createInvoice, getProducts } from "@/actions/patients" // Re-use logic
import { createAppointment, updateAppointmentStatus, getAvailableSlots } from "@/actions/appointments"
import { getServices } from "@/app/dashboard/[slug]/services/actions" // [LOAD SERVICES]
import { linkPatientToAppointment } from "@/actions/attendance"
import { getPatients } from "@/actions/patients"
import { CurrencyInput } from "@/components/ui/currency-input"
import { getReportTemplates } from "@/app/dashboard/[slug]/settings/reports/actions"
import { getOrganizationSettings } from "@/app/dashboard/[slug]/settings/organization/actions"
import { ReportViewer } from "@/components/reports/ReportViewer"
import { PhysicalAssessmentReportPrint } from '@/features/forms/pbe/components/physical-assessment-report-print'
import { BiomechanicsReport } from "@/features/forms/pbe/components/biomechanics-report"
import { SmartReportPrint } from '@/features/forms/pbe/components/smart-report-print'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { sendMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { generatePortalToken } from "@/app/dashboard/[slug]/patients/actions/voiding-diary"

interface FinishAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    patient: any
    recordId?: string
    onConfirm: () => void
    paymentMethods?: any[]
    professionals?: any[]
}

export function FinishAttendanceDialog({ open, onOpenChange, appointment, patient, recordId, onConfirm, paymentMethods = [], professionals = [] }: FinishAttendanceDialogProps) {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string
    const [step, setStep] = useState<"finance" | "report" | "schedule">("finance")

    // Org Settings
    const [orgSettings, setOrgSettings] = useState<any>(null)

    // Report State
    const [templates, setTemplates] = useState<any[]>([])
    const [viewingTemplate, setViewingTemplate] = useState<any>(null)
    const [viewingPhysicalReport, setViewingPhysicalReport] = useState<any>(null) // [NEW]
    const [viewingBiomechanicsReport, setViewingBiomechanicsReport] = useState<any>(null) // [NEW]
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [isLinking, setIsLinking] = useState(false)
    const [patientSearch, setPatientSearch] = useState("")
    const [patientResults, setPatientResults] = useState<any[]>([])
    const [isSearchingPatients, setIsSearchingPatients] = useState(false)
    const [isSendingMsg, setIsSendingMsg] = useState<string | null>(null)

    const [fullRecord, setFullRecord] = useState<any>(null)

    // Fetch Record Data if recordId exists
    useEffect(() => {
        if (!recordId) return
        const fetchRecord = async () => {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data } = await supabase.from('patient_records').select('*').eq('id', recordId).single()
            if (data) setFullRecord(data)
        }
        fetchRecord()
    }, [recordId])

    // Fetch Templates & Org Settings on Mount
    useEffect(() => {
        getReportTemplates().then(setTemplates)
        getOrganizationSettings().then(data => {
            if (data?.org) setOrgSettings(data.org)
        })
    }, [])

    // [NEW] Combined Templates (Standard + Dynamic Physical Report)
    const availableReports = useMemo(() => {
        const list = [...templates]
        // Check if we have a Physical Assessment Report in the record
        if (fullRecord?.content?.aiReport || fullRecord?.content?.report?.clinical_reasoning) {
            const isSmart = !!fullRecord?.content?.report?.clinical_reasoning
            list.unshift({
                id: isSmart ? 'smart-pbe-report' : 'physical-assessment-report',
                title: isSmart ? 'Relatório IA (PBE) - Smart' : 'Relatório de Avaliação Física',
                type: 'physical_assessment', // Re-use generic type or create new? Let's use physical_assessment and Handle in Render
                is_dynamic: true,
                content: isSmart ? fullRecord.content.report : fullRecord.content.aiReport,
                is_smart: isSmart
            })
        }
        // Check for Biomechanics Data
        if (fullRecord?.content?.shoeSize !== undefined || fullRecord?.content?.postural?.shoeSize !== undefined) {
            list.unshift({
                id: 'biomechanics-report',
                title: 'Relatório Biomecânico',
                type: 'biomechanics_assessment', // Special type
                is_dynamic: true,
                content: fullRecord.content // Pass full content
            })
        }
        return list
    }, [templates, fullRecord])

    const handleReportSelect = (template: any) => {
        if (template.type === 'physical_assessment') {
            if (template.is_smart) {
                // For now, re-use JSON viewer or a new Smart Report Print component?
                // The user said "report page is not working well".
                // Let's assume we need a proper viewer. For now, let's allow re-viewing the JSON structure via a Generic Viewer or the Dialog.
                // Actually, we can reuse the `viewingPhysicalReport` state but we need a component that handles the PBE structure.
                // Let's pass the IS_SMART flag to the component or create a new state.
                // Simpler: Just render the JSON in a nice way if no dedicated component exists yet.
                // OR, since `PhysicalAssessmentReportPrint` expects specific structure, we might break it.
                // Let's Create a `SmartReportPrint` component or adapt.
                // For this step, I will just set the state and let valid Physical reports work, 
                // but for Smart reports we might need to update `PhysicalAssessmentReportPrint`.
                setViewingPhysicalReport(template.content)
            } else {
                setViewingPhysicalReport(template.content)
            }
        } else if (template.type === 'biomechanics_assessment') {
            setViewingBiomechanicsReport(template.content)
        } else {
            setViewingTemplate(template)
        }
    }

    // Finance State
    const [price, setPrice] = useState<number>(appointment.original_price || appointment.price || 0)
    const [discount, setDiscount] = useState<number>(appointment.discount || 0)
    const [addition, setAddition] = useState<number>(appointment.addition || 0)
    const [paymentMethod, setPaymentMethod] = useState<string>("pix")
    const [isPaid, setIsPaid] = useState(false)
    const [isSavingFinance, setIsSavingFinance] = useState(false)
    const [installments, setInstallments] = useState(1)
    const [cardBrandId, setCardBrandId] = useState<string | null>(null)
    const [cardBrands, setCardBrands] = useState<any[]>([])
    const [paymentFees, setPaymentFees] = useState<any[]>([])
    const [acquirers, setAcquirers] = useState<any[]>([])
    const [selectedAcquirerId, setSelectedAcquirerId] = useState<string | null>(null)

    // [NEW] Holiday State
    const [holidays, setHolidays] = useState<any[]>([])

    // Fetch card brands, payment fees, acquirers, HOLIDAYS, SERVICE LINKS, and PROFESSIONALS if missing
    const [serviceLinks, setServiceLinks] = useState<any[]>([])

    useEffect(() => {
        const fetchPaymentData = async () => {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const [brandsResult, feesResult, acquirersResult, holidaysResult, sLinksRes, proRes] = await Promise.all([
                supabase.from('card_brands').select('*').eq('active', true).order('name'),
                supabase.from('payment_method_fees').select(`
                    *,
                    card_brand:card_brands(id, name, slug),
                    acquirer:payment_acquirers(id, name, receipt_days)
                `).order('method').order('installments'),
                supabase.from('payment_acquirers').select('*').eq('active', true).order('name'),
                supabase.from('holidays' as any).select('date, name').eq('is_mandatory', true),
                supabase.from('service_professionals').select('service_id, profile_id'),
                // If professionals prop is empty, fetch them here
                professionals.length === 0 ? supabase.from('profiles').select('id, full_name').eq('organization_id', appointment.organization_id).order('full_name') : Promise.resolve({ data: null })
            ])

            if (brandsResult.data) setCardBrands(brandsResult.data)
            if (feesResult.data) setPaymentFees(feesResult.data)
            if (acquirersResult.data) setAcquirers(acquirersResult.data)
            if (holidaysResult.data) setHolidays(holidaysResult.data)
            if (sLinksRes.data) setServiceLinks(sLinksRes.data)

            // [FIX] Update professionals if missing
            if (proRes.data && professionals.length === 0) {
                // We can't update props, but we can have local state? 
                // Actually relying on parent is better, but as fallback:
                // We need a local state for professionals to support the fallback.
                // Ideally parent passes it. For now, let's just cheat and use a ref or local state if we want to fix it strictly here.
                // But wait, `professionals` is a prop. I can't write to it.
                // I'll add `internalProfessionals` state.
            }
        }
        fetchPaymentData()
    }, [])

    // [FIX] Local Professionals State to handle missing prop
    const [internalProfessionals, setInternalProfessionals] = useState<any[]>([])

    useEffect(() => {
        const filterAndSet = (list: any[]) => {
            const filtered = list.filter(p =>
                !p.full_name?.toLowerCase().includes('tester') &&
                !p.full_name?.toLowerCase().includes('teste')
            )
            // Ensure current professional is included
            const currentProId = appointment.professional_id
            if (currentProId && !filtered.find(p => p.id === currentProId)) {
                const originalPro = list.find(p => p.id === currentProId)
                if (originalPro) filtered.push(originalPro)
            }
            setInternalProfessionals(filtered)
        }

        if (professionals.length > 0) {
            filterAndSet(professionals)
        } else {
            // Fallback fetch
            const fetchPros = async () => {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data } = await supabase.from('profiles')
                    .select('id, full_name, organization_id')
                    .eq('organization_id', appointment.organization_id || patient.organization_id)
                    .order('full_name')

                if (data) filterAndSet(data)
            }
            fetchPros()
        }
    }, [professionals, appointment.organization_id, appointment.professional_id])

    // Schedule State
    const [returnDate, setReturnDate] = useState<Date | undefined>(undefined)
    const [returnTime, setReturnTime] = useState("")

    // [NEW] Holiday Check for Return Scheduling
    const holidayWarning = useMemo(() => {
        if (!returnDate) return null
        const dateStr = format(returnDate, 'yyyy-MM-dd')
        return holidays.find(h => h.date === dateStr)
    }, [returnDate, holidays])
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(appointment.professional_id)
    const [selectedServiceId, setSelectedServiceId] = useState<string>(appointment.service_id || "")
    const [services, setServices] = useState<any[]>([])
    const [referralReason, setReferralReason] = useState("")
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)

    // Products State
    const [products, setProducts] = useState<any[]>([])
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>("")

    // Fetch Products
    useEffect(() => {
        getProducts().then(setProducts)
        getServices(slug).then(data => {
            if (data) setServices(data.filter((s: any) => s.active))
        })
    }, [])

    // Computed Total
    const totalValue = useMemo(() => {
        const productsTotal = selectedProducts.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
        return Number(price) - Number(discount) + Number(addition) + productsTotal
    }, [price, discount, addition, selectedProducts])

    const handleAddProduct = () => {
        if (!selectedProductId) return
        const product = products.find(p => p.id === selectedProductId)
        if (!product) return

        setSelectedProducts(prev => {
            const existing = prev.find(p => p.productId === product.id)
            if (existing) {
                return prev.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p)
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice: product.base_price,
                costPrice: product.cost_price || 0
            }]
        })
        setSelectedProductId("")
    }

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId))
    }

    // [NEW] Local state for service if missing or generic from appointment
    const [currentServiceId, setCurrentServiceId] = useState<string>(() => {
        const name = appointment.services?.name?.toLowerCase() || ""
        const notes = appointment.notes?.toLowerCase() || ""
        if (!appointment.service_id || name === 'consulta' || name.includes('definir') || notes.includes('definir')) {
            return ""
        }
        return appointment.service_id
    })

    // [NEW] Auto-update price when service changes in finance step
    useEffect(() => {
        if (currentServiceId && services.length > 0) {
            const selected = services.find(s => s.id === currentServiceId)
            if (selected && selected.price !== undefined) {
                setPrice(selected.price)
            }
        }
    }, [currentServiceId, services])

    // Reset on Open
    useEffect(() => {
        if (open) {
            setStep("finance")
            setPrice(appointment.original_price || appointment.price || 0)
            setDiscount(appointment.discount || 0)
            setAddition(appointment.addition || 0)
            setReturnDate(undefined)
            setAvailableSlots([])
            setReturnTime("")
            setSelectedProfessionalId(appointment.professional_id)
            setSelectedServiceId(appointment.service_id || "")
            setCurrentServiceId(appointment.service_id || "")

            // [NEW] Reset linking state
            setSelectedPatient(null)
            setPatientSearch("")
            setPatientResults([])
        }
    }, [open])

    // [NEW] Automatic IWGDF Rescheduling Alert
    useEffect(() => {
        if (open && step === 'schedule' && fullRecord?.content?.classification?.iwgdfLevel) {
            const iwgdf = Number(fullRecord.content.classification.iwgdfLevel);
            if (iwgdf > 0 && !returnDate) {
                let monthsToAdd = 0;
                if (iwgdf === 1) monthsToAdd = 6;
                else if (iwgdf === 2) monthsToAdd = 3;
                else if (iwgdf === 3) monthsToAdd = 1;

                if (monthsToAdd > 0) {
                    const futureDate = new Date();
                    futureDate.setMonth(futureDate.getMonth() + monthsToAdd);
                    setReturnDate(futureDate);
                    toast.info(`Retorno recomendado p/ ${monthsToAdd} mes(es) (IWGDF Nível ${iwgdf}). Verifique disponibilidade na agenda!`, {
                        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                        duration: 5000
                    });
                }
            }
        }
    }, [open, step, fullRecord, returnDate]);

    // [NEW] Debounced Patient Search
    useEffect(() => {
        if (!patientSearch || patientSearch.length < 2) {
            setPatientResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsSearchingPatients(true)
            try {
                const res = await getPatients({ query: patientSearch, slug, limit: 10 })
                setPatientResults(res.data || [])
            } finally {
                setIsSearchingPatients(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [patientSearch])

    const handleLinkPatient = async (p: any) => {
        setIsLinking(true)
        try {
            const res = await linkPatientToAppointment(appointment.id, p.id)
            if (res.success) {
                setSelectedPatient(p)
                toast.success(`Atendimento vinculado a ${p.name}`)
                router.refresh()
            } else {
                toast.error("Erro ao vincular: " + res.msg)
            }
        } finally {
            setIsLinking(false)
        }
    }

    // Fetch Slots when Date or Professional Changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!returnDate || !selectedProfessionalId) return
            setIsLoadingSlots(true)
            try {
                const dateStr = format(returnDate, 'yyyy-MM-dd')
                const slots = await getAvailableSlots(selectedProfessionalId, dateStr, selectedServiceId, appointment.location_id)
                setAvailableSlots(slots)
            } catch (e) {
                console.error(e)
                toast.error("Erro ao buscar horários")
            } finally {
                setIsLoadingSlots(false)
            }
        }
        fetchSlots()
    }, [returnDate, selectedProfessionalId])


    // Check if Method is Credit Card or Debit Card
    const isCardPayment = useMemo(() => {
        const method = paymentMethods.find(m => m.id === paymentMethod) || paymentMethods.find(m => m.slug === paymentMethod)
        if (!method) return paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
        const lowerName = (method.slug || method.name || "").toLowerCase()
        return lowerName.includes('crédito') || lowerName.includes('débito') || lowerName.includes('credit') || lowerName.includes('debit') || method.slug === 'credit_card' || method.slug === 'debit_card'
    }, [paymentMethod, paymentMethods])

    const isCreditCard = useMemo(() => {
        const method = paymentMethods.find(m => m.id === paymentMethod) || paymentMethods.find(m => m.slug === paymentMethod)
        if (!method) return paymentMethod === 'credit_card'
        const lowerName = (method.slug || method.name || "").toLowerCase()
        return lowerName.includes('crédito') || lowerName.includes('credit') || method.slug === 'credit_card'
    }, [paymentMethod, paymentMethods])

    // Get Suggestion for Net Value
    const netValueCalculation = useMemo(() => {
        if (!isCardPayment || !cardBrandId) return null

        const method = paymentMethods.find(m => m.id === paymentMethod) || paymentMethods.find(m => m.slug === paymentMethod)
        const methodSlugRaw = (method?.slug || method?.name || "").toLowerCase()
        let methodType = ''
        if (methodSlugRaw.includes('débito') || methodSlugRaw.includes('debit')) methodType = 'debit_card'
        else if (methodSlugRaw.includes('crédito') || methodSlugRaw.includes('credit')) methodType = 'credit_card'

        if (!methodType) return null

        const options = paymentFees.filter((f: any) =>
            f.method === methodType &&
            f.card_brand_id === cardBrandId &&
            f.installments === installments
        )

        if (options.length === 0) return null

        const best = options.sort((a: any, b: any) => {
            // Compare total cost: (Percentage + Fixed)
            const costA = (totalValue * (a.fee_percent / 100)) + (a.fee_fixed || 0)
            const costB = (totalValue * (b.fee_percent / 100)) + (b.fee_fixed || 0)
            return costA - costB
        })[0]

        const feeAmount = (totalValue * (best.fee_percent / 100)) + (best.fee_fixed || 0)
        return {
            net: totalValue - feeAmount,
            feePercent: best.fee_percent,
            feeFixed: best.fee_fixed || 0,
            acquirerName: best.acquirer?.name,
            acquirerId: best.acquirer_id
        }
    }, [isCardPayment, cardBrandId, paymentMethod, paymentMethods, installments, paymentFees, totalValue])

    // --- Actions ---

    const handleSaveFinance = async () => {
        // [NEW] Validate Service Selection if it was missing
        if (!currentServiceId) {
            toast.error("Por favor, selecione o serviço realizado.")
            return
        }

        setIsSavingFinance(true)
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()

            // [NEW] Guard for Quick Attendance
            if (!patient.id) {
                toast.error("Para gerar faturamento, primeiro vincule um paciente a este atendimento.")
                setIsSavingFinance(false)
                return
            }

            // [FIX] Update Appointment with Selected Service and recalculate end_time
            // This ensures the appointment card on the schedule has the correct duration
            const selectedService = services.find((s: any) => s.id === currentServiceId)
            const serviceDuration = selectedService?.duration || 45 // minutes

            const updatePayload: any = {}
            if (currentServiceId !== appointment.service_id) {
                updatePayload.service_id = currentServiceId
            }
            // Always recalculate end_time based on service duration (fixes phantom appointments with 0 or default duration)
            if (appointment.start_time) {
                const startTime = new Date(appointment.start_time)
                const newEndTime = new Date(startTime.getTime() + serviceDuration * 60000)
                updatePayload.end_time = newEndTime.toISOString()
            }

            if (Object.keys(updatePayload).length > 0) {
                const { error: updateApptError } = await supabase
                    .from('appointments')
                    .update(updatePayload)
                    .eq('id', appointment.id)

                if (updateApptError) {
                    console.error("Error updating appointment on finish:", updateApptError)
                }
            }

            // [NEW] Fee validation check - ONLY if actually paying now
            if (isPaid && isCardPayment && cardBrandId) {
                if (!netValueCalculation) {
                    const confirmNoFee = await Swal.fire({
                        title: 'Taxa não configurada!',
                        text: 'Não encontramos uma taxa cadastrada para esta bandeira/parcelamento. Deseja prosseguir com taxa 0% ou revisar as configurações?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Prosseguir (Taxa 0%)',
                        cancelButtonText: 'Revisar Agora',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                    })

                    if (!confirmNoFee.isConfirmed) {
                        setIsSavingFinance(false)
                        return
                    }
                }
            }

            const res = await createInvoice(
                patient.id,
                [appointment.id],
                totalValue,
                isPaid ? paymentMethod : 'pending',
                new Date().toISOString(),
                installments,
                netValueCalculation?.feePercent || 0,
                selectedProducts,
                isPaid ? 'paid' : 'pending',
                slug,
                cardBrandId,
                netValueCalculation?.acquirerId,
                Number(discount),
                Number(addition)
            )

            if (res.error) {
                // If the error is only that an invoice already exists, we can still move forward
                if (res.error.includes('Já existe uma fatura') || res.error.includes('duplicate key')) {
                    toast.info("Este atendimento já possui uma fatura vinculada.")
                    await updateAppointmentStatus(appointment.id, 'attended', undefined, slug)
                    setStep("report")
                    return
                }
                toast.error(res.error)
                return
            }

            if (isPaid) {
                toast.success("Pagamento registrado!")
            } else {
                toast.success("Fatura gerada em aberto!")
            }

            // [NEW] Update status immediately to avoid floating 'in_attendance' states
            await updateAppointmentStatus(appointment.id, 'attended', undefined, slug)

            setStep("report")
        } catch (e) {
            toast.error("Erro ao salvar financeiro")
        } finally {
            setIsSavingFinance(false)
        }
    }

    const handleScheduleReturn = async () => {
        if (!returnDate || !returnTime) {
            toast.error("Selecione data e horário para o retorno")
            return
        }

        setIsScheduling(true)
        try {
            // Construct Date + Time
            const dateStr = format(returnDate, 'yyyy-MM-dd')
            const startDateTime = new Date(`${dateStr}T${returnTime}:00`)
            // endDateTime moved down

            // Construct FormData for Server Action
            const formData = new FormData()
            formData.append('patient_id', patient.id)
            formData.append('professional_id', selectedProfessionalId)
            if (appointment.location_id) formData.append('location_id', appointment.location_id)
            if (selectedServiceId) formData.append('service_id', selectedServiceId)

            formData.append('date', dateStr)
            formData.append('time', returnTime)

            // [NEW] Referral Reason
            if (selectedProfessionalId !== appointment.professional_id && referralReason) {
                formData.append('referral_reason', referralReason)
            }

            formData.append('start_time', startDateTime.toISOString())

            // Calculate End Time based on Service Duration
            const serviceDuration = services.find(s => s.id === selectedServiceId)?.duration || 45
            const endDateTime = new Date(startDateTime.getTime() + serviceDuration * 60000)

            formData.append('end_time', endDateTime.toISOString())
            formData.append('notes', "Retorno agendado na finalização")
            formData.append('type', 'appointment')
            // Default recurring false
            formData.append('is_recurring', 'false')

            const res = await createAppointment(formData) as any

            if (res.error) {
                toast.error(res.error)
            } else if (res.confirmationRequired) {
                // [NEW] Handle Holidays and Conflicts with SweetAlert
                const result = await MySwal.fire({
                    title: 'Confirmação Necessária',
                    html: `<div class="text-left text-sm whitespace-pre-line">${res.message}</div>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar Agendamento',
                    cancelButtonText: 'Revisar Horário',
                    confirmButtonColor: '#2563eb',
                    cancelButtonColor: '#64748b'
                })

                if (result.isConfirmed) {
                    formData.set('force_block_override', 'true')
                    const retryRes = await createAppointment(formData) as any
                    if (retryRes.error) {
                        toast.error(retryRes.error)
                    } else {
                        toast.success("Atendimento agendado!")
                        await onConfirm()
                        onOpenChange(false)
                    }
                }
            } else {
                toast.success("Atendimento agendado!")
                await onConfirm() // Finalize everything
                onOpenChange(false)
            }
        } catch (e) {
            toast.error("Erro ao agendar retorno")
        } finally {
            setIsScheduling(false)
        }
    }

    const handleSkipSchedule = async () => {
        await onConfirm()
        onOpenChange(false)
    }

    const handleSendWhatsapp = async (report: any) => {
        const pPhone = patient.phone?.replace(/\D/g, '')
        if (!pPhone) {
            toast.error("Paciente sem telefone cadastrado.")
            return
        }

        setIsSendingMsg(report.id)
        try {
            setIsSendingMsg(report.id)

            // [NEW] Generate Portal Link for Patient
            let portalLink = ""
            const portalRes = await generatePortalToken(patient.id, slug, { mode: 'attendance', recordId })
            if (portalRes.success && portalRes.url) {
                portalLink = `\n\nAcesse seu relatório completo pelo link abaixo:\n${portalRes.url}`
            }

            const pName = (patient.full_name || patient.name || 'Paciente').split(' ')[0]
            const msg = `Olá ${pName}, aqui está o seu *${report.title}* realizado na ${orgSettings?.name || 'nossa clínica'}.${portalLink}`

            // Call server action
            const result = await sendMessage(pPhone, msg, undefined, {
                patientId: patient.id,
                templateId: report.id,
                type: 'report'
            }, slug)

            if (result.success) {
                toast.success("Relatório enviado via WhatsApp (Z-API)!")
            } else {
                // If it fails, we can fallback to manual if a certain error or just stay with error
                toast.error("Erro no envio automático: " + result.error)
            }
        } catch (e: any) {
            toast.error("Falha ao comunicar com serviço: " + e.message)
        } finally {
            setIsSendingMsg(null)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto"
                    onPointerDownOutside={(e) => {
                        // [FIX] Prevent closing if clicking on the print viewer or SweetAlert overlays
                        const target = e.target as HTMLElement;
                        const isSwal = target?.closest('.swal2-container');
                        if (viewingBiomechanicsReport || viewingPhysicalReport || isSwal) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Finalizar Atendimento</DialogTitle>
                        <DialogDescription>
                            Complete as etapas para encerrar a sessão.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-between mb-8 px-8 relative">
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10" />

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'finance' ? 'text-primary' : (step === 'report' || step === 'schedule' ? 'text-green-600' : 'text-slate-400')}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'finance' ? 'border-primary bg-primary/10' : (step === 'report' || step === 'schedule' ? 'border-green-600 bg-green-100 text-green-600' : 'border-slate-200')}`}>
                                    {step === 'report' || step === 'schedule' ? <CheckCircle className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-semibold">Financeiro</span>
                            </div>

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'report' ? 'text-primary' : (step === 'schedule' ? 'text-green-600' : 'text-slate-400')}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'report' ? 'border-primary bg-primary/10' : (step === 'schedule' ? 'border-green-600 bg-green-100 text-green-600' : 'border-slate-200')}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold">Relatório</span>
                            </div>

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'schedule' ? 'text-primary' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'schedule' ? 'border-primary bg-primary/10' : 'border-slate-200'}`}>
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold">Agendar Retorno</span>
                            </div>
                        </div>

                        {/* [NEW] Quick Attendance Linking Section */}
                        {step === 'finance' && !patient.id && !selectedPatient && (
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 mb-6 space-y-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3 text-indigo-900 mb-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <PenTool className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <Label className="font-black text-sm uppercase tracking-tight">Vincular Paciente</Label>
                                        <span className="text-xs font-medium opacity-70">Este é um atendimento rápido. Vincule a um paciente para gerar o faturamento.</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por nome, CPF ou telefone..."
                                        className="pl-10 h-12 bg-white border-indigo-100 rounded-xl focus-visible:ring-indigo-500"
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                    />
                                    {isSearchingPatients && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                                    )}
                                </div>

                                {patientResults.length > 0 && (
                                    <div className="bg-white rounded-xl border border-indigo-100 shadow-md overflow-hidden max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95">
                                        {patientResults.map(p => (
                                            <button
                                                key={p.id}
                                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b last:border-b-0 text-left"
                                                onClick={() => handleLinkPatient(p)}
                                                disabled={isLinking}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{p.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-medium">{p.cpf || p.phone || 'Sem dados'}</span>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {patientSearch.length >= 2 && !isSearchingPatients && patientResults.length === 0 && (
                                    <div className="text-center py-4 text-xs text-slate-400 font-bold uppercase tracking-widest bg-white rounded-xl border border-dashed border-indigo-200">
                                        Nenhum paciente encontrado.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Finance */}
                        {step === 'finance' && (patient.id || selectedPatient) && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                {/* Service Confirmation Logic */}
                                {(() => {
                                    const name = appointment.services?.name?.toLowerCase() || ""
                                    const notes = appointment.notes?.toLowerCase() || ""
                                    const isGeneric = !appointment.service_id || name === 'consulta' || name.includes('definir') || notes.includes('definir')

                                    if (isGeneric) {
                                        return (
                                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 animate-in shake-in-1 duration-500">
                                                <div className="flex items-center gap-2 text-amber-800 mb-3">
                                                    <Sparkles className="h-5 w-5" />
                                                    <div className="flex flex-col">
                                                        <Label className="font-black text-xs uppercase tracking-tight">Confirmação de Serviço</Label>
                                                        <span className="text-[10px] font-medium opacity-80 italic">O atendimento foi iniciado como "{appointment.services?.name || 'A Definir'}". Por favor, selecione o serviço exato para o faturamento:</span>
                                                    </div>
                                                </div>
                                                <Select value={currentServiceId} onValueChange={setCurrentServiceId}>
                                                    <SelectTrigger className="bg-white border-amber-300 h-11 text-sm font-bold shadow-sm">
                                                        <SelectValue placeholder="Selecione o serviço realizado..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        {services.map(s => (
                                                            <SelectItem key={s.id} value={s.id} className="font-medium">
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Serviço Realizado</Label>
                                            <Select value={currentServiceId} onValueChange={setCurrentServiceId}>
                                                <SelectTrigger className="w-[240px] h-8 text-[11px] font-bold border-none bg-slate-100 hover:bg-slate-200 transition-colors">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[9999]">
                                                    {services.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )
                                })()}

                                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-md border">
                                        <Label className="text-base">Valor Base (Atendimento)</Label>
                                        <CurrencyInput
                                            value={price}
                                            onValueChange={(v) => setPrice(Number(v))}
                                            className="w-32 text-right font-bold text-lg border-0 focus-visible:ring-0 p-0"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-xs text-red-600 font-bold uppercase">Desconto</Label>
                                            <CurrencyInput
                                                value={discount}
                                                onValueChange={(v) => setDiscount(Number(v))}
                                                className="bg-red-50/50 text-red-700 font-medium"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-xs text-blue-600 font-bold uppercase">Taxas / Adicionais</Label>
                                            <CurrencyInput
                                                value={addition}
                                                onValueChange={(v) => setAddition(Number(v))}
                                                className="bg-blue-50/50 text-blue-700 font-medium"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    {/* Products Section */}
                                    <div className="space-y-3 pt-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Produtos / Adicionais</Label>
                                        <div className="flex gap-2">
                                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                                <SelectTrigger className="bg-white flex-1">
                                                    <SelectValue placeholder="Selecione um produto..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.base_price}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" size="sm" onClick={handleAddProduct} disabled={!selectedProductId}>
                                                Adicionar
                                            </Button>
                                        </div>

                                        {selectedProducts.length > 0 && (
                                            <div className="space-y-2 bg-slate-100 p-2 rounded-md">
                                                {selectedProducts.map(item => (
                                                    <div key={item.productId} className="flex flex-col gap-2 p-2 bg-white rounded border shadow-sm">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="font-medium">{item.quantity}x {item.name}</span>
                                                            <button onClick={() => handleRemoveProduct(item.productId)} className="text-red-500 hover:text-red-700">
                                                                &times;
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-muted-foreground">Venda:</span>
                                                                <span className="font-semibold">R$ {item.unitPrice.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground">Custo Unit.:</span>
                                                                <CurrencyInput
                                                                    value={item.costPrice}
                                                                    onValueChange={(val) => {
                                                                        setSelectedProducts(prev => prev.map(p => p.productId === item.productId ? { ...p, costPrice: val || 0 } : p))
                                                                    }}
                                                                    className="w-20 h-6 text-right text-xs"
                                                                    placeholder="0,00"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <span className="font-bold text-lg">Total a Receber</span>
                                        <span className="font-bold text-2xl text-primary">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Status do Pagamento</Label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                onClick={() => setIsPaid(true)}
                                                className={`text-sm font-medium py-2 rounded-md transition-all ${isPaid
                                                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                Receber Agora
                                            </button>
                                            <button
                                                onClick={() => setIsPaid(false)}
                                                className={`text-sm font-medium py-2 rounded-md transition-all ${!isPaid
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                Deixar em Aberto
                                            </button>
                                        </div>
                                    </div>

                                    {isPaid && (
                                        <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
                                            <div className={cn(
                                                "grid gap-4",
                                                isCardPayment ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
                                            )}>
                                                <div className="space-y-2">
                                                    <Label>Forma de Pagamento</Label>
                                                    <Select value={paymentMethod} onValueChange={(val) => {
                                                        setPaymentMethod(val)
                                                        // [AUTO-ADVANCE] To Brand if card
                                                        // Note: In React, we can't easily trigger the next "Select" to open, 
                                                        // but we can ensure the layout is clean.
                                                    }}>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {paymentMethods.length > 0 ? (
                                                                paymentMethods.map(pm => (
                                                                    <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                                                                ))
                                                            ) : (
                                                                <>
                                                                    <SelectItem value="pix">Pix</SelectItem>
                                                                    <SelectItem value="money">Dinheiro</SelectItem>
                                                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                                                </>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {isCardPayment && (
                                                    <>
                                                        <div className="space-y-2 animate-in fade-in">
                                                            <Label>Bandeira do Cartão</Label>
                                                            <Select value={cardBrandId || ""} onValueChange={setCardBrandId}>
                                                                <SelectTrigger className="bg-white">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {cardBrands.map(brand => (
                                                                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {isCreditCard && (
                                                            <div className="space-y-2 animate-in fade-in">
                                                                <Label>Parcelas</Label>
                                                                <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                                                                    <SelectTrigger className="bg-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                                                            <SelectItem key={i} value={String(i)}>{i}x</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {isCardPayment && netValueCalculation && (
                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-1 animate-in zoom-in-95">
                                                    <div className="flex justify-between text-xs text-blue-600 font-bold uppercase tracking-wider">
                                                        <span>Cálculo Líquido ({netValueCalculation.acquirerName})</span>
                                                        <span>
                                                            Taxa: {netValueCalculation.feePercent}%
                                                            {netValueCalculation.feeFixed > 0 && ` + R$ ${netValueCalculation.feeFixed.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-blue-800">Valor a receber:</span>
                                                        <span className="text-lg font-bold text-blue-900">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netValueCalculation.net)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleSaveFinance}
                                    disabled={isSavingFinance}
                                    className={cn(
                                        "w-full font-bold h-12 text-base transition-all",
                                        !isPaid && "bg-slate-700 hover:bg-slate-800 shadow-lg"
                                    )}
                                >
                                    {isSavingFinance ? "Processando..." : (
                                        appointment.invoice_id
                                            ? "Finalizar e Ver Relatório"
                                            : (isPaid ? "Confirmar Pagamento e Finalizar" : "Gerar Fatura e Finalizar Atendimento")
                                    )}
                                </Button>
                                {appointment.invoice_id && (
                                    <p className="text-[10px] text-center text-slate-400 mt-2 italic">
                                        Fatura já vinculada a este atendimento.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 2: Report */}
                        {step === 'report' && (
                            <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center py-2">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <h3 className="text-lg font-bold text-slate-800">Atendimento Registrado!</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availableReports.map(report => (
                                        <div key={report.id} className="flex flex-col gap-1">
                                            <Button
                                                variant="outline"
                                                className="justify-start h-auto py-3 px-4 w-full"
                                                onClick={() => handleReportSelect(report)}
                                            >
                                                <FileText className="w-5 h-5 mr-3 text-blue-600" />
                                                <div className="text-left">
                                                    <div className="font-semibold">{report.title}</div>
                                                    <div className="text-xs text-muted-foreground">Clique para visualizar e imprimir</div>
                                                </div>
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={isSendingMsg === report.id}
                                                    className="h-8 text-[10px] text-green-600 font-bold uppercase tracking-wider hover:bg-green-50 w-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendWhatsapp(report);
                                                    }}
                                                >
                                                    {isSendingMsg === report.id ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                            Enviando...
                                                        </>
                                                    ) : "WhatsApp"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:bg-blue-50 w-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toast.success("Enviando por E-mail...");
                                                    }}
                                                >
                                                    E-mail
                                                </Button>
                                            </div>
                                        </div>
                                    ))}


                                    {availableReports.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg space-y-4">
                                            <p className="text-muted-foreground text-sm">Nenhum relatório gerado neste atendimento.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // Force refresh record
                                                    const fetchRecord = async () => {
                                                        const { createClient } = await import("@/lib/supabase/client")
                                                        const supabase = createClient()
                                                        const { data } = await supabase.from('patient_records').select('*').eq('id', recordId).single()
                                                        if (data) {
                                                            setFullRecord(data)
                                                            toast.success("Lista atualizada!")
                                                        }
                                                    }
                                                    fetchRecord()
                                                }}
                                            >
                                                Atualizar Lista
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mt-2 pt-2 border-t flex justify-center">
                                        <Link href={`/dashboard/${slug}/patients/${patient.id}?tab=evolutions`} target="_blank" className="w-full">
                                            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Ver Histórico (Evoluções)
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setStep('schedule')}>
                                        Pular / Próximo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Schedule */}
                        {step === 'schedule' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="border rounded-md p-2 bg-white shadow-sm flex-1 flex flex-col items-center">
                                        <Calendar
                                            mode="single"
                                            selected={returnDate}
                                            onSelect={setReturnDate}
                                            locale={ptBR}
                                            disabled={(date) => date < new Date()}
                                            className="rounded-md border-0"
                                        />
                                        {holidayWarning && (
                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 font-bold animate-in shake-in-1">
                                                <AlertTriangle className="h-4 w-4 inline mr-1" /> ATENÇÃO: {holidayWarning.name.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-6 flex-1 pt-2">
                                        <div className="space-y-2">
                                            <Label>Horário do Retorno</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <Select value={returnTime} onValueChange={setReturnTime} disabled={!returnDate || isLoadingSlots}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={isLoadingSlots ? "Buscando..." : "Selecione horário"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSlots.length > 0 ? (
                                                            availableSlots.map(time => (
                                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-xs text-center text-muted-foreground">
                                                                {returnDate ? "Sem horários livres" : "Selecione a data"}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Profissional</Label>
                                            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {internalProfessionals.length > 0 ? (
                                                        internalProfessionals.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value={appointment.professional_id}>
                                                            {appointment.profiles?.full_name || 'Profissional Atual'}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Serviço</Label>
                                            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o serviço" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {services
                                                        .filter(s => {
                                                            // [FIX] Filter services based on professional link
                                                            // Check if THIS specific professional has ANY links defined in the junction table
                                                            const professionalHasAnyLinks = serviceLinks.some(link => link.profile_id === selectedProfessionalId)

                                                            // If no links at all are defined for this pro, show all active services (fallback)
                                                            if (!professionalHasAnyLinks) return true

                                                            // Otherwise, show only the ones explicitly linked
                                                            const isLinked = serviceLinks.some(link => link.service_id === s.id && link.profile_id === selectedProfessionalId)
                                                            return isLinked
                                                        })
                                                        .map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                                                    {s.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>


                                        {/* [NEW] Referral Reason */}
                                        {selectedProfessionalId !== appointment.professional_id && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label>Motivo do Encaminhamento</Label>
                                                <Textarea
                                                    value={referralReason}
                                                    onChange={(e) => setReferralReason(e.target.value)}
                                                    placeholder="Descreva o motivo do encaminhamento para o colega..."
                                                    className="h-20"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    O profissional receberá uma notificação com esta mensagem.
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-4 flex flex-col gap-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-slate-200 text-slate-500 hover:bg-slate-50 font-bold h-11"
                                                    onClick={handleSkipSchedule}
                                                >
                                                    Finalizar sem Agendar
                                                </Button>

                                                <Button
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-md"
                                                    onClick={handleScheduleReturn}
                                                    disabled={isScheduling || !returnDate || !returnTime}
                                                >
                                                    {isScheduling ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Agendando...
                                                        </>
                                                    ) : (
                                                        "Confirmar Agendamento"
                                                    )}
                                                </Button>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setStep('report')}
                                                className="w-full mt-2 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                                            >
                                                Voltar para Relatório
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div >
                </DialogContent >
            </Dialog >

            {/* REPORT VIEWER MODAL */}
            {
                viewingTemplate && (
                    <ReportViewer
                        template={viewingTemplate}
                        data={{
                            patient,
                            appointment,
                            professional_name: professionals.find(p => p.id === appointment.professional_id)?.name || 'Profissional',
                            record: {
                                cid: fullRecord?.cid || '',
                                form_data: fullRecord?.content || {}
                            }
                        }}
                        onClose={() => setViewingTemplate(null)}
                    />
                )
            }

            {/* Floating Dialog for Report View */}
            {
                viewingPhysicalReport && (
                    <Dialog open={true} onOpenChange={() => setViewingPhysicalReport(null)}>
                        <DialogContent className="max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
                            <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                                {/* DETECT TYPE BASED ON CONTENT STRUCTURE */}
                                {viewingPhysicalReport.clinical_reasoning ? (
                                    <SmartReportPrint report={viewingPhysicalReport} />
                                ) : (
                                    <PhysicalAssessmentReportPrint report={viewingPhysicalReport} />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )
            }

            {/* [FIX] BIOMECHANICS REPORT - Wrapped in Dialog to restore interaction/scrolling */}
            {
                viewingBiomechanicsReport && (
                    <Dialog open={true} onOpenChange={() => setViewingBiomechanicsReport(null)}>
                        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 gap-0 border-none bg-white overflow-hidden">
                            <BiomechanicsReport
                                open={true}
                                onClose={() => setViewingBiomechanicsReport(null)}
                                data={viewingBiomechanicsReport}
                                patient={patient}
                                organizationName={orgSettings?.name}
                                professional={professionals.find(p => p.id === appointment.professional_id) || professionals[0]}
                                organization={{ address: orgSettings?.address, logo_url: orgSettings?.logo_url, name: orgSettings?.name }}
                            />
                        </DialogContent>
                    </Dialog>
                )
            }
        </>
    )
}
