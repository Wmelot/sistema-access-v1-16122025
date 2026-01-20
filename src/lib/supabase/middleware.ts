import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 1. Get User (Optimized)
    // Avoid connecting to Supabase if no session cookie is present
    const hasSessionCookie = request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('-auth-token'));

    let user = null;
    if (hasSessionCookie) {
        const { data } = await supabase.auth.getUser()
        user = data.user
    }

    // 2. Define Public Routes (No Login Required)
    const pathname = request.nextUrl.pathname

    // LANDING PAGE IS PUBLIC!
    if (pathname === '/') {
        // If user is logged in, optionally redirect to dashboard, OR let them see landing page.
        // Usually SaaS apps redirect logged in users to dashboard.
        if (user) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        return response
    }

    // Other Public Routes
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/setup') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/book') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/avaliacao') ||
        pathname.startsWith('/subscription-expired')
    ) {
        // If user is logged in and trying to login/signup, redirect to dashboard
        if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        return response
    }

    // 3. Protect All Other Routes
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 4. (Optional) Suspension Check logic could go here, but let's keep it simple first
    // ...

    return response
}
