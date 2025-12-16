import { ProfessionalForm } from "../components/professional-form"
import { getServices } from "@/app/dashboard/services/actions"

export default async function NewProfessionalPage() {
    const services = await getServices()

    return <ProfessionalForm services={services || []} />
}
