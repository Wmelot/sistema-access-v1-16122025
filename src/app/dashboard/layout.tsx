import DashboardLayoutClient from "./layout-client"
import { getClinicSettings } from "./settings/actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getClinicSettings();

    return (
        <DashboardLayoutClient
            logoUrl={settings?.logo_url}
            clinicName={settings?.name}
        >
            {children}
        </DashboardLayoutClient>
    )
}
