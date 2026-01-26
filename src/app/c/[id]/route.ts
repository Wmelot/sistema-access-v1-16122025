import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id
    const supabase = await createClient()

    const { data: link } = await supabase
        .from('short_links')
        .select('original_url')
        .eq('id', id)
        .single()

    if (!link) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirect to the original URL
    return NextResponse.redirect(new URL(link.original_url, request.url))
}
