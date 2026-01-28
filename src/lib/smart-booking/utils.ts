// Smart Booking Utility Functions
// Helper functions for time manipulation and slot generation

/**
 * Parse time string (HH:mm) or ISO string to minutes since midnight (America/Sao_Paulo)
 */
export function parseTimeToMinutes(time: string): number {
    if (time.includes('T')) {
        // Handle ISO string - Extract HH:mm in Brazil Time
        const d = new Date(time)
        const parts = new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo'
        }).formatToParts(d);
        const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        return hh * 60 + mm;
    }
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Add minutes to a time string
 */
export function addMinutes(time: string, minutes: number): string {
    const totalMinutes = parseTimeToMinutes(time) + minutes
    return minutesToTime(totalMinutes)
}

/**
 * Check if a time slot overlaps with an appointment
 */
export function hasOverlap(
    slotStart: string,
    slotEnd: string,
    aptStart: string,
    aptEnd: string
): boolean {
    const slotStartMin = parseTimeToMinutes(slotStart)
    const slotEndMin = parseTimeToMinutes(slotEnd)
    const aptStartMin = parseTimeToMinutes(aptStart)
    const aptEndMin = parseTimeToMinutes(aptEnd)

    return slotStartMin < aptEndMin && slotEndMin > aptStartMin
}

/**
 * Generate time slots for a day based on professional schedule
 */
export function generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = 60
): string[] {
    const slots: string[] = []
    let currentMinutes = parseTimeToMinutes(startTime)
    const endMinutes = parseTimeToMinutes(endTime)

    while (currentMinutes < endMinutes) {
        slots.push(minutesToTime(currentMinutes))
        currentMinutes += intervalMinutes
    }

    return slots
}

/**
 * Check if a date is today or tomorrow
 */
export function isSameDay(date: string): boolean {
    const targetDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    targetDate.setHours(0, 0, 0, 0)

    return targetDate.getTime() === today.getTime() ||
        targetDate.getTime() === tomorrow.getTime()
}

/**
 * Hash a date string to a consistent number for seeding
 */
export function hashDate(date: string): number {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
        const char = date.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
}

/**
 * Get day of week from date string (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: string): number {
    return new Date(date).getDay()
}

/**
 * Format time for display (remove leading zero if needed)
 */
export function formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    return `${h}:${minutes}`
}
