import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PatientForm from "@/app/dashboard/patients/new/patient-form"
import { getPriceTables } from "@/app/dashboard/prices/actions"
import { getPatient } from "@/app/dashboard/patients/actions"


export default async function EditPatientPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const resolvedSearchParams = await searchParams
    const appointmentId = resolvedSearchParams.appointmentId as string
    const mode = resolvedSearchParams.mode as string

    const supabase = await createClient()

    // Fetch necessary data
    let data;
    try {
        data = await Promise.all([
            getPatient(id),
            getPriceTables(),
            supabase.from('patients').select('id, full_name').order('full_name')
        ]);
    } catch (error: any) {
        console.error("Critical Error fetching data for EditPatientPage:", error);
        return (
            <div className="p-6 bg-red-50 border border-red-200 text-red-900 rounded-lg">
                <h2 className="text-lg font-bold">Erro ao carregar página de edição</h2>
                <p className="font-mono text-sm mt-2">{error?.message || String(error)}</p>
                <div className="mt-4 text-xs bg-white p-2 rounded border">
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>
            </div>
        );
    }

    const [patient, priceTables, { data: patients }] = data;

    if (!patient) return notFound()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Editar Paciente</h1>
            </div>

            <PatientForm
                existingPatients={patients || []}
                priceTables={priceTables || []}
                initialData={patient}
                appointmentId={appointmentId}
                mode={mode}
            />
        </div>
    )
}
