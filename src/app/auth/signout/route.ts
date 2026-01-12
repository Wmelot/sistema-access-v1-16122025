import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

async function handleSignOut(req: NextRequest) {
    const supabase = await createClient()

    // Check if we have a session
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session) {
        await supabase.auth.signOut()
    }

    revalidatePath('/', 'layout')

    // Force absolute URL for redirect to avoid issues
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = '' // Clear query params

    return NextResponse.redirect(url)
}

export async function POST(req: NextRequest) {
    return handleSignOut(req)
}

export async function GET(req: NextRequest) {
    return handleSignOut(req)
}
