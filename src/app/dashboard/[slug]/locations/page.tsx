import { getLocations } from "./actions"
import { LocationsClient } from "./locations-client"

export default async function LocationsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const locations = await getLocations()

    return <LocationsClient locations={locations} slug={slug} />
}
