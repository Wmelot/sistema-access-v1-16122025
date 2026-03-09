import { AsaasConfigCard } from '../asaas-config-card';
import { SystemIntegrationsCard } from '../system/system-integrations-card';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default async function IntegrationsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const hasGoogleIntegration = !!process.env.GOOGLE_CLIENT_ID;

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Integrações de Terceiros"
                description="Conecte sua clínica a ferramentas externas para automatizar processos."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AsaasConfigCard slug={slug} />
                <SystemIntegrationsCard hasGoogleIntegration={hasGoogleIntegration} />
            </div>
        </div>
    );
}
