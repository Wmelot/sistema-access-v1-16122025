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
                patients (name, phone),
                profiles (full_name, photo_url),
                locations (name),
                services (name, special_reminder)
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

        // Fetch organization separately
        const { data: org } = await supabase
            .from('organizations')
            .select('slug, name, address, maps_url, footer_message')
            .eq('id', appt.organization_id)
            .single()

        return NextResponse.json({
            ...appt,
            organizations: org
        })

    } catch (err) {
        console.error(`[API PUBLIC APPOINTMENT] Critical Error:`, err)
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
    }
}
