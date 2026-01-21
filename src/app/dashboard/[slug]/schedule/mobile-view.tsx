"use client"

import { useRef, useEffect } from "react"
import {
    format,
    addDays,
    startOfWeek,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    endOfWeek,
    addMonths,
    subMonths,
    startOfYear,
    eachMonthOfInterval,
    isSameMonth,
    subYears,
    addYears,
    addWeeks // [NEW]
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ViewLevel = 'day' | 'month' | 'year'

interface MobileScheduleViewProps {
    date: Date
    setDate: (date: Date) => void
    events: any[]
    onAddKey: () => void // Unused but kept for interface compatibility
    onEventClick: (event: any) => void
    onSlotClick: (date: Date) => void
    isSearching?: boolean
    searchTerm?: string
    // [NEW] Lifted State
    viewLevel: ViewLevel
    setViewLevel: (level: ViewLevel) => void
    selectedProfessionalName?: string
    selectedProfessionalColor?: string // [NEW]
}

export function MobileScheduleView({
    date,
    setDate,
    events,
    onAddKey,
    onEventClick,
    onSlotClick,
    isSearching,
    searchTerm,
    viewLevel,
    setViewLevel,
    selectedProfessionalName,
    selectedProfessionalColor // [NEW]
}: MobileScheduleViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logic for Day View
    useEffect(() => {
        if (viewLevel === 'day' && scrollRef.current) {
            scrollRef.current.scrollTop = 448 // Scroll to ~7am
        }
    }, [viewLevel])

    // --- DAY VIEW IMPLEMENTATION ---
    const renderDayView = () => {
        // Generate Week Days for the Strip
        const weekStart = startOfWeek(date, { weekStartsOn: 0 })
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

        // Layout constants
        const startHour = 5
        const endHour = 23
        const hourHeight = 64
        const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => startHour + i)

        const getEventStyle = (start: Date, end: Date) => {
            const startH = start.getHours()
            const startM = start.getMinutes()
            const endH = end.getHours()
            const endM = end.getMinutes()

            const startTotalMinutes = (startH * 60 + startM) - (startHour * 60)
            const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)

            const top = (startTotalMinutes / 60) * hourHeight
            const height = (durationMinutes / 60) * hourHeight

            return { top: `${top}px`, height: `${Math.max(height, 20)}px` }
        }

        return (
            <div className={`flex flex-col h-full bg-background animate-in fade-in duration-300`}>

                {/* [NEW] Professional Header Banner */}
                {selectedProfessionalName && (
                    <div
                        className="px-4 py-1.5 text-center border-b"
                        style={{
                            backgroundColor: selectedProfessionalColor ? `${selectedProfessionalColor}15` : 'rgba(var(--primary), 0.1)',
                            borderColor: selectedProfessionalColor ? `${selectedProfessionalColor}30` : 'rgba(var(--primary), 0.2)'
                        }}
                    >
                        <span
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: selectedProfessionalColor || 'var(--primary)' }}
                        >
                            Agenda de: {selectedProfessionalName}
                        </span>
                    </div>
                )}

                {/* [NEW] Navigation Header - Week Navigation */}
                <div className="flex items-center justify-between px-4 py-2 bg-background border-b z-20">
                    <Button variant="ghost" size="icon" onClick={() => setDate(addWeeks(date, -1))}>
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="px-6 font-bold text-xs uppercase tracking-wide border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDate(new Date())}
                    >
                        Hoje
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => setDate(addWeeks(date, 1))}>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>

                {/* Week Strip */}
                <div className="flex justify-between items-center text-center pb-2 px-4 border-b bg-background z-10 pt-2 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.1)]">
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
                                    {format(d, "EEE", { locale: ptBR }).replace('.', '').substring(0, 3)}
                                </span>
                                <div className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-full text-lg font-medium transition-colors",
                                    isSelected ? "bg-red-500 text-white shadow-md shadow-red-200" : isToday ? "text-red-500" : "text-foreground"
                                )}>
                                    {format(d, "d")}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Timeline */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto relative bg-background isolate">
                    <div className="relative min-h-full" style={{ height: `${hours.length * hourHeight}px` }}>
                        {hours.map((h) => (
                            <div key={h} className="absolute w-full border-t border-slate-100 flex" style={{ top: `${(h - startHour) * hourHeight}px`, height: `${hourHeight}px` }}>
                                <span className="w-10 text-xs text-muted-foreground text-right pr-2 -mt-2 bg-background">
                                    {h.toString().padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}

                        {isSameDay(date, new Date()) && (
                            <div className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none" style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (startHour * 60)) / 60 * hourHeight}px` }}>
                                <div className="w-2 h-2 rounded-full bg-red-500 -mt-[5px] ml-[38px]" />
                            </div>
                        )}

                        <div className="absolute inset-0 left-10 z-0" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const y = e.clientY - rect.top + e.currentTarget.scrollTop
                            const minutes = (y / hourHeight) * 60
                            const totalMinutes = (startHour * 60) + minutes
                            const hour = Math.floor(totalMinutes / 60)
                            const mins = Math.round((totalMinutes % 60) / 30) * 30
                            const clickDate = new Date(date)
                            clickDate.setHours(hour, mins, 0, 0)
                            onSlotClick(clickDate)
                        }} />

                        {events.filter(e => isSameDay(new Date(e.start), date)).map((event) => {
                            if (!event || !event.start) return null;
                            const evtStart = new Date(event.start)
                            const evtEnd = new Date(event.end)

                            // [Fixed] Normalize Data Access (Handle Raw vs Wrapped)
                            const data = event.resource || event

                            const style = getEventStyle(evtStart, evtEnd)
                            const isFree = data.type === 'free_slot'
                            const serviceColor = data.services?.color || '#3b82f6'

                            // [NEW] Status & Color Logic
                            const isBlocked = data.type === 'block'
                            const status = data.status
                            const isPaid = !!data.payment_method_id
                            const isCompleted = status === 'completed'

                            // Determine Classes based on Status
                            let containerClass = "bg-white border-slate-200 border-l-4 text-slate-900"
                            let borderLeftColor = serviceColor
                            let textColor = "text-slate-900"
                            let subTextColor = "text-slate-500"

                            if (isFree) {
                                containerClass = "bg-gray-50 border-gray-200 border-l-4 border-l-gray-300 text-gray-700 cursor-pointer hover:bg-gray-100 z-20"
                                borderLeftColor = '#d1d5db'
                                textColor = "text-gray-600"
                                subTextColor = "text-gray-400"
                            } else if (isBlocked) {
                                // [NEW] Block Styling (Pink/Red)
                                containerClass = "bg-red-50 border-red-500 border border-l-4 text-red-900 z-30"
                                borderLeftColor = '#ef4444' // red-500
                                textColor = "text-red-900"
                                subTextColor = "text-red-700"
                            } else if (isCompleted) {
                                // [FIXED] Always Green if Completed (Matches Desktop)
                                containerClass = "bg-green-50 border-green-200 border-l-4 border-l-green-600 text-green-900 z-30"
                                borderLeftColor = '#16a34a' // green-600
                                textColor = "text-green-900"
                                subTextColor = "text-green-700"
                            } else if (status === 'attended') {
                                containerClass = "bg-yellow-50/50 border-yellow-200 border-l-4 border-l-yellow-500 text-yellow-900 z-30"
                                borderLeftColor = '#eab308' // yellow-500
                                textColor = "text-yellow-900"
                                subTextColor = "text-yellow-700"
                            } else if (status === 'checked_in') {
                                containerClass = "bg-slate-100 border-slate-200 border-l-4 border-l-slate-500 text-slate-700 z-30"
                                borderLeftColor = '#64748b' // slate-500
                                textColor = "text-slate-700"
                                subTextColor = "text-slate-500"
                            }

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "absolute left-10 right-0 rounded-md px-2 py-1 text-xs font-medium overflow-hidden transition-all active:scale-95 shadow-sm border",
                                        containerClass
                                    )}
                                    style={{
                                        top: style.top,
                                        height: style.height,
                                        borderLeftColor: borderLeftColor
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (isFree) onSlotClick(evtStart)
                                        else onEventClick(data) // Pass normalized data
                                    }}
                                >
                                    {isFree ? (
                                        <div className="flex items-center gap-2 h-full relative">
                                            {/* Aesthetic Dot for Free Slots (Small Gray) */}
                                            <div className="absolute top-1 right-1">
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                            </div>
                                            <span className="text-gray-500 font-semibold text-[10px]">
                                                {format(evtStart, "HH:mm")} - {format(evtEnd, "HH:mm")}
                                            </span>
                                            <span className="text-gray-600 font-bold text-[10px] uppercase tracking-wide">
                                                LIVRE
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full justify-center leading-tight">
                                            <div className={cn("font-bold truncate text-[11px] mb-0.5", textColor)}>
                                                {isBlocked
                                                    ? (data.title || data.observations || "Bloqueio")
                                                    : (data.patients?.name || data.title || event.title)
                                                }
                                            </div>
                                            <div className="text-[10px] opacity-90 truncate font-semibold" style={{ color: isCompleted ? textColor : serviceColor }}>
                                                {data.services?.name || data.resource?.services?.name}
                                            </div>
                                            <div>
                                                <div
                                                    className="h-1.5 w-1.5 rounded-full absolute top-1 right-1"
                                                    style={{ backgroundColor: borderLeftColor }}
                                                />
                                            </div>
                                            <div className={cn("text-[10px]", subTextColor)}>
                                                {format(evtStart, "HH:mm")} - {format(evtEnd, "HH:mm")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // --- MONTH VIEW IMPLEMENTATION ---
    const renderMonthView = () => {
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(monthStart)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

        const days = eachDayOfInterval({ start: calStart, end: calEnd })
        const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"] // Simple initials

        return (
            <div className="flex flex-col h-full bg-background animate-in zoom-in-95 duration-200 p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setDate(subMonths(date, 1))}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <span className="text-xl font-bold capitalize">
                        {format(date, "MMMM", { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setDate(addMonths(date, 1))}>
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-y-4 text-center">
                    {/* Headers */}
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-xs font-medium text-muted-foreground mb-2">
                            {d}
                        </div>
                    ))}

                    {/* Days */}
                    {days.map((d, i) => {
                        const isCurrentMonth = isSameMonth(d, date)
                        const isSelected = isSameDay(d, date)
                        const isToday = isSameDay(d, new Date())

                        // Check if day has event (dots)
                        const hasEvent = events.some(e => isSameDay(new Date(e.start), d))

                        return (
                            <div key={i} className="flex flex-col items-center gap-1 cursor-pointer"
                                onClick={() => {
                                    setDate(d)
                                    setViewLevel('day')
                                }}
                            >
                                <div className={cn(
                                    "h-10 w-10 flex items-center justify-center rounded-full text-lg transition-all",
                                    isSelected ? "bg-red-500 text-white font-bold" :
                                        isToday ? "text-red-500 font-bold" :
                                            isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-30"
                                )}>
                                    {format(d, "d")}
                                </div>
                                {/* Dot indicator */}
                                {hasEvent && isCurrentMonth && !isSelected && (
                                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // --- YEAR VIEW IMPLEMENTATION ---
    const renderYearView = () => {
        const yearStart = startOfYear(date)
        const months = eachMonthOfInterval({
            start: yearStart,
            end: new Date(date.getFullYear(), 11, 31)
        })

        return (
            <div className="flex flex-col h-full bg-background animate-in zoom-in-95 duration-200 p-4 overflow-y-auto">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setDate(subYears(date, 1))}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <span className="text-2xl font-bold">
                        {date.getFullYear()}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setDate(addYears(date, 1))}>
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-x-4 gap-y-8">
                    {months.map((m, i) => {
                        const isCurrentMonth = isSameMonth(m, date)
                        const isThisMonth = isSameMonth(m, new Date())

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                    isCurrentMonth && "bg-muted"
                                )}
                                onClick={() => {
                                    setDate(m)
                                    setViewLevel('month')
                                }}
                            >
                                <span className={cn(
                                    "text-sm font-bold capitalize text-center mb-1",
                                    isThisMonth ? "text-red-500" : "text-foreground"
                                )}>
                                    {format(m, "MMMM", { locale: ptBR })}
                                </span>

                                {/* Mini Grid Visualization - Simplified for performance/aesthetics */}
                                <div className="grid grid-cols-7 text-[6px] gap-[1px] text-center text-muted-foreground/60 pointer-events-none">
                                    {Array.from({ length: 31 }).map((_, d) => (
                                        <div key={d} className={cn(
                                            "aspect-square rounded-[1px]",
                                            (d % 7 === 0 || d % 7 === 6) && "bg-transparent", // weekends
                                            d < 5 && "bg-primary/10" // Decorative
                                        )} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-hidden h-full">
            {viewLevel === 'day' && renderDayView()}
            {viewLevel === 'month' && renderMonthView()}
            {viewLevel === 'year' && renderYearView()}
        </div>
    )
}
