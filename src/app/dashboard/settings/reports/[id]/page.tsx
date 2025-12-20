
import { getFormTemplates } from "../actions"
import { getReportTemplate } from "../actions"
import { ReportTemplateEditor } from "@/components/reports/ReportTemplateEditor"

export default async function ReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch data in parallel
    const formTemplatesPromise = getFormTemplates()
    const reportTemplatePromise = id !== 'new' ? getReportTemplate(id) : Promise.resolve(null)

    const [formTemplates, reportTemplate] = await Promise.all([
        formTemplatesPromise,
        reportTemplatePromise
    ])

    return (
        <div className="container mx-auto py-6 max-w-6xl">
            <ReportTemplateEditor
                template={reportTemplate}
                formTemplates={formTemplates || []}
            />
        </div>
    )
}
