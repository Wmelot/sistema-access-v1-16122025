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

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') && // [NEW] Allow Signup
        !request.nextUrl.pathname.startsWith('/setup') && // [NEW] Allow Setup
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/book') &&
        !request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/avaliacao')
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // --- SUSPENSION CHECK ---
    if (user && !request.nextUrl.pathname.startsWith('/billing/suspended')) { // Avoid redirect loop
        // We need to fetch the organization status.
        // Profiles -> Organization -> Status
        // Note: This adds a DB query to every request. Ideally, status is in user_metadata or JWT claim.
        // For MVP, a single select is acceptable (Supabase handles it well).

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization:organizations(status, id)')
            .eq('id', user.id)
            .single()

        // @ts-ignore
        const status = profile?.organization?.status
        // @ts-ignore
        const orgId = profile?.organization?.id
        const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'

        // If Suspended AND not Master Org (Master never gets suspended)
        if (status === 'suspended' && orgId !== MASTER_ORG_ID) {
            // Allow access to /admin (in case Master is impersonating? No, Master impersonating sees as user)
            // Actually, if Master Impersonates, they become that user context usually? 
            // In our impersonation logic, we switch organization_id in profile. 
            // So if Master switches to Suspended Tenant, Master GETS SUSPENDED VIEW. This is CORRECT behavior.

            // Allow specific routes like /admin for Master to switch back?
            // If Master is impersonating, they need to be able to click "Voltar".
            // "Voltar" action uses server action `backToMaster`.
            // Server actions are POST requests. We must allow them?
            // Middleware runs on Server Actions too in Next.js? Yes.
            // But we need to allow access to the UI to CLICK the button.
            // Solution: We allow /billing/suspended (already checked above).
            // We should put a "Back to Admin" button on Suspended Page if user has email accessfisio@gmail.com

            const url = request.nextUrl.clone()
            url.pathname = '/billing/suspended'
            return NextResponse.redirect(url)
        }
    }

    return response
}
