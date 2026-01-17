import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import DashboardLayoutClient from "./layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/hooks/use-permissions"
import { createClient } from "@/lib/supabase/server"
import { ImpersonationBar } from "@/components/admin/impersonation-bar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getClinicSettings();

    // Trial Expiration Check
    if (settings?.trial_ends_at) {
        const trialEnd = new Date(settings.trial_ends_at);
        const now = new Date();
        if (now > trialEnd && settings.status !== 'paid' && settings.status !== 'active_paid') {
            redirect('/subscription-expired');
        }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // [FAILSAFE] If no user (and middleware missed it), force redirect
    if (!user) {
        redirect('/login');
    }

    let userProfile: any = null;
    if (user) {
        try {
            // Reverting to Supabase Client for Layout Fetch to avoid Vercel DNS/TCP issues
            // This ensures the App Shell always loads via HTTP (std port 443)
            const { data: profileRaw, error: profileErr } = await supabase
                .from('profiles')
                .select('id, full_name, photo_url, organization_id, roles(name)')
                .eq('id', user.id)
                .single()

            if (profileErr) console.error("Profile fetch error:", profileErr)

            const profile = profileRaw as any

            if (profile) {
                userProfile = {
                    id: profile.id,
                    role: profile?.roles?.name || 'Vazio',
                    avatarUrl: profile.photo_url || user.user_metadata.avatar_url || user.user_metadata.picture || null,
                    email: user.email,
                    name: user.user_metadata.full_name || profile.full_name,
                    organizationId: profile.organization_id
                };
            }
        } catch (e) {
            console.error("Layout profile fetch error:", e)
        }
    }

    // Impersonation Check
    const MASTER_EMAIL = 'accessfisio@gmail.com';
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';

    // @ts-ignore
    // Show bar if Master Email, regardless of Org (User wants to go back to Admin Panel easily)
    const isMasterAdmin = userProfile?.email === MASTER_EMAIL;
    const isImpersonating = isMasterAdmin; // Simplification: Master Admin always sees the bar to return to /admin

    return (
        <PermissionsProvider>
            <DashboardLayoutClient
                logoUrl={settings?.logo_url}
                clinicName={settings?.name}
                currentUser={userProfile}
                features={settings?.features}
                trialEndsAt={settings?.trial_ends_at}
            >
                <AutoLogoutProvider>
                    {isImpersonating && (
                        <ImpersonationBar clinicName={settings?.name || 'Clínica'} />
                    )}
                    {children}
                </AutoLogoutProvider>
            </DashboardLayoutClient>
        </PermissionsProvider>
    )
}
