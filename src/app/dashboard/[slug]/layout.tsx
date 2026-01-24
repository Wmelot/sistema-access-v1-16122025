import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

import DashboardLayoutClient from "../layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/components/providers/permissions-provider"
import { createClient } from "@/lib/supabase/server"

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

    // If settings not found, Master can still access with defaults
    // Non-master will be blocked by middleware or other checks

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
        try {
            const { data: profileRaw, error: profileErr } = await supabase
                .from('profiles')
                .select('id, full_name, photo_url, organization_id, roles(name), organizations(slug)')
                .eq('id', user.id)
                .single()

            const profile = profileRaw as any

            if (profile) {
                let roleName = profile?.roles?.name || 'Vazio';

                // FORCE MASTER for Admin email
                const masterEmails = ['wmelot@gmail.com', 'warley@gmail.com', 'accessfisio@gmail.com'];
                if (masterEmails.includes(user.email || '')) {
                    roleName = 'Master';
                }

                userProfile = {
                    id: profile.id,
                    role: roleName,
                    avatarUrl: profile.photo_url || user.user_metadata.avatar_url || user.user_metadata.picture || null,
                    email: user.email,
                    name: user.user_metadata.full_name || profile.full_name || user.email?.split('@')[0] || 'Usuário',
                    organizationId: profile.organization_id
                };
                originSlug = profile.organizations?.slug;
            }
        } catch (e) {
            console.error("Layout profile fetch error:", e)
        }
    }

    return (
        <PermissionsProvider>
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
