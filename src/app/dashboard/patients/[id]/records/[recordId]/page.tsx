import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormRenderer } from '@/components/forms/FormRenderer'

export default async function RecordPage({ params }: { params: Promise<{ id: string, recordId: string }> }) {
    const { id, recordId } = await params
    const supabase = await createClient()

    // Fetch Record + Template
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
        console.error(error)
        return notFound()
    }

    return (
        <div className="container py-6">
            {/* Versioning Logic: Use Snapshot if available (Safe for old records), else fallback to live template (Drafts/New) */}
            <FormRenderer
                recordId={record.id}
                patientId={id}
                template={record.template_snapshot ? { ...record.template, fields: record.template_snapshot } : record.template}
                initialContent={record.content}
                status={record.status || 'draft'}
            />
        </div>
    )
}
