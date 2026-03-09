import { ClinicalIntelligenceSettings } from '../intelligence/clinical-intelligence-settings';

export default function IntelligenceSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Inteligência Clínica</h2>
                <p className="text-muted-foreground text-sm">Gerencie protocolos baseados em evidência e comportamento da IA.</p>
            </div>

            <ClinicalIntelligenceSettings />
        </div>
    );
}
