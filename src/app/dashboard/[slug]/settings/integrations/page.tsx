import { AsaasConfigCard } from '../asaas-config-card';
import { SystemIntegrationsCard } from '../system/system-integrations-card';

export default async function IntegrationsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const hasGoogleIntegration = !!process.env.GOOGLE_CLIENT_ID;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Integrações de Terceiros</h2>
                <p className="text-muted-foreground text-sm">Conecte sua clínica a ferramentas externas para automatizar processos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AsaasConfigCard slug={slug} />
                <SystemIntegrationsCard hasGoogleIntegration={hasGoogleIntegration} />
            </div>
        </div>
    );
}
