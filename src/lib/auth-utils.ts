import { db } from "@/lib/db"

/**
 * Checks if a master user has temporary support access to an organization.
 */
export async function checkMasterSupportAccess(userEmail: string | undefined, orgSlug: string) {
    if (!userEmail) return false;

    // 1. Check if user is a Master (hardcoded emails or role check could be here)
    const masterEmails = ['wmelot@gmail.com', 'warley@gmail.com', 'accessfisio@gmail.com'];
    if (!masterEmails.includes(userEmail)) {
        // Optionally check roles table too, but email is faster for Master access
        return false;
    }

    // 2. Check if the target organization has active support access
    const { rows } = await db.query(`
        SELECT support_access_active, support_access_until 
        FROM public.organizations 
        WHERE slug = $1
    `, [orgSlug]);

    if (rows.length === 0) return false;

    const org = rows[0];
    if (!org.support_access_active) return false;

    const until = org.support_access_until ? new Date(org.support_access_until) : null;
    if (!until || until < new Date()) return false;

    return true;
}
