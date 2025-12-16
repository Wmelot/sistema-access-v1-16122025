import { WidgetGrid } from "./components/widgets/widget-grid"
import { getDashboardMetrics } from "./actions"
import { getCurrentUserPermissions } from "@/lib/rbac"

export default async function DashboardPage() {
    const metrics = await getDashboardMetrics()
    const permissions = await getCurrentUserPermissions()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Tela Inicial</h1>
            </div>

            <WidgetGrid
                metrics={metrics}
                permissions={permissions}
            />
        </div>
    )
}
