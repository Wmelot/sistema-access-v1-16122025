import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const supabase = createAdminClient()

    try {
        console.log(`[API PUBLIC APPOINTMENT] Fetching: ${id}`)

        const { data: appt, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patients!appointments_patient_id_fkey (name, phone),
                profiles!appointments_professional_id_fkey (full_name, photo_url),
                locations!appointments_location_id_fkey (name),
                organizations!appointments_organization_id_fkey (slug, name)
            `)
            .eq('id', id)
            .maybeSingle()

        if (error) {
            console.error(`[API PUBLIC APPOINTMENT] DB Error:`, error)
            return NextResponse.json({ error: "Erro ao buscar dados", detail: error.message }, { status: 500 })
        }

        if (!appt) {
            console.warn(`[API PUBLIC APPOINTMENT] Not found: ${id}`)
            return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 })
        }

        return NextResponse.json(appt)

    } catch (err) {
        console.error(`[API PUBLIC APPOINTMENT] Critical Error:`, err)
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
    }
}
