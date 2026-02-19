import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase.from('form_templates').select('id, title, is_locked, type, organization_id')
        if (error) return NextResponse.json({ error }, { status: 500 })
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
