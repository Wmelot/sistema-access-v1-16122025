import { createClient } from "@/lib/supabase/server"
import { BookingWizard } from "@/components/booking/BookingWizard"

export default async function BookingPage() {
    const supabase = await createClient()

    // Fetch public data needed for the wizard
    // We only need basic lists. Availability will be fetched dynamically.
    const [services, locations] = await Promise.all([
        supabase.from('services').select('id, name, duration, price').eq('active', true).order('name'),
        supabase.from('locations').select('id, name').eq('active', true).order('name')
    ])

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden border">
                <div className="bg-primary/10 p-6 text-center border-b">
                    <h1 className="text-2xl font-bold text-primary">Agendamento Online</h1>
                    <p className="text-muted-foreground">Access Fisioterapia</p>
                </div>

                <div className="p-6">
                    <BookingWizard
                        initialServices={services.data || []}
                        initialLocations={locations.data || []}
                    />
                </div>
            </div>

            <div className="mt-8 text-sm text-muted-foreground text-center">
                <p>&copy; {new Date().getFullYear()} Access Fisioterapia. Todos os direitos reservados.</p>
            </div>
        </div>
    )
}
