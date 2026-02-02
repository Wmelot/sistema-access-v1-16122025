import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // COMENTADO PARA DEBUG DE 404 NO VERCEL
    /*
    const response = await updateSession(request)
    const url = request.nextUrl.clone()
    const pathname = url.pathname

    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        return response
    }
    return response
    */
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
