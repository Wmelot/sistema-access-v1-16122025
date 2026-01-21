import { getAppointmentFormData, getAppointments } from "@/actions/appointments"
import ScheduleClient from "./schedule-client"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export default async function SchedulePage({ params }: { params: { slug: string } }) {
    const { slug } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const formData = await getAppointmentFormData(slug)
    const appointments = await getAppointments(slug)

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
