import { PhysicalAssessmentForm } from "@/features/pbe/components/PhysicalAssessmentFormLegacy";

export default function PhysicalAssessmentFormTestPage() {
    // Mock save function
    const handleSave = async (data: any) => {
        'use server';
        console.log("Saving Physical Assessment:", data);
        return { success: true };
    };

    return (
        <div className="w-full h-full p-6">
            <PhysicalAssessmentForm
                patientId="00000000-0000-0000-0000-000000000000"
                onSave={handleSave}
            />
        </div>
    );
}
