import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json([])
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (!profile?.organization_id) return NextResponse.json([])

        // Use direct SQL for accent insensitivity
        const sql = `
            SELECT id, name, phone, email, cpf 
            FROM patients 
            WHERE organization_id = $1 
            AND (unaccent(name) ILIKE unaccent($2) OR cpf ILIKE $2)
            ORDER BY name 
            LIMIT 10
        `
        const { rows } = await db.query(sql, [profile.organization_id, `%${query}%`])

        return NextResponse.json(rows || [])
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
