import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json([])
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('patients')
            .select('id, name, phone, email, cpf')
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(10)

        if (error) {
            console.error('Error searching patients API:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
