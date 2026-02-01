import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardRedirect() {
    console.log('[DashboardRedirect] Starting redirect logic...');
    const supabase = await createClient();

    // Ensure fresh auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.log('[DashboardRedirect] No user/Error, redirecting to login.');
        redirect('/login');
    }

    console.log('[DashboardRedirect] Checking user organization for:', user.email);

    // Get user's organization slug with explicit fresh query
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id, organizations(slug)')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('[DashboardRedirect] Profile fetch error:', error);
    }

    if (!profile) {
        console.warn('[DashboardRedirect] No profile found for user:', user.id);
        redirect('/login');
    }

    let slug = (profile as any)?.organizations?.slug;

    // [RULE] HARD OVERRIDE FOR WMELOT TO AVOID PAINEL DE CONTROLE
    // If the DB says 'painel-master' or similar, we FORCE 'access-fisioterapia'
    // This handles the user's intense frustration with being sent to the wrong org.
    const BLOCKED_SLUGS = ['painel-master', 'painel-de-controle', 'admin'];
    const TARGET_SLUG = 'access-fisioterapia';

    if (user.email?.includes('wmelot') && (!slug || BLOCKED_SLUGS.includes(slug))) {
        console.warn(`[DashboardRedirect] INTERCEPTED: ${user.email} was heading to '${slug}', redirecting to '${TARGET_SLUG}' by FORCE RULE.`);
        slug = TARGET_SLUG;
    } else if (!slug) {
        console.error(`[DashboardRedirect] User ${user.email} has no organization. Redirecting to login error.`);
        redirect('/login?error=no_organization');
    }

    console.log(`[DashboardRedirect] Final destination for ${user.email}: ${slug}`);
    redirect(`/dashboard/${slug}`);
}
