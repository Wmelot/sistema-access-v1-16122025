import DashboardLayoutClient from "./layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/hooks/use-permissions"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getClinicSettings();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role_id(name)')
            .eq('id', user.id)
            .single();

        if (profile) {
            userProfile = {
                id: profile.id,
                // @ts-ignore - Supabase type inference for joined tables can vary (array vs object)
                role: Array.isArray(profile.role_id) ? profile.role_id[0]?.name : (profile.role_id as any)?.name || 'Vazio'
            };
        }
    }

    return (
        <PermissionsProvider>
            <DashboardLayoutClient
                logoUrl={settings?.logo_url}
                clinicName={settings?.name}
                currentUser={userProfile}
            >
                <AutoLogoutProvider>
                    {children}
                </AutoLogoutProvider>
            </DashboardLayoutClient>
        </PermissionsProvider>
    )
}
