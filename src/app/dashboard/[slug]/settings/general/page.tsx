import { getClinicSettings } from '../actions';
import { SettingsForm } from '../settings-form';
import { createClient } from '@/lib/supabase/server';
import { isMasterUser } from '@/lib/auth-master';

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
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Geral</h2>
                <p className="text-muted-foreground text-sm">Informações básicas da clínica.</p>
            </div>
            <SettingsForm
                initialSettings={settings}
                hasGoogleIntegration={hasGoogleIntegration}
                isMaster={isMaster}
                slug={slug}
            />
        </div>
    );
}
