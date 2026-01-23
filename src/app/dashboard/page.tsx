import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardRedirect() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    console.log('[DashboardRedirect] Checking user organization for:', user.email);

    // Get user's organization slug
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id, organizations(slug)')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('[DashboardRedirect] Profile fetch error:', error);
    }

    // Safety check: if user has no profile, redirect to login
    if (!profile) {
        console.warn('[DashboardRedirect] No profile found for user:', user.id);
        redirect('/login');
    }

    // Default slug if none found
    const slug = (profile as any)?.organizations?.slug || 'access-fisioterapia';

    console.log(`[DashboardRedirect] Redirecting ${user.email} to slug: ${slug}`);
    redirect(`/dashboard/${slug}`);
}
