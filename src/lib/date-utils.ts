import { toZonedTime, format as formatTz, fromZonedTime } from 'date-fns-tz'
import { endOfMonth, startOfMonth, set, getDay, getHours, getMinutes } from 'date-fns'

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

/**
 * Returns a Date object representing the time in Brazil (America/Sao_Paulo).
 * Uses date-fns-tz to convert any input date/string to the target timezone.
 */
export const getBrazilDate = (date: Date | string | number = new Date()): Date => {
    return toZonedTime(date, DEFAULT_TIMEZONE)
}

/**
 * Returns the Hour (0-23) of a date in Brazil Timezone.
 */
export const getBrazilHour = (date: Date | string): number => {
    const zonedDate = getBrazilDate(date)
    return getHours(zonedDate)
}

/**
 * Returns the Day of Week (0-6) of a date in Brazil Timezone.
 */
export const getBrazilDay = (date: Date | string): number => {
    const zonedDate = getBrazilDate(date)
    return getDay(zonedDate) // 0 = Sunday
}

/**
 * Returns the Minutes (0-59) of a date in Brazil Timezone.
 */
export const getBrazilMinutes = (date: Date | string): number => {
    const zonedDate = getBrazilDate(date)
    return getMinutes(zonedDate)
}

/**
 * Returns the Start of the Month in Brazil Timezone ISO format
 * Corresponds to YYYY-MM-01 00:00:00-03:00
 */
export const getBrazilStartOfMonth = (year: number, month: number): string => {
    // Month is 1-indexed (Jan=1) to standard input, but JS Date is 0-indexed
    // We create a date in the timezone
    const date = toZonedTime(new Date(year, month - 1, 1), DEFAULT_TIMEZONE)
    const start = startOfMonth(date)
    // Format to ISO with Offset
    return formatTz(start, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: DEFAULT_TIMEZONE })
}

/**
 * Returns the End of the Month in Brazil Timezone ISO format
 * Corresponds to YYYY-MM-LastDay 23:59:59-03:00
 */
export const getBrazilEndOfMonth = (year: number, month: number): string => {
    const date = toZonedTime(new Date(year, month - 1, 1), DEFAULT_TIMEZONE)
    const end = endOfMonth(date)
    // Ensure it's end of day just in case
    const endOfDay = set(end, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
    return formatTz(endOfDay, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: DEFAULT_TIMEZONE })
}

/**
 * Returns the YYYY-MM-DD string in Brazil Timezone.
 */
export const getBrazilDateString = (date: Date): string => {
    const zonedDate = getBrazilDate(date)
    return formatTz(zonedDate, 'yyyy-MM-dd', { timeZone: DEFAULT_TIMEZONE })
}

// --- Legacy Helper Replacements (now robust) ---

/**
 * Forces a date string to have the BRT offset.
 * Example: "2024-01-01" -> "2024-01-01T00:00:00-03:00"
 */
export function toBRTISOString(dateStr: string, timeStr: string = "00:00:00"): string {
    // Combine to ISO string without offset first
    const dateTimeStr = `${dateStr}T${timeStr}`
    // [FIX] Explicitly treat the string as being in the Brazil timezone
    const utcDate = fromZonedTime(dateTimeStr, DEFAULT_TIMEZONE)
    return formatTz(utcDate, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: DEFAULT_TIMEZONE })
}

export function getStartOfDayBRT(dateStr: string): string {
    return toBRTISOString(dateStr, "00:00:00")
}

export function getEndOfDayBRT(dateStr: string): string {
    return toBRTISOString(dateStr, "23:59:59")
}

/**
 * Parses a date string (YYYY-MM-DD or ISO) and returns a Date object in São Paulo timezone.
 * This ensures that "2026-02-15" is interpreted as Feb 15 in São Paulo, not UTC.
 */
export function parseBrazilDate(dateStr: string | Date): Date {
    if (dateStr instanceof Date) {
        return toZonedTime(dateStr, DEFAULT_TIMEZONE)
    }

    // If it's just a date string like "2026-02-15", append midnight time
    if (dateStr.length === 10 && dateStr.includes('-')) {
        const utcDate = fromZonedTime(`${dateStr}T00:00:00`, DEFAULT_TIMEZONE)
        return utcDate
    }

    return toZonedTime(dateStr, DEFAULT_TIMEZONE)
}

/**
 * Formats a Date object to a string in São Paulo timezone.
 * Default format: 'yyyy-MM-dd' (e.g., "2026-02-15")
 */
export function formatBrazilDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
    const zonedDate = parseBrazilDate(date)
    return formatTz(zonedDate, formatStr, { timeZone: DEFAULT_TIMEZONE })
}
