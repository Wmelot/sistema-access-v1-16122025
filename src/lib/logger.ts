'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function logAction(
    action: string,
    details: any,
    resource: string = 'system',
    resourceId?: string
) {
    const supabase = await createClient()

    // 1. Get User Context
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Get Request Context (IP, User Agent)
    let ip = 'unknown'
    let userAgent = 'unknown'

    try {
        const headersList = await headers() // Await just in case (Next.js 15+)
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) {
        // Fallback for environments where headers() is unavailable or throws
        console.warn("Could not retrieve headers for logging:", e)
    }

    // 3. Log to Audit Table
    const { error } = await supabase
        .from('audit_logs')
        .insert({
            user_id: user?.id || null, // Allow system logs (null user) if needed, or enforce.
            action,
            details,
            resource,
            resource_id: resourceId,
            ip_address: ip,
            user_agent: userAgent
        })

    if (error) {
        console.error("[CRITICAL] Failed to write Audit Log:", error)
        // Fallback or Alerting could go here
    }
}

export async function getLogs() {
    const supabase = await createClient()

    // Validate Admin Permissions here if needed
    // const { data: { user } } ... if (!admin) return []

    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            users:user_id ( email, full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error("Error fetching Audit Logs:", error)
        return []
    }

    return data
}
