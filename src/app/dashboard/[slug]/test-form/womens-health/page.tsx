import WomensHealthForm from "@/features/womens-health/components/WomensHealthForm";

export default function WomensHealthFormTestPage() {
    return (
        <div className="w-full h-full p-6">
            <WomensHealthForm patientId="00000000-0000-0000-0000-000000000000" />
        </div>
    );
}
