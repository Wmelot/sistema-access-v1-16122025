import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { requesterEmail, professor } = await req.json();

        if (!requesterEmail || !professor) {
            return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Validar se o solicitante é ADMIN
        const { data: requester } = await supabase
            .from('academic_professors')
            .select('role, organization_id')
            .ilike('email', requesterEmail)
            .single();

        if (requester?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem gerenciar docentes.' }, { status: 403 });
        }

        // 2. Upsert do professor
        const { error } = await supabase.from('academic_professors').upsert({
            organization_id: requester.organization_id,
            name: professor.name,
            email: professor.email.toLowerCase().trim(),
            status: professor.status || 'ativo',
            role: professor.role || 'professor',
            permissions: professor.permissions || { canInvite: false, canDelete: false, canViewDashboard: false },
            lattes_url: professor.lattesUrl || professor.lattes_url || ''
        }, { onConflict: 'organization_id,email' });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Erro na API de save-professor:', err);
        return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
