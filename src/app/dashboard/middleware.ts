import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Lista de slugs válidos (você pode expandir isso)
    const validSlugs = ['access-fisioterapia', 'test-form', 'axiom-saude'];

    // Check if it's a dashboard route
    if (pathname.startsWith('/dashboard/')) {
        const pathParts = pathname.split('/').filter(Boolean);

        // If it's /dashboard/something but 'something' is not a valid slug
        // and it's not already in the format /dashboard/[slug]/[page]
        if (pathParts.length \u003e = 2) {
            const potentialSlug = pathParts[1];

            // If the second part is NOT a valid slug, it's an old route
            // Example: /dashboard/financial -> should redirect to /dashboard/[slug]/financial
            if (!validSlugs.includes(potentialSlug)) {
                // This is an old route, redirect to /dashboard (which will then redirect to /dashboard/[slug])
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard';
                return NextResponse.redirect(url);
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
