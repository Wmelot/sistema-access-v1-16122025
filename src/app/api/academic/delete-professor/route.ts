import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { requesterEmail, professorId } = await req.json();

        if (!requesterEmail || !professorId) {
            return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Validar se o solicitante é ADMIN
        const { data: requester } = await supabase
            .from('academic_professors')
            .select('role')
            .ilike('email', requesterEmail)
            .single();

        if (requester?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }

        // 2. Delete
        const { error } = await supabase
            .from('academic_professors')
            .delete()
            .eq('id', professorId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Erro na API de delete-professor:', err);
        return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
