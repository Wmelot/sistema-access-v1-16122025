
/**
 * Returns a Date object representing the time in Brazil (America/Sao_Paulo).
 * This is crucial for consistency between Client (Brazil) and Server (UTC/Vercel).
 */
export const getBrazilDate = (date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

/**
 * Returns the Hour (0-23) of a date in Brazil Timezone.
 * Safe replacement for .getHours() which depends on Server Timezone.
 */
export const getBrazilHour = (date: Date | string): number => {
    return getBrazilDate(date).getHours()
}

/**
 * Returns the Day of Week (0-6) of a date in Brazil Timezone.
 * Safe replacement for .getDay() which depends on Server Timezone.
 */
export const getBrazilDay = (date: Date | string): number => {
    return getBrazilDate(date).getDay()
}

/**
 * Returns the Minutes (0-59) of a date in Brazil Timezone.
 * Usually .getMinutes() is safe across timezones for full offsets, but good for consistency.
 */
export const getBrazilMinutes = (date: Date | string): number => {
    return getBrazilDate(date).getMinutes()
}

/**
 * Returns the Start of the Month in Brazil Timezone.
 * Corresponds to YYYY-MM-01 00:00:00-03:00
 */
export const getBrazilStartOfMonth = (year: number, month: number): string => {
    // Month is 1-indexed for string construction convenience, or 0-indexed? 
    // Let's standardise: Month is 1 (Jan) to 12 (Dec)
    const y = String(year).padStart(4, '0')
    const m = String(month).padStart(2, '0')
    return `${y}-${m}-01T00:00:00-03:00`
}

/**
 * Returns the End of the Month in Brazil Timezone.
 * Corresponds to YYYY-MM-LastDay 23:59:59-03:00
 */
export const getBrazilEndOfMonth = (year: number, month: number): string => {
    // Get last day by using Date(year, month, 0)
    // Note: JS Month is 0-indexed in Date constructor.
    // If input `month` is 1-12:
    // new Date(year, month, 0) gives the last day of 'month'. e.g. new Date(2023, 1, 0) is Jan 31st? No.
    // new Date(2023, 1, 1) is Feb 1st.
    // new Date(2023, 1, 0) is Jan 31st.
    // So if input month is 1 (Jan), we want new Date(year, 1, 0). 

    // BUT we must be careful about Timezones in that constructor too!

    // Safer: Calculate last day number mathematically or using a simple date.
    const lastDay = new Date(year, month, 0).getDate()
    // .getDate() is generally safe as it returns 28-31 regardless of timezone shift unless we are really unlucky with exact midnight boundary.
    // Actually new Date(2023, 1, 0) -> Jan 31st Local.
    // If generic server local is used, it should be fine for just extracting the day number (28, 30, 31).

    const y = String(year).padStart(4, '0')
    const m = String(month).padStart(2, '0')
    const d = String(lastDay).padStart(2, '0')
    return `${y}-${m}-${d}T23:59:59-03:00`
}

/**
 * Returns the YYYY-MM-DD string in Brazil Timezone.
 */
export const getBrazilDateString = (date: Date): string => {
    return getBrazilDate(date).toISOString().split('T')[0]
}
