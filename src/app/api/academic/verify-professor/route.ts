import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Busca o professor usando a chave de serviço (ignora RLS)
        const { data: professor, error } = await supabase
            .from('academic_professors')
            .select('*')
            .ilike('email', email.trim())
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar professor:', error);
            return NextResponse.json({ error: 'Erro no banco de dados.' }, { status: 500 });
        }

        if (!professor) {
            return NextResponse.json({ error: 'E-mail não cadastrado.' }, { status: 404 });
        }

        // Retorna o professor (senha será verificada no cliente ou aqui, mas aqui é mais seguro)
        // Por enquanto, retorna o objeto para manter a lógica de troca de senha no cliente
        return NextResponse.json({ professor });

    } catch (err) {
        console.error('Erro na API de login:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
