"use client"

import { useState, useEffect } from "react"
import { Calendar as BigCalendarComponent } from "@/components/schedule/Calendar"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search, List, Calendar as CalendarIcon } from "lucide-react"
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
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all")
    const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLocationId || "all")

    // Filter appointments
    const filteredAppointments = initialAppointments.filter(appt => {
        const matchesProfessional = selectedProfessionalId === 'all' || appt.professional_id === selectedProfessionalId
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

    const getOptimalView = () => {
        const day = date.getDay()
        const isWeekendSelected = day === 0 || day === 6

        // Calculate start/end of current week to only check relevant appointments
        const curr = new Date(date)
        const first = curr.getDate() - curr.getDay() // First day is the day of the month - the day of the week
        const firstDay = new Date(curr.setDate(first))
        firstDay.setHours(0, 0, 0, 0)

        const last = first + 6
        const lastDay = new Date(curr.setDate(last))
        lastDay.setHours(23, 59, 59, 999)

        const hasWeekendAppts = filteredAppointments.some(appt => {
            const apptStart = new Date(appt.start_time)
            // Check if appt is in this week
            if (apptStart < firstDay || apptStart > lastDay) return false

            const apptDay = apptStart.getDay()
            return (apptDay === 0 || apptDay === 6)
        })

        if (isWeekendSelected || hasWeekendAppts) {
            return Views.WEEK
        }

        return Views.WORK_WEEK
    }

    const currentView = getOptimalView()

    // Prevent hydration errors by not rendering date-dependent components on server
    if (!isMounted) {
        return null // or a simplified loading state
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ... Header ... */}
            <div className="flex items-center justify-between flex-none">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-800">Agenda Semanal</h1>

                    <div className="flex gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Intervalo: {step}min
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {currentView === Views.WEEK ? 'Semana Completa' : 'Seg-Sex'}
                        </span>
                    </div>
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
                            <div className="grid grid-cols-3 gap-1">
                                <Button
                                    variant={view === Views.MONTH ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-0"
                                    onClick={() => setView(Views.MONTH)}
                                >
                                    Mês
                                </Button>
                                <Button
                                    variant={view === Views.WEEK ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-0"
                                    onClick={() => setView(Views.WEEK)}
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
                            />
                        </div>
                    </div>

                    {/* 5. Update Button (Bottom) */}
                    <Button variant="outline" className="w-full gap-2 bg-white" onClick={() => window.location.reload()}>
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Atualizar Calendário
                    </Button>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-lg shadow-sm border p-1 overflow-hidden">
                    {viewMode === 'calendar' ? (
                        <BigCalendarComponent
                            date={date}
                            onDateChange={setDate}
                            view={currentView} // Use dynamic view
                            onViewChange={setView}
                            selectable={true}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            appointments={filteredAppointments}
                            step={step}
                            timeslots={timeslots}
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
