'use client'

import PalmilhaAccessForm from "@/features/pbe/components/PalmilhaAccessForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function PalmilhaSandboxPage() {
    return (
        <div className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200">
                <InfoIcon className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-800">Ambiente de Sandbox</AlertTitle>
                <AlertDescription className="text-indigo-700">
                    Este é um ambiente de teste. Os dados preenchidos aqui <strong>não são salvos</strong> no banco de dados nem vinculados a nenhum paciente.
                </AlertDescription>
            </Alert>

            <PalmilhaAccessForm
                patientId="sandbox"
                onSave={(data) => console.log('Sandbox Save:', data)}
            />
        </div>
    );
}
