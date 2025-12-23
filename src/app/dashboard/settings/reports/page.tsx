import { getReportTemplates } from "./actions"
import { ReportTemplateList } from "@/components/reports/ReportTemplateList"

export default async function ReportTemplatesPage() {
    const templates = await getReportTemplates()

    return (
        <ReportTemplateList templates={templates || []} />
    )
}
