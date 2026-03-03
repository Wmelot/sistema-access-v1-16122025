import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayoutClient from "../layout-client"
import { getClinicSettings } from "./settings/actions"
import { AutoLogoutProvider } from "@/components/providers/auto-logout-provider"
import { PermissionsProvider } from "@/components/providers/permissions-provider"
import { createClient, createAdminClient } from "@/lib/supabase/server"
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
            // 1. Try with regular client (respects RLS)
            let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            // 2. Fallback to Admin Client (service role) if failed
            if (!profile || profileError) {
                console.warn(`[Layout] Profile fetch failed for ${user.id}. Error: ${profileError?.message || 'No data'}. Trying admin client...`);
                const adminClient = await createAdminClient();
                const { data: adminProfile, error: adminError } = await adminClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (adminProfile) {
                    profile = adminProfile;
                } else {
                    console.error(`[Layout] Admin fallback also failed for ${user.id}:`, adminError?.message);
                }
            }

            if (profile) {
                console.log(`[Layout] Profile found for ${user.email}. ID: ${profile.id}`);
                const isMaster = await isMasterUser(user.id)
                let roleName = 'Vazio';

                if (isMaster) {
                    roleName = 'Master';
                } else if (profile.role_id) {
                    // Fetch role name separately to be safe from mapping issues
                    const adminClient = await createAdminClient();
                    const { data: roleData } = await adminClient.from('roles').select('name').eq('id', profile.role_id).single();
                    roleName = roleData?.name || 'Vazio';
                }

                userProfile = {
                    id: profile.id,
                    role: roleName,
                    avatarUrl: profile.photo_url || null,
                    email: user.email || '',
                    name: profile.full_name || userProfile.name,
                    organizationId: profile.organization_id,
                    hasCompletedOnboarding: profile.has_completed_onboarding ?? true
                };

                if (profile.organization_id) {
                    const adminClient = await createAdminClient();
                    const { data: orgData } = await adminClient.from('organizations').select('slug').eq('id', profile.organization_id).single();
                    originSlug = orgData?.slug;
                }
            } else {
                const isMasterFallback = await isMasterUser(user.id);
                console.warn(`[Layout] Profile NOT FOUND for ${user.id}. isMasterFallback: ${isMasterFallback}`);
                if (isMasterFallback) {
                    userProfile.role = 'Master';
                }
                userProfile.email = user.email || '';
            }

            // [SECURITY] Prevent non-master users from accessing other organizations' slugs
            if (userProfile.role !== 'Master' && settings && userProfile.organizationId !== settings.id) {
                console.warn(`[Layout] USER ${user.email} BLOCKED: Tried to access '${slug}' but belongs to ID ${userProfile.organizationId}. Redirecting...`);
                const adminClient = await createAdminClient();
                const { data: userOrg } = await adminClient
                    .from('organizations')
                    .select('slug')
                    .eq('id', userProfile.organizationId)
                    .single();

                if (userOrg) {
                    redirect(`/dashboard/${userOrg.slug}`);
                } else {
                    redirect('/login?error=no_organization');
                }
            }
        } catch (e) {
            if ((e as any).digest?.includes('NEXT_REDIRECT')) throw e;
            console.error("Layout profile fetch error:", e)
        }
    }

    console.log(`[Layout] Final UserProfile Role: ${userProfile?.role} | Name: ${userProfile?.name}`);

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
