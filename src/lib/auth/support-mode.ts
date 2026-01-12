'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Master Admin Constants
const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MASTER_EMAIL = 'accessfisio@gmail.com'

export async function isMasterSupportMode(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check if the logged-in user is the Master Admin
    if (user.email !== MASTER_EMAIL) return false

    // Check if they are accessing a DIFFERENT organization (Impersonation/Support)
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    // If Profile Org ID is NOT the Master Org ID, it means they have been moved/switched to another org context.
    if (profile?.organization_id && profile.organization_id !== MASTER_ORG_ID) {
        // Check for Explicit Unmask Toggle via Cookie
        const cookieStore = await cookies()
        const unmaskCookie = cookieStore.get("axiom_support_unmask")

        if (unmaskCookie?.value === "true") {
            return false; // User explicitly requested to Unmask
        }

        return true; // Default to masked for Master in other clinics
    }

    return false
}
