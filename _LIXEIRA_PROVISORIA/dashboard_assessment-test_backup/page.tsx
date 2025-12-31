'use client';

import { PhysicalAssessmentForm } from '@/components/assessments/physical-assessment-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AssessmentTestPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/forms">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">Avaliação Física Avançada</h1>
                    <span className="text-xs text-muted-foreground">Original (Hardcoded) Preview</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <PhysicalAssessmentForm
                    patientId="preview-mode"
                    readOnly={false}
                    onSave={(data) => console.log('Preview Save:', data)}
                />
            </div>
        </div>
    );
}
