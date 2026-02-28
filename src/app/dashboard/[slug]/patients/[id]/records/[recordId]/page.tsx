import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { RecordClient } from './RecordClient'

export default async function RecordPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string, id: string, recordId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug, id, recordId } = await params
    const resolvedSearchParams = await searchParams
    const isReadOnly = resolvedSearchParams.readonly === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Fetch Organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    // 2. Fetch Record + Template
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

    // 3. Fetch Patient Data
    const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

    // 4. Fetch Professional (who created the record)
    const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', record.created_by)
        .single()

    // 5. Check Appointment Validity
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
    const CLINICAL_EVOLUTION_ID = 'e0000000-0000-0000-0000-000000000001'

    // If template is null but ID is system evolution, fix it
    if (!(record as any).template && record.template_id === CLINICAL_EVOLUTION_ID) {
        (record as any).template = {
            id: CLINICAL_EVOLUTION_ID,
            title: 'Evolução Clínica & IA (NOVO)',
            fields: []
        }
    }

    // [NEW] Fix native Palmilha 5
    if (!(record as any).template && record.template_id === 'palmilha-5') {
        (record as any).template = {
            id: 'palmilha-5',
            title: 'Palmilha 5.0 (EVOLUÍDA)',
            fields: []
        }
    }

    // 6. [NEW] Enforce 24h Rule for editing
    const createdAt = new Date(record.created_at)
    const now = new Date()
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    // Force ReadOnly if more than 24h passed
    const isLockedByTime = diffInHours >= 24
    const effectiveIsReadOnly = isReadOnly || isLockedByTime

    const templateData = (record as any).template || { id: 'deleted', title: 'Modelo Excluído', fields: [] }
    const finalTemplate = (record as any).template_snapshot ? { ...templateData, fields: (record as any).template_snapshot } : templateData
    const resolvedTemplateId = record.template_id || finalTemplate.id

    // ROBUST DETECTION for Palmilha V3
    const isPalmilhaV3 = resolvedTemplateId === 'fde183ad-1c20-4d6c-9efb-89d08f483cf2' ||
        (record.content?.isV3 === true);

    const isPBE5 = resolvedTemplateId === 'pbe-5' ||
        finalTemplate.title?.toLowerCase().includes('pbe 5') ||
        finalTemplate.title?.toLowerCase().includes('pbe5');

    const isPalmilha5 = !isPBE5 && (
        resolvedTemplateId === 'palmilha-5' || resolvedTemplateId === 'e0000000-0000-0000-0000-000000000005'
    );

    const isPalmilhaOriginal = !isPalmilhaV3 && (
        resolvedTemplateId === '13fa2f92-41fa-462f-aa7e-5407d619dd94' ||
        (record.content?.shoeSize !== undefined) ||
        finalTemplate.title?.toLowerCase().includes('palmilha')
    );

    const isWomensHealth = resolvedTemplateId === 'womens_health_system' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000003' ||
        finalTemplate.title?.toLowerCase().includes('saúde da mulher') ||
        (record.content?.obstetric !== undefined)

    const isAdvancedPhysical = !isPBE5 && (
        resolvedTemplateId === 'system-physical-assessment' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000002' ||
        resolvedTemplateId === 'f33bb240-c1be-4201-adf2-e5a59229d056' ||
        finalTemplate.title?.toLowerCase().includes('avaliação física avançada') ||
        (record.content?.antro !== undefined)
    )

    const isConceptPBE = resolvedTemplateId === 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000008' ||
        finalTemplate.title?.toLowerCase().includes('pbe') ||
        (record.content?.anamnesis !== undefined && record.content?.physicalExam !== undefined);

    const isUltimatePBE = resolvedTemplateId === 'ultimate_pbe_system' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000006' ||
        finalTemplate.title?.toLowerCase().includes('ultimate pbe');

    const isSmartWizard = resolvedTemplateId === 'tree_wizard_system' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000007' ||
        finalTemplate.title?.toLowerCase().includes('wizard') ||
        finalTemplate.title?.toLowerCase().includes('inteligente');

    const isDiabeticFoot = resolvedTemplateId === 'diabetic_foot_system' ||
        resolvedTemplateId === 'e0000000-0000-0000-0000-000000000009' ||
        finalTemplate.title?.toLowerCase().includes('pé diabético') ||
        finalTemplate.title?.toLowerCase().includes('pé insensível');

    const isBackup = finalTemplate.title === 'Backup Feegow' || finalTemplate.id === 'e0000000-0000-0000-0000-000000000002';

    const isClinicalEvolution = record.content?._record_type !== 'assessment' && !isPalmilha5 && !isPalmilhaV3 && !isPalmilhaOriginal && !isWomensHealth && !isAdvancedPhysical && !isConceptPBE && !isUltimatePBE && !isSmartWizard && !isDiabeticFoot && !isBackup && (
        resolvedTemplateId === CLINICAL_EVOLUTION_ID ||
        finalTemplate.title?.toLowerCase().includes('evolução clínica') ||
        finalTemplate.title?.toLowerCase() === 'evolução inteligente' ||
        (record.content?.evolution_text !== undefined)
    );

    return (
        <RecordClient
            id={id}
            record={record}
            patientData={patientData}
            organization={organization}
            professional={profData}
            isReadOnly={effectiveIsReadOnly}
            validAppointmentId={validAppointmentId}
            finalTemplate={finalTemplate}
            isPBE5={isPBE5}
            isPalmilha5={isPalmilha5}
            isPalmilhaV3={isPalmilhaV3}
            isPalmilhaOriginal={isPalmilhaOriginal}
            isWomensHealth={isWomensHealth}
            isAdvancedPhysical={isAdvancedPhysical}
            isConceptPBE={isConceptPBE}
            isUltimatePBE={isUltimatePBE}
            isSmartWizard={isSmartWizard}
            isDiabeticFoot={isDiabeticFoot}
            isBackup={isBackup}
            isClinicalEvolution={isClinicalEvolution}
        />
    )
}
