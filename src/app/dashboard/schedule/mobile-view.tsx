"use client"

import { useRef, useEffect } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface MobileScheduleViewProps {
    date: Date
    setDate: (date: Date) => void
    events: any[]
    onAddKey: () => void
    onEventClick: (event: any) => void
    onSlotClick: (date: Date) => void
    isSearching?: boolean
    searchTerm?: string
}

export function MobileScheduleView({
    date,
    setDate,
    events,
    onAddKey,
    onEventClick,
    onSlotClick,
    isSearching,
    searchTerm
}: MobileScheduleViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to 8:00 AM or first event
    useEffect(() => {
        if (scrollRef.current) {
            // 8AM * 64px/hour = 512px. Let's scroll to 7AM.
            // 7 * 64 = 448
            scrollRef.current.scrollTop = 448
        }
    }, [])

    // Generate Week Days for the Strip (centered on current date, or just current week)
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // EVENTS ARE ALREADY FILTERED BY PARENT (ScheduleClient)
    // We just render them.

    // Layout constants
    const startHour = 5 // 5 AM
    const endHour = 23 // 11 PM
    const hourHeight = 64 // px height per hour

    const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => startHour + i)

    // Helper to calculate position
    const getEventStyle = (start: Date, end: Date) => {
        const startH = start.getHours()
        const startM = start.getMinutes()
        const endH = end.getHours()
        const endM = end.getMinutes()

        // Minutes from start of timeline (5:00)
        const startTotalMinutes = (startH * 60 + startM) - (startHour * 60)
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)

        const top = (startTotalMinutes / 60) * hourHeight
        const height = (durationMinutes / 60) * hourHeight

        return {
            top: `${top}px`,
            height: `${Math.max(height, 20)}px`, // Min height
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-background">
            {/* Header / Week Strip */}
            <div className="px-4 py-2 border-b bg-background z-10">
                {/* Date Title */}
                <div className="flex items-center justify-between mb-4">
                    {/* Month Name */}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-foreground capitalize">
                            {format(date, "MMMM", { locale: ptBR })}
                        </h1>
                    </div>
                </div>

                {/* Week Strip */}
                <div className="flex justify-between items-center text-center pb-2">
                    {weekDays.map((d, i) => {
                        const isSelected = isSameDay(d, date)
                        const isToday = isSameDay(d, new Date())
                        return (
                            <div
                                key={i}
                                className="flex flex-col items-center gap-1 min-w-[40px] cursor-pointer"
                                onClick={() => setDate(d)}
                            >
                                <span className={cn(
                                    "text-[10px] font-medium uppercase text-muted-foreground",
                                    (isSelected || isToday) && "text-foreground font-bold"
                                )}>
                                    {format(d, "EEE", { locale: ptBR }).replace('.', '')}
                                </span>
                                <div className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-full text-lg font-medium transition-colors",
                                    isSelected ? "bg-red-500 text-white" : isToday ? "text-red-500" : "text-foreground"
                                )}>
                                    {format(d, "d")}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto relative bg-background"
            >
                {/* Grid Lines */}
                <div className="relative min-h-full" style={{ height: `${hours.length * hourHeight}px` }}>
                    {hours.map((h) => (
                        <div
                            key={h}
                            className="absolute w-full border-t border-slate-100 flex"
                            style={{ top: `${(h - startHour) * hourHeight}px`, height: `${hourHeight}px` }}
                        >
                            {/* Adjusted width to w-10 (2.5rem) and text alignment */}
                            <span className="w-10 text-xs text-muted-foreground text-right pr-2 -mt-2 bg-background">
                                {h.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}

                    {/* Current Time Line */}
                    {isSameDay(date, new Date()) && (
                        <div
                            className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none"
                            style={{
                                top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (startHour * 60)) / 60 * hourHeight}px`
                            }}
                        >
                            {/* Adjusted position to match left-10 (40px) + some padding */}
                            <div className="w-2 h-2 rounded-full bg-red-500 -mt-[5px] ml-[38px]" />
                        </div>
                    )}

                    {/* Events */}
                    {events.map((event) => {
                        // Guard against invalid event data
                        if (!event || !event.start) return null;

                        const style = getEventStyle(new Date(event.start), new Date(event.end))
                        const isFree = event.resource?.type === 'free_slot'

                        return (
                            <div
                                key={event.id}
                                className={cn(
                                    // Layout Change: left-10 (Align with time column), right-0 (Full width)
                                    "absolute left-10 right-0 rounded-l-none rounded-r-md px-2 py-1 text-xs border-y border-r font-medium overflow-hidden transition-all active:scale-95 z-10",
                                    isFree
                                        ? "bg-green-50/80 border-green-200 text-green-700 cursor-pointer hover:bg-green-100" // "Available" style
                                        : "bg-red-50 border-red-100 border-l-4 border-l-red-500 text-foreground shadow-sm" // "Appointment" style
                                )}
                                style={style}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (isFree) {
                                        onSlotClick(new Date(event.start))
                                    } else {
                                        onEventClick(event)
                                    }
                                }}
                            >
                                <div className="font-bold truncate">
                                    {isFree ? "Horário Disponível" : (event.patients?.name || event.title)}
                                </div>
                                {!isFree && (
                                    <div className="text-[10px] opacity-80 truncate">
                                        {event.services?.name}
                                    </div>
                                )}
                                <div className="text-[10px] opacity-70">
                                    {format(new Date(event.start), "HH:mm")} - {format(new Date(event.end), "HH:mm")}
                                </div>
                            </div>
                        )
                    })}

                    {/* Clickable Background for "Empty" slots */}
                    <div
                        className="absolute inset-0 left-10 z-0"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const y = e.clientY - rect.top + e.currentTarget.scrollTop
                            // Calculate time from Y
                            const minutes = (y / hourHeight) * 60
                            const totalMinutes = (startHour * 60) + minutes
                            const hour = Math.floor(totalMinutes / 60)
                            const mins = Math.round((totalMinutes % 60) / 30) * 30 // Snap to 30m

                            const clickDate = new Date(date)
                            clickDate.setHours(hour, mins, 0, 0)
                            onSlotClick(clickDate)
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
