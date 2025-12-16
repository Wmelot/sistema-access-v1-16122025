import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PatientForm from "@/app/dashboard/patients/new/patient-form"
import { getPriceTables } from "@/app/dashboard/prices/actions"
import { getPatient } from "@/app/dashboard/patients/actions"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditPatientPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch necessary data
    const [patient, priceTables, { data: patients }] = await Promise.all([
        getPatient(id),
        getPriceTables(),
        supabase.from('patients').select('id, full_name').order('full_name')
    ])

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
            />
        </div>
    )
}
