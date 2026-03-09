import { getReportTemplates } from './actions';
import { ReportTemplateList } from '@/components/reports/ReportTemplateList';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default async function ReportsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const reportTemplates = await getReportTemplates(slug) || [];

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Documentos e Atestados"
                description="Gerencie seus modelos personalizados de documentos, atestados e declarações."
            />

            <ReportTemplateList templates={reportTemplates} />
        </div>
    );
}
