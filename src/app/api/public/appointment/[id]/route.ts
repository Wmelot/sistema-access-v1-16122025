import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const supabase = createAdminClient()

    try {
        const { data: appt, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients (name, phone),
                professional:profiles (full_name, photo_url),
                location:locations (name),
                organization:organizations (slug, name)
            `)
            .eq('id', id)
            .maybeSingle()

        if (error || !appt) {
            return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 })
        }

        // Clean up data for public view
        return NextResponse.json(appt)

    } catch (err) {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}
