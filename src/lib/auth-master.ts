import { createAdminClient } from "@/lib/supabase/server"

/**
 * Centrally determines if a user has "Master" (Platform Admin) privileges.
 * This checks both verified administrative emails and the 'Master' role in the database.
 * 
 * IMPORTANT: This should be used for UI visibility and secondary checks. 
 * Critical security MUST be enforced via RLS in Postgres using the is_master_user() function.
 */
export async function isMasterUser(userId?: string, userEmail?: string): Promise<boolean> {
    if (!userId && !userEmail) return false

    // 1. Hardcoded critical fallback (Safety net)
    const masterEmails = [
        'wmelot@gmail.com',
        'warley@gmail.com',
        'accessfisio@gmail.com',
        'wmelot@icloud.com'
    ]

    if (userEmail && masterEmails.includes(userEmail)) {
        return true
    }

    if (!userId) return false

    // 2. Database Role Check
    try {
        const adminClient = await createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role, role_id(name)')
            .eq('id', userId)
            .single()

        const profileData = profile as any
        const roleName = profileData?.role_id?.name || profileData?.role

        return roleName === 'Master'
    } catch (error) {
        console.error("[AuthMaster] Failed to check master role:", error)
        return false
    }
}
