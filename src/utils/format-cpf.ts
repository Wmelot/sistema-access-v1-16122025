/**
 * Centralized CPF formatting utility.
 * 
 * STORAGE FORMAT:  RAW  →  12345678901
 * DISPLAY FORMAT:  MASKED/RAW → 123.456.789-00
 */

export function formatCPF(cpf: string | null | undefined): string {
    if (!cpf) return '-'

    const digits = cpf.replace(/\D/g, '')

    if (digits.length !== 11) {
        // Return original or - if it doesn't look like a CPF
        return cpf || '-'
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Validates if a string is a valid CPF (simple length check + fallback)
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
    if (!cpf) return false
    const digits = cpf.replace(/\D/g, '')
    return digits.length === 11
}
