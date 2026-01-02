import { WidgetGrid } from "./components/widgets/widget-grid"
import { getDashboardMetrics } from "./actions"
import { getCurrentUserPermissions } from "@/lib/rbac"
import { getProfessionals } from "./professionals/actions" // Reuse existing working action

import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const metrics = await getDashboardMetrics()
    const permissions = await getCurrentUserPermissions()
    const supabase = await createClient()

    // 1. Get Current User (for default color logic)
    const { data: { user } } = await supabase.auth.getUser()
    let currentUserProfile = null
    if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        currentUserProfile = data
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
