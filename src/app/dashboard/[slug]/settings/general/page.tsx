import { getClinicSettings } from '../actions';
import { SettingsForm } from '../settings-form';
import { createClient } from '@/lib/supabase/server';
import { isMasterUser } from '@/lib/auth-master';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default async function GeneralSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const settings = await getClinicSettings(slug);
    const hasGoogleIntegration = !!process.env.GOOGLE_CLIENT_ID;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isMaster = await isMasterUser(user?.id);

    if (!settings) return null;

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Identidade da Clínica"
                description="Informações básicas e personalização visual."
            />
            <SettingsForm
                initialSettings={settings}
                hasGoogleIntegration={hasGoogleIntegration}
                isMaster={isMaster}
                slug={slug}
            />
        </div>
    );
}
