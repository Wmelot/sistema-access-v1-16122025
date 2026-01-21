import { getProfessionals } from "./actions"
import { ProfessionalsList } from "./components/professionals-list"

export default async function ProfessionalsPage() {
    const professionals = await getProfessionals()

    return <ProfessionalsList professionals={professionals} />
}
