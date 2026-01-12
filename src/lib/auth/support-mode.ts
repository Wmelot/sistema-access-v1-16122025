'use server'

import { createClient } from '@/lib/supabase/server'

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

    // In a real impersonation flow, we might rely on the URL param or a session claim
    // But typically support mode means: User is Master, but Context is NOT Master Org.
    // However, if the Master User *switched* context, their profile.organization_id might be updated 
    // OR we check the current tenant context from the request/URL.

    // For this implementation, let's assume if the Profile's Org ID is NOT the Master Org ID, 
    // it means they have been moved/switched to another org context.

    if (profile?.organization_id && profile.organization_id !== MASTER_ORG_ID) {
        return true
    }

    return false
}
