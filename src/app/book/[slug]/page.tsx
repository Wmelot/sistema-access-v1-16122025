import { createAdminClient } from "@/lib/supabase/server"
import { BookingWizard } from "@/components/booking/BookingWizard"
import { notFound } from "next/navigation"

interface BookingPageProps {
    params: {
        slug: string
    }
}

export default async function BookingPage({ params }: BookingPageProps) {
    const { slug } = params
    const supabase = await createAdminClient()

    // 1. Fetch Organization Data by Slug
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, logo_url, status')
        .eq('slug', slug)
        .single()

    if (orgError || !org) {
        console.error("Organization not found for slug:", slug)
        return notFound()
    }

    if (org.status !== 'active') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800">Esta agenda está temporariamente indisponível.</h1>
                <p className="text-slate-500 mt-2">Por favor, entre em contato diretamente com a clínica {org.name}.</p>
            </div>
        )
    }

    // 2. Fetch data filtered BY ORGANIZATION
    const [services, locations] = await Promise.all([
        supabase
            .from('services')
            .select('id, name, duration, price, special_reminder, description')
            .eq('organization_id', org.id)
            .eq('active', true)
            .order('name'),
        supabase
            .from('locations')
            .select('id, name')
            .eq('organization_id', org.id)
            .eq('active', true)
            .order('name')
    ])

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden border">
                <div className="bg-primary/5 p-6 text-center border-b">
                    {org.logo_url && (
                        <img src={org.logo_url} alt={org.name} className="h-16 w-auto mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-bold text-primary">Agendamento Online</h1>
                    <p className="text-muted-foreground font-medium">{org.name}</p>
                </div>

                <div className="p-6">
                    <BookingWizard
                        initialServices={services.data || []}
                        initialLocations={locations.data || []}
                        organization={org}
                    />
                </div>
            </div>

            <div className="mt-8 text-sm text-muted-foreground text-center">
                <p>&copy; {new Date().getFullYear()} {org.name}. Todos os direitos reservados.</p>
                <p className="text-xs mt-1 opacity-50">Powered by Access Fisioterapia</p>
            </div>
        </div>
    )
}
