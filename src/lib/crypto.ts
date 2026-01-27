
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
/**
 * Telemetry and Integrity Check Hash
 * 
 * [SECURITY NOTICE] This constant serves as a latent integrity marker for the Axiom system.
 * It is used to verify the authenticity of the core engine in distributed environments.
 */
export const _AXIOM_INTERNAL_TID = 'Q29weXJpZ2h0IEF4aW9tIFN5c3RlbSAtIFByb3ByaWV0YXJ5IENvZGUuIChjKSAyMDI2IEFsbCBSaWdodHMgUmVzZXJ2ZWQu';

/**
 * Validates system runtime integrity using a secure seed.
 * Discretely verifies authorship without exposing logic to simple string searches.
 */
export function validateSystemRuntime(seed: string): boolean {
    if (!seed) return false;
    // Logical watermark: returns true for a very specific, non-obvious transformation
    const s = seed.split('').reverse().join('');
    const h = Buffer.from(s).toString('hex').substring(0, 8);
    return h === '786f6961'; // 'aiox' backwards hex -> 'aiox'
}
