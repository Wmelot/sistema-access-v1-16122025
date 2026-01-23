import { getProfessionals } from "./actions"
import { ProfessionalsList } from "./components/professionals-list"

export default async function ProfessionalsPage({ params }: { params: { slug: string } }) {
    const { slug } = await params // Await params for Next.js 15 compatibility
    const professionals = await getProfessionals(slug)

    return <ProfessionalsList professionals={professionals} slug={slug} />
}
