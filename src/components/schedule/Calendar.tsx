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
    themeColor // [NEW] Destructure prop
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
    themeColor?: string // [NEW]
}) {
    // Map DB appointments to Calendar Events
    const events = appointments.map(appt => {
        if (appt.type === 'block') {
            const eventTitle = appt.notes?.split('\n')[0] || 'BLOQUEIO' // Use first line of notes as title
            return {
                id: appt.id,
                title: eventTitle,
                start: new Date(appt.start_time),
                end: new Date(appt.end_time),
                resourceId: appt.professional_id,
                resource: appt, // Store full object for access in components
                color: '#f3f4f6' // Fallback
            }
        }

        const patientName = appt.patients?.name || 'Paciente s/ nome'
        const profileName = appt.profiles?.full_name?.split(' ')[0] || 'Profissional'
        return {
            id: appt.id,
            title: `${patientName} - ${profileName}`, // Ensure non-empty string
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            resource: appt,
            color: appt.profiles?.color || '#3b82f6'
        }
    })

    // Calculate Dynamic Min/Max Time
    // We only care about the TIME of the event, not the date.
    // So we normalize everything to a reference date.
    const referenceDate = new Date()
    referenceDate.setHours(0, 0, 0, 0);

    let minTime = new Date(referenceDate)
    minTime.setHours(6, 0, 0, 0) // Default Start 06:00

    let maxTime = new Date(referenceDate)
    maxTime.setHours(21, 0, 0, 0) // Default End 21:00

    events.forEach(event => {
        // Create a date object for the event's start time on the reference date
        const eventStart = new Date(event.start)
        const startOnRef = new Date(referenceDate)
        startOnRef.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)

        // Create a date object for the event's end time on the reference date
        const eventEnd = new Date(event.end)
        const endOnRef = new Date(referenceDate)
        endOnRef.setHours(eventEnd.getHours(), eventEnd.getMinutes(), 0, 0)
        // Handle overflow to next day (e.g. event ends at 00:00 or later?)
        // Simple assumption: events don't span multiple days for this view logic usually, 
        // or we just clamp to 24h.

        if (startOnRef < minTime) {
            // Expand start time (e.g. 05:00)
            const newMin = new Date(startOnRef)
            newMin.setMinutes(0)
            minTime = newMin
        }

        if (endOnRef > maxTime) {
            // Expand end time
            const newMax = new Date(endOnRef)
            if (newMax.getMinutes() > 0) newMax.setHours(newMax.getHours() + 1, 0, 0)
            // If event ends exactly at midnight 00:00 of next day, this logic might be tricky.
            // But let's assume standard day hours.
            // If newMax goes beyond "today", it implies next day.
            // RBC max prop usually handles same-day time.
            if (newMax > maxTime) maxTime = newMax
        }
    })

    const eventStyleGetter = (event: any) => {
        // [NEW] Block Styling
        if (event.resource?.type === 'block') {
            return {
                style: {
                    backgroundColor: '#f3f4f6', // gray-100
                    color: '#6b7280', // gray-500
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

        const backgroundColor = event.color || '#3b82f6'
        const borderColor = event.color || '#3b82f6'

        return {
            style: {
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                opacity: 0.9,
                color: '#fff', // White text for better contrast on colored bg
                border: '0px',
                display: 'block',
                borderRadius: '6px'
            }
        }
    }

    // Default scroll position (07:00)
    const scrollToTime = new Date()
    scrollToTime.setHours(7, 0, 0, 0)

    // Calculate total slots for dynamic height
    // Calculate total slots for dynamic height
    const totalDurationMinutes = (maxTime.getTime() - minTime.getTime()) / (1000 * 60);
    const slotDurationMinutes = (step || 30) / (timeslots || 2);
    const totalSlots = Math.ceil(totalDurationMinutes / slotDurationMinutes);

    // Total height needed to show all slots
    // Set pixelPerSlot to match roughly the visual height (15px "tiniest possible")
    const pixelPerSlot = 15;
    const headerHeight = 64; // Estimated height for the calendar header (toolbar + day labels)
    const calculatedHeight = (totalSlots * pixelPerSlot) + headerHeight;

    return (
        <Card
            className="p-4 text-sm shadow-sm border-0 bg-white"
            style={{
                height: `${calculatedHeight}px`,
                // @ts-ignore - Custom CSS Variable
                '--schedule-theme-color': themeColor || '#59cbbb'
            }}
        >
            <BigCalendar
                localizer={localizer}
                events={events} // Use real events
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
                    event: ({ event }) => (
                        <AppointmentContextMenu appointment={event.resource}>
                            <div className="pl-1 h-full w-full" style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                lineHeight: '1.2',
                                color: event.resource?.type === 'block' ? 'inherit' : '#fff', // Smart color
                                textShadow: event.resource?.type === 'block' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                                {event.title}
                            </div>
                        </AppointmentContextMenu>
                    ),
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
