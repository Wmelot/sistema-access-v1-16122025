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
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.warn('SignOut API failed (Safe Ignore):', e)
        }
    }

    // [NEW] Clear Custom Auth Cookie (Aggressive)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('axiom_user')
    cookieStore.set('axiom_user', '', { maxAge: 0, path: '/' }) // Force overwrite
    // Also clear supabase auth token just in case
    cookieStore.getAll().forEach(c => {
        if (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) {
            cookieStore.delete(c.name)
            cookieStore.set(c.name, '', { maxAge: 0, path: '/' })
        }
    })

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
