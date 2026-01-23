import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Atualizar sessão (Supabase)
    const response = await updateSession(request)

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // 2. Redirecionar /dashboard para o slug correto (apenas se for exatamente /dashboard)
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        // Deixamos o redirecionamento para o arquivo src/app/dashboard/page.tsx
        // Isso é mais seguro e evita loops no middleware
        return response
    }

    // 3. Segurança: Redirecionar rotas "antigas" para a nova estrutura com slug
    const reserved = ['financial', 'patients', 'schedule', 'reports', 'settings', 'marketing', 'forms', 'reminders']
    const parts = pathname.split('/').filter(Boolean)

    if (parts.length === 2 && parts[0] === 'dashboard' && reserved.includes(parts[1])) {
        // Se alguém acessar /dashboard/schedule, deixamos a página /dashboard/page.tsx 
        // ou o próprio layout lidar com isso para evitar erros de cache do Next.js.
        // Por agora, vamos apenas deixar passar para evitar o erro de parallelRoutes.
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
