"use client"

import { useState, useRef, useEffect } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Plus, Search, Menu, ListFilter, Calendar as CalendarIcon } from "lucide-react" // Changed List to ListFilter to avoid conflict
import { cn } from "@/lib/utils"
// Duplicate cn removed
// Removed Avatar imports if not used, or keep if needed
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileScheduleViewProps {
    date: Date
    setDate: (date: Date) => void
    events: any[]
    onAddKey: () => void
    onEventClick: (event: any) => void
    onSlotClick: (date: Date) => void
}

export function MobileScheduleView({
    date,
    setDate,
    events,
    onAddKey,
    onEventClick,
    onSlotClick
}: MobileScheduleViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to 8:00 AM or first event
    useEffect(() => {
        if (scrollRef.current) {
            // 8AM * 60px/hour = 480px. Let's scroll to 7AM (420px) for padding
            scrollRef.current.scrollTop = 420
        }
    }, [])

    // Generate Week Days for the Strip (centered on current date, or just current week)
    // iPhone usually shows the current week or a strip. Let's do a static Mon-Sun of the current week.
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // Filter Filter State
    const [filterType, setFilterType] = useState<'all' | 'scheduled' | 'free'>('all')

    // Filter events for today & type
    const dayEvents = events.filter(e => {
        const eDate = new Date(e.start)
        const isToday = isSameDay(eDate, date)
        if (!isToday) return false

        const isFree = e.resource?.type === 'free_slot'

        if (filterType === 'scheduled') return !isFree
        if (filterType === 'free') return isFree

        return true
    })

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
            {/* iOS Header */}
            <div className="px-4 py-2 border-b bg-background z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-red-500 font-medium cursor-pointer" onClick={() => setDate(new Date())}>
                        <ChevronLeft className="h-5 w-5" />
                        <span>Hoje</span>
                    </div>
                    <div className="flex items-center gap-4">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddKey}>
                            <Plus className="h-6 w-6 text-red-500" />
                        </Button>
                    </div>

                    {/* Date Title */}
                    <div className="flex flex-col mb-4">
                        <h1 className="text-2xl font-bold text-foreground">
                            {format(date, "MMMM", { locale: ptBR })}
                        </h1>
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
                                <span className="w-14 text-xs text-muted-foreground text-right pr-3 -mt-2 bg-background">
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
                                <div className="w-2 h-2 rounded-full bg-red-500 -mt-[5px] ml-[52px]" />
                            </div>
                        )}

                        {/* Events */}
                        {dayEvents.map((event) => {
                            const style = getEventStyle(new Date(event.start), new Date(event.end))
                            const isFree = event.resource?.type === 'free_slot'

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "absolute left-14 right-2 rounded-md px-2 py-1 text-xs border font-medium overflow-hidden transition-all active:scale-95 z-10",
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
                                    <div className="font-bold">
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

                        {/* Clickable Background for "Empty" slots (Optional, users usually just click the timeline) */}
                        <div
                            className="absolute inset-0 left-14 z-0"
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
        </div>
    )
}
