import PalmilhaForm from "@/features/palmilha-biomecanica/components/PalmilhaForm";

export default function TestFormPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Ambiente de Teste</h1>
                    <p className="text-muted-foreground">
                        Visualizando componente: Palmilha Biomecânica 2.0
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <PalmilhaForm patientId="00000000-0000-0000-0000-000000000000" />
                </div>
            </div>
        </div>
    );
}
