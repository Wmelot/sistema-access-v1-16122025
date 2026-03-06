'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Master Admin Constants
const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MASTER_EMAILS = ['accessfisio@gmail.com', 'warley@gmail.com']

// Known Home Clinic IDs for the Master
const HOME_CLINIC_IDS = [
    MASTER_ORG_ID,
    '9571532e-fdf8-4aaa-b236-416fd6459566', // access-fisioterapia
    'd58907d2-12b1-4c7c-8999-15528a798fb2'  // access-fisioterapia-1
]

export async function isMasterSupportMode(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check if the logged-in user is one of the Master Admins
    if (!MASTER_EMAILS.includes(user.email || '')) return false

    // Check if they are accessing a DIFFERENT organization (Impersonation/Support)
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    // If Profile Org ID is NOT in the Home Clinic list, it means they are in support mode (intruder)
    if (profile?.organization_id && !HOME_CLINIC_IDS.includes(profile.organization_id)) {
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
