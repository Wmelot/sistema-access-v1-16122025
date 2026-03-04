import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json({ error: 'Email e nova senha são obrigatórios.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Atualiza a senha usando a chave de serviço
        const { error } = await supabase
            .from('academic_professors')
            .update({
                password: newPassword,
                needsPasswordChange: false,
                updated_at: new Date().toISOString()
            })
            .ilike('email', email.trim());

        if (error) {
            console.error('Erro ao atualizar senha:', error);
            return NextResponse.json({ error: 'Erro ao salvar nova senha no banco.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Erro na API de senha:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
