"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar as BigCalendarComponent } from "@/components/schedule/Calendar"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, UserPlus, ListFilter, Stethoscope, Loader2, Plus, Lock, MapPin, CalendarPlus } from "lucide-react"
import { getPatients } from "@/actions/patients"
import { moveAppointment, deleteAppointment, updateAppointmentStatus } from "@/actions/appointments"
import Link from "next/link"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { ScheduleListView } from "./list-view"
import { AppointmentDialog } from "@/components/schedule/AppointmentDialog"
import { BlockDialog } from "@/components/schedule/BlockDialog"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Views, View } from "react-big-calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ptBR } from "date-fns/locale"
import { format, isToday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { MobileScheduleView } from "./mobile-view"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/hooks/use-sidebar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

interface ScheduleClientProps {
    patients: any[]
    locations: any[]
    services: any[]
    professionals: any[]
    serviceLinks: any[]
    appointments: any[]
    currentUserId?: string
    userRole?: string
    holidays?: any[]
    priceTables?: any[]
    paymentMethods?: any[] // [NEW]
    defaultLocationId?: string | null
}

export default function ScheduleClient({
    appointments: initialAppointments,
    patients,
    locations,
    services,
    professionals,
    serviceLinks,
    holidays,
    priceTables,
    paymentMethods, // [NEW]
    currentUserId,
    userRole,
    defaultLocationId
}: ScheduleClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { slug } = useParams()
    const lastClickRef = useRef<{ time: number, start: number } | null>(null)
    const lastEventClickRef = useRef<{ time: number, id: string | null } | null>(null)
    const lastActionTimeRef = useRef<number>(0)
    const isActionInProgress = useRef<boolean>(false)

    // [MODIFIED] Date State is now URL-driven
    const dateParam = searchParams.get('date')
    const date = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()

    // Helper to set date (pushes to URL)
    const setDate = (newDate: Date | undefined) => {
        if (!newDate) return
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', newDate.toISOString().split('T')[0])
        router.push(`/dashboard/${slug}/schedule?${params.toString()}`)
    }

    const [view, setView] = useState<View>(Views.WEEK)
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
    const [listStartDate, setListStartDate] = useState<Date>(startOfMonth(new Date()))
    const [listEndDate, setListEndDate] = useState<Date>(endOfMonth(new Date()))
    const [showWeekends, setShowWeekends] = useState(false)
    const [visualStep, setVisualStep] = useState<number | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleStepChange = (val: string) => {
        const n = Number(val)
        setVisualStep(n)
        localStorage.setItem('schedule_interval', val)
    }

    // Load persisted step
    useEffect(() => {
        const saved = localStorage.getItem('schedule_interval')
        if (saved) setVisualStep(Number(saved))
    }, [])

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        // [NEW] Supabase Realtime Subscription
        const supabase = createClient()
        const channel = supabase
            .channel('schedule_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments'
                    // We could filter by organization_id here if we had it directly, 
                    // but the router.refresh() will handle RLS on the server side correctly.
                },
                (payload) => {
                    console.log('Realtime update received:', payload)
                    router.refresh()
                    setLastUpdate(new Date())
                    toast.success("Agenda atualizada!", {
                        description: "Um novo agendamento ou alteração foi detectado.",
                        duration: 3000
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, slug])

    // Dialog State
    const [isApptDialogOpen, setIsApptDialogOpen] = useState(false)
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date, resourceId?: string } | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const handleSelectSlot = ({ start, end, resourceId, action, allDay }: any) => {
        // [USER REQUEST] Disable double-click creation in all-day area (header blocks)
        if (allDay) return

        const now = Date.now()
        // [REFINE] Sensitivity to 600ms for better user experience
        const isManualDoubleClick = lastClickRef.current &&
            (now - lastClickRef.current.time < 600) &&
            (Math.abs(lastClickRef.current.start - start.getTime()) < 1000);

        console.log('[SLOT_INTERACTION]', { action, isManualDoubleClick, delta: lastClickRef.current ? now - lastClickRef.current.time : 'N/A' })

        lastClickRef.current = { time: now, start: start.getTime() }

        // [ESSENTIAL] Always set selection so the grid highlights on the first click
        setSelectedSlot({ start, end, resourceId })
        setSelectedAppointment(null)

        // [USER REQUEST] Only open dialog if it's an intentional Creation action (dblClick or ContextMenu)
        if (action !== 'doubleClick' && !isManualDoubleClick && action !== 'force_create') {
            return
        }

        // [COOLDOWN & RACE CONDITION]
        if (isActionInProgress.current) return
        if (now - lastActionTimeRef.current < 500) return

        isActionInProgress.current = true
        lastActionTimeRef.current = now

        const effectiveProfId = selectedProfessionalId === 'me' ? currentUserId : selectedProfessionalId

        const isGlobalBlock = filteredAppointments.some(appt => {
            if (appt.type !== 'block') return false
            // Check intersection
            const bStart = new Date(appt.start_time)
            const bEnd = new Date(appt.end_time)
            // Global Block = No professional_id
            if (appt.professional_id) return false
            return (start < bEnd && end > bStart)
        })

        const isSpecificBlock = effectiveProfId !== 'all' && filteredAppointments.some(appt => {
            if (appt.type !== 'block') return false
            if (appt.professional_id !== effectiveProfId) return false
            const bStart = new Date(appt.start_time)
            const bEnd = new Date(appt.end_time)
            return (start < bEnd && end > bStart)
        })

        if (isGlobalBlock || isSpecificBlock) {
            // [MODIFIED] Google Logic:
            // Single Click on Block -> Ignored (just selects visual slot)
            // Context Menu "Novo Agendamento" -> Sends action: 'force_create' -> Allows Encaixe

            if (action !== 'force_create') {
                return // Ignore interaction on block unless forced via menu
            }

            // Permission Check
            const isOwner = currentUserId && effectiveProfId === currentUserId

            if (isOwner) {
                // If forced via menu, we can skip confirm or keep it as safety.
                // Let's keep it as safety.
                const confirmed = window.confirm("Este horário está bloqueado. Deseja realizar um encaixe?")
                if (!confirmed) return
            } else {
                toast.error("Horário bloqueado. Não é possível agendar neste horário.")
                return
            }
        }

        // [NEW] Month View Support
        if (view === 'month') {
            // Adjust time to reasonable work hour (e.g., 08:00) instead of 00:00?
            // Or let AppointmentDialog handle default? Dialog handles default based on Slot.
            // If dragging in month view (rare), it might span multiple days.
            // Let's verify start/end.
            setIsApptDialogOpen(true)
            return
        }

        setIsApptDialogOpen(true)
        setTimeout(() => { isActionInProgress.current = false }, 500)
    }

    const handleSelectEvent = async (event: any, e?: React.SyntheticEvent) => {
        const now = Date.now()
        const eventId = event.id || event.resource?.id || null
        // Increase sensitivity to 600ms
        const isManualDoubleClick = lastEventClickRef.current &&
            (now - lastEventClickRef.current.time < 600) &&
            (lastEventClickRef.current.id === eventId);

        console.log('[EVENT_CLICK_DEBUG]', { id: eventId, isManualDoubleClick, delta: lastEventClickRef.current ? now - lastEventClickRef.current.time : 'N/A' })

        // [COOLDOWN & RACE CONDITION]
        if (isActionInProgress.current) return
        if (now - lastActionTimeRef.current < 500) return

        lastEventClickRef.current = { time: now, id: eventId }

        if (isManualDoubleClick) {
            handleDoubleClickEvent(event, e)
            return
        }

        // [FIX] Prevent opening dialog when trying to open Context Menu (Ctrl+Click or Right Click propagation)
        // Actually, now we want context menu (Right Click) to ALSO trigger this menu for standardization.
        // So we only block if it's a native middle click or something weird.
        if (e) {
            const native = e.nativeEvent as MouseEvent
            if (native.button === 1) return // Middle click
        }

        // [USER REQUEST] Double Click for creation. 
        // handleSelectEvent is for SINGLE CLICK. We only handle existing appointments here.
        if (event.resource?.type === 'free_slot') {
            return // Ignore single click on free slot
        }

        const appointmentData = event.resource || event
        setSelectedAppointment(appointmentData)
        setSelectedSlot(null)

        if (appointmentData.type === 'block') {
            const result = await MySwal.fire({
                title: 'Bloqueio de Horário',
                text: 'O que deseja fazer com este bloqueio?',
                icon: 'warning',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Editar Bloqueio',
                denyButtonText: 'Remover Bloqueio',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3b82f6',
                denyButtonColor: '#ef4444',
            })

            if (result.isConfirmed) {
                setIsBlockDialogOpen(true)
            } else if (result.isDenied) {
                handleDeleteAppointment(appointmentData.id)
            }

            isActionInProgress.current = false
        } else {
            // [USER REQUEST] Show options menu on single click for appointments
            const patientName = appointmentData.patients?.name || appointmentData.title || 'Paciente'

            const result = await MySwal.fire({
                title: patientName,
                text: 'O que deseja fazer?',
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Editar Agendamento',
                denyButtonText: 'Ver Prontuário',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3b82f6',
                denyButtonColor: '#10b981',
                footer: `
                    <div id="swal-cancel-appt-btn" style="color: #ef4444; font-size: 12px; font-weight: bold; cursor: pointer; text-decoration: underline; margin-top: 10px;">
                        Cancelar Agendamento
                    </div>
                `,
                didOpen: () => {
                    const btn = document.getElementById('swal-cancel-appt-btn')
                    if (btn) btn.onclick = () => {
                        MySwal.close()
                        handleCancelAppointment(appointmentData)
                    }
                }
            })

            if (result.isConfirmed) {
                setIsApptDialogOpen(true)
            } else if (result.isDenied) {
                const patientId = appointmentData.patient_id || appointmentData.patients?.id
                if (patientId) {
                    router.push(`/dashboard/${slug}/patients/${patientId}`)
                } else {
                    toast.error("Paciente não identificado.")
                }
            }

            isActionInProgress.current = false
        }
    }

    const handleCancelAppointment = async (appt: any) => {
        const confirmed = await MySwal.fire({
            title: 'Cancelar Agendamento?',
            text: 'O status mudará para "Cancelado" e o horário ficará livre.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, cancelar',
            cancelButtonText: 'Voltar',
            confirmButtonColor: '#ef4444'
        })

        if (confirmed.isConfirmed) {
            const tid = toast.loading("Cancelando agendamento...")
            try {
                const result = await updateAppointmentStatus(appt.id, 'cancelled')
                if (result.error) throw new Error(result.error)
                toast.success("Agendamento cancelado.", { id: tid })
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Erro ao cancelar", { id: tid })
            }
        }
    }

    const handleDeleteAppointment = async (id: string) => {
        const confirmed = await MySwal.fire({
            title: 'Remover Permanentemente?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Voltar',
            confirmButtonColor: '#ef4444'
        })

        if (confirmed.isConfirmed) {
            const tid = toast.loading("Removendo...")
            try {
                const result = await deleteAppointment(id)
                if (result.error) throw new Error(result.error)
                toast.success("Removido com sucesso.", { id: tid })
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Erro ao remover", { id: tid })
            }
        }
    }

    const handleDoubleClickEvent = async (event: any, e?: React.SyntheticEvent) => {
        console.log('[DBL_CLICK_EVENT] Triggered', {
            eventType: event.resource?.type,
            event,
            cooldownRemaining: 300 - (Date.now() - lastActionTimeRef.current)
        })

        const now = Date.now()

        // [COOLDOWN] Prevent duplicate triggers (native vs manual) - 300ms is safe for dblclick
        if (now - lastActionTimeRef.current < 300) {
            console.log('[DBL_CLICK_EVENT] Cooldown active, ignoring duplicate')
            return
        }
        lastActionTimeRef.current = now

        // Double click on free slot -> Create Choice
        if (event.resource?.type === 'free_slot') {
            console.log('[DBL_CLICK_EVENT] Free slot detected, showing choice dialog')
            const start = new Date(event.start)
            const end = new Date(event.end)
            const resourceId = event.resourceId || event.resource?.resourceId

            // Re-use logic for block check
            const isBlocked = filteredAppointments.some((appt: any) => {
                if (appt.type !== 'block') return false
                const bStart = new Date(appt.start_time)
                const bEnd = new Date(appt.end_time)
                return (start < bEnd && end > bStart)
            })

            const effectiveProfId = selectedProfessionalId === 'me' ? currentUserId : selectedProfessionalId

            if (isBlocked) {
                // Block handling logic remains same
                if (currentUserId && effectiveProfId === currentUserId) {
                    const confirmed = window.confirm("Este horário está bloqueado. Deseja realizar um encaixe?")
                    if (!confirmed) return
                } else {
                    toast.error("Horário bloqueado.")
                    return
                }
            }

            // [NEW] Visual Choice for User (Simulating Context Menu)
            const result = await MySwal.fire({
                title: 'O que deseja criar?',
                text: 'Selecione a ação para este horário.',
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Novo Agendamento',
                denyButtonText: 'Novo Bloqueio',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#16a34a', // Green
                denyButtonColor: '#ef4444', // Red
            })

            if (result.isConfirmed) {
                // Appointment
                setSelectedSlot({ start, end, resourceId })
                setSelectedAppointment(null)
                setIsApptDialogOpen(true)
            } else if (result.isDenied) {
                // Block
                setSelectedSlot({ start, end, resourceId })
                setSelectedAppointment(null)
                setIsBlockDialogOpen(true)
            }
            return
        }

        // Double click on existing appointment -> Just ensure it opens (usually already opened by first click)
        const appointmentData = event.resource || event
        setSelectedAppointment(appointmentData)
        setSelectedSlot(null)

        if (appointmentData.type === 'block') {
            setIsBlockDialogOpen(true)
        } else {
            setIsApptDialogOpen(true)
        }
    }

    const handleEventDrop = async ({ event, start, end, resourceId }: any) => {
        if (event.resource?.type === 'free_slot') return

        const tid = toast.loading("Movendo agendamento...")
        try {
            const res = await moveAppointment(event.id, start, end, resourceId)
            if (res.success) {
                toast.success("Agendamento movido!", { id: tid })
            } else {
                toast.error(res.error || "Erro ao mover.", { id: tid })
                router.refresh()
            }
        } catch (err) {
            toast.error("Erro inesperado.", { id: tid })
            router.refresh()
        }
    }

    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false) // Mobile Search Mode logic

    // [NEW] Global Search State (Desktop Sidebar)
    const [globalSearchTerm, setGlobalSearchTerm] = useState("")
    const [globalSearchResults, setGlobalSearchResults] = useState<{ id: string, name: string }[]>([])
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
    const [openGlobalSearch, setOpenGlobalSearch] = useState(false)
    const [preSelectedPatient, setPreSelectedPatient] = useState<{ id: string, name: string, phone?: string } | null>(null)

    // Debounce Global Search
    useEffect(() => {
        if (!globalSearchTerm || globalSearchTerm.length < 2) {
            setGlobalSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsSearchingGlobal(true)
            try {
                const { data: results } = await getPatients({ query: globalSearchTerm })
                setGlobalSearchResults(results || [])
            } catch (err) {
                console.error(err)
            } finally {
                setIsSearchingGlobal(false)
                setOpenGlobalSearch(true)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [globalSearchTerm])

    // Handle Global Selection
    const handleGlobalSearchSelect = (patient: { id: string, name: string }) => {
        setPreSelectedPatient(patient)
        setIsApptDialogOpen(true) // Open Dialog
        setOpenGlobalSearch(false)
        setGlobalSearchTerm("") // Reset search
        setIsSearching(false) // Close Mobile Search Mode
    }

    // [NEW] Listen for External Search Triggers (from Top Bar or Waitlist Link)
    useEffect(() => {
        const openDialog = searchParams.get('openDialog')
        const patientId = searchParams.get('patientId')
        const patientName = searchParams.get('patientName') || searchParams.get('patient_name') // Handle both snake_case (waitlist) and camelCase
        const phone = searchParams.get('phone')

        if ((openDialog === 'true' && patientId) || patientName) {
            // If we have an ID, excellent. If not, we pass Name/Phone for pre-fill.
            setPreSelectedPatient({
                id: patientId || '',
                name: patientName || '',
                phone: phone || '' // Extended type locally?
            } as any)

            setIsApptDialogOpen(true)

            // Clean URL (remove triggers but keep date)
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('openDialog')
            newParams.delete('patientId')
            newParams.delete('patientName')
            newParams.delete('patient_name')
            newParams.delete('phone')
            router.replace(`${window.location.pathname}?${newParams.toString()}`)
        }
    }, [searchParams, router])

    // Filter States
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(currentUserId || "all")
    const [selectedLocationId, setSelectedLocationId] = useState<string>("all") // [FIX] Default to ALL to avoid hiding appointments from other locations
    const [filterType, setFilterType] = useState<'all' | 'scheduled' | 'free'>('all') // [NEW] Filter State

    // Mobile View Level State (Day -> Month -> Year)
    const [viewLevel, setViewLevel] = useState<'day' | 'month' | 'year'>('day')

    // Filter appointments
    console.log('[DEBUG] Initial Appointments:', initialAppointments.length)
    console.log('[DEBUG] Current Filters:', { selectedLocationId, selectedProfessionalId, filterType })

    const filteredAppointments = initialAppointments.filter(appt => {
        const matchesProfessional =
            selectedProfessionalId === 'all' ||
            (selectedProfessionalId === 'me' && appt.professional_id === currentUserId) ||
            appt.professional_id === selectedProfessionalId ||
            (appt.type === 'block' && !appt.professional_id) // [FIX] Global Blocks appear for everyone

        const matchesLocation = selectedLocationId === 'all' ||
            appt.location_id === selectedLocationId ||
            (appt.type === 'block' && !appt.location_id) || // [FIX] Global Blocks appear in all locations
            (appt.resource?.type === 'free_slot' && selectedLocationId !== 'all')

        // Search Filter
        let matchesSearch = true
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const patientName = appt.patients?.name?.toLowerCase() || ""
            const profName = appt.profiles?.full_name?.toLowerCase() || ""
            matchesSearch = patientName.includes(term) || profName.includes(term)
        }

        // Type Filter (Mobile)
        let matchesType = true
        if (filterType === 'scheduled') {
            matchesType = (appt.resource?.type !== 'free_slot')
        } else if (filterType === 'free') {
            // Main appointments list usually doesn't have free slots unless we merge them first.
            // Wait, 'filteredAppointments' is used to GENERATE the displayEvents. 
            // If we filter here, we only filter REAL appointments.
            // Availability Events are generated LATER.
            // Implementation Detail: We need to filter the FINAL merged list or handle it here.
            // Actually, the `displayEvents` merges them.
            // So we should probably filter `displayEvents` or just let the View handle it?
            // NO, `MobileScheduleView` logic was removed. We need to filter BEFORE passing to it.
            // OR, better: We filter `filteredAppointments` only for "Scheduled".
            // For "Free", we just let them be generated, but maybe we hide real appointments?
            if (filterType === 'free') matchesType = false // Hide real appointments if looking for free slots
        }

        // [NEW] Date Period Filter for List View
        let matchesPeriod = true
        if (viewMode === 'list') {
            const itemDate = new Date(appt.start_time)
            const s = new Date(listStartDate)
            s.setHours(0, 0, 0, 0)
            const e = new Date(listEndDate)
            e.setHours(23, 59, 59, 999)
            matchesPeriod = itemDate >= s && itemDate <= e
        }

        // [NEW] Remove blocks from list view
        const isNotBlockIfList = viewMode === 'calendar' || appt.type !== 'block'

        return matchesProfessional && matchesLocation && matchesSearch && matchesType && matchesPeriod && isNotBlockIfList
    }).map(appt => {
        const isBlock = appt.type === 'block'
        const rawTitle = appt.title || (isBlock ? appt.notes : appt.patients?.name) || (isBlock ? 'Bloqueio' : 'Sem título')
        const displayTitle = rawTitle.replace(/\[GRP:[^\]]+\]/, "").trim()

        return {
            ...appt,
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            title: displayTitle // [FIX] Strip internal group tags
        }
    })

    // [FIX] Dynamic Interval Logic - Respect Professional's Profile Configuration
    const currentProf = professionals.find(p => p.id === (selectedProfessionalId === 'me' ? currentUserId : selectedProfessionalId))
    const step = visualStep || currentProf?.slot_interval || 30;
    // To show fractional labels in the gutter (ex: 08:15, 08:30), timeslots must be 1.
    const timeslots = 1;


    const handleBlockCreate = ({ start, end, resourceId }: any) => {
        setSelectedSlot({
            start,
            end,
            resourceId
        })
        setSelectedAppointment(null)
        setIsBlockDialogOpen(true)
    }


    // [NEW] Dynamic View Logic
    const getOptimalView = () => {
        // [FIX] Force Day view on Mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return Views.DAY
        }

        // If user explicitly selected Day or Agenda, don't override
        if (view === Views.DAY || view === Views.AGENDA) return view

        if (showWeekends) return Views.WEEK
        return Views.WORK_WEEK
    }

    // [NEW] Generate Availability "Ghost" Events
    // Only if a specific professional is selected
    const availabilityEvents: any[] = []
    const selectedProfObj = selectedProfessionalId === 'me'
        ? professionals.find(p => p.id === currentUserId)
        : professionals.find(p => p.id === selectedProfessionalId)

    if (selectedProfObj) {
        // Calculate View Range
        const viewStart = new Date(date)
        viewStart.setDate(date.getDate() - date.getDay()) // Sunday
        viewStart.setHours(0, 0, 0, 0)

        for (let i = 0; i < 7; i++) {
            const currDate = new Date(viewStart)
            currDate.setDate(viewStart.getDate() + i)
            const dayOfWeek = currDate.getDay()

            const slots = selectedProfObj.professional_availability?.filter((a: any) => a.day_of_week === dayOfWeek) || []

            const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
            let currentSlot: any = null
            const mergedSlots: any[] = []

            for (const slot of sortedSlots) {
                if (!currentSlot) {
                    currentSlot = { ...slot }
                } else {
                    if (slot.start_time <= currentSlot.end_time) {
                        if (slot.end_time > currentSlot.end_time) {
                            currentSlot.end_time = slot.end_time
                        }
                    } else {
                        mergedSlots.push(currentSlot)
                        currentSlot = { ...slot }
                    }
                }
            }
            if (currentSlot) mergedSlots.push(currentSlot)

            mergedSlots.forEach((slot: any) => {
                if (!slot.start_time || !slot.end_time) return
                const [sh, sm] = slot.start_time.split(':').map(Number)
                const [eh, em] = slot.end_time.split(':').map(Number)

                let time = new Date(currDate)
                time.setHours(sh, sm, 0, 0)
                const endTime = new Date(currDate)
                endTime.setHours(eh, em, 0, 0)

                const internalStep = 15
                let currentFreeStart: Date | null = null

                while (time < endTime) {
                    const slotEnd = new Date(time.getTime() + internalStep * 60000)
                    if (slotEnd > endTime) {
                        if (currentFreeStart) {
                            pushFreeSlot(currentFreeStart, endTime)
                            currentFreeStart = null
                        }
                        break
                    }

                    const collision = filteredAppointments.some(appt => {
                        const aStart = new Date(appt.start_time)
                        const aEnd = new Date(appt.end_time)
                        return (time < aEnd && slotEnd > aStart)
                    })

                    if (!collision) {
                        if (!currentFreeStart) currentFreeStart = new Date(time)
                    } else {
                        if (currentFreeStart) {
                            pushFreeSlot(currentFreeStart, time)
                            currentFreeStart = null
                        }
                    }
                    time = slotEnd
                }

                if (currentFreeStart) {
                    pushFreeSlot(currentFreeStart, endTime)
                }

                function pushFreeSlot(s: Date, e: Date) {
                    const loc = locations.find(l => l.id === slot.location_id)
                    const locColor = loc?.color || '#e5e7eb'

                    availabilityEvents.push({
                        id: `free-${s.toISOString()}`,
                        title: 'Livre',
                        start: new Date(s),
                        end: new Date(e),
                        type: 'free_slot',
                        resourceId: selectedProfObj.id,
                        resource: {
                            type: 'free_slot',
                            locationColor: locColor,
                            locationName: loc?.name
                        }
                    })
                }
            })
        }
    }

    // Merge for display
    let displayEvents = [...availabilityEvents, ...filteredAppointments]

    // [NEW] Final Filter for "Free Slots" (since they are added after the first filter)
    if (filterType === 'scheduled') {
        displayEvents = displayEvents.filter(e => e.resource?.type !== 'free_slot')
    } else if (filterType === 'free') {
        displayEvents = displayEvents.filter(e => e.resource?.type === 'free_slot')
    }

    console.log('[DEBUG] Filtered Appointments:', filteredAppointments.length)
    console.log('[DEBUG] Final Display Events:', displayEvents.length)

    // Effect to auto-switch view when dependencies change
    useEffect(() => {
        const handleResize = () => {
            const optimal = getOptimalView()
            if (view !== optimal) {
                setView(optimal)
            }
        }

        // Check on mount and resize
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [date, filteredAppointments, selectedProfessionalId, view, viewMode, showWeekends])

    // [NEW] Auto-Collapse Sidebar on List View
    const { setIsCollapsed } = useSidebar()

    useEffect(() => {
        if (viewMode === 'list') {
            setIsCollapsed(true)
        }
    }, [viewMode, setIsCollapsed])

    // [NEW] Availability Logic for Sidebar Calendar
    const getDailyStatus = (date: Date) => {
        // [FIX] Correct Comparison including Time Intersection for Blocks
        const checkStart = new Date(date)
        checkStart.setHours(0, 0, 0, 0)

        const checkEnd = new Date(date)
        checkEnd.setHours(23, 59, 59, 999)

        // 1. Check for Blocks (Any intersection with this day)
        const hasBlock = filteredAppointments.some(a => {
            if (a.type !== 'block') return false
            const aStart = new Date(a.start_time)
            const aEnd = new Date(a.end_time)
            return (aStart <= checkEnd && aEnd >= checkStart)
        })

        if (hasBlock) return 'blocked'

        // 2. Count Appointments (Start date matching only, standard behavior)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayAppts = filteredAppointments.filter(a =>
            a.type !== 'block' && a.start_time.startsWith(dateStr)
        )

        if (dayAppts.length === 0) return 'free'
        if (dayAppts.length >= 10) return 'full'
        return 'partial'
    }

    const modifiers = {
        free: (date: Date) => getDailyStatus(date) === 'free',
        partial: (date: Date) => getDailyStatus(date) === 'partial',
        full: (date: Date) => getDailyStatus(date) === 'full',
        blocked: (date: Date) => getDailyStatus(date) === 'blocked'
    }

    const modifiersClassNames = {
        free: "bg-green-100/50 hover:bg-green-200/50 data-[selected=true]:bg-primary",
        partial: "bg-yellow-100/70 hover:bg-yellow-200/70 data-[selected=true]:bg-primary",
        full: "bg-red-100/70 hover:bg-red-200/70 data-[selected=true]:bg-primary",
        blocked: "bg-gray-500/20 text-gray-500 font-bold hover:bg-gray-500/30 data-[selected=true]:bg-primary",
    }

    // [NEW] Dynamic Theme Color
    const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId)

    const themeColor = selectedProfessional?.color || '#84c8b9'

    // Prevent hydration errors by not rendering date-dependent components on server
    if (!isMounted) {
        return null // or a simplified loading state
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ... Header ... */}
            {/* ... Header ... */}
            <div className="flex items-center justify-between flex-none h-14"> {/* Fixed height for consistency */}
                {/* Desktop Title (Always Visible) */}
                <h1 className="text-xl font-bold text-gray-800 hidden md:block">Agenda</h1>

                {/* Mobile Search Overlay or Dynamic Title */}
                <div className="md:hidden flex-1 flex items-center">
                    {isSearching ? (
                        <div className="flex items-center flex-1 gap-2 animate-in fade-in slide-in-from-right-5 duration-200 relative">
                            {/* Mobile Global Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    placeholder="Buscar paciente..."
                                    className="pl-9 h-9"
                                    value={globalSearchTerm}
                                    onChange={(e) => {
                                        setGlobalSearchTerm(e.target.value)
                                        if (e.target.value.length > 0) setOpenGlobalSearch(true)
                                    }}
                                    onFocus={() => globalSearchTerm.length >= 2 && setOpenGlobalSearch(true)}
                                />
                                {isSearchingGlobal && (
                                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}

                                {/* Mobile Search Results Dropdown (Absolute) */}
                                {openGlobalSearch && globalSearchResults.length > 0 && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border rounded-md shadow-2xl max-h-[60vh] overflow-y-auto p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {globalSearchResults.map(patient => (
                                            <div
                                                key={patient.id}
                                                className="w-full px-3 py-3 text-sm hover:bg-slate-50 border-b last:border-0 border-slate-100 flex items-center justify-between group active:bg-slate-100"
                                            >
                                                {/* Link to Profile */}
                                                <Link
                                                    href={`/dashboard/patients/${patient.id}`}
                                                    className="flex-1 flex flex-col cursor-pointer"
                                                    onClick={() => {
                                                        setOpenGlobalSearch(false)
                                                        setGlobalSearchTerm("")
                                                        setIsSearching(false) // Close search mode
                                                    }}
                                                >
                                                    <span className="font-medium text-slate-700">{patient.name}</span>
                                                </Link>

                                                {/* New Appt Button */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 ml-2 text-blue-600 active:bg-blue-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleGlobalSearchSelect(patient)
                                                    }}
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {openGlobalSearch && globalSearchTerm.length >= 2 && globalSearchResults.length === 0 && !isSearchingGlobal && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground z-50">
                                        Nenhum paciente encontrado.
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setIsSearching(false); setGlobalSearchTerm(""); setOpenGlobalSearch(false) }}>
                                Cancelar
                            </Button>
                        </div>
                    ) : (
                        // Stacked Year/Month Selectors
                        <div className="flex flex-col items-start leading-none pl-2">
                            {/* Year Selector */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-muted-foreground text-xs font-semibold hover:bg-transparent hover:text-primary"
                                onClick={() => setViewLevel('year')}
                            >
                                {date.getFullYear()}
                            </Button>

                            {/* Month Selector */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-lg font-bold capitalize hover:bg-transparent hover:text-primary -mt-1"
                                onClick={() => setViewLevel('month')}
                            >
                                {format(date, "MMMM", { locale: ptBR })}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 px-3 text-xs font-semibold transition-all border-dashed",
                                showWeekends ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => setShowWeekends(!showWeekends)}
                        >
                            {showWeekends ? "Ocultar Sábado/Domingo" : "Exibir Sábado/Domingo"}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 text-muted-foreground transition-all", isRefreshing && "animate-spin text-primary")}
                            onClick={() => {
                                setIsRefreshing(true)
                                router.refresh()
                                setTimeout(() => setIsRefreshing(false), 1000)
                            }}
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </Button>

                        {/* Status Legend - Desktop & Tablet */}
                        <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200">
                            <div className="flex items-center gap-1.5" title="Confirmado">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                <span className="text-[10px] font-medium text-slate-600">Confirmado</span>
                            </div>
                            <div className="w-px h-3 bg-slate-300" />
                            <div className="flex items-center gap-1.5" title="Aguardando">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                                <span className="text-[10px] font-medium text-slate-600">Aguardando</span>
                            </div>
                            <div className="w-px h-3 bg-slate-300" />
                            <div className="flex items-center gap-1.5" title="Em Atendimento">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                                <span className="text-[10px] font-medium text-slate-600">Atendendo</span>
                            </div>
                            <div className="w-px h-3 bg-slate-300" />
                            <div className="flex items-center gap-1.5" title="Finalizado (Pendente Pagamento)">
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <span className="text-[10px] font-medium text-slate-600">Finalizado</span>
                            </div>
                            <div className="w-px h-3 bg-slate-300" />
                            <div className="flex items-center gap-1.5" title="Faturado (Pago)">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] font-medium text-slate-600">Faturado</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <Select
                            value={step.toString()}
                            onValueChange={handleStepChange}
                        >
                            <SelectTrigger className="h-8 px-2 bg-muted border-none text-xs text-muted-foreground w-[80px] hover:bg-slate-200 transition-colors">
                                <SelectValue placeholder={`${step}min`} />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" align="end" sideOffset={4}>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!isSearching && (
                    <div className="md:hidden flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 text-muted-foreground", isRefreshing && "animate-spin text-primary")}
                            onClick={() => {
                                setIsRefreshing(true)
                                router.refresh()
                                setTimeout(() => setIsRefreshing(false), 1000)
                            }}
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                                setDate(new Date())
                                setViewLevel('day')
                            }}
                        >
                            {isToday(date) ? "Hoje" : format(date, "dd/MM/yy")}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant={selectedProfessionalId === 'all' ? 'ghost' : 'secondary'} size="icon" className="h-8 w-8 text-muted-foreground">
                                    <Stethoscope className={cn("h-5 w-5", selectedProfessionalId !== 'all' && "text-primary")} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                                <DropdownMenuItem onClick={() => setSelectedProfessionalId('all')}>
                                    -- selecione --
                                </DropdownMenuItem>
                                {professionals.filter(p => p.has_agenda !== false).map(prof => (
                                    <DropdownMenuItem key={prof.id} onClick={() => {
                                        setSelectedProfessionalId(prof.id)
                                        setSelectedLocationId('all')
                                    }}>
                                        <div className="flex items-center gap-2">
                                            {prof.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.color }} />}
                                            {prof.full_name}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant={selectedLocationId === 'all' ? 'ghost' : 'secondary'} size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MapPin className={cn("h-5 w-5", selectedLocationId !== 'all' && "text-primary")} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                                <DropdownMenuItem onClick={() => setSelectedLocationId('all')}>
                                    -- selecione --
                                </DropdownMenuItem>
                                {locations.map(loc => (
                                    <DropdownMenuItem key={loc.id} onClick={() => {
                                        setSelectedLocationId(loc.id)
                                        setSelectedProfessionalId('all')
                                    }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: loc.color || '#94a3b8' }} />
                                            {loc.name}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant={filterType === 'all' ? 'ghost' : 'secondary'} size="icon" className="h-8 w-8">
                                    <ListFilter className={cn("h-5 w-5", filterType !== 'all' && "text-primary")} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                                <DropdownMenuItem onClick={() => setFilterType('all')}>Todos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType('scheduled')}>Agendados</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType('free')}>Horários Livres</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)}>
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsBlockDialogOpen(true)}>
                            <Lock className="h-5 w-5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsApptDialogOpen(true)}>
                            <Plus className="h-6 w-6 text-red-500" />
                        </Button>

                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                        >
                            {viewMode === 'list' ? (
                                <CalendarIcon className="h-5 w-5 text-primary" />
                            ) : (
                                <List className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <div className="hidden md:flex items-center gap-2">
                <AppointmentDialog
                    patients={patients}
                    locations={locations}
                    services={services}
                    professionals={professionals}
                    serviceLinks={serviceLinks}
                    open={isApptDialogOpen}
                    onOpenChange={(open) => {
                        setIsApptDialogOpen(open)
                        if (!open) {
                            setTimeout(() => {
                                setSelectedAppointment(null)
                                setSelectedSlot(null)
                                setPreSelectedPatient(null)
                            }, 300)
                        }
                    }}
                    selectedSlot={selectedSlot}
                    appointment={selectedAppointment}
                    holidays={holidays}
                    priceTables={priceTables}
                    initialPatientId={preSelectedPatient?.id}
                    initialPatientName={preSelectedPatient?.name}
                    initialPatientPhone={preSelectedPatient?.phone}
                    initialProfessionalId={selectedProfessionalId !== 'all' ? selectedProfessionalId : currentUserId}
                    userRole={userRole}
                />
                <BlockDialog
                    professionals={professionals}
                    locations={locations}
                    holidays={holidays}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    open={isBlockDialogOpen}
                    onOpenChange={(open) => {
                        setIsBlockDialogOpen(open)
                        if (!open) {
                            setTimeout(() => {
                                setSelectedAppointment(null)
                                setSelectedSlot(null)
                            }, 300)
                        }
                    }}
                    selectedSlot={selectedSlot}
                    appointment={selectedAppointment}
                    currentDate={date} // [NEW] Pass current date context
                    initialProfessionalId={selectedProfessionalId !== 'all' ? selectedProfessionalId : currentUserId} // [NEW] Pass context
                />
            </div>


            {/* Mobile Date Navigation REMOVED (Handled by MobileScheduleView now) */}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Sidebar Controls */}
                {/* Sidebar Controls (Feegow Style) */}
                <div className="hidden md:block w-full max-w-[280px] pr-2 h-full">
                    <div className="sticky top-4 flex flex-col gap-4">
                        {/* 1. Search */}
                        {/* 1. Global Search (Patients) */}
                        {/* 1. Global Search (Patients) */}
                        <div className="bg-white rounded-md border shadow-sm p-3 relative z-50">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar paciente..."
                                    className="pl-9 h-9"
                                    value={globalSearchTerm}
                                    onChange={(e) => {
                                        setGlobalSearchTerm(e.target.value)
                                        if (e.target.value.length > 0) setOpenGlobalSearch(true)
                                    }}
                                    onFocus={() => globalSearchTerm.length >= 2 && setOpenGlobalSearch(true)}
                                />
                                {isSearchingGlobal && (
                                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}

                                {/* Search Results Dropdown (Matched to Mobile) */}
                                {openGlobalSearch && globalSearchResults.length > 0 && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border rounded-md shadow-2xl max-h-[60vh] overflow-y-auto p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {globalSearchResults.map(patient => (
                                            <button
                                                key={patient.id}
                                                className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50 border-b last:border-0 border-slate-100 flex items-center justify-between group active:bg-slate-100"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleGlobalSearchSelect(patient)
                                                }}
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                <span className="font-medium text-slate-800">{patient.name}</span>
                                                <Plus className="h-4 w-4 text-blue-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {openGlobalSearch && globalSearchTerm.length >= 2 && globalSearchResults.length === 0 && !isSearchingGlobal && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground z-50">
                                        Nenhum paciente encontrado.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Professional Filter */}
                        <div className="bg-white rounded-md border shadow-sm p-4 space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profissional</label>
                            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" sideOffset={4} position="popper">
                                    <SelectItem value="all">-- selecione --</SelectItem>
                                    {professionals.length > 0 && <Separator className="my-1 opacity-50" />}
                                    {professionals.filter(p => p.has_agenda !== false).map(prof => (
                                        <SelectItem key={prof.id} value={prof.id}>
                                            <div className="flex items-center gap-2">
                                                {prof.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.color }} />}
                                                {prof.full_name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Location Filter */}
                        <div className="bg-white rounded-md border shadow-sm p-4 space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Local</label>
                            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" sideOffset={4} position="popper">
                                    <SelectItem value="all">-- selecione --</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. View Modes & Actions */}
                        <div className="bg-white rounded-md border shadow-sm p-3 space-y-3">
                            <div className="flex gap-2 w-full">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 px-2 flex-1 gap-2"
                                    onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                                >
                                    {viewMode === 'calendar' ? (
                                        <>
                                            <List className="h-3.5 w-3.5" />
                                            <span className="text-xs">Ver Lista</span>
                                        </>
                                    ) : (
                                        <>
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                            <span className="text-xs">Ver Grade</span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            {viewMode === 'calendar' && (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs flex-1 gap-2"
                                        onClick={() => setView(view === Views.DAY ? Views.WEEK : Views.DAY)}
                                    >
                                        {(view === Views.WEEK || view === Views.WORK_WEEK) ? (
                                            <>
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                Visualizar Dia
                                            </>
                                        ) : (
                                            <>
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                Visualizar Semana
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-2 border-t text-left">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-10 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-bold text-sm px-3 transition-all shadow-sm"
                                    onClick={() => setIsApptDialogOpen(true)}
                                >
                                    <CalendarPlus className="h-4 w-4" />
                                    <span>Novo Agendamento</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-10 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 font-bold text-sm px-3 transition-all shadow-sm"
                                    onClick={() => setIsBlockDialogOpen(true)}
                                >
                                    <Lock className="h-4 w-4" />
                                    <span>Bloquear Horário</span>
                                </Button>
                            </div>

                            {/* List Period Filter - Sidebar (Desktop Only) */}
                            {viewMode === 'list' && (
                                <div className="hidden md:block bg-slate-50 rounded-md border p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ListFilter className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Período da Lista</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Início</label>
                                            <Input
                                                type="date"
                                                className="h-9 text-xs bg-white border-slate-200"
                                                value={format(listStartDate, 'yyyy-MM-dd')}
                                                onChange={(e) => {
                                                    const d = new Date(e.target.value + 'T12:00:00')
                                                    if (!isNaN(d.getTime())) setListStartDate(d)
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fim</label>
                                            <Input
                                                type="date"
                                                className="h-9 text-xs bg-white border-slate-200"
                                                value={format(listEndDate, 'yyyy-MM-dd')}
                                                onChange={(e) => {
                                                    const d = new Date(e.target.value + 'T12:00:00')
                                                    if (!isNaN(d.getTime())) setListEndDate(d)
                                                }}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-[10px] h-8 font-bold uppercase border bg-white"
                                            onClick={() => {
                                                setListStartDate(startOfMonth(new Date()))
                                                setListEndDate(endOfMonth(new Date()))
                                            }}
                                        >
                                            Mês Atual
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. Mini Calendar (Scaled Down) */}
                        <div className="bg-white rounded-md border shadow-sm p-0 overflow-hidden flex justify-center py-2">
                            <div className="scale-90 origin-top">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    locale={ptBR}
                                    className="w-full"
                                    modifiers={modifiers}
                                    modifiersClassNames={modifiersClassNames}
                                />
                                {/* Legend */}
                                <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground pb-2 flex-wrap">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-100 border border-green-200"></div>Livre</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-100 border border-yellow-200"></div>Ocupado</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-100 border border-red-200"></div>Cheio</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-gray-200 border border-gray-300"></div>Bloqueado</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-lg shadow-sm border p-1 h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] overflow-hidden">
                    {/* Mobile: iOS-style Timeline OR List */}
                    <div className="md:hidden h-[calc(100vh-80px)]">
                        {viewMode === 'list' ? (
                            <div className="h-full overflow-y-auto bg-slate-50">
                                {/* Mobile List Period Filter */}
                                <div className="bg-white border-b p-4 space-y-3 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ListFilter className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-bold text-slate-800">Período da Lista</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[10px] h-7 px-2 font-bold uppercase text-primary border"
                                            onClick={() => {
                                                setListStartDate(startOfMonth(new Date()))
                                                setListEndDate(endOfMonth(new Date()))
                                            }}
                                        >
                                            Mês Atual
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Início</label>
                                            <Input
                                                type="date"
                                                className="h-9 text-xs bg-slate-50 border-slate-200"
                                                value={format(listStartDate, 'yyyy-MM-dd')}
                                                onChange={(e) => {
                                                    const d = new Date(e.target.value + 'T12:00:00')
                                                    if (!isNaN(d.getTime())) setListStartDate(d)
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Fim</label>
                                            <Input
                                                type="date"
                                                className="h-9 text-xs bg-slate-50 border-slate-200"
                                                value={format(listEndDate, 'yyyy-MM-dd')}
                                                onChange={(e) => {
                                                    const d = new Date(e.target.value + 'T12:00:00')
                                                    if (!isNaN(d.getTime())) setListEndDate(d)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold capitalize text-gray-900">
                                            Lista de Agendamentos
                                        </h3>
                                        <span className="text-xs text-muted-foreground font-medium bg-white px-2 py-1 rounded border">
                                            {filteredAppointments.length} atendimentos
                                        </span>
                                    </div>
                                    <ScheduleListView
                                        appointments={filteredAppointments}
                                        paymentMethods={paymentMethods || []}
                                    />
                                </div>
                            </div>
                        ) : (
                            <MobileScheduleView
                                date={date}
                                setDate={setDate}
                                events={displayEvents}
                                onAddKey={() => setIsApptDialogOpen(true)}
                                onEventClick={handleSelectEvent}
                                onSlotClick={(slotDate) => {
                                    handleSelectSlot({ start: slotDate, end: new Date(slotDate.getTime() + 30 * 60000), resourceId: null })
                                }}
                                isSearching={isSearching}
                                searchTerm={searchTerm}
                                viewLevel={viewLevel}
                                setViewLevel={setViewLevel}
                                selectedProfessionalName={
                                    selectedLocationId !== 'all'
                                        ? locations.find(l => l.id === selectedLocationId)?.name
                                        : selectedProfessional?.full_name
                                }
                                selectedProfessionalColor={
                                    selectedLocationId !== 'all'
                                        ? locations.find(l => l.id === selectedLocationId)?.color
                                        : selectedProfessional?.color
                                }
                            />
                        )}
                    </div>

                    {/* Desktop: Standard Behavior */}
                    <div className="hidden md:block h-full">
                        {viewMode === 'calendar' ? (
                            <BigCalendarComponent
                                date={date}
                                onDateChange={setDate}
                                view={view}
                                onViewChange={setView}
                                selectable={true}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                onDoubleClickEvent={handleDoubleClickEvent}
                                onEventDrop={handleEventDrop}
                                onBlockCreate={handleBlockCreate}
                                appointments={displayEvents}
                                step={step}
                                timeslots={timeslots}
                                themeColor={themeColor}
                                professional={selectedProfessionalId !== 'all' ? selectedProfessional : undefined}
                                onRefresh={() => {
                                    setIsRefreshing(true)
                                    router.refresh()
                                    setTimeout(() => setIsRefreshing(false), 1000)
                                }}
                            />
                        ) : (
                            <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                <ScheduleListView
                                    appointments={filteredAppointments}
                                    paymentMethods={paymentMethods || []}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
