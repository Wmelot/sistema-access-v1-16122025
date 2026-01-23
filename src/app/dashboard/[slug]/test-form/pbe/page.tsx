import PBEForm from "@/features/pbe/components/PBEForm";

export default function PBEFormTestPage() {
    return (
        <div className="w-full h-full p-6">
            <PBEForm patientId="00000000-0000-0000-0000-000000000000" />
        </div>
    );
}
