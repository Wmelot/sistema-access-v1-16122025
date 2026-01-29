import { getFormTemplate } from '../../../forms/actions';
import { notFound } from 'next/navigation';
import { PublicAssessmentForm } from '@/app/avaliacao/[token]/PublicAssessmentForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
}

export default async function QuestionnairePreviewPage({ params }: PageProps) {
    const { slug, id } = await params;

    const template = await getFormTemplate(id);

    if (!template) {
        return notFound();
    }

    // Adapt template for PublicAssessmentForm
    const previewItem = {
        template: template,
        template_id: template.id
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto pt-6 px-4">
                <Link href={`/dashboard/${slug}/questionnaires`}>
                    <Button variant="ghost" size="sm" className="mb-6">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar para Biblioteca
                    </Button>
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Visualização do Modelo</h1>
                                <p className="text-sm text-slate-500">Este é o formato que seu paciente verá ao receber o link.</p>
                            </div>
                            <div className="hidden sm:block">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                                    Modo Preview
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 sm:p-8">
                        <PublicAssessmentForm item={previewItem} isPreview={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}
