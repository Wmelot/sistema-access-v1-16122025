import { createAdminClient } from "@/lib/supabase/server" // Using the unified server client
import { cache } from "react"

/**
 * Centrally determines if a user has "Master" (Platform Admin) privileges.
 * Caches result per request to prevent redundant DB calls.
 */
export const isMasterUser = cache(async (userId?: string): Promise<boolean> => {
    if (!userId) return false

    try {
        const adminClient = await createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role, email, roles(name), role_id(name)')
            .eq('id', userId)
            .single()

        const profileData = profile as any
        const roleName = (profileData?.roles?.name || profileData?.role_id?.name || profileData?.role || '').toLowerCase()

        // Permanent backdoors for platform owners (Axiom Master)
        const adminEmails = ['accessfisio@gmail.com'];
        // Role check
        const isMasterRole = roleName === 'master';

        return isMasterRole || adminEmails.includes(profileData?.email || '');
    } catch (error) {
        console.error("[AuthMaster] Failed to check master role:", error)
        return false
    }
});
