"use client";

import { FormRenderer } from '@/components/forms/FormRenderer'
import PalmilhaFormV3 from '@/features/palmilha-biomecanica/components/PalmilhaFormV3'
import { WomensHealthForm } from '@/features/womens-health/components/WomensHealthForm'
import { AdvancedPhysicalForm } from '@/features/pbe/components/AdvancedPhysicalForm'
import ConceptPBEForm from '@/features/pbe/components/ConceptPBEForm'
import BiomechanicsInsoleForm from '@/features/pbe/components/BiomechanicsInsoleForm'

interface RecordClientProps {
    id: string;
    record: any;
    patientData: any;
    organization?: any;
    professional?: any;
    isReadOnly: boolean;
    validAppointmentId?: string;
    finalTemplate: any;
    isPalmilhaV3: boolean;
    isPalmilhaOriginal: boolean;
    isWomensHealth: boolean;
    isAdvancedPhysical: boolean;
    isConceptPBE: boolean;
    isBackup: boolean;
}

export function RecordClient({
    id,
    record,
    patientData,
    organization,
    professional,
    isReadOnly,
    validAppointmentId,
    finalTemplate,
    isPalmilhaV3,
    isPalmilhaOriginal,
    isWomensHealth,
    isAdvancedPhysical,
    isConceptPBE,
    isBackup
}: RecordClientProps) {
    return (
        <div className={isBackup ? "w-full px-4 py-6" : "container py-6"}>
            {isReadOnly && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2">
                    <span className="font-bold">Modo de Leitura:</span> Este documento foi finalizado há mais de 24 horas e não pode ser editado (LGPD).
                </div>
            )}
            {isPalmilhaV3 ? (
                <div className="max-w-[1600px] mx-auto">
                    <PalmilhaFormV3
                        patientId={id}
                        initialData={record.content}
                        patient={patientData}
                        readonly={isReadOnly}
                    />
                </div>
            ) : isPalmilhaOriginal ? (
                <BiomechanicsInsoleForm
                    patientId={id}
                    initialData={record.content}
                    patient={patientData}
                    organization={organization}
                    professional={professional}
                    readonly={isReadOnly}
                    onSave={() => { }}
                />
            ) : isWomensHealth ? (
                <WomensHealthForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={() => { }}
                />
            ) : isAdvancedPhysical ? (
                <AdvancedPhysicalForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={() => { }}
                />
            ) : isConceptPBE ? (
                <ConceptPBEForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={() => { }}
                />
            ) : (
                <FormRenderer
                    recordId={record.id}
                    template={finalTemplate}
                    initialContent={record.content}
                    status={(record as any).status || 'draft'}
                    patientId={id}
                    templateId={finalTemplate.id}
                    appointmentId={validAppointmentId}
                    patientName={patientData?.name}
                    readonly={isReadOnly}
                />
            )}
        </div>
    )
}
