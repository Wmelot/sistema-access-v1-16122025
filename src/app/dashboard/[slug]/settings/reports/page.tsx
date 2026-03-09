import { getReportTemplates } from './actions';
import { ReportTemplateList } from '@/components/reports/ReportTemplateList';

export default async function ReportsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const reportTemplates = await getReportTemplates(slug) || [];

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Documentos e Atestados</h2>
                <p className="text-muted-foreground text-sm">Gerencie seus modelos personalizados de documentos, atestados e declarações.</p>
            </div>

            <ReportTemplateList templates={reportTemplates} />
        </div>
    );
}
