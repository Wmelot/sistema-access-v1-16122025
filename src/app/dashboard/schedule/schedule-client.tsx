"use client"

import { useState, useEffect } from "react"
import { Calendar as BigCalendarComponent } from "@/components/schedule/Calendar"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, UserPlus, ListFilter, Stethoscope, Loader2, Plus, Lock, MapPin } from "lucide-react"
import { getPatients } from "@/app/dashboard/patients/actions"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { format, isToday } from "date-fns"
import { MobileScheduleView } from "./mobile-view"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/hooks/use-sidebar"

interface ScheduleClientProps {
    patients: any[]
    locations: any[]
    services: any[]
    professionals: any[]
    serviceLinks: any[]
    appointments: any[]
    currentUserId?: string
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
    defaultLocationId
}: ScheduleClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // [MODIFIED] Date State is now URL-driven
    const dateParam = searchParams.get('date')
    const date = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()

    // Helper to set date (pushes to URL)
    const setDate = (newDate: Date | undefined) => {
        if (!newDate) return
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', newDate.toISOString().split('T')[0])
        router.push(`/dashboard/schedule?${params.toString()}`)
    }

    const [view, setView] = useState<View>(Views.WEEK)
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
    const [showWeekends, setShowWeekends] = useState(false)
    const [visualStep, setVisualStep] = useState<number | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Dialog State
    const [isApptDialogOpen, setIsApptDialogOpen] = useState(false)
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date, resourceId?: string } | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const handleSelectSlot = ({ start, end, resourceId, action }: any) => {
        // [NEW] Check for Block Overlap
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
                alert("Horário bloqueado. Não é possível agendar neste horário.")
                return
            }
        }

        // [NEW] Month View Support
        if (view === 'month') {
            // Adjust time to reasonable work hour (e.g., 08:00) instead of 00:00?
            // Or let AppointmentDialog handle default? Dialog handles default based on Slot.
            // If dragging in month view (rare), it might span multiple days.
            // Let's verify start/end.
            setSelectedSlot({ start, end, resourceId })
            setSelectedAppointment(null)
            setIsApptDialogOpen(true)
            return
        }

        setSelectedSlot({ start, end, resourceId })
        setSelectedAppointment(null) // New appointment
        setIsApptDialogOpen(true)
    }

    const handleSelectEvent = (event: any, e?: React.SyntheticEvent) => {
        // [FIX] Prevent opening dialog when trying to open Context Menu (Ctrl+Click or Right Click propagation)
        if (e) {
            const native = e.nativeEvent as MouseEvent
            // Check for modifier keys
            if (native.ctrlKey || native.metaKey || native.altKey) {
                return
            }
            // Check for Non-Left Click (0 is Left Click)
            if (native.button !== 0) {
                return
            }
        }

        // [NEW] If clicking a "Free Slot", treat as creating a new appointment
        if (event.resource?.type === 'free_slot') {
            const start = new Date(event.start)
            const end = new Date(event.end)

            // Re-use collision logic from handleSelectSlot
            // We need to check if this "Free Slot" actually overlaps a block (edge case)
            // Or just trust the Flow?
            // If the user says "Cliquei no bloqueio", they might be clicking the Empty Grid (SelectSlot) OR a Free Slot.
            // If SelectSlot, logic is already there. 
            // If FreeSlot, we execute this:

            // Check for Block Overlap here too, just in case
            const isBlocked = filteredAppointments.some((appt: any) => {
                if (appt.type !== 'block') return false
                const bStart = new Date(appt.start_time)
                const bEnd = new Date(appt.end_time)
                return (start < bEnd && end > bStart)
            })

            if (isBlocked) {
                if (currentUserId && selectedProfessionalId === currentUserId) {
                    const confirmed = window.confirm("Este horário está bloqueado. Deseja realizar um encaixe?")
                    if (!confirmed) return
                } else {
                    alert("Horário bloqueado.")
                    return
                }
            }

            setSelectedSlot({
                start,
                end,
                resourceId: event.resourceId
            })
            setSelectedAppointment(null)
            setIsApptDialogOpen(true)
            return
        }

        // For real appointments, the event object IS the appointment data (or it's in resource for some views?)
        // In our mapping, 'filteredAppointments' spreads the appt data into the event.
        // 'availabilityEvents' puts metadata in 'resource'.
        // So we fallback: try resource, then event.
        const appointmentData = event.resource || event
        setSelectedAppointment(appointmentData)
        setSelectedSlot(null) // Edit mode

        if (appointmentData.type === 'block') {
            setIsBlockDialogOpen(true)
        } else {
            setIsApptDialogOpen(true)
        }
    }

    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false) // Mobile Search Mode logic

    // [NEW] Global Search State (Desktop Sidebar)
    const [globalSearchTerm, setGlobalSearchTerm] = useState("")
    const [globalSearchResults, setGlobalSearchResults] = useState<{ id: string, name: string }[]>([])
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
    const [openGlobalSearch, setOpenGlobalSearch] = useState(false)
    const [preSelectedPatient, setPreSelectedPatient] = useState<{ id: string, name: string } | null>(null)

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

    // [NEW] Listen for External Search Triggers (from Top Bar)
    useEffect(() => {
        const openDialog = searchParams.get('openDialog')
        const patientId = searchParams.get('patientId')
        const patientName = searchParams.get('patientName')

        if (openDialog === 'true' && patientId) {
            setPreSelectedPatient({ id: patientId, name: patientName || '' })
            setIsApptDialogOpen(true)

            // Clean URL (remove triggers but keep date)
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('openDialog')
            newParams.delete('patientId')
            newParams.delete('patientName')
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

        return matchesProfessional && matchesLocation && matchesSearch && matchesType
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
    const timeslots = step === 60 ? 1 : (step === 15 ? 4 : 2);

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
        // For 'Day' or Mobile view, we really only need the current date, but standardizing a range is fine.
        const start = view === Views.DAY ? date : new Date(date)
        if (view !== Views.DAY) {
            const day = start.getDay()
            const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust for start of week? default date-fns startOfWeek is Sunday
            // Use simple logic matching existing view
            // Assume Sunday start for now or use date-fns
        }

        // Simpler: iterate 7 days around date
        const viewStart = new Date(date)
        viewStart.setDate(date.getDate() - date.getDay()) // Sunday
        viewStart.setHours(0, 0, 0, 0)

        for (let i = 0; i < 7; i++) {
            const currDate = new Date(viewStart)
            currDate.setDate(viewStart.getDate() + i)
            const dayOfWeek = currDate.getDay()

            const slots = selectedProfObj.professional_availability?.filter((a: any) => a.day_of_week === dayOfWeek) || []

            // [FIX] Merge overlapping slots to avoid duplicate "Livre" blocks
            const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
            const mergedSlots: any[] = []
            let currentSlot: any = null

            for (const slot of sortedSlots) {
                if (!currentSlot) {
                    currentSlot = { ...slot }
                } else {
                    // Check overlap (string comparison works for HH:MM)
                    if (slot.start_time <= currentSlot.end_time) {
                        // Merge if extends
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

                // [NEW] Granular Slot Generation (15 min) with Merging
                const internalStep = 15
                let currentFreeStart: Date | null = null

                while (time < endTime) {
                    const slotEnd = new Date(time.getTime() + internalStep * 60000)
                    if (slotEnd > endTime) {
                        // Handle remainder if any (though usually slots are multiples of 15)
                        if (currentFreeStart) {
                            pushFreeSlot(currentFreeStart, endTime)
                            currentFreeStart = null
                        }
                        break
                    }

                    // Check Collision with Real Appointments/Blocks
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

                // Final check for last merged slot
                if (currentFreeStart) {
                    pushFreeSlot(currentFreeStart, endTime)
                }

                function pushFreeSlot(s: Date, e: Date) {
                    // Find Location Color
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
    // Merge for display - Put availabilityEvents FIRST so Appointments overlap them (higher z-order)
    let displayEvents = [...availabilityEvents, ...filteredAppointments]

    // [NEW] Final Filter for "Free Slots" (since they are added after the first filter)
    if (filterType === 'scheduled') {
        displayEvents = displayEvents.filter(e => e.resource?.type !== 'free_slot')
    } else if (filterType === 'free') {
        displayEvents = displayEvents.filter(e => e.resource?.type === 'free_slot')
    }

    // Effect to auto-switch view when dependencies change
    // We only switch between WEEK and WORK_WEEK automatically. 
    // If user is in DAY mode, we stay in DAY mode (handled by getOptimalView check above? No, simpler to manage via effect)
    useEffect(() => {
        if (view === Views.DAY || view === Views.AGENDA || viewMode === 'list') return

        const optimal = getOptimalView()
        if (view !== optimal) {
            setView(optimal)
        }
    }, [date, filteredAppointments, selectedProfessionalId, view, viewMode])

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
                        {/* Weekend Toggle Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 px-3 text-xs font-semibold transition-all border-dashed",
                                showWeekends ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => setShowWeekends(!showWeekends)}
                        >
                            {showWeekends ? "Ocultar Sáb/Dom" : "Exibir Sáb/Dom"}
                        </Button>

                        {/* Professional Quick Interval Info/Link */}
                        <div className="hidden lg:block">
                            <Select
                                value={step.toString()}
                                onValueChange={(val) => setVisualStep(Number(val))}
                            >
                                <SelectTrigger className="h-8 px-2 bg-muted border-none text-xs text-muted-foreground w-[80px] hover:bg-slate-200 transition-colors">
                                    <SelectValue placeholder={`${step}min`} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Actions (Search Icon, Filter, Plus Icon) - Only if NOT searching */}
            {!isSearching && (
                <div className="md:hidden flex items-center gap-1">
                    {/* 1. Today Button */}
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

                    {/* 2. Professional Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={selectedProfessionalId === 'all' ? 'ghost' : 'secondary'} size="icon" className="h-8 w-8 text-muted-foreground">
                                <Stethoscope className={cn("h-5 w-5", selectedProfessionalId !== 'all' && "text-primary")} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedProfessionalId('all')}>
                                -- selecione --
                            </DropdownMenuItem>
                            {professionals.filter(p => p.has_agenda !== false).map(prof => (
                                <DropdownMenuItem key={prof.id} onClick={() => {
                                    setSelectedProfessionalId(prof.id)
                                    setSelectedLocationId('all') // Reset Location
                                }}>
                                    <div className="flex items-center gap-2">
                                        {prof.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.color }} />}
                                        {prof.full_name}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 3. Location Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={selectedLocationId === 'all' ? 'ghost' : 'secondary'} size="icon" className="h-8 w-8 text-muted-foreground">
                                <MapPin className={cn("h-5 w-5", selectedLocationId !== 'all' && "text-primary")} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedLocationId('all')}>
                                -- selecione --
                            </DropdownMenuItem>
                            {locations.map(loc => (
                                <DropdownMenuItem key={loc.id} onClick={() => {
                                    setSelectedLocationId(loc.id)
                                    setSelectedProfessionalId('all') // Reset Professional
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
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilterType('all')}>
                                Todos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('scheduled')}>
                                Agendados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('free')}>
                                Horários Livres
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)}>
                        <Search className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsBlockDialogOpen(true)}>
                        <Lock className="h-5 w-5 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsApptDialogOpen(true)}>
                        {/* Using standard Plus to match design, not UserPlus */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-red-500"
                        >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
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

            <div className="hidden md:flex items-center gap-2">
                {/* Top Bar Controls Removed - Moved to Sidebar */}
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" size="sm" className="gap-2 bg-white" onClick={() => window.location.reload()}>
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Atualizar
                </Button>
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
                            }, 300)
                        }
                    }}
                    selectedSlot={selectedSlot}
                    appointment={selectedAppointment}
                    holidays={holidays}
                    priceTables={priceTables}
                    initialPatientId={preSelectedPatient?.id}
                    initialProfessionalId={selectedProfessionalId !== 'all' ? selectedProfessionalId : currentUserId} // [NEW] Pass context
                />
                <BlockDialog
                    professionals={professionals}
                    locations={locations}
                    holidays={holidays}
                    currentUserId={currentUserId}
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

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                {/* Sidebar Controls */}
                {/* Sidebar Controls (Feegow Style) */}
                <div className="hidden md:flex flex-col gap-4 pr-2 w-full max-w-[280px] sticky top-4 self-start">
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
                            <SelectContent>
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
                            <SelectContent>
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
                        <div className="flex bg-muted rounded-md p-1 gap-1 w-full">
                            <Button
                                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-2 flex-1"
                                onClick={() => setViewMode('calendar')}
                            >
                                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                <span className="text-xs">Grade</span>
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-2 flex-1"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-3.5 w-3.5 mr-2" />
                                <span className="text-xs">Lista</span>
                            </Button>
                        </div>

                        {viewMode === 'calendar' && (
                            <div className="grid grid-cols-2 gap-1">
                                <Button
                                    variant={(view === Views.WEEK || view === Views.WORK_WEEK) ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-0"
                                    onClick={() => setView(Views.WEEK)} // Will auto-optimize to WORK_WEEK if empty
                                >
                                    Semana
                                </Button>
                                <Button
                                    variant={view === Views.DAY ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-0"
                                    onClick={() => setView(Views.DAY)}
                                >
                                    Dia
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <Button variant="outline" className="w-full justify-start gap-2 text-slate-600 h-8 border-dashed border-slate-300 hover:bg-slate-50 text-xs px-2" onClick={() => setIsApptDialogOpen(true)}>
                                <span className="truncate">Agendamento</span>
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 text-slate-600 h-8 border-dashed border-slate-300 hover:bg-slate-50 text-xs px-2" onClick={() => setIsBlockDialogOpen(true)}>
                                <span className="truncate">Bloqueio</span>
                            </Button>
                        </div>
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

                    {/* 5. Update Button (Bottom) */}
                    <Button variant="outline" className="w-full gap-2 bg-white" onClick={() => window.location.reload()}>
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Atualizar Calendário
                    </Button>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-lg shadow-sm border p-1 min-h-[500px]">
                    {/* Mobile: iOS-style Timeline OR List */}
                    <div className="md:hidden h-[calc(100vh-80px)]">
                        {viewMode === 'list' ? (
                            <div className="h-full overflow-y-auto p-4 bg-slate-50">
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
                                    paymentMethods={paymentMethods || []} // [NEW]
                                />
                            </div>
                        ) : (
                            <MobileScheduleView
                                date={date}
                                setDate={setDate}
                                events={displayEvents} // Now passing ALL events (including availability)
                                onAddKey={() => setIsApptDialogOpen(true)}
                                onEventClick={handleSelectEvent}
                                onSlotClick={(slotDate) => {
                                    handleSelectSlot({ start: slotDate, end: new Date(slotDate.getTime() + 30 * 60000), resourceId: null })
                                }}
                                // [NEW] Props (Resolved Header Logic)
                                isSearching={isSearching}
                                searchTerm={searchTerm}
                                viewLevel={viewLevel}
                                setViewLevel={setViewLevel}
                                // Priority: Location > Professional > Default
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
                    <div className="hidden md:block">
                        {viewMode === 'calendar' ? (
                            <BigCalendarComponent
                                date={date}
                                onDateChange={setDate}
                                view={view} // [FIXED] Use 'view' state directly
                                onViewChange={setView}
                                selectable={true}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                onBlockCreate={handleBlockCreate} // [NEW] Connect Block Creation
                                appointments={displayEvents}
                                step={step}
                                timeslots={timeslots}
                                themeColor={themeColor} // Pass dynamic color
                                professional={selectedProfessionalId !== 'all' ? selectedProfessional : undefined}
                            />
                        ) : (
                            <div className="p-4">
                                <ScheduleListView appointments={filteredAppointments} paymentMethods={paymentMethods || []} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}
