import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormRenderer } from '@/components/forms/FormRenderer'
import PalmilhaFormV3 from '@/features/palmilha-biomecanica/components/PalmilhaFormV3'
import { WomensHealthForm } from '@/features/womens-health/components/WomensHealthForm'
import { AdvancedPhysicalForm } from '@/features/pbe/components/AdvancedPhysicalForm'
import ConceptPBEForm from '@/features/pbe/components/ConceptPBEForm'

export default async function RecordPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string, recordId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id, recordId } = await params
    const resolvedSearchParams = await searchParams
    const isReadOnly = resolvedSearchParams.readonly === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Fetch Record + Template
    let { data: record, error } = await supabase
        .from('patient_records')
        .select(`
            *,
            template:form_templates(
                id,
                title,
                description,
                fields
            )
        `)
        .eq('id', recordId)
        .eq('patient_id', id)
        .single()

    // [DEBUG/FIX] Fallback if not found with patient_id (helps if there's a mixup in IDs)
    if (!record && !error || (error && error.code === 'PGRST116')) {
        const { data: fallbackRecord, error: fallbackError } = await supabase
            .from('patient_records')
            .select('*, template:form_templates(id, title, description, fields)')
            .eq('id', recordId)
            .single()

        if (fallbackRecord) {
            console.warn(`Record ${recordId} found but belongs to patient ${fallbackRecord.patient_id}, not ${id}`)
            record = fallbackRecord
            error = null as any
        }
    }

    if (error) {
        console.error("Error fetching record:", error)
        return (
            <div className="container py-10 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded inline-block text-left">
                    <h2 className="font-bold mb-2">Erro ao carregar prontuário</h2>
                    <p>Details: {JSON.stringify(error, null, 2)}</p>
                    <p className="mt-2 text-xs opacity-70">
                        Record ID: {recordId}<br />
                        Patient ID: {id}
                    </p>
                </div>
            </div>
        )
    }

    if (!record) {
        return notFound()
    }

    // 2. Fetch Patient Data (Separate query to avoid FK errors)
    const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

    // 3. Check Appointment Validity
    let validAppointmentId = undefined;
    if (record.appointment_id) {
        const { data: appt } = await supabase
            .from('appointments')
            .select('id')
            .eq('id', record.appointment_id)
            .single()
        if (appt) validAppointmentId = appt.id
    }

    // [NEW] Better Detection for System Forms
    // If template is "Deleted" or NULL, try detecting by ID or content keys
    const templateData = (record as any).template || { id: 'deleted', title: 'Modelo Excluído', fields: [] }
    const finalTemplate = (record as any).template_snapshot ? { ...templateData, fields: (record as any).template_snapshot } : templateData
    const resolvedTemplateId = record.template_id || finalTemplate.id

    const isWomensHealth = resolvedTemplateId === 'womens_health_system' ||
        finalTemplate.title?.includes('Saúde da Mulher') ||
        (record.content?.obstetric !== undefined)

    const isAdvancedPhysical = resolvedTemplateId === 'system-physical-assessment' ||
        resolvedTemplateId === 'f33bb240-c1be-4201-adf2-e5a59229d056' ||
        finalTemplate.title?.includes('Avaliação Física Avançada') ||
        (record.content?.antro !== undefined)

    const isConceptPBE = resolvedTemplateId === 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c' ||
        finalTemplate.title?.includes('PBE') ||
        (record.content?.anamnesis !== undefined && record.content?.physicalExam !== undefined)

    const isPalmilha = finalTemplate.title?.includes('Palmilha') || (record.content?.shoeSize !== undefined)

    return (
        <div className="container py-6">
            {isReadOnly && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2">
                    <span className="font-bold">Modo de Leitura:</span> Este documento foi finalizado há mais de 24 horas e não pode ser editado (LGPD).
                </div>
            )}
            {isPalmilha ? (
                <div className="max-w-[1600px] mx-auto">
                    <PalmilhaFormV3
                        patientId={id}
                        initialData={record.content}
                        patient={patientData}
                        readonly={isReadOnly}
                    />
                </div>
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
