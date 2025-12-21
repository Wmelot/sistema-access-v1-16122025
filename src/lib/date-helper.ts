
/**
 * Standardized Date Helper for Sistema Access
 * Enforces BRT (-03:00) timezone for database compatibility and display consistency.
 */

// BRT Offset in hours
const BRT_OFFSET = -3;

/**
 * Returns a date string with the -03:00 offset appended.
 * Examples: 
 *  input: "2026-01-01" -> "2026-01-01T00:00:00-03:00"
 *  input: "2026-01-01", "23:59:59" -> "2026-01-01T23:59:59-03:00"
 */
export function toBRTISOString(dateStr: string, timeStr: string = "00:00:00"): string {
    // Ensure format is respected
    return `${dateStr}T${timeStr}${BRT_OFFSET < 0 ? '-' : '+'}${Math.abs(BRT_OFFSET).toString().padStart(2, '0')}:00`
}

/**
 * Returns the Start of Day in BRT ISO format
 */
export function getStartOfDayBRT(dateStr: string): string {
    return toBRTISOString(dateStr, "00:00:00")
}

/**
 * Returns the End of Day in BRT ISO format
 */
export function getEndOfDayBRT(dateStr: string): string {
    return toBRTISOString(dateStr, "23:59:59")
}
