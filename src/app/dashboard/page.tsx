import { WidgetGrid } from "./components/widgets/widget-grid"
import { getDashboardMetrics } from "./actions"
import { getCurrentUserPermissions } from "@/lib/rbac"
import { getProfessionals } from "./professionals/actions" // Reuse existing working action

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Get Current User & Check Redirection (PRIORITY)
    const { data: { user } } = await supabase.auth.getUser()


    // [SAAS] Redirect Master Admin to Admin Dashboard IMMEDIATELY
    // [SAAS] Redirect Master Admin to Admin Dashboard IMMEDIATELY - REMOVED
    // if (user) {
    //    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    //
    //    if (profile?.organization_id === '00000000-0000-0000-0000-000000000001') {
    //        const { redirect } = require("next/navigation")
    //        redirect('/admin')
    //    }
    // }

    let metrics = null
    let permissions = []

    try {
        console.log("Dashboard: Fetching metrics...")
        metrics = await getDashboardMetrics()
        console.log("Dashboard: Metrics fetched.")

        console.log("Dashboard: Fetching permissions...")
        permissions = await getCurrentUserPermissions()
        console.log("Dashboard: Permissions fetched.")
    } catch (error) {
        console.error("CRITICAL DASHBOARD ERROR:", error)
        // Fallback metrics to prevent crash
        metrics = {
            birthdays: { today: [], week: [] },
            financials: null,
            my_finance: { total: 0, received: 0, pending: 0 },
            demographics: { men: 0, women: 0, children: 0, total: 0 },
            yearly_comparison: { appointments: { current: [], last: [] }, revenue: { current: [], last: [] }, completed: { current: [], last: [] } },
            categories: []
        }
    }

    // const supabase = await createClient() // Duplicate, removed.



    let currentUserProfile = null
    if (user) {
        try {
            // [FIX] Use Supabase Client instead of DB Direct to avoid Vercel Pooler (6543) errors
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            currentUserProfile = profile
        } catch (e) {
            console.error("Profile fetch error:", e)
        }
    }

    // 2. Fetch Professionals (Use the action from Professionals page that is KNOWN to work)
    const professionals = await getProfessionals()
    // It returns extra fields but includes id, full_name, professional_profile_color (mapped as color?)
    // Checking actions.ts next.

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Tela Inicial</h1>
            </div>

            <WidgetGrid
                metrics={metrics}
                permissions={permissions}
                professionals={professionals || []}
                currentUser={currentUserProfile} // Pass current user
            />
        </div>
    )
}
