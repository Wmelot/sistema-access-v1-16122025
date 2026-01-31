import { PhysicalAssessmentFormV2 } from "@/components/assessments/physical-assessment-form-v2";

export default function PhysicalAssessmentFormV2TestPage() {
    // Mock save function
    const handleSave = async (data: any) => {
        'use server';
        console.log("Saving Physical Assessment V2:", data);
        return { success: true };
    };

    return (
        <div className="w-full h-full p-6">
            <PhysicalAssessmentFormV2
                patientId="00000000-0000-0000-0000-000000000000"
                // @ts-ignore
                onSave={handleSave}
            />
        </div>
    );
}
