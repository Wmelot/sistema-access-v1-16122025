import { getLocations } from "./actions"
import { LocationsClient } from "./locations-client"

export default async function LocationsPage() {
    const locations = await getLocations()

    return <LocationsClient locations={locations} />
}
