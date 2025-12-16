
import { randomBytes } from 'crypto'

/**
 * Generates a cryptographically strong random hex string.
 * @param length Bytes length (result string will be double this length)
 */
export function generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex')
}

/**
 * Generates an API Key with a prefix for easy identification.
 * @param prefix e.g. "sk_live_"
 */
export function generateApiKey(prefix: string = "sk_"): string {
    return `${prefix}${generateSecureToken(24)}`
}
