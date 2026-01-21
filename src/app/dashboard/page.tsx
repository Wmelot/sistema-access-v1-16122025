import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardRedirect() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user's organization slug
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(slug)')
        .eq('id', user.id)
        .single();

    const slug = (profile as any)?.organizations?.slug || 'access-fisioterapia';

    redirect(`/dashboard/${slug}`);
}
