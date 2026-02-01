import { getReportTemplates } from "./actions"
import { ReportTemplateList } from "@/components/reports/ReportTemplateList"

export default async function ReportTemplatesPage({ params }: { params: { slug: string } }) {
    const templates = await getReportTemplates(params.slug)

    return (
        <ReportTemplateList templates={templates || []} />
    )
}
