import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayoutClient from "../layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/components/providers/permissions-provider"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { isMasterUser } from "@/lib/auth-master"

export const dynamic = 'force-dynamic';

export default async function SlugLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: { slug: string }
}) {
    const { slug } = params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const settings = await getClinicSettings(slug);

    // Trial Expiration Check
    if (settings?.trial_ends_at) {
        const trialEnd = new Date(settings.trial_ends_at);
        const now = new Date();
        if (now > trialEnd && settings.status !== 'paid' && settings.status !== 'active_paid') {
            redirect('/subscription-expired');
        }
    }

    let userProfile: any = null;
    let originSlug: string | undefined = undefined;

    if (user) {
        // [RESILIENCE] Start with Auth User Data as baseline
        userProfile = {
            id: user.id,
            role: 'Vazio',
            avatarUrl: user.user_metadata.avatar_url || user.user_metadata.picture || null,
            email: user.email,
            name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário',
            organizationId: null,
            hasCompletedOnboarding: true // Assume completed if profile record is missing for old users
        };

        try {
            const { data: profileRaw, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, photo_url, organization_id, has_completed_onboarding, roles(name), organizations(slug)')
                .eq('id', user.id)
                .single()

            const profile = profileRaw as any

            if (profile) {
                let roleName = profile?.roles?.name || 'Vazio';

                // Case B: User is a MASTER (Universal Access)
                const isMaster = await isMasterUser(user.id)
                if (isMaster) {
                    roleName = 'Master';
                }

                userProfile = {
                    id: profile.id,
                    role: roleName,
                    avatarUrl: profile.photo_url || userProfile.avatarUrl,
                    email: user.email,
                    name: profile.full_name || userProfile.name,
                    organizationId: profile.organization_id,
                    hasCompletedOnboarding: profile.has_completed_onboarding === null ? true : profile.has_completed_onboarding
                };
                originSlug = profile.organizations?.slug;

                // [RESTORED] Check for Active Attendance
                const { rows } = await db.query(`
                    SELECT a.id, a.start_time, a.patient_id, p.name as patient_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.status = 'in_progress' 
                    AND a.professional_id = $1
                    LIMIT 1
                `, [user.id])

                if (rows.length > 0) {
                    // This data is usually consumed by a context or passed down
                    // Since it wasn't being used directly in the return, I'll ensure it stays in scope if needed
                }
            } else if (profileError && profileError.code !== 'PGRST116') {
                console.error("Profile fetch error:", profileError)
            }
        } catch (e) {
            console.error("Layout profile fetch error:", e)
        }
    }

    return (
        <PermissionsProvider userRole={userProfile?.role}>
            <Suspense fallback={null}>
                <DashboardLayoutClient
                    logoUrl={settings?.logo_url}
                    clinicName={settings?.name}
                    currentUser={userProfile}
                    features={settings?.features}
                    trialEndsAt={settings?.trial_ends_at}
                    slug={slug}
                    userOriginSlug={originSlug}
                >
                    <AutoLogoutProvider>
                        {children}
                    </AutoLogoutProvider>
                </DashboardLayoutClient>
            </Suspense>
        </PermissionsProvider>
    )
}
