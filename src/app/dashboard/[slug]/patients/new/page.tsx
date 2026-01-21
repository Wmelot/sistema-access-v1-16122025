import { createClient } from "@/lib/supabase/server"
import PatientForm from "./patient-form"
import { getPriceTables } from "@/app/dashboard/[slug]/prices/actions"

export default async function NewPatientPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: patients } = await supabase.from('patients').select('id, full_name').order('full_name')
    const priceTables = await getPriceTables(slug)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Novo Paciente</h1>
            </div>

            <PatientForm existingPatients={(patients as any) || []} priceTables={priceTables || []} />
        </div>
    )
}
