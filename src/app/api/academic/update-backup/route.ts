import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { evidenceIds } = await req.json();

        if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length === 0) {
            return NextResponse.json({ error: 'Nenhum ID fornecido.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Faz o update do lote de evidências com a data atual (tracked as backed up)
        const { error } = await supabase
            .from('academic_evidences')
            .update({ backed_up_at: new Date().toISOString() })
            .in('id', evidenceIds);

        if (error) {
            console.error('Erro ao atualizar backup data:', error);
            return NextResponse.json({ error: 'Erro ao registrar backup no banco.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `${evidenceIds.length} evidências marcadas como salvas.` });

    } catch (err) {
        console.error('Erro na API de update-backup:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
