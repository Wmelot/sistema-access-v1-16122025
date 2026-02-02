'use client'

import { useParams } from 'next/navigation';
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm";
import { SmartAssessmentForm } from "@/features/pbe/components/SmartAssessmentForm";
import { PhysicalAssessmentForm } from "@/features/pbe/components/PhysicalAssessmentFormLegacy";
import { DiabeticFootForm } from "@/features/pbe/components/DiabeticFootForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function GenericSandboxPage() {
    const params = useParams();
    const type = params.type as string;

    const renderForm = () => {
        switch (type) {
            case 'womens-health':
                return <WomensHealthForm patientId="sandbox" onSave={(data) => console.log('Sandbox Save:', data)} />;
            case 'pbe':
                return <SmartAssessmentForm patientId="sandbox" />;
            case 'physical':
                return <PhysicalAssessmentForm patientId="sandbox" />;
            case 'diabetic-foot':
                return <DiabeticFootForm patientId="sandbox" />;
            default:
                return <div>Formulário não encontrado.</div>;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'womens-health': return 'pink';
            case 'pbe': return 'blue';
            case 'physical': return 'emerald';
            case 'diabetic-foot': return 'orange';
            default: return 'slate';
        }
    };

    const color = getColor();

    return (
        <div className="space-y-6">
            <Alert className={`bg-${color}-50 border-${color}-200`}>
                <InfoIcon className={`h-4 w-4 text-${color}-600`} />
                <AlertTitle className={`text-${color}-800`}>Ambiente de Sandbox</AlertTitle>
                <AlertDescription className={`text-${color}-700`}>
                    Este é um ambiente de teste. Os dados preenchidos aqui <strong>não são salvos</strong> no banco de dados.
                </AlertDescription>
            </Alert>

            <div className="bg-white rounded-xl shadow-sm border p-1">
                {renderForm()}
            </div>
        </div>
    );
}
