"use client"

import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Stethoscope, Activity, Smile, Pill, Heart, Brain, Apple, Clipboard, GraduationCap, HardHat, Scale, Calculator, Briefcase, Ruler, Monitor, Car, Users, HeartPulse, User, Baby, Ribbon, RefreshCcw } from "lucide-react"
import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from "react-big-calendar"
import { format } from "date-fns/format"
import { parse } from "date-fns/parse"
import { startOfWeek } from "date-fns/startOfWeek"
import { getDay } from "date-fns/getDay"
import { ptBR } from "date-fns/locale/pt-BR"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import "./calendar-overrides.css"
import { cn } from "@/lib/utils"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"

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
import { getCommemorationForDate } from "@/lib/commemorative-dates"

// [MOVED INSIDE COMPONENT TO ACCESS PROPS]

// Map icon names to Lucide components
const iconMap: Record<string, any> = {
    Stethoscope, Activity, Smile, Pill, Heart, Brain, Apple, Clipboard,
    GraduationCap, HardHat, Scale, Calculator, Briefcase, Ruler, Monitor,
    Car, Users, HeartPulse, User, Baby, Ribbon
}

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

const DnDCalendar = withDragAndDrop(BigCalendar as any) as any

// [NEW] Separate Component for the Date Header to avoid "More Hooks Rendering" error
const CalendarDateHeader = ({ date, view, professional }: any) => {
    const dayName = format(date, "EEE", { locale: ptBR }).replace('.', '').substring(0, 3).toUpperCase()
    const dayNumber = format(date, "d")
    const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')

    // Professional Color (Default to Blue if missing)
    const themeColor = professional?.color || '#3b82f6'

    return (
        <div className="flex flex-col items-center justify-center py-2 w-full h-full group">
            <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 relative overflow-hidden",
                isToday
                    ? "bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 ring-1 ring-slate-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
            )}>
                {/* Day Number */}
                <span className={cn(
                    "text-2xl font-black tracking-tighter leading-none transition-colors",
                    isToday ? "text-slate-900 dark:text-white" : "text-slate-400 group-hover:text-slate-600"
                )}>
                    {dayNumber}
                </span>

                {/* Day Name Abbr */}
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest leading-none opacity-80 transition-colors",
                    isToday ? "text-primary" : "text-slate-300 group-hover:text-slate-400"
                )}>
                    {dayName}
                </span>

                {/* Subtle glassmorphism highlight for Today */}
                {isToday && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                )}
            </div>

            {/* Dynamic indicator bar for Today - Always visible but styled differently if not today? No, only for today. */}
            {isToday && (
                <div
                    className="h-1.5 w-10 rounded-full mt-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: themeColor }}
                />
            )}
        </div>
    )
}

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
    holidays, // [NEW] - Array of { date: string, name: string, is_mandatory: boolean }
    onRefresh, // [NEW]
    onEventDrop,
    onEventResize,
    onDoubleClickEvent
}: {
    date: Date
    onDateChange: (date: Date) => void
    view: View
    onViewChange: (view: View) => void
    selectable?: boolean
    onSelectSlot?: (slotInfo: { start: Date, end: Date, action?: string }) => void
    onSelectEvent?: (event: any, e?: React.SyntheticEvent) => void
    onBlockCreate?: (slotInfo: { start: Date, end: Date }) => void // [NEW]
    appointments?: any[]
    step?: number
    timeslots?: number
    themeColor?: string
    professional?: any // [NEW]
    holidays?: any[] // [NEW] - Array of { date: string, name: string, is_mandatory: boolean }
    onRefresh?: () => void // [NEW]
    onEventDrop?: (args: any) => void
    onEventResize?: (args: any) => void
    onDoubleClickEvent?: (event: any) => void
}) {
    // ... existing events mapping ... (lines 54-80) removed from here for brevity, assume they are kept by context

    // [New] Mobile Detection
    const [isMobile, setIsMobile] = useState(false)

    // [NEW] Ref to track clicks on free slots for manual double-click detection
    const lastFreeSlotClickRef = useRef<{ time: number; eventId: string } | null>(null)

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

            // [FIX] Detect full-day blocks (duration >= ~23h50m)
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            const isFullDay = appt.all_day || durationHours >= 23.5

            console.log('[BLOCK DEBUG]', eventTitle, 'Duration:', durationHours.toFixed(2), 'h', 'isFullDay:', isFullDay)

            // Fix for Full Day Blocks (react-big-calendar requires end date to be exclusive for day range)
            return {
                id: appt.id,
                title: eventTitle,
                start,
                end,
                resourceId: appt.professional_id,
                resource: appt,
                color: '#ef4444', // red-500
                allDay: isFullDay  // [FIX] Force full-day blocks to header
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
        const isBlock = event.resource?.type === 'block'
        const isOptionalHoliday = event.resource?.type === 'optional_holiday'
        const isFullDay = event.allDay

        if (isBlock) {
            if (isFullDay) {
                // [USER REQUEST] Full day blocks: ONLY standard (header), 
                // no background grid color.
                standardEvents.push(event)
            } else {
                // Partial day blocks: Standard only
                // [FIX] Removed from backgroundEvents to avoid duplicate dot/rendering
                standardEvents.push(event)
            }
        } else if (isOptionalHoliday) {
            // Optional Holidays: Both (Header title + Background color)
            backgroundEvents.push(event)
            standardEvents.push(event)
        } else {
            // Appointments and Free Slots
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
                    display: 'block',
                    pointerEvents: 'none'
                }
            }
        }

        // [NEW] Block Styling (Pink/Red)
        // [FIX] Robust Block Type Detection
        if (event.type === 'block' || event.resource?.type === 'block') {
            return {
                style: {
                    backgroundColor: '#fef2f2', // red-50
                    color: '#991b1b', // red-800
                    border: '1px solid #fecaca', // red-200
                    borderLeft: '4px solid #ef4444', // red-500
                    opacity: 1,
                    fontSize: '0.75rem',
                    fontWeight: 700,
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
                    backgroundColor: 'white', // Gutter is white, CSS handles capsule red
                    cursor: 'default',
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
                const eventId = `${start.getTime()}-${end.getTime()}`

                // Manual double-click detection for free slots using ref
                const handleMouseDown = (e: React.MouseEvent) => {
                    // Only handle left clicks
                    if (e.button !== 0) return

                    const now = Date.now()
                    const lastClick = lastFreeSlotClickRef.current

                    console.log('[FREE_SLOT_WRAPPER] MouseDown detected!', {
                        eventId,
                        lastClick,
                        timeSinceLastClick: lastClick ? now - lastClick.time : 'N/A'
                    })

                    if (lastClick && lastClick.eventId === eventId && (now - lastClick.time) < 500) {
                        // Double click detected on same event!
                        console.log('[FREE_SLOT_WRAPPER] DOUBLE CLICK CONFIRMED!')
                        e.preventDefault()
                        e.stopPropagation()
                        onDoubleClickEvent && onDoubleClickEvent(event)
                        lastFreeSlotClickRef.current = null // Reset
                    } else {
                        // First click or different event
                        lastFreeSlotClickRef.current = { time: now, eventId }
                    }
                }

                return (
                    <div
                        className="w-full h-full"
                        onMouseDown={handleMouseDown}
                        onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDoubleClickEvent && onDoubleClickEvent(event)
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {children}
                    </div>
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
                dotColor = serviceColor
            } else if (status === 'attended') {
                // Yellow
            } else if (status === 'billed') { // Faturado / Recebido
                dotColor = isPaid ? '#16a34a' : '#ca8a04'
            } else if (status === 'no_show') {
                dotColor = '#ef4444' // Red override
            } else if (data.type === 'block') {
                dotColor = '#ef4444'
            }

            const isBlock = event.type === 'block' || event.resource?.type === 'block'

            const content = (
                <div className="h-full w-full relative overflow-visible pointer-events-none" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    color: isBlock ? '#991b1b' : '#334155',
                }}>
                    {/* Dot Indicator - PINNED TO CORNER (Foto 1) */}
                    <div
                        className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0 z-20 absolute",
                            isBlock ? "top-1.5 right-1.5" : "top-1 right-1"
                        )}
                        style={{ backgroundColor: dotColor }}
                    />

                    <div className={cn(
                        "h-full w-full flex flex-col",
                        isBlock ? "items-center justify-center p-2 text-center" : "items-start pt-[2px]"
                    )}>
                        {!isBlock && (
                            <div className="flex w-full items-center justify-between pl-1 pr-1">
                                {/* Custom Time Display */}
                                <span className="text-[10px] opacity-90 font-medium leading-tight">
                                    {`${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
                                </span>
                            </div>
                        )}

                        {/* Event Title */}
                        <div className={cn(
                            "pl-1 pr-1 truncate w-full",
                            isBlock ? "font-bold" : "pt-[1px]"
                        )}>
                            {event.title}
                        </div>
                    </div>
                </div>
            )

            if (event.resource?.type === 'free_slot') {
                return (
                    <div
                        className="h-full w-full"
                        onDoubleClick={(e) => {
                            console.log('[FREE_SLOT_EVENT] Double click on event component!')
                            e.stopPropagation()
                            onDoubleClickEvent && onDoubleClickEvent(event)
                        }}
                    >
                        {content}
                    </div>
                )
            }

            if (!isAppointment) {
                // [FIX] Simplified Block Interaction
                if (isBlock) {
                    return (
                        <div
                            className={cn("h-full w-full relative overflow-visible cursor-pointer rbc-block-event")}
                            onMouseDown={(e) => {
                                if (e.button === 0 || e.button === 2) {
                                    e.stopPropagation()
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelectEvent && onSelectEvent(event, e)
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onSelectEvent && onSelectEvent(event, e)
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                onDoubleClickEvent && onDoubleClickEvent(event)
                            }}
                        >
                            {content}
                        </div>
                    )
                }
                return content
            }

            // Appointment Tooltip & Context Menu
            // [MODIFIED] Using a cleaner wrapper for all click types
            return (
                <div
                    className="h-full w-full cursor-pointer"
                    onMouseDown={(e) => {
                        if (e.button === 0 || e.button === 2) {
                            e.stopPropagation()
                        }
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent && onSelectEvent(event, e)
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onSelectEvent && onSelectEvent(event, e)
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation()
                        onDoubleClickEvent && onDoubleClickEvent(event)
                    }}
                >
                    <AppointmentCard
                        appointment={event.resource}
                        hideTime={false}
                    />
                </div>
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
                    <div className="grid grid-cols-3 items-center px-1 py-2">
                        {/* LEFT: Navigation Buttons */}
                        <div className="flex justify-start">
                            <div className="flex items-center border rounded-md shadow-sm bg-white">
                                <button
                                    onClick={goToBack}
                                    className="p-1.5 hover:bg-slate-50 border-r text-slate-600 transition-colors"
                                    title="Anterior"
                                    type="button"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToCurrent}
                                    className="px-4 py-1.5 text-xs font-bold uppercase text-primary hover:bg-slate-50 transition-colors"
                                    type="button"
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="p-1.5 hover:bg-slate-50 border-l text-slate-600 transition-colors"
                                    title="Próximo"
                                    type="button"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* CENTER: Date Label - Enhanced for Day View */}
                        <div className="flex justify-center">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight capitalize">
                                {props.view === 'day'
                                    ? format(props.date, "eeee, d 'de' MMMM 'de' yyyy", { locale: ptBR })
                                    : format(props.date, 'MMMM yyyy', { locale: ptBR })}
                            </h2>
                        </div>

                        {/* RIGHT: Sync Button */}
                        <div className="flex justify-end items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 text-slate-500 hover:text-primary hover:bg-slate-50 transition-all gap-2 border-slate-200 shadow-sm"
                                        onClick={() => onRefresh && onRefresh()}
                                        type="button"
                                    >
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold whitespace-nowrap">Sincronizar feriados</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Sincronizar feriados e dados da agenda</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )
        },
        header: (headerProps: any) => <CalendarDateHeader {...headerProps} view={view} professional={professional} />
    }), [onSelectSlot, onBlockCreate, backgroundEvents, onSelectEvent, step, onRefresh, view, professional])


    return (
        <Card
            className={`p-0 text-sm shadow-sm border-0 bg-white overflow-hidden rounded-xl ${isMobile ? 'mobile-calendar' : ''} ${view === 'day' ? 'view-day' : ''}`}
            style={{
                height: "100%",
                '--rbc-slot-height': isMobile ? '90px' : '60px',
                '--schedule-theme-color': professional?.color || '#3b82f6'
            } as any}
        >
            <TooltipProvider>
                <DnDCalendar
                    popup
                    localizer={localizer}
                    events={standardEvents}
                    backgroundEvents={backgroundEvents}
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
                    onDoubleClickSlot={onSelectSlot}
                    onEventDrop={onEventDrop}
                    onEventResize={onEventResize}
                    resizable
                    onSelectEvent={onSelectEvent}
                    onDoubleClickEvent={onDoubleClickEvent}
                    step={step || 15}
                    timeslots={timeslots || 2}
                    min={minTime}
                    max={maxTime}
                    scrollToTime={scrollToTime}
                    culture="pt-BR"
                    eventPropGetter={eventStyleGetter}
                    slotPropGetter={slotPropGetter}
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
                    formats={{
                        timeGutterFormat: (date: Date, culture?: string, localizer?: any) =>
                            localizer.format(date, 'HH:mm', culture),
                        dayRangeHeaderFormat: ({ start, end }: any, culture?: string, localizer?: any) => {
                            const startStr = localizer.format(start, "d 'de' MMMM", culture).toLowerCase();
                            const endStr = localizer.format(end, "d 'de' MMMM", culture).toLowerCase();
                            return `${startStr} - ${endStr}`;
                        },
                        dayHeaderFormat: (date: Date, culture?: string, localizer?: any) =>
                            localizer.format(date, "eeee, d 'de' MMMM", culture).toLowerCase(),
                        dayFormat: (date: Date, culture?: string, localizer?: any) =>
                            localizer.format(date, 'dd/MM', culture),
                        monthHeaderFormat: (date: Date, culture?: string, localizer?: any) =>
                            localizer.format(date, "MMMM 'de' yyyy", culture).toLowerCase(),
                        agendaHeaderFormat: ({ start, end }: any, culture?: string, localizer?: any) => {
                            const startStr = localizer.format(start, "d 'de' MMMM", culture).toLowerCase();
                            const endStr = localizer.format(end, "d 'de' MMMM", culture).toLowerCase();
                            return `${startStr} - ${endStr}`;
                        },
                    }}
                />
            </TooltipProvider>
        </Card>
    )
}
