"use client"

import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from "react-big-calendar"
import { format } from "date-fns/format"
import { parse } from "date-fns/parse"
import { startOfWeek } from "date-fns/startOfWeek"
import { getDay } from "date-fns/getDay"
import { ptBR } from "date-fns/locale/pt-BR"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar-overrides.css"

import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppointmentContextMenu } from "./AppointmentContextMenu"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { AppointmentCard } from "./AppointmentCard" // [NEW]

// [MOVED INSIDE COMPONENT TO ACCESS PROPS]

const locales = {
    "pt-BR": ptBR,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

export function Calendar({
    date,
    onDateChange,
    view,
    onViewChange,
    selectable,
    onSelectSlot,
    appointments = [],
    step = 30, // Default value
    timeslots = 2, // Default value
    onSelectEvent,
    themeColor,
    professional, // [NEW] Current professional for availability check
    onBlockCreate, // [NEW]
    holidays // [NEW] - Array of { date: string, name: string, is_mandatory: boolean }
}: {
    date: Date
    onDateChange: (date: Date) => void
    view: View
    onViewChange: (view: View) => void
    selectable?: boolean
    onSelectSlot?: (slotInfo: { start: Date, end: Date, action?: string }) => void
    onSelectEvent?: (event: any) => void
    onBlockCreate?: (slotInfo: { start: Date, end: Date }) => void // [NEW]
    appointments?: any[]
    step?: number
    timeslots?: number
    themeColor?: string
    professional?: any // [NEW]
    holidays?: any[] // [NEW] - Array of { date: string, name: string, is_mandatory: boolean }
}) {
    // ... existing events mapping ... (lines 54-80) removed from here for brevity, assume they are kept by context

    // [New] Mobile Detection
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768 // Standard Tablet/Mobile Breakpoint
            setIsMobile(mobile)

            // Auto-switch to day view on mobile if currently in week/work_week
            if (mobile && (view === 'week' || view === 'work_week')) {
                onViewChange('day')
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [view, onViewChange])

    // [NEW] Merge Holidays into Appointments/Events
    const combinedAppointments = [...appointments]

    // Create "Fake" appointments for Holidays to visualize them
    if (holidays) {
        holidays.forEach(h => {
            // Check if there's already a block for this mandatory holiday to avoid double visual
            // Currently generateHolidays creates a 'block' appointment.
            // So we might duplicate if we add another event here.
            // BUT, generateHolidays creates blocks for MANDATORY only.
            // OPTIONAL holidays need to be added here.

            if (!h.is_mandatory) {
                // Optional Holiday -> Add as 'optional_holiday' event
                // This will be handled by style getters
                const dateParts = h.date.split('-').map(Number)
                const start = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
                const end = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59)

                combinedAppointments.push({
                    id: `holiday-${h.date}`,
                    type: 'optional_holiday',
                    title: h.name,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    all_day: true, // Show in header
                    is_mandatory: false
                })
            }
        })
    }

    const events = combinedAppointments.map(appt => {
        // [NEW] Pass through pre-formatted "Free Slot" events, but WRAP them so style getter works
        if (appt.type === 'free_slot') {
            return {
                ...appt,
                resource: appt
            }
        }

        if (appt.type === 'optional_holiday') {
            return {
                id: appt.id,
                title: appt.title,
                start: new Date(appt.start_time),
                end: new Date(appt.end_time),
                allDay: true,
                resource: appt,
                isBackground: true // Custom flag to identify for backgroundEvents array
            }
        }

        if (appt.type === 'block') {
            const eventTitle = appt.title || appt.notes?.split('\n')[0] || 'BLOQUEIO'
            const start = new Date(appt.start_time)
            const end = new Date(appt.end_time)

            // Fix for Full Day Blocks (react-big-calendar requires end date to be exclusive for day range)
            return {
                id: appt.id,
                title: eventTitle,
                start,
                end,
                resourceId: appt.professional_id,
                resource: appt,
                color: '#ef4444', // red-500
                allDay: appt.all_day || false
            }
        }

        const patientName = appt.patients?.name || 'Paciente s/ nome'
        const profileName = appt.profiles?.full_name?.split(' ')[0] || 'Profissional'
        return {
            id: appt.id,
            title: patientName + ' - ' + profileName,
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            resource: {
                ...appt,
                // Explicitly ensure these exist in resource
                status: appt.status,
                payment_method_id: appt.payment_method_id,
                type: appt.type,
                patients: appt.patients,
                services: appt.services,
                notes: appt.notes
            },
            color: appt.profiles?.color || '#3b82f6'
        }
    })

    // ... min/max time calculation ... (lines 84-124) preserved

    const referenceDate = new Date()
    referenceDate.setHours(0, 0, 0, 0);
    let minTime = new Date(referenceDate)
    minTime.setHours(6, 0, 0, 0)
    let maxTime = new Date(referenceDate)
    maxTime.setHours(23, 0, 0, 0)

    // [NEW] Separate Blocks into Background Events
    const standardEvents: any[] = []
    const backgroundEvents: any[] = []

    events.forEach(event => {
        if (event.resource?.type === 'block') {
            // Blocks are now Standard Events to show Title clearly?
            // User wants "Card". Standard events are cards. Background are just color.
            // If I make them standard, they block the view.
            // If I make them background, I need All Day event for title.
            // Let's use Background for Color + Standard Events for content if they are partial day.
            // For full day blocks, All Day event is best.

            // Check if full day
            const isFullDay = (event.end.getTime() - event.start.getTime()) >= 24 * 60 * 60 * 1000 - 1000 // approx

            // Always push to background for color
            backgroundEvents.push(event)

            // Push to standard ONLY if not full day? Or always?
            // If I push to standard, it shows the card.
            // Let's push to standard so "Card" appears.
            standardEvents.push(event)
        } else if (event.resource?.type === 'optional_holiday') {
            // Optional Holidays: Background (Yellow) + All Day (Title)
            backgroundEvents.push(event)
            standardEvents.push(event) // It's marked allDay: true, so it goes to header.
        } else {
            standardEvents.push(event)
        }
    })

    const eventStyleGetter = (event: any) => {
        // [NEW] Free Slot Styling
        if (event.resource?.type === 'free_slot') {
            return {
                style: {
                    backgroundColor: '#f9fafb', // gray-50
                    color: '#9ca3af', // gray-400
                    border: '0px',
                    borderLeft: '4px solid #e5e7eb', // gray-200
                    borderRadius: '6px',
                    opacity: 1,
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }
            }
        }

        // [NEW] Optional Holiday Styling (Yellow)
        if (event.resource?.type === 'optional_holiday') {
            return {
                style: {
                    backgroundColor: '#fefce8', // yellow-50
                    color: '#854d0e', // yellow-800
                    border: '1px solid #fde047', // yellow-300
                    borderLeft: '4px solid #eab308', // yellow-500
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    display: 'block'
                }
            }
        }

        // [NEW] Block Styling (Pink/Red)
        if (event.resource?.type === 'block') {
            return {
                style: {
                    backgroundColor: '#fef2f2', // red-50
                    color: '#991b1b', // red-800
                    border: '1px solid #fecaca', // red-200
                    borderLeft: '4px solid #ef4444', // red-500
                    opacity: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                }
            }
        }
        // APPOINTMENT STYLING
        // [Fixed] Normalize Data Access with Fallbacks
        const data = event.resource || event
        const status = data.status || data.resource?.status
        const serviceColor = data.services?.color || data.resource?.services?.color || '#cbd5e1' // Default slate-300

        // Base Style Container (RBC Wrapper)
        const style = {
            backgroundColor: 'transparent',
            color: 'inherit',
            border: 'none',
            borderLeft: 'none',
            display: 'block',
            borderRadius: '0px',
            opacity: 1,
            boxShadow: 'none',
            fontSize: '0.80rem',
            padding: '0px',
            overflow: 'hidden' // Clip internal content
        }

        // All styling is now handled by the Base Style above (RBC Wrapper is transparent)
        // and the AppointmentCard itself handles the visuals.


        return {
            style,
            title: '' // [FIX] Suppress default browser tooltip
        }
    }

    // [NEW] Slot Styling for Availability
    const slotPropGetter = (date: Date) => {
        // Only valid if a professional is selected
        if (!professional) return {}

        const day = date.getDay()
        const availability = professional.professional_availability || []
        const slotsForDay = availability.filter((a: any) => a.day_of_week === day)

        // If no slots for this day -> Unavailable
        if (slotsForDay.length === 0) {
            return {
                style: {
                    backgroundColor: 'white', // Changed from gray to white as requested
                    cursor: 'default',
                    opacity: 1
                }
            }
        }

        // Check if time is within any slot
        const timeMins = date.getHours() * 60 + date.getMinutes()
        const isWorking = slotsForDay.some((slot: any) => {
            if (!slot.start_time || !slot.end_time) return false
            const [sh, sm] = slot.start_time.split(':').map(Number)
            const [eh, em] = slot.end_time.split(':').map(Number)
            const startMins = sh * 60 + sm
            const endMins = eh * 60 + em
            // RBC renders slots starting at 'date'. 
            // We consider it working if the ENTIRE slot fits? Or assumes start time is enough?
            // Usually start time check is enough for visual cue.
            return timeMins >= startMins && timeMins < endMins
        })

        if (!isWorking) {
            return {
                style: {
                    backgroundColor: 'white', // Changed from gray to white as requested
                    cursor: 'default',
                    opacity: 1
                }
            }
        }

        // [NEW] Check for BLOCKS logic (Red Background)
        // We do this check regardless of availability? 
        // User wants "as if the column... became light red".
        // Priority: If available but blocked -> Red.
        // If unavailable -> White/Gray (already handled?).
        // Actually, Block usually implies unavailability, but it's an explicit event.

        // Find blocks
        const checkTimeMins = date.getHours() * 60 + date.getMinutes()

        // Check Block Intersections
        const isBlockedSlot = appointments.some((appt: any) => {
            if (appt.type !== 'block') return false

            const start = new Date(appt.start_time)
            const end = new Date(appt.end_time)

            // Check Date Intersections
            const slotStart = date
            const slotEnd = new Date(date.getTime() + (step || 30) * 60000)

            // Overlap: StartA < EndB && EndA > StartB
            return (slotStart < end && slotEnd > start)
        })

        if (isBlockedSlot) {
            return {
                style: {
                    backgroundColor: '#fef2f2', // red-50
                    borderLeft: '4px solid #ef4444', // red-500 (Matches Block Card)
                    opacity: 1
                },
                className: 'blocked-slot'
            }
        }

        // [NEW] Optional Holidays Logic
        // We will need to pass `holidays` prop to Calendar
        // const isOptionalHoliday = holidays?.some(h => h.date === dateStr && !h.is_mandatory)
        // if (isOptionalHoliday) { return { style: { backgroundColor: '#fefce8' } } } -- Will do this after adding prop.



        // [NEW] Optional Holidays Logic
        // Check if there is an optional holiday on this day (DATE string comparison)
        const dateString = format(date, 'yyyy-MM-dd')
        const optionalHoliday = holidays?.find(h => h.date === dateString && !h.is_mandatory)

        if (optionalHoliday) {
            return {
                style: {
                    backgroundColor: '#fffbeb', // amber-50 (Yellow-ish)
                    borderLeft: '4px solid #f59e0b', // amber-500
                    opacity: 1
                },
                title: optionalHoliday.name // Can we set title? No, it's just style.
            }
        }

        return {}
    }

    const scrollToTime = new Date()
    scrollToTime.setHours(7, 0, 0, 0)

    // ... height calc ...

    // [NEW] Stable Components Definition
    const components = useMemo(() => ({
        eventWrapper: ({ event, children }: any) => {
            // [FIX] Apply Context Menu to "Free Slots" here (Outer Wrapper)
            // This ensures the click is captured even on padding/margins
            if (event.resource?.type === 'free_slot') {
                const start = event.start
                const end = event.end
                return (
                    <ContextMenu>
                        <ContextMenuTrigger className="block w-full h-full">
                            {children}
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => onSelectSlot && onSelectSlot({ start, end })}>
                                Novo Agendamento
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onBlockCreate && onBlockCreate({ start, end })}>
                                Novo Bloqueio
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                )
            }
            return <div>{children}</div>
        },
        event: ({ event }: any) => {
            const isAppointment = event.resource?.type !== 'free_slot' && event.resource?.type !== 'block'

            // [NEW] Calculate Dot Color matching the side border
            const data = event.resource || event
            const status = data.status || data.resource?.status
            const isPaid = !!(data.payment_method_id || data.resource?.payment_method_id)
            const serviceColor = event.resource?.services?.color || '#3b82f6'

            let dotColor = serviceColor
            if (data.type === 'free_slot') {
                dotColor = '#cbd5e1' // gray-300
            } else if (status === 'checked_in') {
                dotColor = serviceColor // Keep service color but gray background? Or Gray dot? 
                // User said "Aguardando: paciente chegou...". Usually implies neutral or specific.
                // Let's keep Service Color for consistency of "What is this appointment", 
                // but the CARD background is Gray. 
                // Actually, user liked "Service Color Dot".
            } else if (status === 'attended') {
                // Yellow
                // dotColor = '#facc15' // Optional override if we want status-colored dots allowed
            } else if (status === 'completed') { // Faturado / Recebido
                dotColor = isPaid ? '#16a34a' : '#ca8a04'
            } else if (status === 'no_show') {
                dotColor = '#ef4444' // Red override
            } else if (data.type === 'block') {
                dotColor = '#ef4444'
            }

            const content = (
                <div className="h-full w-full relative flex flex-col items-start pt-[2px]" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    color: event.resource?.type === 'block' ? 'inherit' : '#334155',
                    textShadow: event.resource?.type === 'block' ? 'none' : '0 1px 2px rgba(255,255,255,0.5)'
                }}>
                    <div className="flex w-full items-center justify-between pl-1 pr-1">
                        {/* Custom Time Display */}
                        <span className="text-[10px] opacity-90 font-medium leading-tight">
                            {/* [FIX] Hide detailed time for Full Day Blocks */}
                            {event.resource?.type === 'block' &&
                                format(event.start, 'HH:mm') === '00:00' &&
                                format(event.end, 'HH:mm') === '23:59'
                                ? '' // Hide time for full days in middle of block
                                : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`
                            }
                        </span>

                        {/* Dot Indicator - Perfectly aligned with Time */}
                        <div
                            className="h-1.5 w-1.5 rounded-full shrink-0 ml-1"
                            style={{ backgroundColor: dotColor }}
                        />
                    </div>

                    {/* Event Title */}
                    <div className="pl-1 pr-1 truncate w-full pt-[1px]">
                        {event.title}
                    </div>
                </div>
            )

            if (!isAppointment) {
                // [FIX] Add Click Handler for Blocks too!
                if (event.resource?.type === 'block') {
                    return (
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                                // Only Trigger on Left Click
                                if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                                    onSelectEvent && onSelectEvent(event)
                                }
                            }}
                            className="h-full w-full"
                        >
                            {content}
                        </div>
                    )
                }
                // For Free Slots, render content directly (eventWrapper handles interaction)
                return content
            }

            // Appointment Tooltip & Context Menu
            // [MODIFIED] Use AppointmentCard instead of custom div
            return (
                <AppointmentContextMenu appointment={event.resource} onEdit={() => onSelectEvent && onSelectEvent(event)}>
                    <div
                        className="h-full w-full"
                    // We don't need Tooltip here anymore because AppointmentCard has visual cues?
                    // Or maybe we keep Tooltip wrapper around the Card?
                    // The Card has its own ToolTips for buttons. 
                    // Let's keep context menu wrapper.
                    >
                        <AppointmentCard
                            appointment={event.resource}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                                    onSelectEvent && onSelectEvent(event)
                                }
                            }}
                            // Hide time if it's too short? 20min slots?
                            hideTime={false}
                        />
                    </div>
                </AppointmentContextMenu>
            )
        },
        timeSlotWrapper: (props: any) => {
            const start = props.value
            const end = new Date(start.getTime() + (step || 30) * 60000)

            // Check if this slot is covered by a BLOCK
            const overlappingBlock = backgroundEvents.find(block => {
                const bStart = new Date(block.start)
                const bEnd = new Date(block.end)
                return (start < bEnd && end > bStart)
            })

            if (overlappingBlock) {
                return (
                    <ContextMenu>
                        <ContextMenuTrigger
                            className="block h-full w-full"
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectEvent && onSelectEvent(overlappingBlock)
                            }}
                        >
                            {props.children}
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => onSelectEvent && onSelectEvent(overlappingBlock)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Bloqueio
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onSelectSlot && onSelectSlot({ start, end, action: 'force_create' })}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Agendamento (Encaixe)
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onSelectEvent && onSelectEvent(overlappingBlock)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Gerenciar Bloqueio
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                )
            }

            // FREE SLOT
            return (
                <ContextMenu>
                    <ContextMenuTrigger className="block h-full w-full">
                        {props.children}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => onSelectSlot && onSelectSlot({ start, end })}>
                            Novo Agendamento
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onBlockCreate && onBlockCreate({ start, end })}>
                            Novo Bloqueio
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            )
        },
        toolbar: (props: any) => {
            const goToBack = () => {
                props.onNavigate('PREV')
            }
            const goToNext = () => {
                props.onNavigate('NEXT')
            }
            const goToCurrent = () => {
                props.onNavigate('TODAY')
            }

            const label = props.label

            return (
                <div className="flex flex-col gap-2 mb-4 relative z-10">
                    <div className="flex items-center justify-between px-1 py-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold capitalize text-slate-800 tracking-tight min-w-[200px]">
                                {label}
                            </h2>
                            <div className="flex items-center border rounded-md shadow-sm bg-white">
                                <button
                                    onClick={goToBack}
                                    className="p-1.5 hover:bg-slate-50 border-r text-slate-600 transition-colors"
                                    title="Anterior"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToCurrent}
                                    className="px-4 py-1.5 text-xs font-bold uppercase text-primary bg-slate-100 hover:bg-slate-100 transition-colors"
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="p-1.5 hover:bg-slate-50 border-l text-slate-600 transition-colors"
                                    title="Próximo"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* View Buttons Removed - Moved to External Sidebar */}
                        <div />
                    </div>
                </div>
            )
        }
    }), [onSelectSlot, onBlockCreate, backgroundEvents, onSelectEvent, step])

    const totalDurationMinutes = (maxTime.getTime() - minTime.getTime()) / (1000 * 60);
    const slotDurationMinutes = (step || 30) / (timeslots || 2);
    const totalSlots = Math.ceil(totalDurationMinutes / slotDurationMinutes);
    const pixelPerSlot = 15;
    const headerHeight = 64;

    return (
        <Card
            className={`p-4 text-sm shadow-sm border-0 bg-white ${isMobile ? 'mobile-calendar' : ''}`}
            style={{
                height: '100%',
                // @ts-ignore
                '--schedule-theme-color': themeColor || '#59cbbb',
                // [NEW] Dynamic CSS Variable for TimeSlot Height
                // @ts-ignore
                '--rbc-slot-height': isMobile ? '90px' : '60px' // Taller height on mobile for easier touch (90px) vs Desktop (60px)
            }}
        >
            <BigCalendar
                popup
                localizer={localizer}
                events={standardEvents} // [FIX] Only appointments/free slots here
                backgroundEvents={backgroundEvents} // [FIX] Blocks go here
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                view={view}
                onView={onViewChange}
                date={date}
                onNavigate={onDateChange}
                views={['month', 'week', 'work_week', 'day', 'agenda']}
                selectable={selectable}
                onSelectSlot={onSelectSlot}
                onSelectEvent={undefined} // [FIX] Disable default to prevent Flash. We handle clicks manually in components.event
                step={step || 15}
                timeslots={timeslots || 2}
                min={minTime}
                max={maxTime}
                scrollToTime={scrollToTime}
                culture="pt-BR"
                eventPropGetter={eventStyleGetter}
                slotPropGetter={slotPropGetter} // [NEW]
                messages={{
                    next: "Próximo",
                    previous: "Anterior",
                    today: "Hoje",
                    month: "Mês",
                    week: "Semana",
                    work_week: "Semana Útil",
                    day: "Dia",
                    agenda: "Agenda",
                    date: "Data",
                    time: "Hora",
                    event: "Evento",
                    noEventsInRange: "Sem atendimentos neste período.",
                }}

                titleAccessor="title"
                components={components}
            />
        </Card >
    )
}
