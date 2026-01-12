
import { NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/services/smart-reports/generator';
import { fetchAssessmentData } from '@/lib/services/smart-reports/mapper';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { patientId, blueprintId, data, assessmentId } = body;

        console.log("Generating report request:", { patientId, blueprintId, hasAssessmentId: !!assessmentId });

        let reportInput;

        // MODE A: Real Data from DB
        if (assessmentId) {
            console.log("Fetching real assessment data...");
            reportInput = await fetchAssessmentData(assessmentId);
            if (!reportInput) {
                return NextResponse.json({
                    error: 'Avaliação não encontrada',
                    details: `Não foi possível encontrar o ID ${assessmentId} nas tabelas 'patient_assessments' ou 'attendance_records'. Verifique se o atendimento foi salvo corretamente.`
                }, { status: 404 });
            }
        }
        // MODE B: Dummy/Direct Data (Test Page)
        else {
            reportInput = {
                patientId,
                professionalId: 'test_prof_123',
                assessmentId: 'test_assess_123',
                data
            };
        }

        // Generate the report
        const result = await reportGenerator.generate(reportInput, blueprintId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json(
            { error: 'Failed to generate report', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
