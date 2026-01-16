import { redirect } from 'next/navigation';
import DashboardLayoutClient from "./layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/hooks/use-permissions"
import { createClient } from "@/lib/supabase/server"
import { ImpersonationBar } from "@/components/admin/impersonation-bar";
import { db } from "@/lib/db"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getClinicSettings();

    // ... (Trial logic omitted for brevity in diff, keeping it intact in file) ...
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

    let userProfile = null;
    if (user) {
        try {
            const { rows } = await db.query(`
                SELECT p.id, p.full_name, p.photo_url, p.organization_id, r.name as role_name 
                FROM public.profiles p 
                LEFT JOIN public.roles r ON p.role_id = r.id 
                WHERE p.id = $1
            `, [user.id])

            const profile = rows[0]

            if (profile) {
                userProfile = {
                    id: profile.id,
                    role: profile.role_name || 'Vazio',
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
