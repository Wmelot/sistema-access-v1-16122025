import { createAdminClient } from "@/lib/supabase/server"

/**
 * Centrally determines if a user has "Master" (Platform Admin) privileges.
 * This checks both verified administrative emails and the 'Master' role in the database.
 * 
 * IMPORTANT: This should be used for UI visibility and secondary checks. 
 * Critical security MUST be enforced via RLS in Postgres using the is_master_user() function.
 */
export async function isMasterUser(userId?: string): Promise<boolean> {
    if (!userId) return false

    // 2. Database Role Check
    try {
        const adminClient = await createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role, email, roles(name), role_id(name)')
            .eq('id', userId)
            .single()

        const profileData = profile as any
        // Check both roles.name and role_id.name as Supabase mapping can vary by config
        const roleName = profileData?.roles?.name || profileData?.role_id?.name || profileData?.role

        // Also allow hard override for owner email
        return roleName === 'Master' || profileData?.email === 'wmelot@gmail.com'
    } catch (error) {
        console.error("[AuthMaster] Failed to check master role:", error)
        return false
    }
}
