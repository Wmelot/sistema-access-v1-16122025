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
import { UltimatePBEForm } from '@/features/pbe/components/UltimatePBEForm'
import AdvancedSmartAssessment from '@/features/smart-assessment/components/AdvancedSmartAssessment'
import DiabeticFootForm from '@/features/pbe/components/DiabeticFootForm'
import { updateRecordContent } from '@/actions/patients'
import { toast } from 'sonner'

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
    isUltimatePBE: boolean;
    isSmartWizard: boolean;
    isDiabeticFoot: boolean;
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
    isUltimatePBE,
    isSmartWizard,
    isDiabeticFoot,
    isBackup,
    isClinicalEvolution
}: RecordClientProps) {
    const { slug } = useParams()
    const router = useRouter()

    const handleSave = async (content: any) => {
        if (isReadOnly) {
            toast.error("Este registro está em modo apenas leitura.")
            return
        }

        const res = await updateRecordContent(record.id, content)
        if (res.success) {
            router.refresh()
            toast.success("Alterações salvas com sucesso!")
        } else {
            toast.error(res.message || "Erro ao salvar.")
        }
    }

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
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Badge variant="outline" className="bg-amber-200/50 border-amber-300 text-amber-700 uppercase font-black tracking-widest text-[10px]">Somente Leitura</Badge>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm mb-1">Formulário apenas para leitura</h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Este documento foi finalizado ou inserido há mais de 24 horas. Por segurança e normas de prontuário, não é permitida a edição direta.
                            <strong> Você ainda pode gerar e imprimir o relatório normalmente.</strong>
                        </p>
                    </div>
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
                    onSave={handleSave}
                />
            ) : isWomensHealth ? (
                <WomensHealthForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={handleSave}
                />
            ) : isAdvancedPhysical ? (
                <AdvancedPhysicalForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={handleSave}
                    hideHeader={true}
                    hideButtons={false}
                />
            ) : isConceptPBE ? (
                <ConceptPBEForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={handleSave}
                />
            ) : isUltimatePBE ? (
                <UltimatePBEForm
                    patientId={id}
                    initialData={record.content}
                    readOnly={isReadOnly}
                    onSave={handleSave}
                    patient={patientData}
                    professional={professional}
                />
            ) : isSmartWizard ? (
                <AdvancedSmartAssessment
                    patientId={id}
                    initialData={record.content}
                    onSave={handleSave}
                    readOnly={isReadOnly}
                />
            ) : isDiabeticFoot ? (
                <DiabeticFootForm
                    patientId={id}
                    initialData={record.content}
                    patient={patientData}
                    onSave={handleSave}
                    readOnly={isReadOnly}
                />
            ) : isClinicalEvolution ? (
                <div className="max-w-[1200px] mx-auto">
                    <FisioterapiaEvolutionForm
                        patientId={id}
                        initialData={record.content}
                        attendanceId={record.appointment_id}
                        onSave={handleSave}
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
