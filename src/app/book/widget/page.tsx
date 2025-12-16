import { createClient } from "@/lib/supabase/server"
import { BookingWizard } from "@/components/booking/BookingWizard"

// Force separate layout logic or just clean styling
export const metadata = {
    title: 'Agendamento - Access',
}

export default async function WidgetPage() {
    const supabase = await createClient()

    const [services, locations] = await Promise.all([
        supabase.from('services').select('id, name, duration, price').eq('active', true).order('name'),
        supabase.from('locations').select('id, name').eq('active', true).order('name')
    ])

    return (
        <div className="min-h-screen bg-transparent">
            {/* No Header, just the wizard in a container appropriate for Iframe */}
            <div className="bg-white rounded-xl shadow-none p-4">
                <BookingWizard
                    initialServices={services.data || []}
                    initialLocations={locations.data || []}
                />
            </div>
        </div>
    )
}
