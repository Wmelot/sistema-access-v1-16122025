import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormRenderer } from '@/components/forms/FormRenderer'

export default async function RecordPage({ params }: { params: Promise<{ id: string, recordId: string }> }) {
    const { id, recordId } = await params
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

    if (error || !record || !record.template) {
        console.error("Error fetching record:", error)
        return notFound()
    }

    return (
        <div className="container py-6">
            <FormRenderer
                recordId={record.id}
                template={record.template_snapshot ? { ...record.template, fields: record.template_snapshot } : record.template}
                initialContent={record.content}
                status={record.status || 'draft'}
                patientId={id}
                templateId={record.template.id}
            />
        </div>
    )
}

