import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { requesterEmail, evidenceId } = await req.json();

        if (!requesterEmail || !evidenceId) {
            return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Validar se o solicitante tem permissão (Admin ou Dono)
        const { data: requester } = await supabase
            .from('academic_professors')
            .select('role, id')
            .ilike('email', requesterEmail)
            .single();

        if (!requester) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 403 });
        }

        // 2. Buscar a evidência para checar o dono
        const { data: ev } = await supabase
            .from('academic_evidences')
            .select('professor_id')
            .or(`id.eq.${evidenceId},title.eq.${evidenceId}`)
            .maybeSingle();

        const isOwner = ev?.professor_id === requester.id;
        const isAdmin = requester.role === 'admin';

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Acesso negado para excluir este registro.' }, { status: 403 });
        }

        // 3. Delete
        const { error } = await supabase
            .from('academic_evidences')
            .delete()
            .or(`id.eq.${evidenceId},title.eq.${evidenceId}`);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Erro na API de delete-evidence:', err);
        return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
