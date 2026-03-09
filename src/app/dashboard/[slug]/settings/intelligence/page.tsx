import { ClinicalIntelligenceSettings } from '../intelligence/clinical-intelligence-settings';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default async function IntelligenceSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Inteligência Clínica"
                description="Gerencie protocolos baseados em evidência e comportamento da IA."
            />

            <ClinicalIntelligenceSettings />
        </div>
    );
}
