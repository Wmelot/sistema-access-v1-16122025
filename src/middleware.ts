import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
    let response = await updateSession(request)

    // [DEFENSIVE] Ensure response is defined
    if (!response) {
        console.error("Middleware: updateSession returned undefined. Fallback to next().");
        response = NextResponse.next({
            request: { headers: request.headers }
        });
    }

    // Redirect old /dashboard routes to /dashboard/[slug]
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Lista de slugs válidos conhecidos
    const VALID_SLUGS = ['access-fisioterapia', 'test-form', 'axiom-saude'];

    // Check if accessing dashboard route
    if (pathname.startsWith('/dashboard/')) {
        const pathParts = pathname.split('/').filter(Boolean);

        // If we have at least 2 parts: ['dashboard', 'something']
        if (pathParts.length >= 2) {
            const secondPart = pathParts[1];

            // If the second part is NOT a valid slug, it's an old route
            // Examples: /dashboard/financial, /dashboard/patients, etc.
            if (!VALID_SLUGS.includes(secondPart)) {
                try {
                    const supabase = await createClient();
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        // Get user's organization
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('organization_id, organizations(slug)')
                            .eq('id', user.id)
                            .single();

                        if ((profile as any)?.organizations?.slug) {
                            const slug = (profile as any).organizations.slug;

                            // Rebuild the path with the slug
                            // Example: /dashboard/financial -> /dashboard/access-fisioterapia/financial
                            const pathAfterDashboard = '/' + pathParts.slice(1).join('/');
                            url.pathname = `/dashboard/${slug}${pathAfterDashboard}`;

                            console.log(`[Middleware] Redirecting ${pathname} -> ${url.pathname}`);
                            return NextResponse.redirect(url);
                        }
                    }
                } catch (error) {
                    console.error('[Middleware] Error redirecting to slug-based route:', error);
                }
            }
        }
    }

    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY') // Prevent iframe embedding (Clickjacking)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()') // Minimize feature access
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none';") // Modern check for iframes

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
