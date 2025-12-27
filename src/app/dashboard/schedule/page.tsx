import { getAppointmentFormData, getAppointments } from "./actions"
import ScheduleClient from "./schedule-client"
import { createClient } from "@/lib/supabase/server"

export default async function SchedulePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const formData = await getAppointmentFormData()
    const appointments = await getAppointments()

    return (
        <ScheduleClient
            patients={formData.patients}
            locations={formData.locations}
            services={formData.services}
            professionals={formData.professionals}
            serviceLinks={formData.serviceLinks}
            appointments={appointments || []}
            currentUserId={user?.id}
            holidays={formData.holidays}
            priceTables={formData.priceTables}
            paymentMethods={formData.paymentMethods} // [NEW]
            defaultLocationId={formData.defaultLocationId}
        />
    )
}
