"use client";

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { FormRenderer } from '@/components/forms/FormRenderer'
import PalmilhaFormV3 from '@/features/palmilha-biomecanica/components/PalmilhaFormV3'
import { WomensHealthForm } from '@/features/womens-health/components/WomensHealthForm'
import { AdvancedPhysicalForm } from '@/features/pbe/components/AdvancedPhysicalForm'
import ConceptPBEForm from '@/features/pbe/components/ConceptPBEForm'
import BiomechanicsInsoleForm from '@/features/pbe/components/BiomechanicsInsoleForm'
import { FisioterapiaEvolutionForm } from '@/features/clinical-evolution/components/FisioterapiaEvolutionForm'

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
    isClinicalEvolution: boolean;
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
    isBackup,
    isClinicalEvolution
}: RecordClientProps) {
    const { slug } = useParams()
    const router = useRouter()

    return (
        <div className={isBackup ? "w-full px-4 py-6 bg-white" : "container py-6"}>
            {/* [NEW] Header Navigation */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>

                {isReadOnly && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Modo de Leitura (LGPD)
                    </Badge>
                )}
            </div>

            {isReadOnly && (
                <div className="mb-6 bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-lg flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Documento Finalizado</span>
                        <Badge variant="outline" className="bg-slate-200/50">Somente Leitura</Badge>
                    </div>
                    <p className="text-sm">
                        Este documento foi assinado ou inserido há mais de 24 horas. Para alterações posteriores, anexe uma nova evolução ou retificação.
                    </p>
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
            ) : isClinicalEvolution ? (
                <div className="max-w-[1200px] mx-auto">
                    <FisioterapiaEvolutionForm
                        patientId={id}
                        initialData={record.content}
                        attendanceId={record.appointment_id}
                        onSave={() => { }}
                        readOnly={isReadOnly}
                    />
                </div>
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
