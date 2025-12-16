"use client"

import { useState, useEffect } from "react"
import { Calendar as BigCalendarComponent } from "@/components/schedule/Calendar"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search, List, Calendar as CalendarIcon } from "lucide-react"
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
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Dialog State
    const [isApptDialogOpen, setIsApptDialogOpen] = useState(false)
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date, resourceId?: string } | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const handleSelectSlot = ({ start, end, resourceId }: any) => {
        setSelectedSlot({ start, end, resourceId })
        setSelectedAppointment(null) // New appointment
        setIsApptDialogOpen(true)
    }

    const handleSelectEvent = (event: any) => {
        setSelectedAppointment(event.resource)
        setSelectedSlot(null) // Edit mode

        if (event.resource.type === 'block') {
            setIsBlockDialogOpen(true)
        } else {
            setIsApptDialogOpen(true)
        }
    }

    const [searchTerm, setSearchTerm] = useState("")

    // Filter States
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(() => {
        // Default to 'me' if user is logged in (Minha Agenda)
        if (currentUserId) return "me"
        return "all"
    })
    const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLocationId || "all")

    // Filter appointments
    const filteredAppointments = initialAppointments.filter(appt => {
        const matchesProfessional =
            selectedProfessionalId === 'all' ||
            (selectedProfessionalId === 'me' && appt.professional_id === currentUserId) ||
            appt.professional_id === selectedProfessionalId

        const matchesLocation = selectedLocationId === 'all' || appt.location_id === selectedLocationId

        // Search Filter
        let matchesSearch = true
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const patientName = appt.patients?.name?.toLowerCase() || ""
            const profName = appt.profiles?.full_name?.toLowerCase() || ""
            matchesSearch = patientName.includes(term) || profName.includes(term)
        }

        return matchesProfessional && matchesLocation && matchesSearch
    })

    // Force visual consistency: Always use 30-minute slots for the grid.
    // Finer granularity (15m appointments) will still visually appear within these slots.
    const step = 30;
    const timeslots = 2;

    // [NEW] Dynamic View Logic
    const getOptimalView = () => {
        // If user explicitly selected Day or Agenda, don't override
        if (view === Views.DAY || view === Views.AGENDA) return view

        const day = date.getDay()
        const isWeekendSelected = day === 0 || day === 6

        // 1. If user clicked a weekend date, showing it is mandatory
        if (isWeekendSelected) return Views.WEEK

        // 2. Check for Weekend Appointments in current week
        const curr = new Date(date)
        const first = curr.getDate() - curr.getDay()
        const firstDay = new Date(curr.setDate(first))
        firstDay.setHours(0, 0, 0, 0)

        const last = first + 6
        const lastDay = new Date(curr.setDate(last))
        lastDay.setHours(23, 59, 59, 999)

        const hasWeekendAppts = filteredAppointments.some(appt => {
            const apptStart = new Date(appt.start_time)
            if (apptStart < firstDay || apptStart > lastDay) return false
            const apptDay = apptStart.getDay()
            return (apptDay === 0 || apptDay === 6)
        })

        if (hasWeekendAppts) return Views.WEEK

        // 3. Check for Professional Availability on Weekend
        // If "All" selected, check if ANY professional works weekend? Or default to Work Week?
        // Let's be conservative: If "All", usually showing M-F is cleaner unless appointments exist.
        // If Specific Professional selected, check their specific availability.

        let profToCheckId = selectedProfessionalId
        if (selectedProfessionalId === 'me' && currentUserId) profToCheckId = currentUserId

        if (profToCheckId !== 'all') {
            const prof = professionals.find(p => p.id === profToCheckId)
            const availability = prof?.professional_availability || []
            // supabase returns array of objects { day_of_week: n }
            const worksWeekend = availability.some((a: any) => a.day_of_week === 0 || a.day_of_week === 6)

            if (worksWeekend) return Views.WEEK
        }

        return Views.WORK_WEEK
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

    // [NEW] Availability Logic for Sidebar Calendar
    const getDailyStatus = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const dayAppts = filteredAppointments.filter(a => a.start_time.startsWith(dateStr))

        if (dayAppts.length === 0) return 'free'

        // Setup heuristic for "Full": > 12 appointments or > 8 hours duration?
        // Simple heuristic: > 10 appointments = Red, otherwise Yellow
        if (dayAppts.length >= 10) return 'full'
        return 'partial'
    }

    const modifiers = {
        free: (date: Date) => getDailyStatus(date) === 'free',
        partial: (date: Date) => getDailyStatus(date) === 'partial',
        full: (date: Date) => getDailyStatus(date) === 'full',
    }

    const modifiersClassNames = {
        free: "bg-green-100/50 hover:bg-green-200/50 data-[selected=true]:bg-primary",
        partial: "bg-yellow-100/70 hover:bg-yellow-200/70 data-[selected=true]:bg-primary",
        full: "bg-red-100/70 hover:bg-red-200/70 data-[selected=true]:bg-primary",
    }

    // [NEW] Dynamic Theme Color
    const selectedProfessional = selectedProfessionalId === 'me'
        ? professionals.find(p => p.id === currentUserId)
        : professionals.find(p => p.id === selectedProfessionalId)

    const themeColor = selectedProfessional?.color || '#59cbbb'

    // Prevent hydration errors by not rendering date-dependent components on server
    if (!isMounted) {
        return null // or a simplified loading state
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ... Header ... */}
            <div className="flex items-center justify-between flex-none">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Agenda</h1>

                    <div className="flex bg-muted rounded-lg p-1 gap-1">
                        <Button
                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                            Grade
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-3.5 w-3.5 mr-2" />
                            Lista
                        </Button>
                    </div>

                    {currentUserId ? (
                        <Link href={`/dashboard/professionals/${currentUserId}?tab=availability`} title="Clique para configurar o intervalo e visualização">
                            <div className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-slate-200 transition-colors">
                                    {step}min
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {step}min
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
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
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                {/* Sidebar Controls */}
                {/* Sidebar Controls (Feegow Style) */}
                <div className="flex flex-col gap-4 pr-2 w-full max-w-[280px] sticky top-4 self-start">
                    {/* 1. Search */}
                    <div className="bg-white rounded-md border shadow-sm p-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Busca rápida..."
                                className="pl-8 h-9 bg-slate-50 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                                <SelectItem value="all">Todos os Profissionais</SelectItem>
                                {currentUserId && <SelectItem value="me">Minha Agenda</SelectItem>}
                                {professionals.length > 0 && <Separator className="my-1 opacity-50" />}
                                {professionals.map(prof => (
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
                                <SelectItem value="all">Todos os Locais</SelectItem>
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
                            <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground pb-2">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-100 border border-green-200"></div>Livre</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-100 border border-yellow-200"></div>Ocupado</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-100 border border-red-200"></div>Cheio</div>
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
                <div className="bg-white rounded-lg shadow-sm border p-1">
                    {viewMode === 'calendar' ? (
                        <BigCalendarComponent
                            date={date}
                            onDateChange={setDate}
                            view={view} // [FIXED] Use 'view' state directly
                            onViewChange={setView}
                            selectable={true}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            appointments={filteredAppointments}
                            step={step}
                            timeslots={timeslots}
                            themeColor={themeColor} // Pass dynamic color
                        />
                    ) : (
                        <div className="p-4">
                            <ScheduleListView appointments={filteredAppointments} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
