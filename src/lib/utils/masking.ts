/**
 * Masks an email address for privacy.
 * Example: wmelot@gmail.com -> wm***t@gmail.com
 */
export function maskEmail(email: string | null | undefined): string {
    if (!email || !email.includes('@')) return email || '';

    const [user, domain] = email.split('@');

    if (user.length <= 2) {
        return `***@${domain}`;
    }

    if (user.length <= 4) {
        return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`;
    }

    // Standard masking: first 2 chars, asterisks, last 1 char
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

/**
 * Masks a name partially.
 * Example: Warley Oliveira -> Warley O.
 */
export function maskName(name: string | null | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name;

    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
