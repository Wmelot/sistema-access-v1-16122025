/**
 * Centralised phone formatting utility.
 * 
 * STORAGE FORMAT:  E.164  →  +5531991856084
 * DISPLAY FORMAT:  (31) 99185-6084  (with optional flag)
 * 
 * This file provides helpers to:
 *  1. Normalise any phone string to E.164   → normalizePhone()
 *  2. Format any phone string for display   → formatPhoneDisplay()
 *  3. Get country flag emoji from phone     → getPhoneFlag()
 */

/**
 * Strips all non-digit chars, then ensures the number starts with the
 * country code.  Defaults to +55 (Brazil) when the raw digits look
 * like a local number (10-11 digits).
 *
 * Examples:
 *   "(31) 99185-6084"    → "+5531991856084"
 *   "+5531991856084"     → "+5531991856084"
 *   "31991856084"        → "+5531991856084"
 *   "+15551234567"       → "+15551234567"
 */
export function normalizePhone(phone: string | null | undefined): string {
    if (!phone) return ''

    // Already in E.164 format
    if (phone.startsWith('+')) {
        return phone.replace(/[^\d+]/g, '')
    }

    const digits = phone.replace(/\D/g, '')
    if (!digits) return ''

    // Brazilian number with country code (55) already included
    if (digits.length >= 12 && digits.startsWith('55')) {
        return `+${digits}`
    }

    // Local Brazilian number: 10 or 11 digits (DDD + number)
    if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`
    }

    // Fallback: just prefix with +
    return `+${digits}`
}

/**
 * Formats any phone input for human-readable display.
 * 
 * Brazilian numbers     → (31) 99185-6084
 * International numbers → +1 (555) 123-4567  (kept as-is if not BR)
 * 
 * Always strips the country code from display for Brazilian numbers.
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
    if (!phone) return ''

    const digits = phone.replace(/\D/g, '')
    if (!digits) return ''

    // Brazilian number with country code
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        const local = digits.slice(2) // Remove '55'
        return formatBrazilianLocal(local)
    }

    // Local Brazilian (no country code)
    if (!phone.startsWith('+') && (digits.length === 10 || digits.length === 11)) {
        return formatBrazilianLocal(digits)
    }

    // International or unknown: return formatted if possible
    if (phone.startsWith('+')) {
        // Try to display international numbers neatly
        return phone
    }

    // Fallback: apply basic Brazilian formatting anyway
    if (digits.length === 10 || digits.length === 11) {
        return formatBrazilianLocal(digits)
    }

    return phone // Return as-is if nothing matches
}

/**
 * Formats a local Brazilian phone number (without country code).
 * 
 * 11 digits (celular): 31991856084 → (31) 99185-6084
 * 10 digits (fixo):    3134567890  → (31) 3456-7890
 */
function formatBrazilianLocal(digits: string): string {
    if (digits.length === 11) {
        // Celular: (XX) XXXXX-XXXX
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
        // Fixo: (XX) XXXX-XXXX
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return digits
}

/**
 * Returns the country flag emoji for a phone number.
 * Defaults to 🇧🇷 for Brazilian numbers.
 */
export function getPhoneFlag(phone: string | null | undefined): string {
    if (!phone) return '🇧🇷'

    const digits = phone.replace(/\D/g, '')

    // Brazilian
    if (digits.startsWith('55') || (!phone.startsWith('+') && (digits.length === 10 || digits.length === 11))) {
        return '🇧🇷'
    }

    // US/Canada
    if (digits.startsWith('1') && digits.length === 11) return '🇺🇸'

    // Portugal
    if (digits.startsWith('351')) return '🇵🇹'

    // Default
    return '🌐'
}

/**
 * Combined display: flag + formatted number
 * Example: "🇧🇷 (31) 99185-6084"
 */
export function formatPhoneWithFlag(phone: string | null | undefined): string {
    if (!phone) return ''
    return `${getPhoneFlag(phone)} ${formatPhoneDisplay(phone)}`
}
