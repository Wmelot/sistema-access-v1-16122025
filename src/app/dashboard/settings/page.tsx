import { getClinicSettings } from './actions';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
    const settings = await getClinicSettings();

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Configurações da Clínica</h1>
                <p className="text-muted-foreground">
                    Gerencie as informações da sua empresa. Esses dados serão usados nos cabeçalhos de prontuários e relatórios pdf.
                </p>
            </div>

            <SettingsForm initialSettings={settings} />
        </div>
    );
}
