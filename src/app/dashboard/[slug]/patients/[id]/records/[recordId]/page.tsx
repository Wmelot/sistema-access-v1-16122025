import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormRenderer } from '@/components/forms/FormRenderer'
import PalmilhaAccessForm from '@/features/pbe/components/PalmilhaAccessForm'

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
    const { data: record, error } = await supabase
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

    if (error) {
        console.error("Error fetching record:", error)
        // Keep the debug view for now, it's useful if something else breaks
        return (
            <div className="container py-10 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded inline-block text-left">
                    <h2 className="font-bold mb-2">Erro ao carregar prontuário</h2>
                    <p>Details: {JSON.stringify(error, null, 2)}</p>
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

    // Safety check for template
    const templateData = record.template || { id: 'deleted', title: 'Modelo Excluído', fields: [] }
    const finalTemplate = (record as any).template_snapshot ? { ...templateData, fields: (record as any).template_snapshot } : templateData
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

    const isPalmilha = finalTemplate.title?.includes('Palmilha')

    return (
        <div className="container py-6">
            {isReadOnly && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2">
                    <span className="font-bold">Modo de Leitura:</span> Este documento foi finalizado há mais de 24 horas e não pode ser editado (LGPD).
                </div>
            )}
            {isPalmilha ? (
                <div className="max-w-[1600px] mx-auto">
                    <PalmilhaAccessForm
                        patientId={id}
                        initialData={record.content}
                        patient={patientData}
                        readonly={isReadOnly}
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

