"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
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
    professional // [NEW] Current professional for availability check
}: {
    date: Date
    onDateChange: (date: Date) => void
    view: View
    onViewChange: (view: View) => void
    selectable?: boolean
    onSelectSlot?: (slotInfo: { start: Date, end: Date }) => void
    onSelectEvent?: (event: any) => void
    appointments?: any[]
    step?: number
    timeslots?: number
    themeColor?: string
    professional?: any // [NEW]
}) {
    // ... existing events mapping ... (lines 54-80) removed from here for brevity, assume they are kept by context

    const events = appointments.map(appt => {
        // [NEW] Pass through pre-formatted "Free Slot" events
        if (appt.type === 'free_slot') {
            return appt
        }

        if (appt.type === 'block') {
            const eventTitle = appt.notes?.split('\n')[0] || 'BLOQUEIO'
            return {
                id: appt.id,
                title: eventTitle,
                start: new Date(appt.start_time),
                end: new Date(appt.end_time),
                resourceId: appt.professional_id,
                resource: appt,
                color: '#f3f4f6'
            }
        }

        const patientName = appt.patients?.name || 'Paciente s/ nome'
        const profileName = appt.profiles?.full_name?.split(' ')[0] || 'Profissional'
        return {
            id: appt.id,
            title: `${patientName} - ${profileName}`,
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            resource: appt,
            color: appt.profiles?.color || '#3b82f6'
        }
    })

    // ... min/max time calculation ... (lines 84-124) preserved

    const referenceDate = new Date()
    referenceDate.setHours(0, 0, 0, 0);
    let minTime = new Date(referenceDate)
    minTime.setHours(6, 0, 0, 0)
    let maxTime = new Date(referenceDate)
    maxTime.setHours(21, 0, 0, 0)

    events.forEach(event => {
        const eventStart = new Date(event.start)
        const startOnRef = new Date(referenceDate)
        startOnRef.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)
        const eventEnd = new Date(event.end)
        const endOnRef = new Date(referenceDate)
        endOnRef.setHours(eventEnd.getHours(), eventEnd.getMinutes(), 0, 0)

        if (startOnRef < minTime) {
            const newMin = new Date(startOnRef)
            newMin.setMinutes(0)
            minTime = newMin
        }
        if (endOnRef > maxTime) {
            const newMax = new Date(endOnRef)
            if (newMax.getMinutes() > 0) newMax.setHours(newMax.getHours() + 1, 0, 0)
            if (newMax > maxTime) maxTime = newMax
        }
    })

    const eventStyleGetter = (event: any) => {
        // [NEW] Free Slot Styling
        if (event.resource?.type === 'free_slot') {
            return {
                className: 'free-slot-event',
                style: {
                    borderRight: `4px solid ${event.resource.locationColor || 'transparent'}`
                }
            }
        }

        // [NEW] Block Styling
        if (event.resource?.type === 'block') {
            return {
                style: {
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px dashed #d1d5db',
                    opacity: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }
            }
        }
        // APPOINTMENT STYLING
        // Background: Professional's Color (themeColor)
        // Right Border: Service's Color

        const professionalColor = themeColor || '#84c8b9'
        const serviceColor = event.resource?.services?.color || '#3b82f6'

        return {
            style: {
                backgroundColor: professionalColor,
                borderColor: professionalColor,
                color: '#334155',
                border: '0px',
                borderRight: `6px solid ${serviceColor}`, // Service Color on Right
                display: 'block',
                borderRadius: '6px',
                opacity: 1, // Solid color as requested
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
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
                    backgroundColor: '#e5e7eb', // Darker gray (gray-200)
                    cursor: 'not-allowed',
                    opacity: 0.6
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
                    backgroundColor: '#e5e7eb', // Darker gray (gray-200)
                    cursor: 'not-allowed',
                    opacity: 0.6
                }
            }
        }

        return {}
    }

    const scrollToTime = new Date()
    scrollToTime.setHours(7, 0, 0, 0)

    // ... height calc ...

    const totalDurationMinutes = (maxTime.getTime() - minTime.getTime()) / (1000 * 60);
    const slotDurationMinutes = (step || 30) / (timeslots || 2);
    const totalSlots = Math.ceil(totalDurationMinutes / slotDurationMinutes);
    const pixelPerSlot = 15;
    const headerHeight = 64;
    const calculatedHeight = (totalSlots * pixelPerSlot) + headerHeight;

    return (
        <Card
            className="p-4 text-sm shadow-sm border-0 bg-white"
            style={{
                height: `${calculatedHeight}px`,
                // @ts-ignore
                '--schedule-theme-color': themeColor || '#59cbbb'
            }}
        >
            <BigCalendar
                localizer={localizer}
                events={events}
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
                onSelectEvent={onSelectEvent}
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
                components={{
                    event: ({ event }) => {
                        const isAppointment = event.resource?.type !== 'free_slot' && event.resource?.type !== 'block'

                        const content = (
                            <div className="pl-1 h-full w-full" style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                lineHeight: '1.2',
                                color: event.resource?.type === 'block' ? 'inherit' : '#334155',
                                textShadow: event.resource?.type === 'block' ? 'none' : '0 1px 2px rgba(255,255,255,0.5)'
                            }}>
                                {event.title}
                            </div>
                        )

                        if (!isAppointment) {
                            return (
                                <AppointmentContextMenu appointment={event.resource}>
                                    {content}
                                </AppointmentContextMenu>
                            )
                        }

                        // Appointment Tooltip
                        return (
                            <AppointmentContextMenu appointment={event.resource}>
                                <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <span className="h-full w-full block cursor-pointer hover:scale-[1.03] transition-transform duration-200">
                                                {content}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 border-slate-800 text-slate-50 p-3 text-xs max-w-[220px] shadow-xl z-[60]">
                                            <div className="font-bold text-sm mb-1">{event.resource?.patients?.name}</div>
                                            <div className="font-medium text-slate-300 mb-2">{event.resource?.services?.name || 'Atendimento'}</div>

                                            <div className="space-y-0.5 text-slate-400">
                                                {event.resource?.id && <div>ID: {event.resource?.id}</div>}
                                                {event.resource?.patients?.phone && <div>Tel.: {event.resource?.patients?.phone}</div>}
                                            </div>

                                            {event.resource?.notes && (
                                                <div className="mt-2 pt-2 border-t border-slate-700 text-slate-300 italic">
                                                    {event.resource.notes}
                                                </div>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </AppointmentContextMenu>
                        )
                    },
                    toolbar: (props) => {
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
                }}
            />
        </Card>
    )
}
