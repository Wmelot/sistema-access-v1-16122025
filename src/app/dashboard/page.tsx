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

    const metrics = await getDashboardMetrics()
    const permissions = await getCurrentUserPermissions()
    // const supabase = await createClient() // Duplicate, removed.



    let currentUserProfile = null
    if (user) {
        try {
            const { rows } = await db.query("SELECT * FROM public.profiles WHERE id = $1", [user.id])
            currentUserProfile = rows[0] || null
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
