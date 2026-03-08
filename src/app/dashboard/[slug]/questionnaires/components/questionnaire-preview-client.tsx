"use client"

import { PublicAssessmentForm } from '@/app/avaliacao/[token]/PublicAssessmentForm';
import { AssessmentForm } from '@/app/dashboard/[slug]/patients/components/assessments/AssessmentForm';
import { ASSESSMENTS, AssessmentType } from '@/app/dashboard/[slug]/patients/components/assessments/definitions';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';

interface QuestionnairePreviewClientProps {
    template: any;
    slug: string;
    id: string;
}

export function QuestionnairePreviewClient({ template, slug, id }: QuestionnairePreviewClientProps) {
    const { isCollapsed } = useSidebar();

    // Check if it's a standardized assessment from definitions.ts
    // Use slug if available, fallback to id
    const assessmentType = (template.slug || id) as AssessmentType;
    const isStandardized = assessmentType in ASSESSMENTS;

    // Adapt template for PublicAssessmentForm (fallback)
    const previewItem = {
        template: template,
        template_id: template.id,
        organization: template.organization // For primary color
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-6 px-4 transition-all duration-300">
            {/* Dynamic Container to occupy more space */}
            <div className={cn(
                "mx-auto transition-all duration-300",
                isCollapsed ? "max-w-[95%]" : "max-w-[85%]"
            )}>
                <Link href={`/dashboard/${slug}/questionnaires`}>
                    <Button variant="ghost" size="sm" className="mb-6 hover:bg-slate-200">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar para Biblioteca
                    </Button>
                </Link>

                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden min-h-[70vh]">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Visualização do Modelo</h1>
                                <p className="text-sm text-slate-500">
                                    {isStandardized
                                        ? "Esta é a visualização funcional que você vê durante o atendimento."
                                        : "Este é o formato que seu paciente verá ao receber o link."}
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                                    Modo Preview
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 sm:p-10">
                        {isStandardized ? (
                            <AssessmentForm type={assessmentType} isPreview={true} />
                        ) : (
                            <PublicAssessmentForm item={previewItem} isPreview={true} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
